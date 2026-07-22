/**
 * capture-products.ts — the ONE fetch the agent may trigger after step 0
 * (S155, founder call: "fetch what I name during intake").
 *
 * Step-0 capture auto-downloads the first MAX_PDPS products by homepage order —
 * code's choice, not the founder's. When intake answers name catalogue products
 * whose photos are NOT on disk, the ORCHESTRATOR calls this tool with their
 * exact URLs from brand.md's ## Catalogue list, and the SAME deterministic
 * downloader used at step 0 (runProductPhotos: structured data only, no model)
 * pulls their pack shots into assets/.
 *
 * This is deliberately the orchestrator's only MCP exemption
 * (hook.ts orchestratorMcpAllow) and it is fenced hard:
 *   · same-host only — a URL off the founder's domain is refused (never turn
 *     the intake into a general fetcher);
 *   · /products/ paths only — product pages, nothing else;
 *   · once per run, max 4 products — an answer, not a crawl.
 */
import { tool, createSdkMcpServer } from '@anthropic-ai/claude-agent-sdk';
import { z } from 'zod';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { runProductPhotos } from '../../agent-loop/mcp/brand-identity.ts';
import { packShotInventory } from '../capture.ts';

const normHost = (h: string): string => h.replace(/^www\./, '').toLowerCase();

/** Same-brand product-page guard — pure, exported for fixture tests. */
export function productUrlProblem(url: string, brandHost: string): string | null {
  let u: URL;
  try { u = new URL(url); } catch { return `"${url}" is not a valid absolute URL`; }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') return `"${url}" — only http(s) URLs are fetchable`;
  if (normHost(u.hostname) !== normHost(brandHost)) {
    return `"${url}" is not on the founder's domain (${brandHost}) — capture_products fetches the founder's own catalogue ONLY, never external pages`;
  }
  if (!/\/products\/[a-z0-9._-]+\/?$/i.test(u.pathname)) {
    return `"${url}" is not a product page — only /products/<slug> paths are fetchable (use the exact URL from brand.md's ## Catalogue list)`;
  }
  return null;
}

export function createCaptureProductsServer(runDir: string, brandHost: string) {
  const sentinel = path.join(runDir, 'raw', '.capture-products-done');
  const captureTool = tool(
    'capture_products',
    'Fetch pack shots for CATALOGUE products the founder named during intake whose photos are not yet in assets/. Pass the EXACT product-page URLs from brand.md\'s "## Catalogue" list (never guess a slug). Runs the same deterministic step-0 downloader (structured product data only, no model, ~$0) and refreshes the pack-shot inventory. ONE call per run, max 4 products — resolve the founder\'s full wish list first, then call once.',
    {
      productUrls: z.array(z.string().min(8)).min(1).max(4)
        .describe('Exact product-page URLs from brand.md ## Catalogue (1–4). Same-domain /products/ pages only.'),
    },
    async (a) => {
      const refuse = (text: string) => ({ content: [{ type: 'text' as const, text }] });
      if (fs.existsSync(sentinel)) {
        return refuse('CAPTURE REFUSED: this run already spent its one post-intake product fetch. Work with the assets on disk; the founder can upload any further photos via the panel.');
      }
      const problems = a.productUrls.map((u) => productUrlProblem(u, brandHost)).filter(Boolean);
      if (problems.length) return refuse(`CAPTURE REFUSED: ${problems.join(' · ')}`);
      fs.mkdirSync(path.dirname(sentinel), { recursive: true });
      fs.writeFileSync(sentinel, `${a.productUrls.join('\n')}\n@ ${new Date().toISOString()}\n`);
      try {
        const report = await runProductPhotos(a.productUrls, runDir);
        // keep brand.md's asset record mirroring the disk (create/judge read it)
        const inventory = packShotInventory(runDir);
        if (inventory.length) {
          fs.appendFileSync(
            path.join(runDir, 'brand.md'),
            ['', '## ⚠ PACK-SHOT INVENTORY (refreshed after intake fetch — supersedes the list above)', '', ...inventory, ''].join('\n'),
          );
        }
        return {
          content: [{
            type: 'text' as const,
            text: `CAPTURE COMPLETE — brand.md inventory refreshed.\n${report}\n\nUpdate founder-facts.md's asset section to match, and remember: create views every pack shot it binds (rule 9).`,
          }],
        };
      } catch (err) {
        return refuse(`CAPTURE FAILED: ${err instanceof Error ? err.message : String(err)} — record the gap honestly in founder-facts.md; the founder can upload photos via the panel.`);
      }
    },
  );
  return createSdkMcpServer({ name: 'capture', version: '0.1.0', tools: [captureTool] });
}

export const CAPTURE_PRODUCTS_TOOL = 'mcp__capture__capture_products';
