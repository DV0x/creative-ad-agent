/**
 * web.ts — the lite pipeline's web entry.
 *
 *   npm run web   →   http://localhost:4142
 *
 * A fork of agent-loop/web/server.ts (the per-connection plumbing must differ:
 * lite runs dir, step-0 capture before the session wakes, the lite Options
 * builder through ChatSession's buildOptions seam). Everything engine-side is
 * IMPORTED from agent-loop unchanged: ChatSession (held-open stream +
 * AskUserQuestion wiring + watchdog), the reducer, setup helpers, TraceLogger,
 * and the browser UI (web/public) itself.
 */
import { createServer } from 'node:http';
import { WebSocketServer } from 'ws';
import { readFile } from 'node:fs/promises';
import { existsSync, watch, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { join, extname, basename, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEnv, writeFounderStub, readSessionInfo, rehydrateView, slugFor, type ResumableRun } from '../agent-loop/chat/setup.ts';
import { ChatSession } from '../agent-loop/chat/session.ts';
import { initView, reduce, type ChatView } from '../agent-loop/chat/reducer.ts';
import { TraceLogger } from '../agent-loop/trace.ts';
import { buildLiteOptions } from './pipeline.ts';
import { LITE_ORDER } from './stages.ts';
import { captureStepZero } from './capture.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const LITE_DIR = __dirname;
const RUNS_DIR = join(LITE_DIR, 'runs');
const PUBLIC = join(LITE_DIR, '..', 'agent-loop', 'web', 'public'); // reuse the heavy UI as-is
const PORT = 4142;

loadEnv();
// S155 F1/F14 — lite runs on a fast turn cadence (~35s between calls), so agent-loop's
// 1h prompt-cache TTL (2× write cost, right for heavy's long stage gaps) only adds a
// ~60% surcharge here. And microcompact's tool-result pruning invalidated the field
// seat's cache EVERY call in run 1 (~$4.40 of re-writes) while silently dropping viewed
// images from context — with the download pool now capped, the full pool fits without
// pruning.
delete process.env.ENABLE_PROMPT_CACHING_1H;
process.env.DISABLE_MICROCOMPACT = '1';

/** TraceLogger that strips base64 image payloads before they hit trace.jsonl —
 *  run 1's trace was 113MB of viewed-image bytes. Non-mutating (JSON round-trip),
 *  fast path skips small messages; the reducer/UI stream is untouched. */
class LiteTraceLogger extends TraceLogger {
  record(m: any): void {
    try {
      if (m && typeof m === 'object') {
        const s = JSON.stringify(m);
        if (s.length > 200_000) {
          super.record(JSON.parse(s, (k, v) => (k === 'data' && typeof v === 'string' && v.length > 50_000 ? `[stripped ${v.length}B base64]` : v)));
          return;
        }
      }
    } catch { /* fall through to raw */ }
    super.record(m);
  }
}

function missingLiteKeys(): string[] {
  const missing = ['PERPLEXITY_API_KEY', 'SCRAPECREATORS_API_KEY'].filter((k) => !process.env[k]);
  if (!process.env.KIE_API_KEY && !process.env.FAL_KEY) missing.push('KIE_API_KEY (or FAL_KEY)');
  return missing;
}

function createLiteRunDir(brandUrl: string): string {
  const runDir = join(RUNS_DIR, `${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}_${slugFor(brandUrl)}`);
  for (const d of ['field/picks', 'field/creatives', 'creatives', 'renders', 'raw/pages', 'assets']) {
    mkdirSync(join(runDir, d), { recursive: true });
  }
  return runDir;
}

function listLiteRuns(limit = 8): ResumableRun[] {
  if (!existsSync(RUNS_DIR)) return [];
  const out: ResumableRun[] = [];
  for (const name of readdirSync(RUNS_DIR).sort().reverse()) {
    if (out.length >= limit) break;
    const dir = join(RUNS_DIR, name);
    const info = readSessionInfo(dir);
    if (!info) continue;
    const rendersDir = join(dir, 'renders');
    const renders = existsSync(rendersDir)
      ? readdirSync(rendersDir).filter((f) => /\.(png|jpe?g|webp)$/i.test(f)).length
      : 0;
    out.push({ runId: name, brandUrl: info.brandUrl, startedAt: info.startedAt, done: existsSync(join(dir, 'DONE.md')), renders });
  }
  return out;
}

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
};

const http = createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? '/', 'http://localhost');
    let path = decodeURIComponent(url.pathname);
    if (path.startsWith('/images/')) {
      const [runId, ...rest] = path.replace('/images/', '').split('/');
      const imgPath = join(RUNS_DIR, runId, 'renders', rest.join('/'));
      if (existsSync(imgPath) && imgPath.startsWith(RUNS_DIR)) {
        res.writeHead(200, { 'content-type': MIME[extname(imgPath)] ?? 'application/octet-stream', 'cache-control': 'no-cache' });
        res.end(await readFile(imgPath));
        return;
      }
      res.writeHead(404);
      res.end('image not found');
      return;
    }
    if (path === '/') path = '/index.html';
    const filePath = join(PUBLIC, path);
    if (existsSync(filePath) && filePath.startsWith(PUBLIC)) {
      res.writeHead(200, { 'content-type': MIME[extname(filePath)] ?? 'text/plain' });
      res.end(await readFile(filePath));
      return;
    }
    res.writeHead(404);
    res.end('not found');
  } catch (e: any) {
    res.writeHead(500);
    res.end(String(e?.message ?? e));
  }
});

