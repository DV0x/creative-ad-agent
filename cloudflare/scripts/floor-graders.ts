// Floor graders: 6 binary code-based checks for first-generation shippability.
// See docs/eval-corpus/axial-coding-SYNTHESIS.md for the rubric definitions.
//
// Run from cloudflare/ via:  npx tsx scripts/floor-graders.ts
//
// Output: docs/eval-corpus/floor-baseline-YYYY-MM-DD.md

import { execSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';

const DB_STAGING = 'creative-agent-db';
const DB_PROD = 'creative-agent-db-prod';

const STAGING_IDS = [
  'campaign_mn308y6w6e43dw', // Bewakoof
  'campaign_mn4ogmsbujom9y', // Mamaearth (FAIL anchor — wrong-brand)
  'campaign_mn9ulfufiarpro', // Theratefinder Mar 28 (PASS anchor 2)
  'campaign_mnjwlnnlelx5wf', // Dailyobjects
  'campaign_mnka70u46w19q8', // Gonoise
  'campaign_molat687fo6wad',
  'campaign_moldlidaxv97ly', // Theratefinder Apr 30
  'campaign_moo0j70x7xapvv', // Arjun Infra
  'campaign_mosi22bwouky66', // TWT staging (PASS anchor 1)
  'campaign_mp3zdim0g07tlu', // Staging-Creat (FAIL runner-up)
];

const PROD_IDS = [
  'campaign_mn3egfu1pjxp5r', // Ravila
  'campaign_mn4fy5gosonhqt', // Verbisedu
  'campaign_mn7az22inyrf68', // Verbisedu (other run)
  'campaign_mniw0gw4pqn6xu', // Traya
  'campaign_mp2lfp269caapa', // TWT-2 prod
  'campaign_mp2v002v6n7lb4', // Creat prod
  'campaign_mp3q9e5n9d2f81', // Opti prod
  'campaign_mp40awylzb2gch', // TWT prod
];

// ---------------------------------------------------------------------------
// DB access
// ---------------------------------------------------------------------------

type Row = Record<string, unknown>;

function query(db: string, sql: string): Row[] {
  const cmd = ['npx', 'wrangler', 'd1', 'execute', db, '--remote', '--json', '--command', JSON.stringify(sql)].join(' ');
  const stdout = execSync(cmd, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] });
  const jsonStart = stdout.indexOf('[');
  if (jsonStart < 0) throw new Error(`no JSON in wrangler output:\n${stdout.slice(0, 400)}`);
  const parsed = JSON.parse(stdout.slice(jsonStart));
  return parsed[0]?.results ?? [];
}

function quoteIds(ids: string[]): string {
  return ids.map(id => `'${id.replace(/'/g, "''")}'`).join(',');
}

interface Campaign {
  id: string;
  name: string;
  brand: string | null;
  active_reference_file_ids: string | null;
  source: 'staging' | 'prod';
}

interface CampaignFile { campaign_id: string; file_type: 'research' | 'hooks' | 'prompts'; content: string }
interface CampaignImage { campaign_id: string; image_index: number; hook_type: string; prompt: string | null; version: number }
interface Message { campaign_id: string; role: 'user' | 'assistant'; content: string; created_at: string }

function loadEnv(db: string, ids: string[], source: 'staging' | 'prod') {
  const inClause = quoteIds(ids);
  const campaigns = query(db, `SELECT id, name, brand, active_reference_file_ids FROM campaigns WHERE id IN (${inClause});`) as unknown as Omit<Campaign, 'source'>[];
  const files = query(db, `SELECT campaign_id, file_type, content FROM campaign_files WHERE campaign_id IN (${inClause});`) as unknown as CampaignFile[];
  const images = query(db, `SELECT campaign_id, image_index, hook_type, prompt, version FROM campaign_images WHERE campaign_id IN (${inClause}) AND version = 1;`) as unknown as CampaignImage[];
  const messages = query(db, `SELECT campaign_id, role, content, created_at FROM messages WHERE campaign_id IN (${inClause}) ORDER BY campaign_id, created_at ASC;`) as unknown as Message[];
  return { campaigns: campaigns.map(c => ({ ...c, source })), files, images, messages };
}

// ---------------------------------------------------------------------------
// Markdown parsing helpers
// ---------------------------------------------------------------------------

function extractHookHeadlines(hooksMd: string): string[] {
  const matches = [...hooksMd.matchAll(/\*\*Hook:\*\*\s*"([^"]+)"/g)];
  return matches.map(m => m[1].trim());
}

