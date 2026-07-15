/**
 * web/server.ts — the standalone demo web server (option A).
 *
 * A thin Node http + WebSocket server that REUSES the whole engine (ChatSession + reducer +
 * setup + buildBaseOptions). Per browser connection it runs one ChatSession, folds the SDK
 * stream through the reducer SERVER-side, and streams the ready-to-render ChatView to the
 * browser. It also serves the rendered ad images from the run folder and watches that folder
 * so the image pops into the chat the moment it lands. The browser sends back answers to the
 * agent's questions and follow-up messages.
 *
 *   npm run web   →   http://localhost:4141
 */
import { createServer } from 'node:http';
import { WebSocketServer } from 'ws';
import { readFile } from 'node:fs/promises';
import { existsSync, watch, writeFileSync, mkdirSync } from 'node:fs';
import { join, extname, basename, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEnv, missingKeys, createRunDir, writeFounderStub, stageBinderRefs, AGENT_LOOP_DIR } from '../chat/setup.ts';
import { ChatSession } from '../chat/session.ts';
import { initView, reduce, type ChatView } from '../chat/reducer.ts';
import { TraceLogger } from '../trace.ts';
import { STAGE_ORDER, type Mode } from '../stages.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC = join(__dirname, 'public');
const PORT = 4141;

loadEnv();

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

    // rendered ad images: /images/<runId>/<file>  →  runs/<runId>/renders/<file>
    if (path.startsWith('/images/')) {
      const [runId, ...rest] = path.replace('/images/', '').split('/');
      const imgPath = join(AGENT_LOOP_DIR, 'runs', runId, 'renders', rest.join('/'));
      if (existsSync(imgPath) && imgPath.startsWith(join(AGENT_LOOP_DIR, 'runs'))) {
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

// Decode a browser data-URL and land it in the run dir's assets/ folder — the field-first
// flow binds LOCAL paths at render time (the render MCP handles per-provider upload), so no
// fal upload happens here. collect inventories assets/; build binds them on the render call.
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

const wss = new WebSocketServer({ server: http });

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
  // coalesce view pushes to ~8fps so a burst of messages doesn't flood the socket
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

  ws.on('message', (data) => {
    let msg: any;
    try {
      msg = JSON.parse(data.toString());
    } catch {
      return;
    }
    if (msg.type === 'start' && !session)
      startRun(String(msg.url ?? ''), msg.mode === 'deep' ? 'deep' : 'surface', msg.image).catch((e) =>
        send({ type: 'ended', error: String(e?.message ?? e) }),
      );
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

  async function startRun(url: string, mode: Mode, image?: { dataUrl: string; filename?: string }) {
    if (!/^https?:\/\//i.test(url)) {
      send({ type: 'ended', error: 'please enter a full URL (https://…)' });
      return;
    }
    const order = [...STAGE_ORDER];
    const miss = missingKeys(order);
    if (miss.length) {
      send({ type: 'ended', error: `missing required env: ${miss.join(', ')}` });
      return;
    }
    runDir = createRunDir(url);
    runId = basename(runDir);
    writeFounderStub(runDir, url);
    stageBinderRefs(runDir, order);
    const logger = new TraceLogger(runDir);
    view = initView(url, order);
    dirty = true;
    send({ type: 'started', runId });

    // bind an uploaded reference BEFORE the pipeline runs, so research + the render use the real
    // thing (the founder's face, the product, the room) rather than an invented one
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

    // the ad images land in runs/<runId>/renders — tell the browser the moment each appears
    try {
      imgWatcher = watch(join(runDir, 'renders'), (_ev, fname) => {
        if (fname && /\.(png|jpe?g|webp)$/i.test(fname.toString())) {
          send({ type: 'image', url: `/images/${runId}/${fname}` });
        }
      });
    } catch {
      /* renders dir watch is best-effort */
    }

    session = new ChatSession(
      { brandUrl: url, runDir, order, mode, logger },
      {
        onMessage: (m) => bump({ t: 'sdk', m }),
        onQuestion: (q) => {
          bump({ t: 'question', q });
          send({ type: 'question', questions: q.questions });
        },
        onIdle: () => bump({ t: 'idle' }),
        onSessionId: (id) => bump({ t: 'session', id }),
        onEnd: (err) => {
          logger.finalize();
          bump({ t: 'ended', err: err?.message });
          send({ type: 'ended', error: err?.message });
        },
      },
    );
    void session.run();
    session.send(`My brand is ${url}. Read the site first, then ask me what you need to know, and build the ad.`);
  }
});

http.listen(PORT, () => {
  process.stdout.write(`\n  ✦ creative-agent demo → http://localhost:${PORT}\n\n`);
});
