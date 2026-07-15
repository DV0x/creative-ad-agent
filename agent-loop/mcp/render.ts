/**
 * render MCP — GPT Image 2 behind ONE tool, provider-redundant (KIE + fal).
 *
 * WHY GPT Image 2: text fidelity ~99% (vs Nano Banana ~90-95%). The field-first
 * creatives are copy-heavy (verbatim on-image strings are a gate check), so text
 * accuracy is the whole game. Validated in the Verbis manual run — a ~120-word
 * letter rendered with zero garble, twice.
 *
 * WHY TWO PROVIDERS: fal went account-level `Forbidden` mid-flight on 2026-07-07
 * and KIE carried the Verbis renders. Neither is trusted alone. Job shape is
 * shared; each render tries the primary provider and falls over to the other.
 *   - KIE  (KIE_API_KEY): jobs API — createTask → poll recordInfo; refs via
 *     base64 upload (3-day temp URLs); ~10 credits per 2K render. 4:5 was
 *     "temporarily unavailable" as of 2026-07-08 → on an aspect-ratio failure
 *     the task is retried once at the 3:4 fallback (Ads Manager crops natively).
 *   - fal  (FAL_KEY): fal-ai/gpt-image-2 (+ /edit when refs bind); true 4:5 via
 *     explicit pixel sizes (multiples of 16); refs via fal.storage.upload.
 *
 * Provider order: RENDER_PROVIDER env ('kie' | 'fal') wins; else KIE when its
 * key exists (the currently-reliable one), else fal. Ported from the validated
 * manual runners: clients/verbis/render.cjs + clients/verbis/field-first-test/
 * kie-render.mjs — same job format ({name, prompt, size?, refs?}).
 *
 * Refs are LOCAL paths (brand marks / faces / product photos), resolved against
 * the run dir. Competitor pixels NEVER enter a render call — that law lives in
 * the build binder; this tool just renders what it is given.
 */
import { fal } from '@fal-ai/client';
import { createSdkMcpServer, tool } from '@anthropic-ai/claude-agent-sdk';
import { z } from 'zod';
import * as fs from 'node:fs';
import * as path from 'node:path';

type Provider = 'kie' | 'fal';

const KIE_API = 'https://api.kie.ai/api/v1';
const KIE_UPLOAD = 'https://kieai.redpandaai.co/api/file-base64-upload';
const KIE_POLL_MS = 10_000;
const KIE_TIMEOUT_MS = 10 * 60 * 1000;

// KIE aspect fallbacks — used only when createTask rejects the requested ratio.
const KIE_RATIO_FALLBACK: Record<string, string> = { '4:5': '3:4', '5:4': '4:3' };

// fal: aspect → concrete pixels (GPT Image 2 wants multiples of 16).
const FAL_SIZE: Record<string, { width: number; height: number }> = {
  '1:1': { width: 1440, height: 1440 },
  '4:5': { width: 1152, height: 1440 }, // Meta feed portrait
  '3:4': { width: 1152, height: 1536 },
  '9:16': { width: 1088, height: 1920 }, // stories/reels
  '16:9': { width: 1920, height: 1088 },
  '1.91:1': { width: 1456, height: 768 }, // Meta landscape link
};

function stamp(): string {
  return new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
}

function mimeOf(file: string): string {
  const ext = path.extname(file).toLowerCase();
  return ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
}

// ── KIE ─────────────────────────────────────────────────────────────────────
function kieHeaders(): Record<string, string> {
  return { Authorization: `Bearer ${process.env.KIE_API_KEY}`, 'Content-Type': 'application/json' };
}

async function kieUploadRef(absPath: string): Promise<string> {
  const b64 = fs.readFileSync(absPath).toString('base64');
  const r = await fetch(KIE_UPLOAD, {
    method: 'POST',
    headers: kieHeaders(),
    body: JSON.stringify({
      base64Data: `data:${mimeOf(absPath)};base64,${b64}`,
      uploadPath: 'agent-loop-refs',
      fileName: path.basename(absPath),
    }),
  });
  const d: any = await r.json().catch(() => ({}));
  const url = d?.data?.downloadUrl ?? d?.data?.fileUrl ?? d?.data?.url;
  if (!url) throw new Error(`KIE ref upload failed (${r.status}): ${JSON.stringify(d).slice(0, 200)}`);
  return url;
}