function extractCTAs(hooksMd: string): string[] {
  const matches = [...hooksMd.matchAll(/\*\*CTA:\*\*\s*"([^"]+)"/g)];
  return matches.map(m => m[1].trim());
}

function extractResearchUrl(researchMd: string): string | null {
  const m = researchMd.match(/\*\*URL:\*\*\s*(https?:\/\/[^\s)]+)/i);
  return m ? m[1].trim().replace(/[.,;]+$/, '') : null;
}

function extractDomain(url: string): string {
  try {
    return new URL(url.trim()).hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return url.toLowerCase();
  }
}

// "Interesting" numbers worth fact-checking: 3+ digits, percentages, k/m/b suffixes,
// or any number paired with $/₹. Skips years 2020-2030 to avoid false positives.
function extractInterestingNumbers(text: string): string[] {
  const out = new Set<string>();
  // 3+ digit numbers (with commas / +)
  for (const m of text.matchAll(/\b(\d{1,3}(?:,\d{3})+(?:\+)?|\d{3,}(?:\+)?)\b/g)) {
    const raw = m[1].replace(/,/g, '').replace(/\+$/, '');
    const n = parseInt(raw, 10);
    if (n >= 2020 && n <= 2030) continue; // year, skip
    out.add(m[1]);
  }
  // X% or X.X% patterns
  for (const m of text.matchAll(/\b(\d+(?:\.\d+)?)\s*%/g)) out.add(`${m[1]}%`);
  // Xk / Xm / Xb suffixes
  for (const m of text.matchAll(/\b(\d+(?:\.\d+)?[kmb])\b/gi)) out.add(m[1].toLowerCase());
  // Currency-prefixed numbers
  for (const m of text.matchAll(/[$₹€£]\s*(\d+(?:[,.]?\d+)*)/g)) out.add(`${m[0]}`);
  return [...out];
}

function normalizeNumber(s: string): string {
  return s.toLowerCase().replace(/[,$₹€£\s+]/g, '');
}

function detectLocale(researchMd: string): 'IN' | 'US' | 'UK' | 'CA' | 'unknown' {
  const t = researchMd.toLowerCase();
  if (/\bindia\b|indian|₹|inr\b|rupee/.test(t)) return 'IN';
  if (/\bcanada\b|canadian|cad\b|\bontario\b|\bquebec\b/.test(t)) return 'CA';
  if (/\bunited kingdom\b|british|\bgbp\b|\bpound sterling\b/.test(t)) return 'UK';
  if (/\bunited states\b|\busa\b|american|\busd\b/.test(t)) return 'US';
  return 'unknown';
}

// First user message likely contains the URL the user typed.
function extractUserUrl(messages: Message[], campaignId: string): string | null {
  const userMsgs = messages.filter(m => m.campaign_id === campaignId && m.role === 'user');
  for (const m of userMsgs) {
    const match = m.content.match(/(https?:\/\/[^\s)]+)/i);
    if (match) return match[1].trim().replace(/[.,;]+$/, '');
  }
  return null;
}

function assistantMsgCount(messages: Message[], campaignId: string): number {
  return messages.filter(m => m.campaign_id === campaignId && m.role === 'assistant').length;
}

// ---------------------------------------------------------------------------
// 6 floor checks
// ---------------------------------------------------------------------------

type CheckResult = { pass: boolean; note: string };

// F1 — Right brand: domain in research matches user-typed URL OR user confirmed.
function checkF1RightBrand(c: Campaign, research: string, messages: Message[]): CheckResult {
  const userUrl = extractUserUrl(messages, c.id);
  const researchUrl = extractResearchUrl(research);
  if (!userUrl) return { pass: true, note: 'no user URL found (skipped)' };
  if (!researchUrl) return { pass: false, note: 'no research URL found' };
  const userDomain = extractDomain(userUrl);
  const researchDomain = extractDomain(researchUrl);
  if (userDomain === researchDomain) return { pass: true, note: `match: ${userDomain}` };
  // Allow www / subdomain variance: same registrable suffix?
  const userBase = userDomain.split('.').slice(-2).join('.');
  const researchBase = researchDomain.split('.').slice(-2).join('.');
  if (userBase === researchBase) return { pass: true, note: `match (base): ${userBase}` };
  return { pass: false, note: `MISMATCH: user=${userDomain} research=${researchDomain}` };
}

