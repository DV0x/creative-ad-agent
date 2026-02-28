# Platform Capability Audit: Creative Agent for Performance Marketers

**Date:** 2026-02-21
**Auditor:** Platform Research Agent
**Scope:** Full codebase review of agent pipeline, server architecture, client UI

---

## 1. Current Capabilities

### 1.1 Research Extraction (URL to Brand Brief)

**What it does:** A dedicated `research` subagent (defined in `agent/.claude/agents/research.md`) receives a URL, fetches the homepage via `WebFetch`, and produces a structured markdown research brief saved to `files/research/{brand}_research.md`. The brief extracts: the offer (with specific numbers), key value props, proof points (ratings, credentials, deal examples), full product/service list, pain points addressed, verbatim testimonials, brand colors (hex codes), brand voice assessment, headline/CTA messaging, and a full ICP analysis with demographics, pain points, motivations, and language patterns. If the user specifies a target audience, the ICP analysis focuses on that segment; otherwise it derives the ICP from the site's own messaging.

**Evidence from code:** The orchestrator prompt (`server/lib/orchestrator-prompt.ts`) explicitly sequences `research agent -> hook skill -> art skill -> MCP images`. The research agent definition enforces strict rules: be specific with numbers, extract exact quotes, note missing info, and cap output at 60-70 lines. Good vs. bad examples embedded in the agent file ensure quality.

**Strength: 8/10.** The research extraction is remarkably thorough for a single-URL scrape. It captures brand colors (critical for ad consistency), ICP segments (critical for targeting), and verbatim testimonials (critical for social proof hooks). The structured output format ensures downstream skills get consistent input.

**Marketer Relevance: 9/10.** Every performance marketer starts a campaign by understanding the brand. Automated research extraction eliminates the manual process of reading through a website and pulling out key data. The ICP analysis is particularly valuable because it translates brand data into targeting language that hooks can use. Marketers currently spend 30-60 minutes doing this manually per client.

**Weakness:** Single-page extraction only (homepage). Does not crawl subpages, pricing pages, or about pages. Does not integrate third-party data (e.g., SimilarWeb traffic, Meta Ad Library competitor ads, review sites). If the homepage is thin or image-heavy, extraction quality drops.

---

### 1.2 Hook Generation (10 Hook Types, Research-Driven)

**What it does:** The `hook-methodology` skill (`agent/.claude/skills/hook-methodology/SKILL.md` + `formulas.md`) implements a 5-step process: Extract from every research section, Match research elements to hook types, Construct hooks with traceability, add Body + CTA, and Variety Check. It defines 10 hook types across two categories: 5 Attention Hooks (Question, Surprising Stat, Pattern Interrupt, Controversial, Direct Address) and 5 Desire Hooks (Social Proof, Problem-Solution, Contrast, FOMO/Urgency, Curiosity). Default output is 3 hooks per campaign (user can request more, up to 6 for image generation).

