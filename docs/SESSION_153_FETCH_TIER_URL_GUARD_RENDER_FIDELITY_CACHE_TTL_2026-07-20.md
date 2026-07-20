# SESSION 153 — headless fetch tier, URL guard, render fidelity, 1h cache TTL

**Dates:** 2026-07-18 → 2026-07-20
**Status:** Seven fixes built across three brands and four run attempts. All validated live on the
final run (House of Twilight), which shipped **3 of 3 at $4.38/shipped — the best $/shipped to date**
and the first clean PASS since the fix work began. Everything UNCOMMITTED on `new-ui` at time of
writing.

## Part 1 — The runs (what each one was for)

| Run dir | Brand | Outcome |
|---|---|---|
| `2026-07-18-12-17-41_www-thesouledstore-com…` | Souled Store | **Killed at intake.** WebFetch 406 → orchestrator fell back to prior knowledge ("I'll work from what I know"). Exposed defect #1. |
| `2026-07-18-12-31-13_www-thesouledstore-com…` | Souled Store | **Killed at intake by us**, to build the headless tier. Pre-fetch worked; site turned out to be a client-rendered SPA (302 chars of text). |
| `2026-07-18-14-08-47_www-thesouledstore-com…` | Souled Store | **Completed, FLAGGED.** $12.70 / 68.8m / 0 shipped. Brand-capture layer validated in-run; exposed defects #2 (derived URL) and #3 (name-derived garment description). |
| `2026-07-20-06-26-40_houseoftwilight-in…` | House of Twilight | **Completed, PASS ×3.** $13.14 / 53.0m / **3 of 3 shipped**. Every fix validated. |

## Part 2 — What was built

**1. Code-side intake pre-fetch** (`mcp/brand-identity.ts` `prefetchIntakeGround`, called from
`web/server.ts` `startRun`). The orchestrator may not call MCP (routing law) and WebFetch is
bot-blocked on many storefronts, so intake had no grounding path and improvised from priors. The
runner now fetches the brand page BEFORE the model wakes and writes `raw/pages/intake-ground.txt`,
**capped at 20k chars** (intake only needs enough to ask smart questions; verbatim full capture is
collect's job — an uncapped file invites a giant Read into the orchestrator's forever-context).

**2. Headless-Chromium fetch tier** (`fetchRendered` + `fetchPageSmart`, Playwright, lazy-imported).
Static fetch first (fast, free, right for most sites); if extracted text < 1,500 chars the page is an
SPA shell, so render it in headless Chromium and re-extract from the live DOM. **All four capture
paths share it** — `page_text`, `product_photos`, `brand_identity`, intake pre-fetch. Degrades to
static if Playwright/Chromium is absent. Proof on the SPA PDP: **302 chars → 17,740 chars**, ₹1,399
recovered, pack shot (1080×1440) downloaded where the static tier found nothing.
**PROD NOTE:** swap the inside of `fetchRendered` for Cloudflare Browser Rendering when the
field-first pipeline ports; callers are implementation-blind by design.

**3. Gate `page_text` fallback** — gate's LP check gets `mcp__brand__page_text` + the `brand` server;
gate.md check 6 retries a bot-blocked LP with it before writing UNVERIFIED. (Without this the LP
check silently dies on any 406 site.)

**4. Hook denial routes instead of dead-ending** — the orchestrator-MCP denial now names the seat
that owns the tool and points at the pre-fetched file.

**5. URL guard — three belts** (fixes the S153 false-positive, see Part 3):
- **Structural:** `hook.ts` denies any Write to `founder-facts.md` that drops the founder's exact URL
  (`HookConfig.brandUrl`, passed from `pipeline.ts`).
- **Behavioral:** intake prompt requires `Brand URL: <exact url>` as the first line after the title,
  verbatim, query params included, with the reason stated.
- **Judgment:** gate.md — never construct/normalize/derive a URL from a product name, canonical slug
  or breadcrumb; a soft-404 only rules if it came from the verbatim founder URL.