// F2 — Right locale: currency in hooks matches detected locale.
function checkF2RightLocale(research: string, hooks: string): CheckResult {
  const locale = detectLocale(research);
  if (locale === 'unknown') return { pass: true, note: 'locale unknown (skipped)' };
  if (locale === 'IN') {
    // Indian brand: $X is wrong
    if (/\$\s*\d/.test(hooks)) return { pass: false, note: 'USD in hooks for IN brand' };
    return { pass: true, note: 'IN locale, no USD leak' };
  }
  if (locale === 'CA' || locale === 'US' || locale === 'UK') {
    if (/₹\s*\d/.test(hooks)) return { pass: false, note: `INR in hooks for ${locale} brand` };
    return { pass: true, note: `${locale} locale, no INR leak` };
  }
  return { pass: true, note: `${locale} locale` };
}

// F3 — No fabrication (number-traceability): every interesting number in hooks
// also appears in research.
function checkF3NoFabrication(research: string, hooks: string): CheckResult {
  const hookNums = extractInterestingNumbers(hooks);
  if (hookNums.length === 0) return { pass: true, note: 'no numbers in hooks (skipped)' };
  const researchNums = new Set(extractInterestingNumbers(research).map(normalizeNumber));
  const fabricated: string[] = [];
  for (const n of hookNums) {
    if (!researchNums.has(normalizeNumber(n))) fabricated.push(n);
  }
  if (fabricated.length === 0) return { pass: true, note: `${hookNums.length} nums all traced` };
  return { pass: false, note: `untraced: ${fabricated.slice(0, 3).join(', ')}${fabricated.length > 3 ? '…' : ''}` };
}

// F4 — Hook in image: each image prompt contains at least one quoted string
// (proxy for hook headline / CTA embedded on canvas).
function checkF4HookInImage(images: CampaignImage[]): CheckResult {
  if (images.length === 0) return { pass: false, note: 'no images' };
  const stripped: CampaignImage[] = [];
  const withHook: CampaignImage[] = [];
  for (const img of images) {
    if (!img.prompt) continue;
    const quotedCount = (img.prompt.match(/['"][^'"]{5,}['"]/g) || []).length;
    const explicitNoText = /no\s+text\s+overlay/i.test(img.prompt);
    if (explicitNoText || quotedCount === 0) stripped.push(img);
    else withHook.push(img);
  }
  const total = stripped.length + withHook.length;
  if (total === 0) return { pass: false, note: 'no prompts' };
  const passRate = withHook.length / total;
  if (passRate >= 0.5) return { pass: true, note: `${withHook.length}/${total} images have hook content` };
  return { pass: false, note: `${stripped.length}/${total} images stripped of hook content` };
}

// F5 — Reference deployed: if user uploaded references, image prompts reference them.
function checkF5ReferenceDeployed(c: Campaign, images: CampaignImage[]): CheckResult {
  const refIds = c.active_reference_file_ids;
  if (!refIds || refIds === '[]' || refIds === 'null') {
    return { pass: true, note: 'no refs uploaded (skipped)' };
  }
  let parsed: string[] = [];
  try { parsed = JSON.parse(refIds); } catch { parsed = []; }
  if (parsed.length === 0) return { pass: true, note: 'no refs uploaded (skipped)' };
  if (images.length === 0) return { pass: false, note: `${parsed.length} refs uploaded, no images` };
  const refPattern = /reference image|uploaded image|provided image|refs?\.json|reference photo|user[- ]uploaded/i;
  const usingRefs = images.filter(img => img.prompt && refPattern.test(img.prompt));
  if (usingRefs.length === images.length) return { pass: true, note: `${parsed.length} refs deployed in all ${images.length} prompts` };
  if (usingRefs.length === 0) return { pass: false, note: `${parsed.length} refs uploaded, 0/${images.length} prompts use them` };
  return { pass: false, note: `${parsed.length} refs, only ${usingRefs.length}/${images.length} prompts use them` };
}

// F6 — CTA action-shaped: extracted CTAs contain action verbs / don't lead with soft patterns.
const SOFT_CTA_PATTERNS = [
  /^see\b/i, /^discover\b/i, /^explore\b/i, /^learn\b/i,
  /^find out\b/i, /^check out\b/i, /^view\b/i, /^read\b/i,
  /^browse\b/i,
];
const ACTION_VERBS = [
  /\b(start|get|claim|book|order|shop|buy|try|apply|schedule|join|grab|build|take|find|download|sign|activate|unlock|reserve|reveal|trade|switch|upgrade|stop|add|swap|compare|calculate)\b/i,
];
const URGENCY = /\b(now|today)\b/i;

