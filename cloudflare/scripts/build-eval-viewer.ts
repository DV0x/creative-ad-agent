// Builds an interactive eval viewer at docs/eval-corpus/viewer.html:
//   - Pulls campaigns from prod + staging D1
//   - Downloads images from R2 (prod + staging buckets) into docs/eval-corpus/images/
//   - Generates a single self-contained HTML file with collapsible cards, inline image
//     previews, per-campaign notes textarea (localStorage), search/filter, and an
//     "export notes to MD" button.
//
// Run from cloudflare/:
//   npx tsx scripts/build-eval-viewer.ts
//
// Preserves existing notes from docs/eval-corpus/campaigns-YYYY-MM-DD.md (the dump file)
// by parsing them out and using as initial textarea values.

import { execSync } from 'node:child_process';
import { writeFileSync, mkdirSync, existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

const DB_PROD = 'creative-agent-db-prod';
const DB_STAGING = 'creative-agent-db';
const BUCKET_PROD = 'creative-agent-assets-prod';
const BUCKET_STAGING = 'creative-agent-assets';
const PROD_LIMIT = 10;
const STAGING_LIMIT = 30;
const IMAGE_CONCURRENCY = 5;

type Row = Record<string, unknown>;

function query(db: string, sql: string): Row[] {
  const cmd = ['npx', 'wrangler', 'd1', 'execute', db, '--remote', '--json', '--command', JSON.stringify(sql)].join(' ');
  const stdout = execSync(cmd, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] });
  const trimmed = stdout.trim();
  const jsonStart = trimmed.indexOf('[');
  if (jsonStart < 0) throw new Error(`no JSON in wrangler output`);
  const parsed = JSON.parse(trimmed.slice(jsonStart));
  return parsed[0]?.results ?? [];
}

function quoteIds(ids: string[]): string {
  return ids.map(id => `'${id.replace(/'/g, "''")}'`).join(',');
}

interface Campaign {
  id: string; name: string; brand: string | null; status: string;
  created_at: string; user_id: string; source: 'prod' | 'staging';
}
interface CFile { campaign_id: string; file_type: 'research' | 'hooks' | 'prompts'; content: string }
interface CImage { campaign_id: string; image_index: number; hook_type: string; prompt: string | null; file_path: string; version: number; user_id: string; source: 'prod' | 'staging' }
interface CMessage { campaign_id: string; content: string; created_at: string; role: string }

function dump(db: string, source: 'prod' | 'staging', limit: number) {
  console.log(`[${source}] fetching ${limit} campaigns…`);
  const campaigns = query(db, `SELECT id, name, brand, status, created_at, user_id FROM campaigns WHERE status = 'complete' ORDER BY created_at DESC LIMIT ${limit};`) as unknown as Omit<Campaign, 'source'>[];
  if (campaigns.length === 0) return { campaigns: [], files: [], images: [], messages: [] };
  const ids = campaigns.map(c => c.id);
  const inClause = quoteIds(ids);
  const files = query(db, `SELECT campaign_id, file_type, content FROM campaign_files WHERE campaign_id IN (${inClause});`) as unknown as CFile[];
  const imagesRaw = query(db, `SELECT campaign_id, image_index, hook_type, prompt, file_path, version FROM campaign_images WHERE campaign_id IN (${inClause}) AND version = 1 ORDER BY campaign_id, image_index;`) as unknown as Omit<CImage, 'user_id' | 'source'>[];
  const messages = query(db, `SELECT campaign_id, content, created_at, role FROM messages WHERE campaign_id IN (${inClause}) ORDER BY campaign_id, created_at ASC;`) as unknown as CMessage[];
  // Attach user_id + source to images for R2 lookup
  const campaignById = new Map(campaigns.map(c => [c.id, c]));
  const images: CImage[] = imagesRaw.map(img => ({
    ...img,
    user_id: campaignById.get(img.campaign_id)?.user_id ?? '',
    source,
  }));
  return {
    campaigns: campaigns.map(c => ({ ...c, source })),
    files,
    images,
    messages,
  };
}