**6. Build binder rule 9 — describe the product FROM THE PIXELS** (`build/SKILL.md`). Build must view
every bound asset before writing the product zone and describe the actual item (garment type, collar,
colour, how the print sits), closing with "the product must match the bound reference photo exactly."
Root cause it fixes: when prompt text describes a different archetype than the reference photo, **the
words win and the real product is silently replaced.**

**7. 1h prompt-cache TTL** (`ENABLE_PROMPT_CACHING_1H=1` in `chat/setup.ts` loadEnv + `run.ts`).
Set in `process.env` (the SDK subprocess inherits it) — deliberately NOT via `Options.env`, which
REPLACES the whole subprocess environment (`sdk.d.ts:1363`). Grounded in
`claude_sdk/tracking_costs.md`. Measured before/after, see Part 4.

## Part 3 — The two defects the TSS run exposed (both real, both fixed)

**Defect: the gate fetched a URL nobody gave it.** Intake's rewrite of founder-facts dropped the
stub's URL line; specs carry no destination field; so gate's fallback chain found nothing and
**built a plausible slug from the product's canonical name** (`…/spider-man-web-of-heritage-oversized-shirts-by-marvel`).
That slug soft-404s ("Looks like this product is unavailable") → gate ruled the destination dead and
FLAGGED all three renders as structural. A live re-fetch of the **real** founder URL returned a
healthy PDP (₹1,399, all sizes in stock). **Hallucination-by-omission: starve a model of a fact and
it improvises one.** The fix is three belts because prompt-only would drift.

**Defect: the bound product was ignored — by the prompt, not by the plumbing.** Every render job DID
carry the pack shot in `refs` (verified in the trace). But the real garment is a *brown camp-collar
button-up with a paisley/mandala print*, while the prompts said "oversized shirt, licensed graphic
print" — graphic-tee language derived from the product NAME. Text and reference disagreed; the model
followed the text and invented substitute prints (c2 rendered **One-Punch Man** — a foreign licensed
IP — under a "TSS official licensed" credential, correctly killed by the FABRICATION check). Rule 9
is the fix. Provider-side IP filtering was a compounding factor on that SKU and is explicitly OUT OF
SCOPE per founder decision.

## Part 4 — Numbers

| | TRF run 2 (S152) | TSS (S153) | **HOT (S153)** |
|---|---:|---:|---:|
| Cost (MAX law) | $13.91 | $12.70 | **$13.14** |
| Wall | 63.6m | 68.8m | **53.0m** |
| Shipped | 3/3 | 0/3 (flagged) | **3/3 PASS** |
| $ / shipped | $4.64 | — | **$4.38** |
| Auto-compactions | 0 | 0 | **0** |
| Images downloaded | 20 | 22 | **21** |
| Own-sourced specs | 0/8 | 0/8 | **0/8** |
| Backfill | ran, closed | ran ×2, both survived on merit | not ordered (8/8 survived) |
| Rate-limit sightings | 75 | 58 | 60 |
| Cache-write TTL split | — | **92% 5m / 8% 1h** | **0% 5m / 100% 1h** |

HOT per-model: Sonnet $8.36 (out 100.7k, cacheW 746.1k) · Opus $4.77 (out 50.6k, cacheW 270.4k) ·
Haiku $0.01.

**On the cache fix's economics — read this before claiming a win.** The TTL flip is *mechanically*
confirmed (2.72M tokens, 100% at 1h, from 92% at 5m). The total cost did NOT drop
($12.70 → $13.14) but the two runs are not an A/B: HOT did strictly more work (8 specs + 3 successful
renders + launch kit vs a run that flagged out before shipping). On the Max plan these dollars are
notional anyway; the real payoffs are **rate-limit headroom** and **actual money once this ports to
API-billed production**. A clean before/after needs two same-shape runs.