async function kieCreateTask(prompt: string, ratio: string, refUrls: string[]): Promise<string> {
  const model = refUrls.length ? 'gpt-image-2-image-to-image' : 'gpt-image-2-text-to-image';
  const input: Record<string, unknown> = { prompt, aspect_ratio: ratio, resolution: '2K' };
  if (refUrls.length) input.input_urls = refUrls;
  const r = await fetch(`${KIE_API}/jobs/createTask`, { method: 'POST', headers: kieHeaders(), body: JSON.stringify({ model, input }) });
  const d: any = await r.json();
  if (d?.code !== 200 || !d?.data?.taskId) throw new Error(`KIE createTask: ${JSON.stringify(d).slice(0, 200)}`);
  return d.data.taskId;
}

async function kieRender(prompt: string, ratio: string, refPaths: string[]): Promise<{ buf: Buffer; note: string }> {
  if (!process.env.KIE_API_KEY) throw new Error('KIE_API_KEY not set');
  const refUrls: string[] = [];
  for (const p of refPaths) refUrls.push(await kieUploadRef(p));

  let usedRatio = ratio;
  let taskId: string;
  try {
    taskId = await kieCreateTask(prompt, usedRatio, refUrls);
  } catch (e: any) {
    const fallback = KIE_RATIO_FALLBACK[ratio];
    if (!fallback) throw e;
    usedRatio = fallback; // 4:5 intermittently unavailable on KIE — 3:4 crops natively in Ads Manager
    taskId = await kieCreateTask(prompt, usedRatio, refUrls);
  }

  const t0 = Date.now();
  for (;;) {
    if (Date.now() - t0 > KIE_TIMEOUT_MS) throw new Error('KIE poll timeout');
    await new Promise((res) => setTimeout(res, KIE_POLL_MS));
    const r = await fetch(`${KIE_API}/jobs/recordInfo?taskId=${taskId}`, { headers: kieHeaders() });
    const d: any = await r.json();
    const st = d?.data?.state;
    if (st === 'fail') throw new Error(`KIE render failed: ${d.data.failCode} ${d.data.failMsg}`);
    if (st === 'success') {
      const urls = JSON.parse(d.data.resultJson ?? '{}')?.resultUrls ?? [];
      if (!urls.length) throw new Error('KIE success but no resultUrls');
      const buf = Buffer.from(await (await fetch(urls[0])).arrayBuffer());
      const ratioNote = usedRatio !== ratio ? `, ratio ${ratio}→${usedRatio} (KIE fallback)` : '';
      return { buf, note: `kie, credits=${d.data.creditsConsumed ?? '?'}${ratioNote}` };
    }
  }
}

// ── fal ─────────────────────────────────────────────────────────────────────
async function falUploadRef(absPath: string): Promise<string> {
  const buf = fs.readFileSync(absPath);
  const name = path.basename(absPath);
  const blob = new File([buf], name, { type: mimeOf(absPath) });
  return await fal.storage.upload(blob);
}

async function falRender(prompt: string, ratio: string, refPaths: string[]): Promise<{ buf: Buffer; note: string }> {
  if (!process.env.FAL_KEY) throw new Error('FAL_KEY not set');
  fal.config({ credentials: process.env.FAL_KEY });
  const image_size = FAL_SIZE[ratio];
  if (!image_size) throw new Error(`fal: unknown size "${ratio}"`);

  const input: Record<string, unknown> = { prompt, num_images: 1, quality: 'high', output_format: 'png', image_size };
  let endpoint = 'fal-ai/gpt-image-2';
  if (refPaths.length) {
    endpoint = 'fal-ai/gpt-image-2/edit';
    const urls: string[] = [];
    for (const p of refPaths) urls.push(await falUploadRef(p));
    input.image_urls = urls;
  }
  const result: any = await fal.subscribe(endpoint, { input: input as any, logs: false });
  const image = (result?.data?.images ?? [])[0];
  if (!image?.url) throw new Error('fal: no image URL in response');
  const buf = Buffer.from(await (await fetch(image.url)).arrayBuffer());
  return { buf, note: `fal (${endpoint})` };
}