function r2Key(img: CImage): string {
  // file_path looks like "/images/1778xxx.png" — strip the leading "/images/" so we can prepend "users/{userId}/images/"
  const stripped = img.file_path.replace(/^\/?images\//, '');
  return `users/${img.user_id}/images/${stripped}`;
}

function localImageName(img: CImage): string {
  // Unique local filename across prod+staging+campaigns
  const ext = img.file_path.match(/\.[a-z0-9]+$/i)?.[0] ?? '.png';
  return `${img.source}_${img.campaign_id}_${img.image_index}${ext}`;
}

async function downloadImagesConcurrent(images: CImage[], outDir: string) {
  const queue = images.slice();
  let done = 0;
  let failed = 0;
  const total = queue.length;
  console.log(`Downloading ${total} images (concurrency=${IMAGE_CONCURRENCY})…`);

  async function worker() {
    while (queue.length > 0) {
      const img = queue.shift();
      if (!img) return;
      const localPath = resolve(outDir, localImageName(img));
      if (existsSync(localPath)) {
        done++; continue;
      }
      const bucket = img.source === 'prod' ? BUCKET_PROD : BUCKET_STAGING;
      const key = r2Key(img);
      const cmd = `npx wrangler r2 object get "${bucket}/${key}" --file="${localPath}" --remote`;
      try {
        execSync(cmd, { stdio: ['ignore', 'ignore', 'ignore'] });
        done++;
      } catch {
        failed++;
      }
      if ((done + failed) % 10 === 0) {
        console.log(`  ${done + failed}/${total} (${failed} failed)`);
      }
    }
  }

  const workers = Array.from({ length: IMAGE_CONCURRENCY }, () => worker());
  await Promise.all(workers);
  console.log(`Done: ${done} downloaded, ${failed} failed (likely missing from R2).`);
}

// Parse existing notes from the .md dump file so we don't lose work
function parseExistingNotes(mdPath: string): Map<string, string> {
  const notes = new Map<string, string>();
  if (!existsSync(mdPath)) return notes;
  const md = readFileSync(mdPath, 'utf8');
  // Walk campaign sections. Each campaign starts with "## PROD" or "## STAGING" and contains
  // "- **Campaign ID:** `<id>`" line. The notes section starts at "### Open-coding notes" and
  // ends at the next "---" or next campaign.
  const campaignRe = /^## (?:PROD|STAGING) — /gm;
  let match: RegExpExecArray | null;
  const starts: number[] = [];
  while ((match = campaignRe.exec(md)) !== null) starts.push(match.index);
  starts.push(md.length);
  for (let i = 0; i < starts.length - 1; i++) {
    const block = md.slice(starts[i], starts[i + 1]);
    const idMatch = block.match(/\*\*Campaign ID:\*\* `([^`]+)`/);
    if (!idMatch) continue;
    const campaignId = idMatch[1];
    const notesIdx = block.indexOf('### Open-coding notes');
    if (notesIdx < 0) continue;
    const afterHeader = block.slice(notesIdx + '### Open-coding notes'.length);
    // Skip the leading "> _Write freeform observations here..._" line
    const lines = afterHeader.split('\n');
    const bulletLines: string[] = [];
    let started = false;
    for (const line of lines) {
      if (line.trim().startsWith('---')) break;
      if (line.trim().startsWith('>')) continue;
      if (!line.trim()) { if (started) continue; else continue; }
      // Capture bullets (lines starting with "- ")
      if (line.startsWith('- ')) {
        started = true;
        bulletLines.push(line.slice(2).trim());
      } else if (line === '-' || line.trim() === '-') {
        // empty bullet placeholder — skip
        continue;
      } else if (started) {
        // continuation lines for previous bullet
        bulletLines[bulletLines.length - 1] += ' ' + line.trim();
      }
    }
    if (bulletLines.length > 0) {
      notes.set(campaignId, bulletLines.map(b => `- ${b}`).join('\n'));
    }
  }
  return notes;
}

function tryParseJSON<T = unknown>(s: string): T | null {
  try { return JSON.parse(s) as T; } catch { return null; }
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function buildHtml(args: {
  campaigns: Campaign[];
  files: CFile[];
  images: CImage[];
  messages: CMessage[];
  initialNotes: Map<string, string>;
}): string {
  const { campaigns, files, images, messages, initialNotes } = args;

  function cardHtml(c: Campaign): string {
    const userMsgs = messages.filter(m => m.campaign_id === c.id && m.role === 'user');
    const allMsgs = messages.filter(m => m.campaign_id === c.id).sort((a, b) => a.created_at.localeCompare(b.created_at));
    const research = files.find(f => f.campaign_id === c.id && f.file_type === 'research');
    const hooks = files.find(f => f.campaign_id === c.id && f.file_type === 'hooks');
    const prompts = files.find(f => f.campaign_id === c.id && f.file_type === 'prompts');
    const imgs = images.filter(i => i.campaign_id === c.id).sort((a, b) => a.image_index - b.image_index);
    const initialNote = initialNotes.get(c.id) ?? '';
    const appUrl = c.source === 'prod'
      ? `https://creativemachines.xyz/campaigns/${c.id}`
      : `https://creative-agent-staging.alphasapien17.workers.dev/campaigns/${c.id}`;

    // Hook bank: parse JSON if possible, otherwise dump raw
    let hookHtml = '<em>(no hooks)</em>';
    if (hooks?.content) {
      const parsed = tryParseJSON<Record<string, unknown>>(hooks.content);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        const rows: string[] = [];
        for (const [k, v] of Object.entries(parsed)) {
          const text = typeof v === 'string' ? v : (v && typeof v === 'object' ? JSON.stringify(v, null, 2) : String(v));
          rows.push(`<div class="hook-row"><span class="hook-type">${escapeHtml(k)}</span><div class="hook-text">${escapeHtml(text)}</div></div>`);
        }
        hookHtml = rows.join('');
      } else {
        hookHtml = `<pre>${escapeHtml(hooks.content)}</pre>`;
      }
    }

    // Image grid
    const imgGrid = imgs.length === 0
      ? '<em>(no images)</em>'
      : `<div class="img-grid">${imgs.map(img => `
          <figure>
            <img src="images/${localImageName(img)}" alt="${escapeHtml(img.hook_type)}" loading="lazy"
                 onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'img-missing',textContent:'⚠ image missing: ${escapeHtml(localImageName(img))}'}))" />
            <figcaption>
              <strong>#${img.image_index}</strong> · <span class="badge">${escapeHtml(img.hook_type)}</span><br/>
              ${img.prompt ? `<details><summary>prompt</summary><pre>${escapeHtml(img.prompt)}</pre></details>` : ''}
            </figcaption>
          </figure>
        `).join('')}</div>`;

    // Conversation transcript
    const transcriptHtml = allMsgs.length === 0
      ? '<em>(no messages)</em>'
      : allMsgs.map(m => `<div class="msg msg-${m.role}"><span class="msg-role">${m.role}</span><div class="msg-content">${escapeHtml(m.content).replace(/\n/g, '<br/>')}</div></div>`).join('');

    const briefShort = userMsgs[0]?.content?.slice(0, 120).replace(/\n/g, ' ') ?? '';
    const sourceBadge = c.source === 'prod' ? '<span class="src src-prod">PROD</span>' : '<span class="src src-staging">STAGING</span>';
    const date = c.created_at.slice(0, 10);

    return `
<article class="card" data-campaign-id="${c.id}" data-source="${c.source}" data-brand="${escapeHtml(c.brand ?? '')}" data-name="${escapeHtml(c.name)}">
  <header class="card-header" onclick="toggleCard(this)">
    <div class="hdr-main">
      ${sourceBadge}
      <span class="brand-name">${escapeHtml(c.brand || c.name || 'Untitled')}</span>
      <span class="date">${date}</span>
      <span class="status">${escapeHtml(c.status)}</span>
    </div>
    <div class="hdr-brief">${escapeHtml(briefShort)}</div>
    <div class="hdr-state">
      <span class="note-indicator" id="ind-${c.id}">·</span>
      <span class="chevron">▾</span>
    </div>
  </header>
  <div class="card-body">
    <div class="meta-line">
      <code>${c.id}</code> ·
      <a href="${appUrl}" target="_blank" rel="noopener">view in app ↗</a> ·
      ${imgs.length} image${imgs.length === 1 ? '' : 's'}
    </div>

    <section>
      <h3>User brief</h3>
      <pre class="brief">${escapeHtml(userMsgs[0]?.content ?? '(none)')}</pre>
    </section>

    <section>
      <h3>Images</h3>
      ${imgGrid}
    </section>

    <section>
      <h3>Hooks</h3>
      <div class="hooks">${hookHtml}</div>
    </section>

    <section>
      <details><summary><h3 style="display:inline">Research output</h3> (click to expand)</summary>
        <pre class="research">${escapeHtml(research?.content ?? '(none)')}</pre>
      </details>
    </section>

    <section>
      <details><summary><h3 style="display:inline">Art direction / prompts</h3> (click to expand)</summary>
        <pre class="art-direction">${escapeHtml(prompts?.content ?? '(none)')}</pre>
      </details>
    </section>

    ${allMsgs.length > 1 ? `
    <section>
      <details><summary><h3 style="display:inline">Full transcript (${allMsgs.length} msgs)</h3> (click to expand)</summary>
        <div class="transcript">${transcriptHtml}</div>
      </details>
    </section>` : ''}

    <section class="notes-section">
      <h3>Open-coding notes</h3>
      <p class="hint">Write freeform observations. What's generic? Fabricated? Brand-specific? Don't categorize yet — that comes later.</p>
      <textarea class="notes" data-campaign-id="${c.id}" data-initial="${escapeHtml(initialNote)}" rows="6" placeholder="- &lt;observation&gt;&#10;- &lt;observation&gt;"></textarea>
      <div class="notes-actions">
        <label><input type="checkbox" class="done-toggle" data-campaign-id="${c.id}" /> Mark as coded</label>
        <button type="button" onclick="clearNotes('${c.id}')">clear</button>
      </div>
    </section>
  </div>
</article>`;
  }

  const cards = campaigns.map(cardHtml).join('\n');
  const prodCount = campaigns.filter(c => c.source === 'prod').length;
  const stagingCount = campaigns.filter(c => c.source === 'staging').length;
  const today = new Date().toISOString().slice(0, 10);

  // The JS + CSS is inline so this is a single drop-in file
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Eval Corpus Viewer — ${today}</title>
<style>
:root {
  --bg: #0f1115;
  --bg-card: #161a22;
  --bg-card-hover: #1c2230;
  --border: #2a3142;
  --fg: #e8eaf0;
  --fg-muted: #8a93a6;
  --accent: #7dd3fc;
  --prod: #34d399;
  --staging: #fbbf24;
  --code-bg: #0a0c11;
  --note-coded: #34d399;
}
* { box-sizing: border-box; }
body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif; background: var(--bg); color: var(--fg); line-height: 1.5; }
header.top {
  position: sticky; top: 0; z-index: 100;
  background: var(--bg-card); border-bottom: 1px solid var(--border);
  padding: 12px 20px; display: flex; align-items: center; gap: 16px; flex-wrap: wrap;
}
header.top h1 { margin: 0; font-size: 16px; font-weight: 700; }
header.top .stats { color: var(--fg-muted); font-size: 13px; }
header.top input[type="search"] { background: var(--code-bg); border: 1px solid var(--border); color: var(--fg); padding: 6px 10px; border-radius: 4px; min-width: 200px; }
header.top button, header.top select { background: var(--code-bg); border: 1px solid var(--border); color: var(--fg); padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 13px; }
header.top button:hover { background: var(--bg-card-hover); }
header.top .progress { font-weight: 700; color: var(--accent); }
.container { max-width: 1100px; margin: 0 auto; padding: 20px; }
.card { background: var(--bg-card); border: 1px solid var(--border); border-radius: 8px; margin-bottom: 12px; overflow: hidden; }
.card-header { padding: 12px 16px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; gap: 12px; }
.card-header:hover { background: var(--bg-card-hover); }
.hdr-main { display: flex; align-items: center; gap: 12px; flex: 0 0 auto; }
.hdr-brief { color: var(--fg-muted); font-size: 13px; flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.hdr-state { display: flex; align-items: center; gap: 8px; }
.brand-name { font-weight: 700; }
.date { color: var(--fg-muted); font-size: 13px; }
.status { font-size: 11px; padding: 2px 6px; background: var(--code-bg); border-radius: 3px; color: var(--fg-muted); }
.src { font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 3px; letter-spacing: 0.5px; }
.src-prod { background: rgba(52, 211, 153, 0.15); color: var(--prod); }
.src-staging { background: rgba(251, 191, 36, 0.15); color: var(--staging); }
.note-indicator { font-weight: 700; font-size: 14px; color: var(--fg-muted); width: 14px; text-align: center; }
.note-indicator.coded { color: var(--note-coded); }
.chevron { color: var(--fg-muted); transition: transform 0.15s; }
.card.open .chevron { transform: rotate(180deg); }
.card-body { display: none; padding: 0 16px 16px; border-top: 1px solid var(--border); }
.card.open .card-body { display: block; }
.meta-line { padding: 12px 0; color: var(--fg-muted); font-size: 12px; }
.meta-line code { background: var(--code-bg); padding: 2px 6px; border-radius: 3px; font-size: 11px; }
.meta-line a { color: var(--accent); }
section { margin: 16px 0; }
section h3 { font-size: 14px; margin: 0 0 8px; color: var(--fg); }
pre { background: var(--code-bg); border: 1px solid var(--border); border-radius: 4px; padding: 12px; font-size: 12px; line-height: 1.5; overflow-x: auto; white-space: pre-wrap; word-break: break-word; }
pre.brief { background: rgba(125, 211, 252, 0.05); border-color: rgba(125, 211, 252, 0.2); }
pre.research { max-height: 500px; overflow-y: auto; }
pre.art-direction { max-height: 500px; overflow-y: auto; }
details > summary { cursor: pointer; color: var(--fg-muted); font-size: 13px; padding: 4px 0; }
details > summary:hover { color: var(--fg); }
.img-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px; }
.img-grid figure { margin: 0; background: var(--code-bg); border: 1px solid var(--border); border-radius: 4px; overflow: hidden; }
.img-grid img { width: 100%; height: auto; display: block; }
.img-grid figcaption { padding: 8px; font-size: 12px; color: var(--fg-muted); }
.img-grid figcaption details { margin-top: 4px; }
.img-grid figcaption pre { font-size: 11px; padding: 6px; max-height: 150px; overflow-y: auto; }
.img-missing { padding: 40px 16px; text-align: center; color: var(--staging); font-size: 12px; background: var(--code-bg); }
.badge { background: rgba(125, 211, 252, 0.15); color: var(--accent); padding: 1px 6px; border-radius: 3px; font-size: 10px; font-weight: 700; }
.hooks { background: var(--code-bg); border: 1px solid var(--border); border-radius: 4px; padding: 8px; }
.hook-row { padding: 6px 0; border-bottom: 1px solid var(--border); display: flex; gap: 12px; }
.hook-row:last-child { border-bottom: none; }
.hook-type { background: rgba(125, 211, 252, 0.1); color: var(--accent); padding: 2px 8px; border-radius: 3px; font-size: 11px; font-weight: 700; align-self: flex-start; min-width: 80px; }
.hook-text { flex: 1; font-size: 13px; white-space: pre-wrap; }
.transcript { display: flex; flex-direction: column; gap: 8px; }
.msg { display: flex; gap: 12px; padding: 8px; background: var(--code-bg); border-radius: 4px; font-size: 12px; }
.msg-role { font-weight: 700; min-width: 70px; }
.msg-user .msg-role { color: var(--accent); }
.msg-assistant .msg-role { color: var(--prod); }
.msg-content { flex: 1; white-space: pre-wrap; word-break: break-word; }
.notes-section { background: rgba(125, 211, 252, 0.04); border: 1px solid rgba(125, 211, 252, 0.2); border-radius: 6px; padding: 12px; }
.notes-section h3 { color: var(--accent); }
.notes-section .hint { font-size: 12px; color: var(--fg-muted); margin: 4px 0 8px; }
textarea.notes { width: 100%; min-height: 100px; background: var(--code-bg); border: 1px solid var(--border); color: var(--fg); padding: 10px; border-radius: 4px; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 13px; resize: vertical; line-height: 1.6; }
.notes-actions { margin-top: 8px; display: flex; gap: 12px; align-items: center; font-size: 12px; color: var(--fg-muted); }
.notes-actions button { background: var(--code-bg); border: 1px solid var(--border); color: var(--fg-muted); padding: 4px 10px; border-radius: 3px; cursor: pointer; font-size: 11px; }
.notes-actions button:hover { color: var(--fg); border-color: var(--fg-muted); }
.hidden { display: none !important; }
</style>
</head>
<body>
<header class="top">
  <h1>Eval Corpus — ${today}</h1>
  <span class="stats">${prodCount} prod · ${stagingCount} staging</span>
  <input type="search" id="search" placeholder="filter by brand…" />
  <select id="srcFilter">
    <option value="all">all sources</option>
    <option value="prod">prod only</option>
    <option value="staging">staging only</option>
  </select>
  <button type="button" id="expandAll">expand all</button>
  <button type="button" id="collapseAll">collapse all</button>
  <span class="progress" id="progress">0 / ${campaigns.length} coded</span>
  <button type="button" id="exportBtn">⬇ export notes</button>