function checkF6CTAActionShaped(hooks: string, images: CampaignImage[]): CheckResult {
  const ctas = extractCTAs(hooks);
  if (ctas.length === 0) {
    // Fall back to image prompts: look for "CTA '...'" or 'CTA "..."'
    const fromPrompts: string[] = [];
    for (const img of images) {
      if (!img.prompt) continue;
      for (const m of img.prompt.matchAll(/CTA[^a-zA-Z]+['"]([^'"]{2,40})['"]/g)) fromPrompts.push(m[1]);
    }
    if (fromPrompts.length === 0) return { pass: false, note: 'no CTAs detectable' };
    return judgeCTAs(fromPrompts);
  }
  return judgeCTAs(ctas);
}

function judgeCTAs(ctas: string[]): CheckResult {
  let soft = 0; let action = 0;
  const examples: string[] = [];
  for (const cta of ctas) {
    const isSoft = SOFT_CTA_PATTERNS.some(p => p.test(cta));
    const isAction = ACTION_VERBS.some(p => p.test(cta)) || URGENCY.test(cta);
    if (isSoft && !isAction) { soft++; examples.push(cta); }
    else action++;
  }
  if (soft === 0) return { pass: true, note: `${ctas.length} CTAs all action-shaped` };
  if (action > soft) return { pass: true, note: `${action}/${ctas.length} action, ${soft} soft` };
  return { pass: false, note: `${soft}/${ctas.length} soft CTAs (e.g. "${examples[0]}")` };
}

// ---------------------------------------------------------------------------
// Run all checks per campaign
// ---------------------------------------------------------------------------

interface RowResult {
  source: 'staging' | 'prod';
  id: string;
  name: string;
  followups: number;
  checks: Record<string, CheckResult>;
  overall: boolean;
  has_research: boolean;
  has_hooks: boolean;
  image_count: number;
}

function gradeCampaign(c: Campaign, files: CampaignFile[], images: CampaignImage[], messages: Message[]): RowResult {
  const research = files.find(f => f.file_type === 'research')?.content || '';
  const hooks = files.find(f => f.file_type === 'hooks')?.content || '';
  const imgs = images.filter(i => i.campaign_id === c.id).sort((a, b) => a.image_index - b.image_index);

  const F1 = research ? checkF1RightBrand(c, research, messages) : { pass: false, note: 'no research' };
  const F2 = research && hooks ? checkF2RightLocale(research, hooks) : { pass: false, note: 'missing research/hooks' };
  const F3 = research && hooks ? checkF3NoFabrication(research, hooks) : { pass: false, note: 'missing research/hooks' };
  const F4 = checkF4HookInImage(imgs);
  const F5 = checkF5ReferenceDeployed(c, imgs);
  const F6 = hooks || imgs.length > 0 ? checkF6CTAActionShaped(hooks, imgs) : { pass: false, note: 'no hooks/images' };

  const checks = { F1, F2, F3, F4, F5, F6 };
  const overall = Object.values(checks).every(r => r.pass);

  // Count assistant messages > 1 as follow-up turns
  const assistMsgs = assistantMsgCount(messages, c.id);
  const followups = Math.max(0, assistMsgs - 1);

  return {
    source: c.source,
    id: c.id,
    name: c.name,
    followups,
    checks,
    overall,
    has_research: !!research,
    has_hooks: !!hooks,
    image_count: imgs.length,
  };
}

// ---------------------------------------------------------------------------
// Output
// ---------------------------------------------------------------------------

const LABELS: Record<string, string> = {
  F1: 'Right brand',
  F2: 'Right locale',
  F3: 'No fabrication',
  F4: 'Hook in image',
  F5: 'Refs deployed',
  F6: 'Action CTA',
};

function shortName(name: string): string {
  return (name || '').slice(0, 38).replace(/\s+/g, ' ').trim();
}