**Evidence from code:** The skill file contains a mandatory extraction checklist requiring hooks from every research section (The Offer, Value Props, Proof Points, Products/Services, Pain Points, Testimonials, Brand Voice, Messaging, and each ICP segment). A validation checklist requires each hook to be: Traceable (citable research source), Owned (not generic enough for a competitor), Felt (names an emotion), Clear (3-second comprehension), and Theirs (uses the audience's language). The variety check ensures at least 3 different hook types, research sections, ICP segments, and 3 of 6 emotional territories (Fear, Hope, Frustration, Relief, Pride, Curiosity).

**Strength: 9/10.** This is the platform's strongest capability. The research-first methodology with mandatory traceability is genuinely sophisticated. The "no invention, only discovery" philosophy, combined with anti-patterns like "The Skip Trap," "The Generic Trap," and "The Template Trap," produces hooks that are specific and defensible. The emotional territory coverage requirement ensures creative diversity. The explicit Research-to-Hook Mapping Guide (formulas.md) gives the AI structured guidance for matching research elements to hook types.

**Marketer Relevance: 10/10.** Hook copy is the single most important variable in static ad performance. Every Meta media buyer spends significant time writing and testing hooks. The fact that hooks are traceable to research sources means a marketer can evaluate whether the hook is defensible (vs. invented claims that could get ad accounts flagged). The 10-type taxonomy maps directly to proven direct-response psychology. The Body + CTA formula with strong CTA examples ("See your options" vs. "Learn more") shows understanding of conversion copywriting.

**Weakness:** Default is only 3 hooks. Performance marketers testing at scale need 10-20+ hook variants to find winners. No A/B variant generation (e.g., "generate 3 variations of the winning hook type"). No integration with Meta's ad copy character limits (primary text: 125 chars recommended, headline: 40 chars recommended).

---

### 1.3 Art Direction (Visual Prompt Generation)

**What it does:** The `art-style` skill (`agent/.claude/skills/art-style/SKILL.md`) routes to style-specific workflow files based on user keywords. Currently two styles are implemented: Anderson Clay Diorama (default) and Soft Brutalism Clay. Two more are planned (Surrealist Scale, Minimal Photography). Each workflow reads the hook-bank file and produces a `{brand}_prompts.json` with detailed image generation prompts.

**Evidence from code:** The Anderson Clay Diorama workflow (`anderson-clay-diorama.md`) is extraordinarily detailed at ~500 lines. It defines three creative decisions: The Story (hook type to visual world mapping), The Stage (lighting, camera, composition, texture, color temperature), and The Frame (typography, border, hierarchy). The prompt template specifies diorama description, lighting angle + shadow color, camera focal length + DOF, composition axis + 3 depth layers, texture hierarchy (5 levels), color temperature arc, clay aesthetic, typography specs (font weight, position, ALL CAPS), and a 10px brand-color border. The output is structured JSON with story metadata, stage specifications, the full prompt text, and aspect ratio.

**Strength: 8/10.** The art direction system is impressive in its specificity. Every prompt includes exact brand hex codes, specific lighting angles, camera focal lengths, composition rules, and texture hierarchies. The hook-type-to-visual-world mapping (e.g., Curiosity -> "Revealing," Frustration -> "Trapped") shows genuine creative direction thinking. The "Diorama Test" quality gate and anti-pattern table prevent common AI image generation failures.

**Marketer Relevance: 7/10.** Performance marketers care about scroll-stopping visuals, but the clay diorama style is niche. While visually distinctive (good for pattern interrupt), it limits the platform to a specific aesthetic. Most performance marketers need photorealistic product shots, lifestyle imagery, UGC-style content, and clean graphic ads. The clay style is a strong creative differentiator for the platform, but not a universal solution. The extensible style-routing architecture is well-designed for adding more styles.

**Weakness:** Only 2 styles implemented (clay-based). No photorealistic mode, no UGC-style mode, no clean graphic/typography-heavy mode. The style system is architecturally extensible (new workflow files + routing keywords), but the current offering is narrow. No product shot integration (placing a real product into a scene). Typography rendering in AI images is notoriously unreliable, and the prompts heavily specify text placement.

---

### 1.4 Image Generation (fal.ai Integration)

**What it does:** The `nano-banana-mcp.ts` MCP server provides AI image generation using fal.ai's Nano Banana Pro model (Google Gemini image model via fal.ai). It supports text-to-image generation with 1K/2K/4K resolution, 10 aspect ratios (including 1:1, 9:16, 16:9), up to 6 images per call, optional reference images (auto-routes to edit endpoint), web search grounding, and configurable output formats (JPEG, PNG, WebP). Images are saved locally to `generated-images/{sessionId}/` and served via a static file route.

**Evidence from code:** The MCP server processes prompts sequentially (one at a time) with a 500ms delay between requests to avoid rate limiting. Each image is saved with a descriptive filename including timestamp, index, and sanitized prompt text. Real-time `image-saved` events are emitted via EventEmitter for immediate WebSocket broadcast to the client. The tool accepts `referenceImageUrls` for style transfer and subject consistency. Reference images are uploaded to fal.ai storage for public URL access.

**Strength: 7/10.** The integration is solid: proper error handling per-image (one failure doesn't stop the batch), real-time progress events, local file persistence, and reference image support for consistency. The fal.ai Nano Banana Pro model produces good quality images. Resolution options up to 4K and 10 aspect ratio choices cover most ad format needs.

**Marketer Relevance: 7/10.** Image generation is essential, but the current implementation has limitations for production use. No text overlay (AI-generated text in images is unreliable). No product shot compositing. No brand template system for consistent ad layouts across campaigns. The reference image support is good for maintaining visual consistency within a campaign. The 6-image limit per generation is adequate for initial testing but not for scale.

**Weakness:** Sequential processing means 6 images at 2K takes significant time (each fal.ai call is 5-15 seconds). No parallel generation. The hook-type labeling is hardcoded to a fixed order (stat, story, fomo, curiosity, callout, contrast) regardless of actual hook content. No image quality scoring or automatic regeneration of poor results. No transparent text overlay system (relies on AI model to render text, which is unreliable).

---

### 1.5 Real-Time Streaming (Thinking Blocks, Progress)

**What it does:** The WebSocket handler (`server/lib/websocket-handler.ts`) processes the SDK message stream and converts it into typed events: `phase` (parse, research, hooks, art, images, complete), `tool_start`/`tool_end`, `message` (text content), `file` (research/hooks/prompts created), `image` (generated image available), and `complete`/`error`. The client (`client/src/hooks/useWebSocket.ts`) renders these as "thinking blocks" in the chat UI, showing real-time progress with collapsible sections for each pipeline phase.

**Evidence from code:** The `BlockBuilder` class in the WebSocket handler constructs structured block data for DB persistence, mirroring the client-side block structure. Blocks include thinking blocks (with children: phase, tool, progress, status), text blocks (final summary), and status blocks (info/success/error). Expected image count is parsed from the user prompt and updated when the prompts file arrives. The client shows skeleton cards for remaining images during generation.

**Strength: 8/10.** The streaming architecture is well-executed. Users see exactly what the agent is doing at each step: "Researching," "Generating Hooks," "Creating Art Direction," "Generating Images" with per-image progress. The thinking block UI (collapsible, with tool names and status indicators) gives transparency without overwhelming the user. The phase detection from SDK tool usage (Task -> research, Skill -> hooks/art, MCP -> images) is clever.

**Marketer Relevance: 7/10.** Marketers appreciate knowing that the system is working and how long it will take. The phase-based progress is much better than a spinner. However, marketers care more about the output quality than the process visibility. The real value is the "not stuck" assurance during the 2-5 minute generation time.

**Weakness:** No time estimates per phase. No ability to skip phases (e.g., "I already have research, just generate hooks"). No partial result preview during generation (can't see the first image while the sixth is still generating -- images do stream in one at a time, but there's no way to act on early results before generation completes).

---

### 1.6 File Management (Research, Hooks, Prompts -- Editable)

**What it does:** Each campaign has three editable files: `research.md`, `hooks.md`, and `prompts.md`. These are persisted in the `campaign_files` table and surfaced in the UI via the Asset Drawer's campaign tree and the File Editor panel. The File Editor (`client/src/components/editor/FileEditor.tsx`) uses TipTap (a ProseMirror-based rich text editor) with undo/redo, auto-save (1-second debounce), save status indicator, and a resizable panel with drag handle.

**Evidence from code:** The store (`client/src/store/index.ts`) tracks `filesReady` state per campaign and per file type. The `updateCampaignFile` action sets the ready flag and updates content. The `saveFileAsync` method syncs to the server API. The file editor shows saved/saving/unsaved status with colored indicators and relative timestamps ("saved 2m ago"). Files are also persisted server-side via the `db.updateCampaignFile` call during generation.

**Strength: 7/10.** The file management gives users full visibility into and control over the intermediate outputs. Being able to edit research before hook generation (or edit hooks before art direction) is a powerful feature for iterative refinement. The TipTap editor provides a solid editing experience with undo/redo. Auto-save prevents data loss.

**Marketer Relevance: 8/10.** This is highly relevant. Performance marketers often want to tweak the research (add competitor data, correct facts), edit hooks (adjust tone, add brand-specific phrases), or modify prompts (change visual direction). The ability to edit intermediate files and regenerate downstream outputs is a key differentiator over black-box tools. However, the current implementation does not actually trigger regeneration from edited files -- the user must manually request a follow-up to use the edited content.

**Weakness:** Editing a file does not auto-trigger downstream regeneration. No diff view to see what changed. No version history. The TipTap editor renders HTML, but the AI generates markdown -- there may be format mismatches. No file templates or pre-populated content for manual campaign creation (without URL research).

---

### 1.7 Asset Library (Upload, Organize, Reference in Chat)

**What it does:** Users can create folders, upload images, and reference assets in chat messages using @mentions. The Asset Drawer (`client/src/components/assets/AssetDrawer.tsx`) shows a collapsible folder tree with file thumbnails. Files are uploaded to the server and stored in the `uploads/` directory. The `ChatInput` component (`client/src/components/chat/ChatInput.tsx`) supports @mentions for asset folders, individual asset files, and campaign files (research/hooks/prompts). When assets are mentioned, they are resolved to base64 attachments for Claude to see + uploaded to fal.ai storage for public URLs that can be passed as `referenceImageUrls` to the image generation MCP tool.

**Evidence from code:** The `resolveAssetAttachments` function in `websocket-handler.ts` reads asset files from disk, creates base64 attachments for the Claude SDK message, and uploads to `fal.storage.upload()` for public URLs. The asset mention system allows both folder-level and file-level references. The DB schema includes `asset_folders` and `asset_files` tables with full CRUD operations.

**Strength: 7/10.** The asset pipeline is well-integrated: upload -> organize in folders -> reference in chat via @mentions -> resolve to both base64 (for Claude to see) and public URLs (for fal.ai reference). This enables style transfer and brand consistency by providing reference images during generation.

**Marketer Relevance: 8/10.** Performance marketers have brand assets (logos, product shots, style references) that need to inform creative generation. The ability to upload brand assets and reference them in generation prompts is essential for brand consistency. The @mention UX is intuitive.

**Weakness:** No automatic brand kit extraction (upload logo -> extract brand colors). No asset tagging or search. No asset preview in the mention dropdown. No asset versioning. The folder structure is flat (no nested folders). No support for document assets (PDFs, brand guidelines) being parsed for content.

---

### 1.8 Follow-Up Refinements (Iterate on Campaigns)

**What it does:** After initial generation completes, users can send follow-up messages via the chat input. The `follow_up` WebSocket message type triggers `handleFollowUp` in the WebSocket handler, which looks up the campaign, retrieves the SDK session ID, and resumes the Claude conversation with full context from the previous generation. This enables iterative refinement: "make the third image warmer," "generate 2 more hooks focusing on social proof," "change the CTA to 'Get Started.'"

**Evidence from code:** The `handleFollowUp` function uses `aiClient.queryWithSession` with the existing SDK session ID for conversation continuity. It supports asset attachments in follow-ups. Image indexing continues from the existing count (e.g., if 6 images exist, new images start at index 7). The client's `startFollowUp` action preserves existing chat messages and appends the new user + assistant messages. For failed/cancelled campaigns, it skips resume (avoids crashing on empty JSONL files) and starts fresh.

**Strength: 8/10.** Session continuity via Claude SDK resume is a major technical achievement. The AI retains full context from research, hooks, art direction, and previous images. This enables natural language iteration ("make it more aggressive") without re-explaining the entire campaign. The graceful fallback (fresh session if resume fails) prevents dead-end states.

**Marketer Relevance: 9/10.** Iteration is the core of performance marketing creative workflow. A marketer tests, analyzes, and iterates. Being able to say "the stat hook performed well, generate 3 more variations of that angle" in natural language is enormously valuable. This is where the platform's chat-based approach truly shines over form-based tools.

**Weakness:** No structured iteration workflow (e.g., "regenerate image 3 with these changes" button on the image card). Follow-ups go through the full AI pipeline, which can be slow for simple changes. No A/B variant generation (e.g., "generate versions A and B of this hook"). The session fork capability exists in `ai-client.ts` (`queryWithSessionFork`) but is not yet wired to the UI.

---

### 1.9 Session Recovery (Resume on Disconnect)

**What it does:** The event buffer system (`server/lib/event-buffer.ts`) stores all WebSocket events per session with sequential IDs. On disconnect and reconnect, the client sends a `subscribe` message with the last received event ID, and the server replays all missed events. Active sessions are persisted in `localStorage` with session ID, prompt, campaign ID, and message ID. The server continues generation in the background when a client disconnects (does NOT abort).

**Evidence from code:** The `handleSubscribe` function replays missed events via `getEventsSince`. The client's `handleConnected` callback checks for saved sessions and triggers recovery. A 45-second recovery timeout clears stuck state. Event buffers have a 40-minute TTL and 1000-event cap. The `sessionAbortControllers` map is separate from WebSocket connections, so abort only happens on explicit cancel.

**Strength: 8/10.** This is production-grade resilience. Background generation continues on disconnect. Event replay ensures no missed images or status updates. The TTL and cap prevent memory leaks. The separation of abort from disconnect is architecturally correct.

**Marketer Relevance: 6/10.** Marketers expect things to work without thinking about connections. Recovery is a hygiene feature -- when it works, nobody notices; when it fails, trust is lost. The 40-minute buffer window is generous enough for tab switches and network interruptions. However, marketers are unlikely to appreciate the engineering behind it.

**Weakness:** No cross-device session continuity (recovery only works in the same browser). No notification when generation completes while the user is away (no email/push notification). The recovery UI shows "Recovering session..." which could be confusing for non-technical users.

---

### 1.10 Campaign Management (List, Rename, Delete)

**What it does:** Campaigns are listed in the Asset Drawer sidebar with collapsible items showing files (Research, Hooks, Prompts) as children. Users can rename campaigns (double-click or pencil icon), delete campaigns (trash icon), and create new campaigns (+ button). The Empty State shows recent campaigns for quick access. Campaign data is persisted in SQLite with full CRUD operations.

**Evidence from code:** The `CampaignItem` component in `AssetDrawer.tsx` supports: inline rename with Enter/Escape handling, delete with optimistic updates, expand/collapse with animated chevrons, and file navigation. The store's `deleteCampaignAsync` and `renameCampaignAsync` use optimistic updates (instant UI response) with async API sync. Campaign status tracking includes: generating, complete, incomplete, error, cancelled. The database schema uses cascading deletes (deleting a campaign removes files, images, and messages).

**Strength: 6/10.** Basic CRUD is functional. Optimistic updates provide good perceived performance. The collapsible tree with file children is a clean UX pattern. Status tracking enables the "Resume" button for incomplete campaigns.

**Marketer Relevance: 7/10.** Campaign organization is essential as users accumulate campaigns. However, the current implementation is minimal: no search, no filtering by status/date, no sorting, no campaign duplication, no campaign archiving, no team sharing. As a marketer's campaign count grows past 10-20, the simple list becomes unwieldy.

**Weakness:** No campaign search or filtering. No campaign duplication (copy an existing campaign as a starting point). No campaign export (download all assets + copy as a package). No campaign sharing or team collaboration. No campaign analytics or performance tracking. No campaign tagging or categorization. The sidebar list shows all campaigns in creation order with no way to reorder.

---

## 2. What Works Well for Performance Marketers

### 2.1 Research-Driven Hooks (Not Template Slop)

The platform's strongest differentiator is its research-first hook methodology. Unlike template-based tools that fill in blanks ("Introducing [Product], the [Adjective] way to [Benefit]"), this system mines the actual brand data. The mandatory extraction checklist forces the AI to examine every section of the research before writing a single hook. The traceability requirement (every hook must cite its research source) means hooks are defensible and specific.

For a performance marketer, this translates directly to ad copy that converts better because it uses real proof points ("$547.5K mortgage approved in 24 hours") rather than vague claims ("Fast approvals"). The validation checklist's "Ownership" test -- "Could a competitor swap in their logo and use this?" -- is exactly how experienced copywriters evaluate hook quality.

### 2.2 Traceability (Every Hook Has a Source)

Each hook in the hook-bank file includes: Type, Source (research section + specific element), Target (ICP segment), Hook text, Body, CTA, and Psychology. This traceability chain means a marketer can:
1. Verify the claim is factual (traces to research)
2. Understand why it should work (psychology explanation)
3. Know who it targets (ICP segment)
4. Test whether the source data is still current

This is particularly valuable for regulated industries (finance, health) where ad claims must be substantiated.

### 2.3 Multiple Hook Types Mapped to Ad Psychology

The 10 hook types are not arbitrary categories. They map to established direct-response psychology: self-reference processing (Question hooks), social proof (Social Proof hooks), loss aversion (FOMO hooks), curiosity gap (Curiosity hooks), identity recognition (Direct Address hooks). The variety check ensures emotional diversity across Fear, Hope, Frustration, Relief, Pride, and Curiosity.

This taxonomy gives marketers a framework for systematic testing. Instead of random creative, a marketer can test "Contrast hooks vs. Social Proof hooks" and build a hypothesis about what works for their audience.

### 2.4 Visual Consistency via Art Style Workflows

The art direction system ensures visual consistency within a campaign through: exact brand hex codes in every prompt, consistent lighting signatures, matching texture hierarchies, and brand-colored borders. The 10px border in brand primary color creates instant brand recognition across a campaign's ad set.

The style-routing architecture (keywords -> workflow files) is extensible, allowing new visual styles to be added without modifying the core pipeline.

### 2.5 Real-Time Progress Visibility

The thinking block UI shows exactly what the system is doing: "Researching," "Generating Hooks," "Creating Art Direction," "Generating Images 3/6." This transparency reduces anxiety during the 2-5 minute generation time. The skeleton card pattern for pending images is a thoughtful UX detail.

### 2.6 Editable Intermediate Files

The ability to edit research, hooks, and prompts gives power users control over the creative process. A marketer can: correct research inaccuracies, add competitor intelligence to the research brief, refine hook copy for brand voice, and adjust visual prompts for specific creative direction. This positions the platform between fully automated (black box) and fully manual (blank canvas).

---

## 3. What's Missing or Weak

### 3.1 Multi-Page Research / Competitor Intelligence

**Gap:** Research is limited to a single homepage fetch. No crawling of subpages (pricing, about, testimonials pages). No competitor ad research (Meta Ad Library integration). No third-party data enrichment (reviews, traffic, market position).

- **Criticality for Performance Marketer:** 8/10. Performance marketers research competitors extensively before creating campaigns. Understanding what competitors are running (and what's working) is essential for differentiation.
- **Difficulty to Build:** 6/10. The research agent already uses WebFetch. Adding multiple URL fetches and Meta Ad Library integration is incremental. The challenge is keeping research brief length manageable.
- **Impact on Retention:** 8/10. Users who see competitor insights in their research will return more often and trust the platform's intelligence.

### 3.2 High-Volume Hook Variant Generation

**Gap:** Default is 3 hooks, max practically 6 (tied to image generation count). Performance marketers testing at scale need 10-20+ hook variants per campaign, with A/B variations of winning angles.

- **Criticality:** 9/10. The #1 workflow in performance marketing is "test more creative." Volume of testable hooks directly impacts ad account performance.
- **Difficulty:** 3/10. The hook methodology is already built. Generating more hooks is a prompt parameter change. A/B variant generation (e.g., "3 variations of this Question hook") requires minor skill extension.
- **Retention Impact:** 9/10. Marketers who can generate 20 hook variants in one session will deeply integrate the platform into their workflow.

### 3.3 Meta Ad Format Compliance

**Gap:** No enforcement of Meta ad specs (1080x1080 for feed, 1080x1920 for stories, 1200x628 for link ads). No character limit guidance for primary text (125 chars recommended), headline (40 chars), and description (30 chars). No automatic cropping or reformatting for different placements.

- **Criticality:** 8/10. Ads that don't meet spec get cropped or rejected. Marketers waste time reformatting.
- **Difficulty:** 4/10. Aspect ratios are already configurable in the MCP tool. Adding Meta-specific presets and character count warnings is straightforward.
- **Retention Impact:** 7/10. Compliance saves time but is not a primary reason to use the tool.

### 3.4 Photorealistic and UGC-Style Visual Modes

**Gap:** Only clay/diorama styles are implemented. No photorealistic product shots, lifestyle photography, UGC-style content, or clean graphic/typography ads.

- **Criticality:** 9/10. The majority of top-performing Meta ads use photorealistic or UGC-style imagery. Clay diorama is a niche style.
- **Difficulty:** 5/10. The art-style routing architecture is built for extensibility. Each new style requires a workflow document similar to the 500-line Anderson Clay Diorama file.
- **Retention Impact:** 9/10. Users who cannot create the ad style they need will not return. Multiple style options are table stakes.

### 3.5 Text Overlay / Graphic Design Layer

**Gap:** Text in generated images relies on the AI model's text rendering, which is unreliable. No post-generation text overlay system, no template system for placing hook text on images, no typography controls.

- **Criticality:** 9/10. Static ads need readable text overlays. AI-generated text often has spelling errors, wrong fonts, or poor placement.
- **Difficulty:** 7/10. Requires either a client-side canvas editor (HTML Canvas or Fabric.js) or a server-side compositing step (Sharp/Canvas). This is significant engineering.
- **Retention Impact:** 8/10. If text on images is unreliable, marketers can't use the output directly. They have to take the image into Figma/Canva for text overlay, breaking the workflow.

### 3.6 Bulk Export for Meta Ads Manager

**Gap:** No bulk download of campaign images. No export in Meta-ready formats. No CSV/spreadsheet export of hook copy for bulk ad creation. No direct Meta API integration for ad upload.

- **Criticality:** 7/10. The last mile of the workflow -- getting creatives into Meta Ads Manager -- is manual. Bulk export reduces friction.
- **Difficulty:** 4/10. ZIP download of images is straightforward. CSV export of hooks + CTAs is trivial. Direct Meta API integration is complex but high-value.
- **Retention Impact:** 7/10. Export features make the platform a workflow tool rather than a creative toy.

### 3.7 Performance Analytics / Creative Scoring

**Gap:** No way to track which hooks/images performed best in-market. No creative scoring or prediction. No feedback loop from Meta ad performance data back into the platform.

- **Criticality:** 7/10. The creative-to-performance feedback loop is the holy grail for performance marketers. Without it, the platform generates creative in isolation.
- **Difficulty:** 8/10. Requires Meta Marketing API integration, data pipeline, and analytics UI. Significant scope.
- **Retention Impact:** 9/10. A performance feedback loop would make the platform indispensable. Marketers would return daily to check what's working and generate more of it.

### 3.8 Team Collaboration

**Gap:** Campaigns are tied to a single user ID. No sharing, commenting, approval workflows, or team workspaces.

- **Criticality:** 6/10. Many performance marketing teams have separate roles (strategist writes hooks, designer refines visuals, media buyer uploads). Without collaboration, only solo practitioners use the tool.
- **Difficulty:** 6/10. Requires permission system, sharing UI, and potentially real-time collaboration.
- **Retention Impact:** 7/10. Team features create organizational lock-in. Solo tools are easier to replace.

---

## 4. UX Friction Points

### 4.1 Landing Page: Prompt Format Clarity

The landing page asks "What would you like to create?" with placeholder text "Enter a website URL or describe your business..." and three examples: "nike.com - focus on sustainability," "Local bakery in Austin, artisan breads," "stripe.com - developer tools."

**Assessment:** The examples effectively communicate the input format. However, there is ambiguity about what the system will produce. A first-time user does not know they will get: research brief + hooks + art direction + 6 images. Adding a brief pipeline description (e.g., "We'll research your brand, write conversion hooks, and generate ad creatives") would set expectations. The connection status indicator (Connected/Disconnected) is visible but may cause anxiety ("why would it be disconnected?"). The WebSocket dependency for the submit button (disabled when disconnected) means the user cannot even queue a request during brief connection blips.

### 4.2 Generation Time

**Assessment:** The full pipeline (research + 6 hooks + 6 art prompts + 6 images) takes 2-5 minutes. This is significant wait time for a performance marketer who may want to generate creative for 5 clients in a session. The thinking block UI helps, but the total time is a potential friction point. Comparison: Canva Magic Design produces a single image in 5-10 seconds. AdCreative.ai generates multiple variants in under 60 seconds. The quality/specificity tradeoff is valid, but time-to-first-result matters.

**Mitigation ideas from existing architecture:** The session fork capability (`queryWithSessionFork` in ai-client.ts) exists but is not exposed in the UI. This could enable parallel campaign generation. The event buffer system already handles multiple concurrent sessions.

### 4.3 Image Quality

**Assessment:** fal.ai Nano Banana Pro (Gemini image model) produces good general-purpose images. The clay diorama prompts generate distinctive, scroll-stopping visuals. However, text rendering in images is unreliable (common AI image generation limitation). Typography-heavy ads (which many top-performing Meta ads are) will require manual post-processing. Resolution up to 4K is excellent for print, but Meta ads are typically served at lower resolutions, so 1K-2K is sufficient.

### 4.4 Output Format

**Assessment:** Images are saved as PNG/JPEG/WebP locally and served via a static file route. There is a "Save All" button in the UI (visible in ResultsView) but it does not appear to have download functionality implemented (it's a placeholder). Individual image download requires right-clicking. There is no way to export the full campaign (images + copy) as a deliverable package. For Meta upload, images need to be at specific dimensions (1080x1080 minimum for feed). The aspect ratio configuration exists (10 options in fal.ai), but the default is 1:1 and there's no multi-format generation (e.g., generate each hook in both 1:1 and 9:16 simultaneously).

### 4.5 Iteration Workflow

**Assessment:** The follow-up chat system works well for natural language iteration. Users can reference specific images using the image selection + chat mention pattern. However, there is no "regenerate this image" button on individual image cards. There is no side-by-side comparison of original vs. regenerated versions. The `replaceImage` function exists in the store but is not surfaced in the UI. A marketer's natural workflow is: see images -> identify weak ones -> regenerate specific images -> compare -> select winners. The current UI supports: see images -> write follow-up message -> wait for full pipeline -> see new images. The gap between these workflows is a significant friction point.

---

## 5. Technical Strengths

### 5.1 Architecturally Impressive

**Claude SDK Agent Orchestration.** The multi-agent architecture (orchestrator -> research agent + hook skill + art skill -> MCP tool) is genuinely sophisticated. Using Claude's native agent/skill system means the AI handles routing and error recovery internally. The `settingSources: ['user', 'project']` configuration auto-discovers agents and skills from the `.claude/` directory, making the system extensible without code changes.

**Event-Driven Real-Time Architecture.** The combination of WebSocket events, EventEmitter for MCP-to-WS bridging, sequential event IDs for replay, and in-memory event buffers creates a robust real-time pipeline. The separation of concerns (MCP server emits events -> WebSocket handler bridges -> client renders) is clean.

**Session Resilience.** Background generation continues on disconnect. Event replay on reconnect. SDK session resume for follow-ups. Graceful fallback from resume failure to fresh session. This is production-grade reliability.

**Database Design.** The SQLite schema with cascading deletes, WAL mode for concurrency, and structured tables (campaigns, files, images, messages, assets) is well-designed for the current scale. The `blocks` column on messages stores the thinking block structure for faithful reconstruction on page refresh.

### 5.2 Marketable Differentiators

**"Research-First Creative AI."** No other tool in the market mandates research traceability for every piece of ad copy. This is a genuine differentiator that can be marketed as: "Every hook traces back to your brand's actual data. No generic templates. No invented claims."

**"Editable Creative Pipeline."** The intermediate file system (research -> hooks -> prompts) gives users visibility and control that no competitor offers. This can be marketed as: "See exactly how your ads were created. Edit any step. Regenerate from any point."

**"Art Direction, Not Random Generation."** The detailed art style workflows with lighting signatures, camera specifications, composition rules, and texture hierarchies produce more intentional visuals than "generate an ad image" prompts. This can be marketed as: "Every image is directed, not random. Professional art direction meets AI generation."

### 5.3 Fragile or Needs Improvement

**Single Model Dependency.** The system uses `claude-haiku-4-5-20251001` for all orchestration and creative work. There is no model fallback, no cost optimization per task (e.g., cheaper model for research, better model for hooks), and no model version pinning strategy.

**Sequential Image Generation.** Images are generated one at a time with a 500ms delay. This means 6 images at 2K resolution could take 30-90 seconds just for the fal.ai calls, plus the SDK overhead. Parallel generation would significantly reduce total time.

**No Caching or Deduplication.** Generating for the same URL twice runs the entire pipeline again. There is no cache for research results, hook banks, or prompts. For a tool that charges per generation, this is fine; for a tool that wants to optimize user time, caching research for recently-analyzed URLs would help.

**MCP Session ID Mapping Complexity.** The `image-events.ts` module maintains a mapping between MCP tool session IDs (human-readable names the AI chooses) and WebSocket session IDs (UUIDs). This is fragile -- if the AI passes an unexpected session ID format, images may not route to the correct client. The deduplication logic (by filename) across EventEmitter and SDK stream fallback adds complexity.

**Authentication Gap.** Clerk integration exists but development mode falls back to anonymous. The WebSocket token verification and HTTP middleware are clean, but there's no rate limiting, no usage tracking, and no quota enforcement. For a production SaaS, these are prerequisites.

---

## Summary Rating Table

| Capability | Strength | Marketer Relevance |
|---|---|---|
| Research Extraction | 8 | 9 |
| Hook Generation | 9 | 10 |
| Art Direction | 8 | 7 |
| Image Generation | 7 | 7 |
| Real-Time Streaming | 8 | 7 |
| File Management | 7 | 8 |
| Asset Library | 7 | 8 |
| Follow-Up Refinements | 8 | 9 |
| Session Recovery | 8 | 6 |
| Campaign Management | 6 | 7 |

**Overall Platform Strength: 7.6/10**
**Overall Marketer Relevance: 7.8/10**

The platform has a strong foundation with a genuine differentiator in research-driven hook generation. The biggest gaps for performance marketers are: more visual style options (beyond clay), higher hook volume for testing, Meta ad format compliance, reliable text overlays, and bulk export. The architecture is extensible -- most gaps can be addressed by adding new workflow files, adjusting prompt parameters, or building lightweight UI features on top of existing server capabilities.