// ── The tool ────────────────────────────────────────────────────────────────
const jobSchema = z.object({
  name: z.string().min(1).describe('Job name — becomes the output filename (<name>_<stamp>.png). Use the creative id, e.g. "creative-1-sticky-notes".'),
  prompt: z.string().min(1).describe('The fully-COMPILED render prompt (the build binder owns compilation — layout skeleton, type scale, exact strings).'),
  size: z.string().optional().describe("Aspect ratio, default '4:5' (Meta feed portrait). Others: '1:1', '3:4', '9:16', '16:9', '1.91:1'."),
  refs: z.array(z.string()).max(8).optional().describe('LOCAL file paths of BRAND references to bind (logo, founder face, product photo) — absolute, or relative to the run dir. Binding uses the edit/i2i endpoint so the marks stay exact. NEVER pass competitor creatives.'),
});

export function createRenderServer(outputDir: string, refsBaseDir?: string) {
  fs.mkdirSync(outputDir, { recursive: true });

  const renderImages = tool(
    'render_images',
    'Render ad image(s) with GPT Image 2, provider-redundant (KIE primary, fal failover — or RENDER_PROVIDER env to force one). ' +
      'Pass an ARRAY of jobs, each a fully-compiled prompt (+ optional LOCAL brand-reference paths, which auto-route to the edit/i2i endpoint so brand marks render exactly). ' +
      'Each image is saved to disk and the result returns its ABSOLUTE filePath — Read() that path to view the pixels for your thumbnail self-check. ' +
      'Renders cost real money (~10 KIE credits each): one shot per creative, at most one targeted retry per named diff.',
    { jobs: z.array(jobSchema).min(1).max(6).describe('Render jobs (1-6), one output image per job.') },
    async (args) => {
      const forced = (process.env.RENDER_PROVIDER ?? '').toLowerCase() as Provider | '';
      const order: Provider[] =
        forced === 'kie' || forced === 'fal'
          ? [forced]
          : process.env.KIE_API_KEY
            ? ['kie', 'fal']
            : ['fal', 'kie'];

      const results: any[] = [];
      for (const job of args.jobs) {
        const ratio = job.size ?? '4:5';
        const refPaths = (job.refs ?? []).map((p) => {
          const abs = path.isAbsolute(p) ? p : path.resolve(refsBaseDir ?? process.cwd(), p);
          if (!fs.existsSync(abs)) throw Object.assign(new Error(`ref not found: ${p} (resolved ${abs})`), { jobName: job.name });
          return abs;
        });

        let rendered: { buf: Buffer; note: string } | null = null;
        const errors: string[] = [];
        for (const provider of order) {
          try {
            rendered = provider === 'kie' ? await kieRender(job.prompt, ratio, refPaths) : await falRender(job.prompt, ratio, refPaths);
            break;
          } catch (e: any) {
            errors.push(`${provider}: ${e?.message ?? String(e)}`);
          }
        }

        if (!rendered) {
          results.push({ name: job.name, error: errors.join(' | ') });
          continue;
        }
        const filePath = path.join(outputDir, `${job.name}_${stamp()}.png`);
        fs.writeFileSync(filePath, rendered.buf);
        results.push({
          name: job.name,
          filePath, // absolute — Read() this to view the pixels
          sizeKB: Math.round(rendered.buf.length / 1024),
          ratio,
          refsBound: refPaths.length,
          provider: rendered.note,
        });
      }

      const ok = results.filter((r) => !r.error).length;
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              {
                success: ok > 0,
                rendered: ok,
                requested: args.jobs.length,
                images: results,
                hint: 'Read() each images[].filePath to view the pixels (thumbnail self-check) before handing off.',
              },
              null,
              2,
            ),
          },
        ],
        ...(ok === 0 ? { isError: true } : {}),
      };
    },
  );

  return createSdkMcpServer({ name: 'render', version: '1.0.0', tools: [renderImages] });
}

export const RENDER_TOOL = 'mcp__render__render_images';
