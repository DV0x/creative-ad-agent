/**
 * PROOF LOOP v2 — raw material + kill pressure + REFERENCE-CONDITIONED rendering.
 *
 * v1 (2026-07-06) proved: verbatim material + a cold buyer beats summaries +
 * rubrics at the CONCEPT layer. Its failures were all in the compile/render
 * layer: copy drifted between seats, and the image agent mode-collapsed to
 * "tasteful brand poster" because text alone cannot specify a visual.
 *
 * v2 fixes exactly those, per the 2026-07-07 session:
 *   1. Copy is authored ONCE at create (cards.json, final strings) — the buyer
 *      approves those strings, a deterministic STRING GUARD blocks any render
 *      whose compiled prompt dropped them. No LLM re-authoring downstream.
 *   2. Genre is a named performance-native form; the SWIPE BANK (bank/index.json,
 *      seeded by swipe-seed.ts from real Meta Ad Library winners) supplies 2-3
 *      reference ads per winner. The image agent adapts their MOVES — never
 *      their surfaces. Same-category refs are EYES-ONLY (never into the render
 *      call); adjacent-category refs may condition the edit endpoint directly.
 *   3. The gate judges PER IMAGE (v1's set-level PASS let a failed image ship)
 *      and adds a CLONE check against the references used.
 *
 * Spine: collect → create → buy(pass 1) → [swipe retrieve — code] →
 *        [string guard — code] → build → gate(buyer pass 2, per image).
 * Control flow is plain TypeScript. Three thinking seats (collector, creative,
 * buyer×2) + one executor (image agent). Same models as the main agent-loop.
 *
 *   tsx proof/run.ts <brand-url> [--founder=<brief.md>] [--product=<image>]
 *                    [--stages=collect,create,buy,build,gate] [--resume=<dir>]
 */
import { config as loadEnv } from 'dotenv';
import { fal } from '@fal-ai/client';
import { query } from '@anthropic-ai/claude-agent-sdk';
import type { Options } from '@anthropic-ai/claude-agent-sdk';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import * as fs from 'node:fs';
import { perplexityMcpServer, PERPLEXITY_TOOL_NAME } from '../mcp/perplexity.ts';
import { createNanoBananaServer } from '../mcp/nano-banana.ts';
import { createRefsServer } from '../mcp/refs.ts';
import { TraceLogger } from '../trace.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..', '..');
const BANK_DIR = join(__dirname, 'bank');

loadEnv({ path: join(REPO_ROOT, '.env.local') });
loadEnv({ path: join(REPO_ROOT, '.env') });
delete process.env.ANTHROPIC_API_KEY; // Max OAuth login wins

// ── args ─────────────────────────────────────────────────────────────────────
const rawArgs = process.argv.slice(2);
const positionals = rawArgs.filter((a) => !a.startsWith('--'));
const brandUrl = positionals[0];
if (!brandUrl) {
  console.error('usage: tsx proof/run.ts <brand-url> [--founder=<brief.md>] [--product=<image>] [--stages=a,b,c] [--resume=<dir>]');
  process.exit(1);
}
const flag = (name: string) => rawArgs.find((a) => a.startsWith(`--${name}=`))?.split('=').slice(1).join('=');
const ALL_STAGES = ['collect', 'create', 'buy', 'build', 'gate'] as const;
type StageName = (typeof ALL_STAGES)[number];
const order = (flag('stages')?.split(',').map((s) => s.trim()).filter(Boolean) as StageName[] | undefined) ?? [...ALL_STAGES];
for (const s of order) if (!ALL_STAGES.includes(s)) { console.error(`unknown stage "${s}" — valid: ${ALL_STAGES.join(', ')}`); process.exit(1); }

if (order.includes('collect') && !process.env.PERPLEXITY_API_KEY) { console.error('missing PERPLEXITY_API_KEY'); process.exit(1); }
if (order.includes('build') && !process.env.FAL_KEY) { console.error('missing FAL_KEY'); process.exit(1); }

