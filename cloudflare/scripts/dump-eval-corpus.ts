// Dumps recent campaigns from staging + prod D1 into a single Markdown file
// for human open-coding (Q2 of the eval framework).
//
// Run from cloudflare/ via:  npx tsx scripts/dump-eval-corpus.ts
//
// Output: docs/eval-corpus/campaigns-YYYY-MM-DD.md

import { execSync } from 'node:child_process';
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';

const DB_PROD = 'creative-agent-db-prod';
const DB_STAGING = 'creative-agent-db';
const PROD_LIMIT = 10;
const STAGING_LIMIT = 30;

type Row = Record<string, unknown>;

function query(db: string, sql: string): Row[] {
  const cmd = ['npx', 'wrangler', 'd1', 'execute', db, '--remote', '--json', '--command', JSON.stringify(sql)].join(' ');
  const stdout = execSync(cmd, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] });
  const trimmed = stdout.trim();
  const jsonStart = trimmed.indexOf('[');
  if (jsonStart < 0) throw new Error(`no JSON in wrangler output:\n${stdout.slice(0, 400)}`);
  const parsed = JSON.parse(trimmed.slice(jsonStart));
  return parsed[0]?.results ?? [];
}

function quoteIds(ids: string[]): string {
  return ids.map(id => `'${id.replace(/'/g, "''")}'`).join(',');
}

interface Campaign {
  id: string;
  name: string;
  brand: string | null;
  status: string;
  created_at: string;
  user_id: string;
  source: 'prod' | 'staging';
}

interface File { campaign_id: string; file_type: 'research' | 'hooks' | 'prompts'; content: string }
interface Image { campaign_id: string; image_index: number; hook_type: string; prompt: string | null; file_path: string; version: number }
interface Message { campaign_id: string; content: string; created_at: string }

function dump(db: string, source: 'prod' | 'staging', limit: number) {
  console.log(`[${source}] fetching ${limit} campaigns…`);
  const campaigns = query(db, `SELECT id, name, brand, status, created_at, user_id FROM campaigns WHERE status = 'complete' ORDER BY created_at DESC LIMIT ${limit};`) as unknown as Omit<Campaign, 'source'>[];
  if (campaigns.length === 0) return { campaigns: [], files: [], images: [], messages: [] };
  const ids = campaigns.map(c => c.id);
  const inClause = quoteIds(ids);
  const files = query(db, `SELECT campaign_id, file_type, content FROM campaign_files WHERE campaign_id IN (${inClause});`) as unknown as File[];
  const images = query(db, `SELECT campaign_id, image_index, hook_type, prompt, file_path, version FROM campaign_images WHERE campaign_id IN (${inClause}) AND version = 1 ORDER BY campaign_id, image_index;`) as unknown as Image[];
  const messages = query(db, `SELECT campaign_id, content, created_at FROM messages WHERE role = 'user' AND campaign_id IN (${inClause}) ORDER BY campaign_id, created_at ASC;`) as unknown as Message[];
  return {
    campaigns: campaigns.map(c => ({ ...c, source })),
    files,
    images,
    messages,
  };
}

function tryParseJSON<T = unknown>(s: string): T | null {
  try { return JSON.parse(s) as T; } catch { return null; }
}