</header>
<main class="container">
${cards}
</main>
<script>
(() => {
  const STORAGE_KEY = 'eval-corpus-notes-${today}';
  const DONE_KEY = 'eval-corpus-done-${today}';
  const totalCampaigns = ${campaigns.length};

  // Load saved notes
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch {}
  let done = {};
  try { done = JSON.parse(localStorage.getItem(DONE_KEY) || '{}'); } catch {}

  // Hydrate textareas
  document.querySelectorAll('textarea.notes').forEach(ta => {
    const id = ta.dataset.campaignId;
    const initial = ta.dataset.initial || '';
    const stored = saved[id];
    ta.value = (stored !== undefined && stored !== null) ? stored : initial;
    ta.addEventListener('input', () => {
      saved[id] = ta.value;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
      updateIndicator(id);
      updateProgress();
    });
  });

  document.querySelectorAll('.done-toggle').forEach(cb => {
    const id = cb.dataset.campaignId;
    cb.checked = !!done[id];
    cb.addEventListener('change', () => {
      done[id] = cb.checked;
      localStorage.setItem(DONE_KEY, JSON.stringify(done));
      updateIndicator(id);
      updateProgress();
    });
  });

  function isCoded(id) {
    const text = (saved[id] || '').trim();
    return done[id] || text.length > 0;
  }

  function updateIndicator(id) {
    const el = document.getElementById('ind-' + id);
    if (!el) return;
    if (isCoded(id)) { el.classList.add('coded'); el.textContent = '✓'; }
    else { el.classList.remove('coded'); el.textContent = '·'; }
  }

  function updateProgress() {
    const ids = Array.from(document.querySelectorAll('article.card')).map(c => c.dataset.campaignId);
    const coded = ids.filter(isCoded).length;
    document.getElementById('progress').textContent = coded + ' / ' + totalCampaigns + ' coded';
  }

  // Initial pass
  document.querySelectorAll('article.card').forEach(c => updateIndicator(c.dataset.campaignId));
  updateProgress();

  // Toggle card
  window.toggleCard = (hdr) => {
    hdr.parentElement.classList.toggle('open');
  };

  // Clear notes
  window.clearNotes = (id) => {
    if (!confirm('Clear notes for this campaign?')) return;
    delete saved[id];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    const ta = document.querySelector('textarea.notes[data-campaign-id="' + id + '"]');
    if (ta) { ta.value = ta.dataset.initial || ''; }
    updateIndicator(id);
    updateProgress();
  };

  // Search + filter
  const search = document.getElementById('search');
  const srcFilter = document.getElementById('srcFilter');
  function applyFilters() {
    const q = search.value.toLowerCase().trim();
    const src = srcFilter.value;
    document.querySelectorAll('article.card').forEach(c => {
      const matchSrc = src === 'all' || c.dataset.source === src;
      const matchQ = !q || (c.dataset.brand + ' ' + c.dataset.name).toLowerCase().includes(q);
      c.classList.toggle('hidden', !(matchSrc && matchQ));
    });
  }
  search.addEventListener('input', applyFilters);
  srcFilter.addEventListener('change', applyFilters);

  // Expand / collapse all
  document.getElementById('expandAll').addEventListener('click', () => {
    document.querySelectorAll('article.card:not(.hidden)').forEach(c => c.classList.add('open'));
  });
  document.getElementById('collapseAll').addEventListener('click', () => {
    document.querySelectorAll('article.card').forEach(c => c.classList.remove('open'));
  });

  // Export notes as MD
  document.getElementById('exportBtn').addEventListener('click', () => {
    const lines = ['# Eval Corpus Notes — ${today}', ''];
    document.querySelectorAll('article.card').forEach(c => {
      const id = c.dataset.campaignId;
      const text = (saved[id] || '').trim();
      if (!text) return;
      const brand = c.dataset.brand || c.dataset.name || id;
      const source = c.dataset.source.toUpperCase();
      const isDone = done[id] ? ' ✓' : '';
      lines.push('## ' + source + ' — ' + brand + ' (\`' + id + '\`)' + isDone);
      lines.push('');
      lines.push(text);
      lines.push('');
      lines.push('---');
      lines.push('');
    });
    const blob = new Blob([lines.join('\\n')], { type: 'text/markdown' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'eval-notes-${today}.md';
    a.click();
  });
})();
</script>
</body>
</html>
`;
}

async function main() {
  const prodData = dump(DB_PROD, 'prod', PROD_LIMIT);
  const stagingData = dump(DB_STAGING, 'staging', STAGING_LIMIT);

  const campaigns = [...prodData.campaigns, ...stagingData.campaigns] as Campaign[];
  const files = [...prodData.files, ...stagingData.files];
  const images = [...prodData.images, ...stagingData.images];
  const messages = [...prodData.messages, ...stagingData.messages];

  const outDir = resolve(__dirname, '..', '..', 'docs', 'eval-corpus');
  const imgDir = resolve(outDir, 'images');
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
  if (!existsSync(imgDir)) mkdirSync(imgDir, { recursive: true });

  // Parse existing notes from the .md dump
  const today = new Date().toISOString().slice(0, 10);
  const mdPath = resolve(outDir, `campaigns-${today}.md`);
  const initialNotes = parseExistingNotes(mdPath);
  console.log(`Preserving notes for ${initialNotes.size} campaign${initialNotes.size === 1 ? '' : 's'} from ${mdPath}`);

  // Download images from R2
  await downloadImagesConcurrent(images, imgDir);

  // Verify how many images actually landed
  const haveLocal = new Set(readdirSync(imgDir));
  const missing = images.filter(img => !haveLocal.has(localImageName(img)));
  if (missing.length > 0) {
    console.log(`⚠ ${missing.length} images missing locally — viewer will show placeholders.`);
  }

  // Build HTML
  const html = buildHtml({ campaigns, files, images, messages, initialNotes });
  const htmlPath = resolve(outDir, 'viewer.html');
  writeFileSync(htmlPath, html, 'utf8');
  console.log(`\n✓ Wrote viewer: ${htmlPath}`);
  console.log(`  Open: file://${htmlPath}`);
}

main().catch(err => {
  console.error('Failed:', err);
  process.exit(1);
});