// ── run dir ──────────────────────────────────────────────────────────────────
const resumeDir = flag('resume');
let runDir: string;
if (resumeDir) {
  runDir = resolve(resumeDir);
  if (!fs.existsSync(runDir)) { console.error(`--resume dir not found: ${runDir}`); process.exit(1); }
  console.log(`↻ RESUME — ${runDir} · running: ${order.join(' → ')}`);
} else {
  const slug = brandUrl.replace(/^https?:\/\//, '').replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '').slice(0, 40).toLowerCase();
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
  runDir = join(__dirname, 'runs', `${stamp}_${slug}`);
}
const imagesDir = join(runDir, 'images');
fs.mkdirSync(imagesDir, { recursive: true });

// ── founder brief ────────────────────────────────────────────────────────────
const founderPath = flag('founder');
if (founderPath && !fs.existsSync(founderPath)) { console.error(`--founder not found: ${founderPath}`); process.exit(1); }
const founderFile = join(runDir, 'founder-facts.md');
if (!(resumeDir && !founderPath && fs.existsSync(founderFile))) {
  fs.writeFileSync(
    founderFile,
    founderPath
      ? fs.readFileSync(founderPath, 'utf-8')
      : `# Founder Facts\n\n- Brand URL: ${brandUrl}\n- No founder brief provided. Work from the URL and the open web; name the gaps.\n`,
  );
}

// ── product ref (optional) — upload to fal, write refs.json ─────────────────
const productPath = flag('product');
if (productPath) {
  if (!fs.existsSync(productPath)) { console.error(`--product not found: ${productPath}`); process.exit(1); }
  if (!process.env.FAL_KEY) { console.error('--product needs FAL_KEY'); process.exit(1); }
  fal.config({ credentials: process.env.FAL_KEY });
  const buf = fs.readFileSync(productPath);
  const ext = (productPath.match(/\.([a-z0-9]+)$/i)?.[1] ?? 'jpg').toLowerCase();
  const mime = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
  const localPath = join(runDir, `product-ref.${ext}`);
  fs.writeFileSync(localPath, buf);
  console.log('· uploading product reference to fal …');
  const falUrl = await fal.storage.upload(new Blob([buf], { type: mime }));
  fs.writeFileSync(join(runDir, 'refs.json'), JSON.stringify({ references: [{ falUrl, localPath, fileId: 'product-ref' }] }, null, 2));
  console.log(`· product bound → ${falUrl}`);
}

// ── the genre vocabulary (shared: create picks, swipe retrieves, build executes) ──
const GENRES = [
  'annotated-product — product shot with markup doing the arguing: arrows, circles, handwritten notes, labeled chips',
  'big-text-statement — a typographic statement dominates; minimal or no scene',
  'comparison — us-vs-them table, side-by-side, before/after',
  'demo-proof — the claim demonstrated physically (texture, pour, translucency, real-ingredient staging)',
  'ugc-still — casual phone-photo moment; human context; deliberately unpolished',
  'founder-note — founder speaking plainly: letter, note, to-camera still',
  'document-proof — evidence artifacts: lab report, receipt, certificate, ingredient list (stylized, never fake platform chrome)',
  'pack-macro — the pack/label itself is the hero, close up',
];

function bankGenreCoverage(): string {
  const idx = join(BANK_DIR, 'index.json');
  if (!fs.existsSync(idx)) return '(swipe bank empty — all genres render without references)';
  const entries = JSON.parse(fs.readFileSync(idx, 'utf-8')) as any[];
  const counts: Record<string, number> = {};
  for (const e of entries) counts[e.genre] = (counts[e.genre] ?? 0) + 1;
  return Object.entries(counts).map(([g, n]) => `${g} (${n} refs)`).join(', ');
}

// ═════════════════════════════ STAGE PROMPTS ═════════════════════════════════

const COLLECT_PROMPT = `You are a FIELD COLLECTOR for an ad agency. You are NOT an analyst, NOT a strategist,
NOT a writer. Your one job: go into the world and bring back RAW MATERIAL, untouched.

Why you exist: every generic ad ever made was built from a summary. The creative team downstream can only be
as specific as what you bring back. A paraphrase is a dead artifact. The exact words a customer typed at 11pm
— typos, rage, weird details — is a live one.

READ FIRST: founder-facts.md in your working directory (the brand, the product, the conversion goal).

THEN COLLECT. You are hunting six types of artifact:
  A. CUSTOMER VOICE — verbatim sentences real buyers wrote about THIS brand/product: reviews, Reddit, Quora,
     YouTube comments, X. Copy the sentence EXACTLY as typed. The weird and specific beat the polished.
  B. CATEGORY PAIN — verbatim sentences people wrote about the CATEGORY or competitors: what they hate,
     fear, got burned by. (Often stronger ad anchors than praise.)
  C. BRAND/FOUNDER VOICE — the founder's or brand's own words, verbatim: interviews, posts, pack copy.
  D. PRODUCT FACTS — concrete, observable: ingredient list as printed, pack format, price, printed claims.
  E. SCENES — where/when this product actually lives in a buyer's day, ONLY as evidenced by what people
     wrote — quote or tightly cite the evidence.
  F. NUMBERS — specific figures with their subject intact, each tied to its source.

YOUR TOOLS:
  - ${PERPLEXITY_TOOL_NAME} — primary engine; ARRAY of up to 8 questions per call; ask for verbatim customer
    language explicitly. Budget: at most 3 calls. Plan them before you fire.
  - WebFetch — the brand's own pages. A few fetches, not a crawl.
  - Read / Write — working-dir files.

WRITE material.md in EXACTLY this shape:
  # Material — <brand>
  ## Artifacts
  [1] (A) "exact verbatim text here" — source: <domain or page>
  ... numbered straight through, 30 to 45 artifacts, types mixed ...
  ## Gaps
  - one line per thing you could not find

HARD RULES:
  - VERBATIM OR OBSERVABLE ONLY. Never compose a "typical" customer sentence. Fabricating an artifact
    poisons everything downstream.
  - NO summaries. NO insights. NO rankings. NO adjectives of your own.
  - THE COLLECTOR'S EYE: prefer the artifact that made you feel something — surprise, wince, laugh — over
    the representative one. But never invent.
  - Attribute every artifact to a source domain.

When material.md is written, you are done. Produce nothing else.`;

const CREATE_PROMPT = `You are a senior DIRECT-RESPONSE creative at a top performance shop — copywriter's
head, media buyer's scars. You write ads that stop thumbs because they are made of real charge, not ad-speak.

READ, in order:
  - founder-facts.md — the product, buyer, conversion event, CPA. The ad's JOB.
  - material.md — a numbered bank of RAW artifacts. Your ONLY source of truth.
  - verdict.md — ONLY IF PRESENT (a previous batch was killed): read the autopsy, make 8 NEW cards that
    answer it. Never resubmit a killed card.

YOUR METHOD — run these steps in your head, in order:
  1. FIX THE SCROLL MOMENT. From the brief: who is scrolling, where, avoiding what boredom, at what
     awareness level. A moment, not a segment ("the guy with enzyme pills in his gym bag", not
     "lactose-intolerant men 25-34").
  2. CHARGE PASS, not relevance pass. Walk the artifacts and mark VOLTAGE — fear, anger, extreme numbers,
     confession, controversy, weird specificity. Rank by "did it make me feel something", never by
     frequency. Frequency-ranking is computing the average; the average is generic by definition.
  3. TENSION PAIRS. Combine artifacts that contradict: belief vs evidence, price vs behavior, promise vs
     scandal, identity vs shame. THE PAIR IS THE CONCEPT. A single fact decorates; a contradiction ruptures.
  4. STEAL THE HOOK. The best lines are already in the material, in the customer's register. Select and
     compress; invent only when nothing steals. Speech test every line: would it survive being said out
     loud to a friend? Ad-speak dies in speech.
  5. GENRE FROM THE PROOF PROBLEM. Ask: what evidence format would make a skeptic believe THIS claim?
     "it's light" → demo-proof. "industry lies" → document-proof / annotated-product. "people switched" →
     ugc-still / comparison. "founder means it" → founder-note. Pick from the vocabulary below — the genre
     is the evidence vehicle, never an aesthetic choice.
  6. ANTI-WALLPAPER CHECK. For each card, NAME the category's default ad it ruptures. Can't name it → the
     card ruptures nothing → replace it.

GENRE VOCABULARY (exact keys):
${GENRES.map((g) => '  - ' + g).join('\n')}
(Reference coverage in the swipe bank right now: __BANK_COVERAGE__. Prefer covered genres when the
proof-logic allows — those render with real reference ads; others render unreferenced.)

WRITE TWO FILES:

1. cards.md — 8 cards, human-readable:
  ## Card N — <name>
  ANCHOR: [#id] "the artifact, quoted" (+ second artifact id if a tension pair)
  MOMENT: <who is scrolling + the moment>   ALIENATES: <who this deliberately loses>
  GENRE: <vocabulary key>
  HOOK: "<max 8 words, the buyer's language>"
  TURN: "<one line — the promise that resolves the hook>"
  PROOF: "<the on-image proof line, if any — or the visual proof described in one phrase>"
  ACTION: "<offer + destination, concrete — this exact text renders on the image>"
  SCENE: <one sentence — what the picture shows; the image agent will stage it via genre references>
  RUPTURES: <one line — the category wallpaper this breaks>

2. cards.json — the SAME 8 cards as a JSON array (this file is machine-law; the strings here render
   PIXEL-VERBATIM on the images):
   [{ "card": 1, "name": "...", "anchor": "[#id]", "genre": "<key>", "hook": "...", "turn": "...",
      "proof": "...", "action": "...", "scene": "...", "alienates": "...", "ruptures": "..." }, ...]

RULES:
  - Every card dies without its anchor (deletion test). 8 different anchors; at least 3 customer-voice (A),
    1 category-pain (B), 1 product-fact (D), 1 scene (E).
  - 8 different genres OR at most 2 cards per genre. No two cards on the same tension.
  - HOOK/TURN/ACTION are FINAL COPY — they will be string-matched downstream; write them exactly as they
    should appear on the image. No placeholder text.
  - Swap test: competitor logo on the image → the ad must break.
  - BANS: invented people/quotes/stats/badges; ad-speak ("elevate","unlock","discover","premium","crafted",
    "journey","game-changer"); abstract scenes; claims the material can't back.

Write ONLY the two files — no preamble, no favorite. A cold buyer judges them. Then you are done.`;

const BUY_PROMPT = `You are a MEDIA BUYER. Not a creative, not a critic — a buyer. Ten years running Meta
ads, ten thousand creatives seen, and the money is YOURS. Every card you approve spends real budget at the
CPA in founder-facts.md. A safe, seen-it-before ad doesn't "underperform" — it takes your money silently.

READ, in order:
  - founder-facts.md — the conversion event and CPA you buy against.
  - material.md — the artifact bank; verify anchors against it.
  - cards.md — 8 cards. Judge ONLY what is on the page.

FOR EACH CARD, five tests — one written line each:
  1. STOP — name the exact element that interrupts a thumb mid-scroll, in five words. Can't name it → KILL.
  2. SEEN-IT — is this shape already this category's wallpaper? Already running → KILL.
  3. SWAP — competitor's pack + logo on it: still works → it was never about this brand → KILL.
  4. TRUE — anchor quoted honestly (check material.md), claim earned by the proof, genre actually fits the
     proof problem? Any invention or a proof that proves the wrong thing → KILL.
  5. ACT — a stopped thumb knows exactly what happens next? Offer concrete?

PORTFOLIO CALL:
  - Approve AT MOST 2 of 8. Zero is allowed and respectable. When uncertain, kill.
  - Two approved cards must be DIFFERENT bets (different emotion + different genre).

WRITE verdict.md:
  ## Autopsies — per card: five test lines + verdict (KILLED: <reason> / SURVIVED)
  ## The Call — "WINNERS: Card X[, Card Y]" with two lines each on why it converts cold at this CPA,
     or "REJECT ALL" + the single clearest instruction for the next batch.
  LAST LINE exactly one of:
  FINAL: WINNERS — Card X[, Card Y]
  FINAL: REJECT ALL

You kill and you pick. No rewriting, no adding, no softening. When verdict.md is written, you are done.`;

const BUILD_PROMPT = `You are the IMAGE AGENT — an art director who EXECUTES. The concept, copy and genre are
already decided and approved; your craft is staging them into pixels that pass as real feed content. You do
not author copy. You do not improvise concepts. You adapt references like every working art director does.

READ, in order:
  - verdict.md      — which card(s) won. Build those, only those.
  - cards.json      — the winners' full cards. The hook/turn/action strings are LAW: they render
                      PIXEL-VERBATIM. You may decide their placement and treatment, never their words.
  - swipe.json      — your REFERENCE BOARD, per winner: 2-3 real Meta ads in the card's genre, each with a
                      MOVE annotation (the stealable structural idea) and a falUrl. Some are marked
                      "eyesOnly": true — those NEVER enter a render call.
  - material.md + founder-facts.md — the truth you stay inside.
  - gate-verdict.md — ONLY IF PRESENT: a previous render failed inspection. Fix ONLY the named re-render
                      diffs for the FAILED image(s) and render those again.

STEP 1 — STUDY THE BOARD. For each winner: Read (view) every reference image in swipe.json AND the product
reference (localPath in refs — call mcp__refs__get_reference_images for it). For each reference, note in
one line what you are STEALING (its move: composition logic, text-density, proof staging, annotation style)
and what you are DISCARDING (its surface: colors, props, scene contents, brand elements). THE LAW OF
ADAPTATION: moves transfer, surfaces never do. If your final image could be mistaken for any single
reference with a logo swap, you failed.

STEP 2 — ADAPTATION SPEC. Write shotspec.md, one block per winner:
  CARD: <n> — <name> · GENRE: <key>
  REFS: per reference id — STEALING: <move applied to OUR scene> / DISCARDING: <its surface>
  SCENE: the card's scene made fully concrete (place, light, surface, what's in/out of frame), staged
    with the stolen moves. Native finish: real light, slight imperfection, phone-plausible.
  PRODUCT: how the bound pack appears — natural scale, logo + flavor readable, NEVER blow up fine print
    (regenerated fine print garbles); the pack's printed design must match the product reference exactly.
  COPY PLACEMENT (strings from cards.json, verbatim):
    HOOK "<...>" — where, treatment (native to the genre: annotation, big type, caption strip...)
    TURN "<...>" — where, treatment
    ACTION "<...>" — where, treatment (must be present and legible)
  FORBID: garbled/invented text; extra limbs; AI gloss (plastic skin, gradient voids, floating objects,
    perfect symmetry); fake platform chrome (no invented UI implying a real platform); any pack copy not on
    the real pack; watermarks.

STEP 3 — COMPILE & RENDER, one image per winner:
  - Compile ONE flowing prompt from the spec: purpose ("direct-response ad image for the Meta feed") →
    genre + stolen moves (describe the composition you want, concretely) → scene → product → the exact
    on-image copy with placement ("render this text exactly: ...") → finish/imperfection → forbids.
    Every sentence carries a spec decision. No filler ("8k", "masterpiece" = noise).
  - Call mcp__nano-banana__generate_ad_images: prompts=[compiled prompt], aspectRatio="4:5",
    resolution="2K", referenceImageUrls=[product falUrl, plus ONLY the falUrls of swipe refs with
    "eyesOnly": false]. Eyes-only refs stay out of the call — no exceptions.

STEP 4 — write build-log.md, per winner:
  ## Card <n> — <name>
  REFS USED: <ids> (into-render: <ids> / eyes-only: <ids>)
  COMPILED PROMPT (verbatim):
  """
  <the exact prompt text you rendered>
  """
  IMAGE: <returned filePath>

When build-log.md exists and the image(s) are rendered, you are done. A separate inspector judges the pixels.`;

const GATE_PROMPT = `You are the PIXEL INSPECTOR — the media buyer's second pass, fresh eyes on finished
pixels. You did not write the cards and did not render. The question per image: "would I put money behind
this, as-is, today?"

DO, in order:
  1. Read cards.json, swipe.json, shotspec.md, build-log.md.
  2. VIEW every rendered image at its filePath under images/ (most recent files). A verdict without viewing
     is worthless.
  3. VIEW the product reference (product-ref.* in the working dir) and compare pack pixels against it.
  4. VIEW each swipe reference used for the image (paths in swipe.json) — for the CLONE check.

CHECK each image — one written line per check:
  1. COPY EXACT — hook/turn/action from cards.json appear verbatim, spelled correctly; NO other garbled,
     half-formed or invented text anywhere (read every piece of text in the image).
  2. THUMBNAIL — at 300px: hook legible, image parseable, one clear focal point.
  3. PRODUCT TRUE — pack format, colors, logo, flavor text match the reference photo. No invented pack.
  4. NATIVE — passes as real feed content; no AI gloss (plastic skin, gradient void, floating/unstable
     objects, impossible physics).
  5. HONEST — nothing fabricated: no invented persons-as-real, ratings, badges, verified marks, fake
     platform UI.
  6. CLONE — lay each swipe reference over it mentally: same scene contents/layout with swapped branding =
     FAIL. Moves may match; surfaces must not.
  7. GENRE — does it read as its card's genre (the evidence vehicle), or did it collapse into a generic
     poster?
  8. ANATOMY — hook dominant; action present + legible; the card's proof actually visible in-frame.

WRITE gate-verdict.md: per image — the eight check lines, each miss a NAMED DIFF marked "re-render: <one-line
prompt fix>" or "structural: <why another roll cannot fix it>". Then per-image call lines, EXACTLY:
  FINAL <image filename>: PASS
  FINAL <image filename>: FAIL
(one line per rendered image; nothing after these lines)

When uncertain on any check, FAIL it. You do not re-render, you do not rewrite specs. When gate-verdict.md
is written, you are done.`;

// ═════════════════════════════ STAGE TABLE ═══════════════════════════════════

interface ProofStage {
  name: StageName;
  systemPrompt: string;
  model: string;
  allowedTools: string[];
  mcpServers: Record<string, any>;
  deliverable: string;
  instruction: string;
  maxTurns: number;
  timeoutMin: number;
}

const NANO_TOOL = 'mcp__nano-banana__generate_ad_images';
const REFS_TOOL = 'mcp__refs__get_reference_images';
const SONNET = 'claude-sonnet-4-6';
const OPUS = 'opus';

const nanoServer = createNanoBananaServer(imagesDir);
const refsServer = createRefsServer(runDir);

const STAGE_DEFS: Record<StageName, ProofStage> = {
  collect: {
    name: 'collect',
    systemPrompt: COLLECT_PROMPT,
    model: SONNET,
    allowedTools: ['Read', 'Write', 'WebFetch', PERPLEXITY_TOOL_NAME],
    mcpServers: { perplexity: perplexityMcpServer },
    deliverable: 'material.md',
    instruction: `Collect the material for ${brandUrl}. founder-facts.md is in your working directory. Write material.md.`,
    maxTurns: 30,
    timeoutMin: 15,
  },
  create: {
    name: 'create',
    systemPrompt: CREATE_PROMPT.replace('__BANK_COVERAGE__', bankGenreCoverage()),
    model: SONNET,
    allowedTools: ['Read', 'Write'],
    mcpServers: {},
    deliverable: 'cards.json',
    instruction: 'Read founder-facts.md and material.md (and verdict.md if present) in your working directory. Write the 8 cards to cards.md AND cards.json.',
    maxTurns: 15,
    timeoutMin: 10,
  },
  buy: {
    name: 'buy',
    systemPrompt: BUY_PROMPT,
    model: OPUS,
    allowedTools: ['Read', 'Write'],
    mcpServers: {},
    deliverable: 'verdict.md',
    instruction: 'Read founder-facts.md, material.md and cards.md in your working directory. Judge the cards and write verdict.md.',
    maxTurns: 10,
    timeoutMin: 10,
  },
  build: {
    name: 'build',
    systemPrompt: BUILD_PROMPT,
    model: SONNET,
    allowedTools: ['Read', 'Write', 'Glob', NANO_TOOL, REFS_TOOL],
    mcpServers: { 'nano-banana': nanoServer, refs: refsServer },
    deliverable: 'build-log.md',
    instruction: 'Read verdict.md, cards.json, swipe.json, material.md, founder-facts.md (and gate-verdict.md if present) in your working directory. View the reference board, write shotspec.md, render the winner(s), write build-log.md.',
    maxTurns: 30,
    timeoutMin: 15,
  },
  gate: {
    name: 'gate',
    systemPrompt: GATE_PROMPT,
    model: OPUS,
    allowedTools: ['Read', 'Write', 'Glob'],
    mcpServers: {},
    deliverable: 'gate-verdict.md',
    instruction: 'Read cards.json, swipe.json, shotspec.md and build-log.md in your working directory, view every rendered image under images/, the product reference, and the swipe references, then write gate-verdict.md with per-image FINAL lines.',
    maxTurns: 15,
    timeoutMin: 12,
  },
};

// ═════════════════════════════ CODE STEPS ════════════════════════════════════

/** Swipe retrieval — pure code. For each winner card, pick 2-3 bank refs:
 *  genre match first, then proofMode-agnostic fallback; safe (adjacent-category)
 *  refs preferred and eligible for the render call; same-category refs eyes-only;
 *  brand-diverse. Writes swipe.json. */
function swipeRetrieve(winners: any[]): void {
  const idxFile = join(BANK_DIR, 'index.json');
  const bank: any[] = fs.existsSync(idxFile) ? JSON.parse(fs.readFileSync(idxFile, 'utf-8')) : [];
  const boards = winners.map((card) => {
    const byGenre = bank.filter((e) => e.genre === card.genre);
    const pool = byGenre.length >= 2 ? byGenre : [...byGenre, ...bank.filter((e) => e.genre !== card.genre)];
    // safe-first, then revealed-winner signal
    const ranked = [...pool].sort((x, y) => {
      if (!!x.sameCategory !== !!y.sameCategory) return x.sameCategory ? 1 : -1;
      if ((y.variants ?? 1) !== (x.variants ?? 1)) return (y.variants ?? 1) - (x.variants ?? 1);
      return (y.daysRunning ?? 0) - (x.daysRunning ?? 0);
    });
    const picked: any[] = [];
    for (const e of ranked) {
      if (picked.length >= 3) break;
      if (picked.some((p) => p.brand === e.brand)) continue; // brand diversity forces abstraction
      picked.push(e);
    }
    return {
      card: card.card,
      name: card.name,
      genre: card.genre,
      genreCovered: byGenre.length >= 2,
      refs: picked.map((e) => ({
        id: e.id,
        file: join(BANK_DIR, e.file),
        falUrl: e.falUrl ?? null,
        move: e.move,
        eyesOnly: !!e.sameCategory,
        genre: e.genre,
      })),
    };
  });
  fs.writeFileSync(join(runDir, 'swipe.json'), JSON.stringify(boards, null, 2));
  for (const b of boards) {
    console.log(`   swipe → card ${b.card} [${b.genre}${b.genreCovered ? '' : ' — no direct genre refs, cross-genre board'}]: ${b.refs.map((r: any) => r.id + (r.eyesOnly ? ' (eyes-only)' : '')).join(', ') || '(bank empty)'}`);
  }
}

/** String guard — pure code. Every winner's hook/turn/action must appear verbatim
 *  (whitespace/quote/case-normalized) in the compiled prompt in build-log.md. */
function normalize(s: string): string {
  return s.toLowerCase().replace(/[‘’“”]/g, "'").replace(/[–—]/g, '-').replace(/\s+/g, ' ').trim();
}
function stringGuard(winners: any[]): { ok: boolean; misses: string[] } {
  const log = normalize(fs.readFileSync(join(runDir, 'build-log.md'), 'utf-8'));
  const misses: string[] = [];
  for (const c of winners) {
    for (const field of ['hook', 'turn', 'action'] as const) {
      const val = (c[field] ?? '').trim();
      if (!val) continue;
      if (!log.includes(normalize(val))) misses.push(`card ${c.card} ${field}: "${val}"`);
    }
  }
  return { ok: misses.length === 0, misses };
}

/** Parse per-image FINAL lines from gate-verdict.md → { filename: 'PASS'|'FAIL' } */
function parseGate(): Record<string, string> {
  const gv = fs.readFileSync(join(runDir, 'gate-verdict.md'), 'utf-8');
  const out: Record<string, string> = {};
  for (const m of gv.matchAll(/^FINAL\s+(\S+?):\s*(PASS|FAIL)\s*$/gim)) out[m[1]] = m[2].toUpperCase();
  return out;
}

// ═════════════════════════════ RUNNER ════════════════════════════════════════

const logger = new TraceLogger(runDir);

async function runStage(stage: ProofStage, roundLabel = ''): Promise<boolean> {
  const t0 = Date.now();
  console.log(`\n▶ ${stage.name}${roundLabel} (${stage.model})`);

  const done = new AbortController();
  async function* promptStream(): AsyncGenerator<any> {
    yield { type: 'user', message: { role: 'user', content: stage.instruction }, parent_tool_use_id: null };
    if (!done.signal.aborted) {
      await new Promise<void>((r) => done.signal.addEventListener('abort', () => r(), { once: true }));
    }
  }

  const options: Options = {
    cwd: runDir,
    model: stage.model,
    systemPrompt: stage.systemPrompt,
    settingSources: [],
    strictMcpConfig: true,
    mcpServers: stage.mcpServers,
    allowedTools: stage.allowedTools,
    maxTurns: stage.maxTurns,
  };

  const hardStop = setTimeout(() => done.abort(), stage.timeoutMin * 60 * 1000);
  try {
    for await (const m of query({ prompt: promptStream(), options })) {
      logger.record(m as any);
      const msg = m as any;
      if (msg.type === 'assistant') {
        for (const b of msg.message?.content ?? []) {
          if (b.type === 'tool_use') console.log(`   · ${b.name}${b.name === PERPLEXITY_TOOL_NAME ? ` (${b.input?.questions?.length ?? '?'}q)` : ''}`);
        }
      }
      if (msg.type === 'result') {
        console.log(`   ■ ${msg.subtype} — turns=${msg.num_turns}, cost=$${(msg.total_cost_usd ?? 0).toFixed(4)}`);
        done.abort();
      }
    }
  } finally {
    clearTimeout(hardStop);
    done.abort();
  }

  const ok = fs.existsSync(join(runDir, stage.deliverable));
  console.log(`${ok ? '✓' : '✗'} ${stage.deliverable} (${((Date.now() - t0) / 60000).toFixed(1)} min)`);
  return ok;
}

const read = (f: string) => (fs.existsSync(join(runDir, f)) ? fs.readFileSync(join(runDir, f), 'utf-8') : '');
const has = (s: StageName) => order.includes(s);

console.log(`\n🚀 proof-loop v2 · ${order.join(' → ')}`);
console.log(`   thesis: raw material + kill pressure + reference adaptation`);
console.log(`   brand:  ${brandUrl}`);
console.log(`   run:    ${runDir}\n`);

const t0 = Date.now();
let outcome = 'incomplete';
try {
  // collect
  if (has('collect') && !(await runStage(STAGE_DEFS.collect))) throw new Error('collect produced no material.md');

  // create ↔ buy (max 2 rounds)
  let winners: any[] = [];
  if (has('create') || has('buy')) {
    for (let round = 1; round <= 2; round++) {
      if (has('create')) {
        if (round > 1) {
          fs.renameSync(join(runDir, 'cards.md'), join(runDir, `cards.r${round - 1}.md`));
          fs.renameSync(join(runDir, 'cards.json'), join(runDir, `cards.r${round - 1}.json`));
        }
        if (!(await runStage(STAGE_DEFS.create, ` (round ${round})`))) throw new Error('create produced no cards.json');
      }
      if (!has('buy')) break;
      if (round > 1) fs.renameSync(join(runDir, 'verdict.md'), join(runDir, `verdict.r${round - 1}.md`));
      if (!(await runStage(STAGE_DEFS.buy, ` (round ${round})`))) throw new Error('buy produced no verdict.md');
      if (/^FINAL:.*REJECT ALL/im.test(read('verdict.md'))) {
        console.log(`   ⟲ buyer rejected all 8 (round ${round})`);
        if (round === 2 || !has('create')) { outcome = 'flagged: buyer rejected two full batches — material or brief is the problem'; throw new Error(outcome); }
      } else break;
    }
    // Resolve winner cards from cards.json + verdict FINAL line
    const fin = read('verdict.md').match(/^FINAL:\s*WINNERS\s*[—-]\s*(.+)$/im)?.[1] ?? '';
    const ids = [...fin.matchAll(/Card\s+(\d+)/gi)].map((m) => Number(m[1]));
    const cards = JSON.parse(read('cards.json'));
    winners = cards.filter((c: any) => ids.includes(c.card));
    if (has('buy') && winners.length === 0) throw new Error(`could not resolve winner cards from verdict FINAL line: "${fin}"`);
    console.log(`   winners: ${winners.map((w) => `card ${w.card} [${w.genre}] "${w.hook}"`).join(' · ')}`);
  } else if (has('build')) {
    // build-only resume: winners from existing verdict + cards.json
    const fin = read('verdict.md').match(/^FINAL:\s*WINNERS\s*[—-]\s*(.+)$/im)?.[1] ?? '';
    const ids = [...fin.matchAll(/Card\s+(\d+)/gi)].map((m) => Number(m[1]));
    winners = JSON.parse(read('cards.json')).filter((c: any) => ids.includes(c.card));
  }

  // build ↔ gate (per-image; max 2 build attempts)
  if (has('build')) {
    swipeRetrieve(winners); // code step — writes swipe.json

    for (let attempt = 1; attempt <= 2; attempt++) {
      if (!(await runStage(STAGE_DEFS.build, attempt > 1 ? ' (re-render round)' : ''))) throw new Error('build produced no build-log.md');

      // String guard — deterministic; one forced redo before any gate spend
      const guard = stringGuard(winners);
      if (!guard.ok) {
        console.log(`   ✋ STRING GUARD: approved copy missing from compiled prompt:\n      ${guard.misses.join('\n      ')}`);
        if (attempt === 2) { outcome = 'flagged: string guard failed twice — build drops approved copy'; break; }
        fs.writeFileSync(join(runDir, 'gate-verdict.md'), `# Guard note\nThe compiled prompt dropped approved copy. Re-render fixing ONLY this — include these strings verbatim:\n${guard.misses.map((m) => '- ' + m).join('\n')}\n\nFINAL guard: FAIL\n`);
        continue; // build re-runs, reads gate-verdict.md as its fix list
      }

      if (!has('gate')) { outcome = 'shipped (ungated)'; break; }
      if (attempt > 1) { try { fs.renameSync(join(runDir, 'gate-verdict.md'), join(runDir, 'gate-verdict.r1.md')); } catch {} }
      if (!(await runStage(STAGE_DEFS.gate))) throw new Error('gate produced no gate-verdict.md');

      const results = parseGate();
      const passes = Object.entries(results).filter(([, v]) => v === 'PASS').map(([k]) => k);
      const fails = Object.entries(results).filter(([, v]) => v === 'FAIL').map(([k]) => k);
      console.log(`   gate: ${passes.length} PASS / ${fails.length} FAIL${fails.length ? ' — ' + fails.join(', ') : ''}`);

      if (fails.length === 0 && passes.length > 0) { outcome = `shipped: ${passes.length}/${passes.length + fails.length} passed the pixel gate`; break; }
      if (/structural/i.test(read('gate-verdict.md')) && passes.length === 0 && attempt === 2) { outcome = 'flagged: structural render fail'; break; }
      if (attempt === 2) {
        outcome = passes.length > 0
          ? `shipped: ${passes.length} passed; ${fails.length} still failing after re-render`
          : 'flagged: no image passed the pixel gate after re-render';
        break;
      }
      console.log('   ⟲ re-render round for failed image(s)');
    }
  } else if (outcome === 'incomplete') {
    outcome = 'partial run (no build stage)';
  }
} catch (e: any) {
  console.error(`\n❌ ${e?.message ?? e}`);
  if (outcome === 'incomplete') outcome = `error: ${e?.message ?? e}`;
} finally {
  fs.writeFileSync(join(runDir, 'DONE.md'), `${outcome}\n`);
  logger.finalize();
  const mins = ((Date.now() - t0) / 60000).toFixed(1);
  console.log(`\n✅ ${outcome} — ${mins} min`);
  for (const s of order) console.log(`   ${fs.existsSync(join(runDir, STAGE_DEFS[s].deliverable)) ? '✓' : '✗'} ${STAGE_DEFS[s].deliverable}`);
  const imgs = fs.existsSync(imagesDir) ? fs.readdirSync(imagesDir).filter((f) => /\.(png|jpe?g|webp)$/i.test(f)) : [];
  console.log(`   images: ${imgs.length}${imgs.length ? ' → ' + imagesDir : ''}`);
  console.log(`   trace:  ${join(runDir, 'trace.md')}`);
}