function fmtCampaign(c: Campaign, files: File[], images: Image[], messages: Message[]): string {
  const lines: string[] = [];
  const date = c.created_at.slice(0, 10);
  lines.push(`## ${c.source.toUpperCase()} — ${c.name || '(no name)'} — ${date}`);
  lines.push('');
  lines.push(`- **Campaign ID:** \`${c.id}\``);
  lines.push(`- **User ID:** \`${c.user_id}\``);
  lines.push(`- **Brand:** ${c.brand || '_(none)_'}`);
  lines.push(`- **Status:** ${c.status}`);
  lines.push(`- **Created:** ${c.created_at}`);
  const url = c.source === 'prod' ? `https://creativemachines.xyz/campaigns/${c.id}` : `https://creative-agent-staging.alphasapien17.workers.dev/campaigns/${c.id}`;
  lines.push(`- **View in app:** ${url}`);
  lines.push('');

  // User brief (first user message)
  const userMsgs = messages.filter(m => m.campaign_id === c.id);
  if (userMsgs.length > 0) {
    lines.push('### User brief (first message)');
    lines.push('```');
    lines.push(userMsgs[0].content.slice(0, 1500));
    lines.push('```');
    if (userMsgs.length > 1) {
      lines.push(`_(${userMsgs.length - 1} follow-up turn${userMsgs.length > 2 ? 's' : ''} omitted)_`);
    }
    lines.push('');
  }

  // Research
  const research = files.find(f => f.campaign_id === c.id && f.file_type === 'research');
  if (research && research.content) {
    lines.push('### Research output');
    lines.push('```markdown');
    lines.push(research.content.slice(0, 6000));
    if (research.content.length > 6000) lines.push(`\n_(truncated; full length ${research.content.length} chars)_`);
    lines.push('```');
    lines.push('');
  } else {
    lines.push('### Research output');
    lines.push('_(none)_');
    lines.push('');
  }

  // Hooks
  const hooks = files.find(f => f.campaign_id === c.id && f.file_type === 'hooks');
  if (hooks && hooks.content) {
    lines.push('### Hooks');
    const parsed = tryParseJSON<Record<string, unknown>>(hooks.content);
    if (parsed && typeof parsed === 'object') {
      for (const [k, v] of Object.entries(parsed)) {
        const text = typeof v === 'string' ? v : (v && typeof v === 'object' && 'text' in (v as Record<string, unknown>) ? String((v as Record<string, unknown>).text) : JSON.stringify(v));
        lines.push(`- **${k}:** ${text}`);
      }
    } else {
      lines.push('```');
      lines.push(hooks.content.slice(0, 2000));
      lines.push('```');
    }
    lines.push('');
  }

  // Art direction / image prompts
  const prompts = files.find(f => f.campaign_id === c.id && f.file_type === 'prompts');
  if (prompts && prompts.content) {
    lines.push('### Art direction / image prompts');
    lines.push('```');
    lines.push(prompts.content.slice(0, 4000));
    if (prompts.content.length > 4000) lines.push(`\n_(truncated; full length ${prompts.content.length} chars)_`);
    lines.push('```');
    lines.push('');
  }

  // Images
  const imgs = images.filter(i => i.campaign_id === c.id).sort((a, b) => a.image_index - b.image_index);
  if (imgs.length > 0) {
    lines.push('### Images');
    for (const img of imgs) {
      lines.push(`- **${img.image_index} (${img.hook_type}):** \`${img.file_path}\``);
      if (img.prompt) {
        lines.push(`  - prompt: ${img.prompt.slice(0, 300).replace(/\n/g, ' ')}${img.prompt.length > 300 ? '…' : ''}`);
      }
    }
    lines.push('');
  } else {
    lines.push('### Images');
    lines.push('_(none generated)_');
    lines.push('');
  }

  // Open-coding workspace
  lines.push('### Open-coding notes');
  lines.push('> _Write freeform observations here. What\'s wrong? What\'s generic? What\'s fabricated? Don\'t categorize yet._');
  lines.push('');
  lines.push('-');
  lines.push('-');
  lines.push('-');
  lines.push('');
  lines.push('---');
  lines.push('');
  return lines.join('\n');
}

function main() {
  const prodData = dump(DB_PROD, 'prod', PROD_LIMIT);
  const stagingData = dump(DB_STAGING, 'staging', STAGING_LIMIT);

  const allCampaigns = [...prodData.campaigns, ...stagingData.campaigns] as Campaign[];
  const allFiles = [...prodData.files, ...stagingData.files];
  const allImages = [...prodData.images, ...stagingData.images];
  const allMessages = [...prodData.messages, ...stagingData.messages];

  const today = new Date().toISOString().slice(0, 10);
  const outDir = resolve(__dirname, '..', '..', 'docs', 'eval-corpus');
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
  const outPath = resolve(outDir, `campaigns-${today}.md`);

  const header: string[] = [];
  header.push(`# Eval Corpus — ${today}`);
  header.push('');
  header.push(`Dumped from D1: ${prodData.campaigns.length} prod + ${stagingData.campaigns.length} staging campaigns (status=complete).`);
  header.push('');
  header.push('**How to use this file:**');
  header.push('1. Read each campaign end-to-end. Click the "View in app" link to see images.');
  header.push('2. In each "Open-coding notes" section, write freeform observations. Don\'t fit them into categories.');
  header.push('3. After ~30 campaigns, feed all notes into an LLM for axial coding (group into 5-6 patterns).');
  header.push('');
  header.push('---');
  header.push('');

  const body = allCampaigns.map(c => fmtCampaign(c, allFiles, allImages, allMessages)).join('\n');
  writeFileSync(outPath, header.join('\n') + body, 'utf8');
  console.log(`\n✓ Wrote ${allCampaigns.length} campaigns to ${outPath}`);
  console.log(`  prod: ${prodData.campaigns.length}, staging: ${stagingData.campaigns.length}`);
  console.log(`  files: ${allFiles.length}, images: ${allImages.length}, user messages: ${allMessages.length}`);
}

main();