**Milestone micro-writes (the other half of old fix #3): RECOMMEND DROPPING.** Measured live at
~$0.5 and seconds (4 one-turn "slice N done" wakes), down from S151's $0.8/3min because the S152
context diet shrank what each wake re-writes. Not worth risking the reader fan-out logic. The cache
was the fish; this is the minnow.

## Part 5 — What the HOT run proved (all seven fixes, one run)

- **URL guard:** `Brand URL:` line survived intake with **zero hook denials** — the prompt belt held
  on its own; the structural belt never had to fire.
- **Gate exact-URL law:** LP **pass ×3** against the real page (offer, code, both prices, product and
  dark identity all cash on the fetched destination).
- **Rule 9:** prompts described the real garment (ecru dobby base, open lapel collar, white buttons,
  black brush-stroke print); the independent gate confirmed "**print reproduced faithfully**". Visual
  comparison against the bound asset: same garment identity. *Honest caveat: generative models
  re-draw a print rather than clone it — individual brush strokes sit differently. Gate ruled that
  acceptable; that ruling is the precedent.*
- **Shopify gallery tier (first in-run test):** 4 pack shots bound; c7 used 2 angles.
- **Cache TTL:** 100% of cache writes at 1h.
- Plus the standing S152 guards: 0 compactions, 0 own-sourced, file-per-spec + code assembly,
  every-number anchoring, WINDOW-TRUNCATED depth handling, register decision named.
- **Buyer quality note:** it FOUND the c5/c6 near-duplicate (same source, family and claim), argued
  they survive as a legitimate A/B within the ≤2-per-family cap, then ranked c6 last as the marginal
  one. Reasoning, not reflex.

## Part 6 — Open items (priority order)

1. **Logo discovery fails on CDN-served storefronts — 2 for 2.** Souled Store (GIF logo) and House of
   Twilight (**no logo file found at all**; Shopify serves logos through `cdn.shopify.com` with
   transform params) both left the palette **PROVISIONAL**, so frequency ranking alone surfaced
   framework/payment-badge colours (`#eb001b` is Mastercard red — the tool flagged it correctly and
   create refused it, but the cross-check tier never fired). **Fix:** broaden logo discovery (Shopify
   CDN patterns, header `<img>`, `og:logo`, apple-touch-icon) + dominant-colour quantization for
   raster logos so the cross-check works beyond SVG. Highest-value remaining brand-layer fix.
   **→ FIXED 2026-07-20 (post-doc), validated live on all three brands:** discovery now also reads
   JSON-LD `"logo"`, img tags whose class/attrs say logo, and strips CDN size params (HOT logo lands
   at full 3008×505); raster logos are colour-quantized in headless canvas (TSS red `#ed2d2f`
   CONFIRMED); palette cross-check is near-match (≤40 RGB) so raster colours can confirm; TRF SVG
   regression unchanged. HOT's mark is genuinely monochrome — now reported as brand signal
   ("dark/mono identity"), not a failure. All in `mcp/brand-identity.ts`, still uncommitted.
2. **`PRODUCT_IMGS_PER_PAGE = 4`** took 4 of 12 available gallery images. Worth raising for
   product-identical brands.
3. **Step 4 CSV outcome loop** (S145) — still the moat, still unbuilt.
4. Clean A/B for the cache TTL (two same-shape runs).
5. Provider IP filter on licensed-merch SKUs — **explicitly parked by founder decision.**

## Part 7 — Fast pointers

- **Files changed (all uncommitted on `new-ui`):** `agent-loop/mcp/brand-identity.ts`,
  `agent-loop/hook.ts`, `agent-loop/pipeline.ts`, `agent-loop/stages.ts`, `agent-loop/run.ts`,
  `agent-loop/chat/setup.ts`, `agent-loop/web/server.ts`, `agent-loop/package.json` (+ lock:
  `playwright`), `agent/.claude/skills/build/SKILL.md`,
  `agent/.claude/skills/build/references/gate.md`.
- **New dependency:** `playwright` + local Chromium (`npx playwright install chromium`, ~93MB).
- Web server MUST be restarted after any code edit (tsx holds old code in memory — bit us in S152).
  Detached launch recipe: S150 Part 5.
- Cost law (S150): MAX `total_cost_usd` within a segment, never sum, never file-last.
- Profiler: `agent-loop/trace-profile.cjs`. Live watcher: `agent-loop/watch-run.cjs <run dir>`.
- Prior: S152 (fix list + brand capture), S151 (trace eval + profiler), S150, S145 (plan).