function renderReport(results: RowResult[]): string {
  const lines: string[] = [];
  const today = new Date().toISOString().slice(0, 10);

  lines.push(`# Floor-grader baseline — ${today}`);
  lines.push('');
  lines.push('First-generation shippability rubric, 6 binary checks per campaign.');
  lines.push('See `axial-coding-SYNTHESIS.md` for rubric definitions.');
  lines.push('');
  lines.push('**Caveat:** `campaign_files` only stores latest state (overwritten on follow-ups).');
  lines.push('Campaigns with `followups > 0` may show iterated content for hooks/research/prompts.');
  lines.push('Images use `version=1` so reflect true first-gen output.');
  lines.push('');

  // Summary table
  const total = results.length;
  const passOverall = results.filter(r => r.overall).length;
  const perCheck: Record<string, { pass: number; total: number }> = {};
  for (const f of ['F1', 'F2', 'F3', 'F4', 'F5', 'F6']) {
    const passed = results.filter(r => r.checks[f].pass).length;
    perCheck[f] = { pass: passed, total };
  }

  lines.push('## Summary');
  lines.push('');
  lines.push(`**Overall floor pass rate:** ${passOverall}/${total} = **${Math.round((passOverall / total) * 100)}%**`);
  lines.push('');
  lines.push('| Check | Pass / Total | Rate |');
  lines.push('|---|---|---|');
  for (const f of ['F1', 'F2', 'F3', 'F4', 'F5', 'F6']) {
    const { pass, total: t } = perCheck[f];
    lines.push(`| ${f} — ${LABELS[f]} | ${pass}/${t} | ${Math.round((pass / t) * 100)}% |`);
  }
  lines.push('');

  // Per-campaign table
  lines.push('## Per-campaign results');
  lines.push('');
  lines.push('| Env | Campaign | Followups | F1 | F2 | F3 | F4 | F5 | F6 | All |');
  lines.push('|---|---|---|---|---|---|---|---|---|---|');
  for (const r of results.sort((a, b) => a.source.localeCompare(b.source) || a.id.localeCompare(b.id))) {
    const cells = ['F1', 'F2', 'F3', 'F4', 'F5', 'F6'].map(f => r.checks[f].pass ? '✓' : '✗');
    const label = `\`${r.id.replace('campaign_', '')}\` ${shortName(r.name)}`;
    lines.push(`| ${r.source} | ${label} | ${r.followups} | ${cells.join(' | ')} | ${r.overall ? '**PASS**' : 'fail'} |`);
  }
  lines.push('');

  // Per-campaign detail (notes)
  lines.push('## Per-campaign detail');
  lines.push('');
  for (const r of results.sort((a, b) => a.source.localeCompare(b.source) || a.id.localeCompare(b.id))) {
    lines.push(`### ${r.source.toUpperCase()} — \`${r.id}\` — ${r.name || '(no name)'}`);
    lines.push('');
    lines.push(`- followups: ${r.followups} · research: ${r.has_research ? '✓' : '✗'} · hooks: ${r.has_hooks ? '✓' : '✗'} · images: ${r.image_count}`);
    for (const f of ['F1', 'F2', 'F3', 'F4', 'F5', 'F6']) {
      const c = r.checks[f];
      lines.push(`- **${f} ${LABELS[f]}:** ${c.pass ? '✓' : '✗'} — ${c.note}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  console.log('[staging] loading 10 campaigns…');
  const staging = loadEnv(DB_STAGING, STAGING_IDS, 'staging');
  console.log(`  campaigns=${staging.campaigns.length} files=${staging.files.length} images=${staging.images.length} messages=${staging.messages.length}`);

  console.log('[prod] loading 8 campaigns…');
  const prod = loadEnv(DB_PROD, PROD_IDS, 'prod');
  console.log(`  campaigns=${prod.campaigns.length} files=${prod.files.length} images=${prod.images.length} messages=${prod.messages.length}`);

  const all: RowResult[] = [];
  for (const c of staging.campaigns) {
    all.push(gradeCampaign(c, staging.files.filter(f => f.campaign_id === c.id), staging.images, staging.messages));
  }
  for (const c of prod.campaigns) {
    all.push(gradeCampaign(c, prod.files.filter(f => f.campaign_id === c.id), prod.images, prod.messages));
  }

  const report = renderReport(all);
  const today = new Date().toISOString().slice(0, 10);
  // Resolve relative to the cloudflare/ working directory (script is run from there).
  const outPath = resolve(process.cwd(), `../docs/eval-corpus/floor-baseline-${today}.md`);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, report, 'utf8');
  console.log(`\nWrote ${outPath}`);

  // Echo summary to stdout
  const passOverall = all.filter(r => r.overall).length;
  console.log(`\nOverall: ${passOverall}/${all.length} = ${Math.round((passOverall / all.length) * 100)}%`);
}

main();
