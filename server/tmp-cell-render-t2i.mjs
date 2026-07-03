// One-off TEXT-TO-IMAGE renderer for the cell prototype (no reference image).
// Mirrors server/lib/nano-banana-mcp.ts's text-to-image call. Delete when the dry run is done.
import { fal } from "@fal-ai/client";
import fs from "node:fs";
import path from "node:path";

const ROOT = "/Users/chakra/Documents/Agents/creative_agent";
const OUT_DIR = path.join(ROOT, "cloudflare/eval/mini-eval/results/cell-dryrun");

const env = fs.readFileSync(path.join(ROOT, ".env"), "utf8");
const key = env.match(/^FAL_KEY=(.*)$/m)?.[1]?.trim().replace(/^"|"$/g, "");
if (!key) { console.error("FAL_KEY not found"); process.exit(1); }
fal.config({ credentials: key });

const prompt = process.argv[2] ? fs.readFileSync(process.argv[2], "utf8") : (() => { console.error("usage: node tmp-cell-render-t2i.mjs <promptfile> <outname>"); process.exit(1); })();
const outName = process.argv[3] || "render-t2i.png";

const result = await fal.subscribe("fal-ai/nano-banana-pro", {
  input: { prompt, num_images: 1, aspect_ratio: "4:5", resolution: "1K", output_format: "png" },
  logs: false,
});

const img = result.data?.images?.[0];
if (!img?.url) { console.error("no image in response:", JSON.stringify(result.data)?.slice(0, 400)); process.exit(1); }
fs.mkdirSync(OUT_DIR, { recursive: true });
const res = await fetch(img.url);
const buf = Buffer.from(await res.arrayBuffer());
const outPath = path.join(OUT_DIR, outName);
fs.writeFileSync(outPath, buf);
console.log("saved:", outPath, Math.round(buf.length / 1024) + "KB");