// Founder uploads (hero photo etc.) land in assets/ for render binding.
async function bindReference(runDir: string, dataUrl: string, filename: string, idx: number) {
  const m = /^data:(image\/[a-z0-9.+-]+);base64,(.+)$/i.exec(dataUrl);
  if (!m) throw new Error('not a valid image');
  const buf = Buffer.from(m[2], 'base64');
  const ext = (m[1].split('/')[1] || 'jpg').replace('jpeg', 'jpg').replace('+xml', '');
  const base = (filename || `ref-${idx}`).replace(/\.[^.]+$/, '').replace(/[^a-z0-9._-]+/gi, '-').slice(0, 32) || `ref-${idx}`;
  const assetsDir = join(runDir, 'assets');
  mkdirSync(assetsDir, { recursive: true });
  const localPath = join(assetsDir, `ref-${idx}-${base}.${ext}`);
  writeFileSync(localPath, buf);
  return { localPath, count: idx };
}

/** initView seeds the heavy loop's interleaved seats (buy after create, gate after
 *  build) — lite has neither; drop the rows so the pipeline strip shows 5 real seats. */
const liteView = (v: ChatView): ChatView => ({
  ...v,
  stages: v.stages.filter((s) => (LITE_ORDER as readonly string[]).includes(s.id)),
});

const wss = new WebSocketServer({ server: http });

// S155 F32: every live ChatSession, so a dying server can interrupt its SDK CLI
// child. Without this, killing the server ORPHANS the agent: the CLI treats
// stdin EOF as "finish the current run" and keeps orchestrating — with the
// hooks, validators, trace logger, and MCP servers all dead in this process.
// Run 3's orphan ran ~11 unsupervised minutes and fabricated 14 field picks.
const liveSessions = new Set<ChatSession>();
let shuttingDown = false;
const hardStop = (signal: string) => {
  if (shuttingDown) return;
  shuttingDown = true;
  process.stdout.write(`\n  ✦ ${signal} — interrupting ${liveSessions.size} live session(s) so no orphan survives…\n`);
  const kills = [...liveSessions].map((s) => s.interrupt().catch(() => {}));
  void Promise.allSettled(kills).then(() => process.exit(0));
  setTimeout(() => process.exit(0), 5000).unref(); // belt: never hang the shutdown
};
process.on('SIGINT', () => hardStop('SIGINT'));
process.on('SIGTERM', () => hardStop('SIGTERM'));

