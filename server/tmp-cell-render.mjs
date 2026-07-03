// One-off dry-run renderer for the cell skill (Session: cell dry run, DailyObjects Angle 2).
// Mirrors server/lib/nano-banana-mcp.ts's edit-endpoint call. Delete when the dry run is done.
import { fal } from "@fal-ai/client";
import fs from "node:fs";
import path from "node:path";

const ROOT = "/Users/chakra/Documents/Agents/creative_agent";
const REF = process.argv[4] || path.join(ROOT, "cloudflare/eval/mini-eval/fixtures/research/dailyobjects/reference-images/lagoon-basalt-tote.png");
const OUT_DIR = path.join(ROOT, "cloudflare/eval/mini-eval/results/cell-dryrun");

// FAL_KEY from root .env (same var production uses)
const env = fs.readFileSync(path.join(ROOT, ".env"), "utf8");
const key = env.match(/^FAL_KEY=(.*)$/m)?.[1]?.trim().replace(/^"|"$/g, "");
if (!key) { console.error("FAL_KEY not found"); process.exit(1); }
fal.config({ credentials: key });

const prompt = process.argv[2] ? fs.readFileSync(process.argv[2], "utf8") : (() => { console.error("usage: node tmp-cell-render.mjs <promptfile> <outname>"); process.exit(1); })();
const outName = process.argv[3] || "render.png";

const refBuf = fs.readFileSync(REF);
const refUrl = await fal.storage.upload(new Blob([refBuf], { type: "image/png" }));
console.log("reference uploaded");

let result;
try {
  result = await fal.subscribe("fal-ai/nano-banana-pro/edit", {
    input: { prompt, image_urls: [refUrl], num_images: 1, aspect_ratio: "4:5", resolution: "1K", output_format: "png" },
    logs: false,
  });
} catch (e) {
  console.error("4:5 failed, retrying 3:4 —", e?.message || e);
  result = await fal.subscribe("fal-ai/nano-banana-pro/edit", {
    input: { prompt, image_urls: [refUrl], num_images: 1, aspect_ratio: "3:4", resolution: "1K", output_format: "png" },
    logs: false,
  });
}

const img = result.data?.images?.[0];
if (!img?.url) { console.error("no image in response:", JSON.stringify(result.data)?.slice(0, 400)); process.exit(1); }
fs.mkdirSync(OUT_DIR, { recursive: true });
const res = await fetch(img.url);
const buf = Buffer.from(await res.arrayBuffer());
const outPath = path.join(OUT_DIR, outName);
fs.writeFileSync(outPath, buf);
console.log("saved:", outPath, Math.round(buf.length / 1024) + "KB");