wss.on('connection', (ws) => {
  let session: ChatSession | null = null;
  let view: ChatView | null = null;
  let runId = '';
  let runDir = '';
  let refCount = 0;
  let imgWatcher: ReturnType<typeof watch> | null = null;
  let dirty = false;

  const send = (obj: unknown) => {
    if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(obj));
  };
  const flush = setInterval(() => {
    if (dirty && view) {
      dirty = false;
      send({ type: 'view', view });
    }
  }, 120);
  const bump = (e: Parameters<typeof reduce>[1]) => {
    if (view) {
      view = reduce(view, e);
      dirty = true;
    }
  };

  send({ type: 'runs', runs: listLiteRuns() });

  ws.on('message', (data) => {
    let msg: any;
    try {
      msg = JSON.parse(data.toString());
    } catch {
      return;
    }
    if (msg.type === 'start' && !session)
      startRun(String(msg.url ?? ''), msg.image).catch((e) => send({ type: 'ended', error: String(e?.message ?? e) }));
    else if (msg.type === 'resume' && !session)
      resumeRun(String(msg.runId ?? '')).catch((e) => send({ type: 'ended', error: String(e?.message ?? e) }));
    else if (msg.type === 'answer' && session) {
      bump({ t: 'answered', a: msg.answers });
      session.answer(msg.answers);
    } else if (msg.type === 'message' && session && typeof msg.text === 'string') {
      bump({ t: 'user', text: msg.text });
      session.send(msg.text);
    } else if (msg.type === 'upload' && runDir && msg.image?.dataUrl) {
      refCount++;
      bindReference(runDir, msg.image.dataUrl, String(msg.image.filename ?? ''), refCount)
        .then((r) => {
          bump({ t: 'user', text: `📎 attached ${msg.image.filename ?? 'a photo'} — say "use this photo" and I'll rebuild with it` });
          send({ type: 'ref', name: msg.image.filename ?? 'photo', count: r.count });
        })
        .catch((e) => send({ type: 'status', text: `upload failed: ${e?.message ?? e}` }));
    }
  });

  ws.on('close', () => {
    clearInterval(flush);
    session?.end();
    imgWatcher?.close();
  });

  async function startRun(url: string, image?: { dataUrl: string; filename?: string }) {
    if (!/^https?:\/\//i.test(url)) {
      send({ type: 'ended', error: 'please enter a full URL (https://…)' });
      return;
    }
    const miss = missingLiteKeys();
    if (miss.length) {
      send({ type: 'ended', error: `missing required env: ${miss.join(', ')}` });
      return;
    }
    runDir = createLiteRunDir(url);
    runId = basename(runDir);
    writeFounderStub(runDir, url);
    const logger = new LiteTraceLogger(runDir);
    view = liteView(initView(url, [...LITE_ORDER]));
    dirty = true;
    send({ type: 'started', runId });

    // founder upload BEFORE the pipeline, so specs bind the real thing
    if (image?.dataUrl) {
      send({ type: 'status', text: 'uploading your photo…' });
      try {
        refCount++;
        const r = await bindReference(runDir, image.dataUrl, image.filename ?? '', refCount);
        send({ type: 'ref', name: image.filename ?? 'photo', count: r.count });
      } catch (e: any) {
        send({ type: 'status', text: `photo upload failed (${e?.message ?? e}) — continuing without it` });
      }
    }

    // STEP 0 — code-side capture (~45s): pages, brand identity, pack shots, redirect
    // guard. The orchestrator prompt says "code already captured" — so it MUST
    // complete before the session wakes.
    send({ type: 'status', text: 'reading your site (pages, logo, palette, pack shots)…' });
    try {
      await captureStepZero(url, runDir, (l) => send({ type: 'status', text: l }));
    } catch (e: any) {
      send({ type: 'status', text: `capture had trouble (${e?.message ?? e}) — the agent will lean on your answers` });
    }

    watchRenders();

    session = new ChatSession(
      {
        brandUrl: url,
        runDir,
        order: [...LITE_ORDER],
        mode: 'surface',
        logger,
        buildOptions: (io) => buildLiteOptions({
          brandUrl: url,
          runDir,
          onProgress: (l) => send({ type: 'status', text: l }),
          canUseTool: io.canUseTool,
          resumeSessionId: io.resumeSessionId,
        }),
      },
      sessionEvents(logger),
    );
    liveSessions.add(session);
    void session.run();
    session.send(`My brand is ${url}. The capture is on disk. Ground yourself in brand.md and the captured pages, then start the founder intake.`);
  }

  function sessionEvents(logger: TraceLogger) {
    return {
      onMessage: (m: any) => bump({ t: 'sdk', m }),
      onProgress: (l: string) => send({ type: 'status', text: l }),
      onQuestion: (q: any) => {
        bump({ t: 'question', q });
        send({ type: 'question', questions: q.questions });
      },
      onIdle: () => bump({ t: 'idle' }),
      onSessionId: (id: string) => bump({ t: 'session', id }),
      onEnd: (err?: Error) => {
        if (session) liveSessions.delete(session);
        logger.finalize();
        bump({ t: 'ended', err: err?.message });
        send({ type: 'ended', error: err?.message });
      },
    };
  }

  function watchRenders() {
    try {
      imgWatcher = watch(join(runDir, 'renders'), (_ev, fname) => {
        if (fname && /\.(png|jpe?g|webp)$/i.test(fname.toString())) {
          bump({ t: 'image', url: `/images/${runId}/${fname}` });
        }
      });
    } catch {
      /* best-effort */
    }
  }

  async function resumeRun(runId_: string) {
    if (!/^[a-z0-9._-]+$/i.test(runId_)) {
      send({ type: 'ended', error: 'invalid run id' });
      return;
    }
    const dir = join(RUNS_DIR, runId_);
    const info = readSessionInfo(dir);
    if (!info) {
      send({ type: 'ended', error: 'this run has no captured session — start a new run' });
      return;
    }
    runDir = dir;
    runId = runId_;
    const logger = new LiteTraceLogger(runDir, { append: true });
    view = liteView(rehydrateView(runDir, info.brandUrl, info.order.length ? info.order : [...LITE_ORDER]));
    dirty = true;
    send({ type: 'resumed', runId, brandUrl: info.brandUrl });

    const rendersDir = join(runDir, 'renders');
    if (existsSync(rendersDir)) {
      for (const f of readdirSync(rendersDir).sort()) {
        if (/\.(png|jpe?g|webp)$/i.test(f)) bump({ t: 'image', url: `/images/${runId}/${f}` });
      }
    }
    watchRenders();

    session = new ChatSession(
      {
        brandUrl: info.brandUrl,
        runDir,
        order: info.order.length ? info.order : [...LITE_ORDER],
        mode: 'surface',
        logger,
        resumeSessionId: info.sessionId,
        buildOptions: (io) => buildLiteOptions({
          brandUrl: info.brandUrl,
          runDir,
          onProgress: (l) => send({ type: 'status', text: l }),
          canUseTool: io.canUseTool,
          resumeSessionId: io.resumeSessionId,
        }),
      },
      sessionEvents(logger),
    );
    liveSessions.add(session);
    void session.run();
  }
});

http.listen(PORT, () => {
  process.stdout.write(`\n  ✦ creative-agent LITE → http://localhost:${PORT}\n\n`);
});
