# Hyperlocal — the additional probes that activate at city depth

You opened this file because the locale depth dial in `SKILL.md` reached city-level or tighter — a single city, a sub-city geography, or a specific cultural cluster within a city. At this depth, two additional probes activate that do not fire for broader briefs. They are subtle and easy to get wrong; read this file before issuing the first probe.

## Contents

- Locking the locale depth — detection and disambiguation
- Probe 1: Locale notes (register + anchors)
- Probe 2: Sub-segments within the locale
- Surface classes — what is reachable, what is not
- When the locale is too small even for the niche
- Where the outputs land in `research.md`

---

## Locking the locale depth — detection and disambiguation

The depth isn't told to you; you infer it. Read three signals, not one:

- **The founder's brief.** *"Target [city] market"* reads hyperlocal. *"Target India"* reads national, even if the brand is based in one city.
- **The brand's footprint.** A single physical location strongly suggests hyperlocal even when the founder says broader. A multi-city chain pulls toward regional.
- **The reviews' geographic clustering.** Where do the brand's existing customers self-identify from in their reviews? When the answer is one city, the *real* customer base is hyperlocal regardless of stated ambition.

When the signals conflict (founder says broader, brand has one location, reviews cluster locally), name the conflict in `research.md` §3 and reason under the most defensible interpretation. The strategist will resolve.

Hyperlocal briefs are also often ambiguous *within* the locale. *"Target [city]"* could mean an IT-corridor professional cohort, the historic-city resident cohort, a regional cultural cohort, or a diaspora cohort — each a different audience with different language, references, and values. When sub-segment is unclear, surface the ambiguity in the file. The orchestrator may resolve at intake; if not, the strategist will.

---

## Probe 1: Locale notes (register + anchors)

### What it surfaces

The locale's *texture* — combined into one short subsection (§3a), not two. Two threads, ~1-2 paragraphs each:

- **Language register.** Which language(s) the audience uses online, the typical code-switching mix when relevant (local-script with English nouns, vs the inverse), and any address forms or recurring fillers that mark the register (*"bro," "anna," "sir," "uncle," "garu"*). The downstream hook writer needs the texture, not an exhaustive analysis. One sentence or two on the register; one short illustrative quote with attribution; flag the unreachable buyer-comment layer as a gap. **Resist the urge to write a code-switching essay** — half a dozen lines is plenty.

- **Cultural anchors.** The 2-3 landmarks, foods, roads, or seasonal markers a local would immediately recognise. Not a guidebook — the strategist needs the *of-this-place* texture, not a list of every monument. List anchors with surface attribution. Avoid pattern-matching from training: every anchor must trace to an actual search result.

This subsection is for *context*, not for the downstream creatives to mine. It lets the strategist judge whether a campaign should sound *of this place* and what *of-this-place* sounds and looks like. **Do not turn §3a into a 30-line enumeration.** A short paragraph for each thread, plus one or two illustrative quotes, is the right length.

### What surfaces carry it

Local-language creator channels in the brand's vertical (descriptions, transcripts) carry the register. Business listings, local press, food blogs, and category Q&A carry the anchors. Most surfaces carry *some* of this — the breadth of available surfaces is the strength.

### What surfaces do NOT carry it

OTA review forms, business listings, formal aggregator reviews push toward English even when the buyer's natural register is something else. Probing formal surfaces for casual register either returns nothing or invites the model to extrapolate from training to fill the silence.

### How to probe

Frame the queries at *what register creators and audiences use when discussing this category in this locale* (for register) and *what locale-specific markers people reference when describing where they want to live, buy, or go* (for anchors). Use the search backend's `language` parameter where relevant. Cap result counts. Quote with attribution read from `search_results`, not from prose.

### What to expect honestly

Creator-side register material is reachable. **Actual buyer comments on those videos and posts are often unreachable** — comment threads render after page load and don't reliably expose to indexers. The model may try to extrapolate *"likely buyer comment patterns"* from creator register; **resist this** — fabricated buyer comments dressed as verbatim are the worst slop you can ship. Anchors are usually broadly distributed; the risk is the opposite — the model generalising too quickly from training rather than from surfaced content. Stay honest about what is *actually surfaced* versus what is general knowledge the model might pattern-match.

---

## Probe 2: Sub-segments within the locale

### What it surfaces

Within most hyperlocal target locales, there are multiple sub-segments — and they are different audiences. The IT-corridor professional cohort. The historic-city resident cohort. The regional-pride cohort. The diaspora cohort. Each has different language, references, and values. The strategist needs to know which sub-segment the brand is actually pitching to before writing The Bet — and "the city" as a single audience is almost always the wrong frame.

### What surfaces carry it

Self-identifications in forum posts, Q&A answers, and creator comments — where they're reachable. Demographic and cultural commentary in local press. Sub-segment-specific creator channels and content (diaspora-targeted vs in-market regional content often exist as different channels with different registers).

### How to probe

Frame the query as *what recognisable sub-segments exist within this locale's target population for this category, and how do they self-identify.* Look for self-IDs and demographic markers. **Resist conflating sub-segments** — if the founder said *"target [city]"* and you found three distinct sub-segments, surface all three with their distinguishing markers and let the strategist (or the orchestrator at intake) decide which one the brand is actually pitching to.

### What to expect honestly

Sub-culture material is reachable but variable in depth. For locales with active self-identifying communities online — urban metros, diaspora clusters — the signal is dense. For smaller towns and less-online cultural groups, sub-segments may not have strong written self-identification online; surface the gap and let the strategist work from broader demographic signals.

---

## Surface classes — what is reachable, what is not

Empirically, here is the realistic picture for hyperlocal probes:

| Surface class | Reachable? | What it carries |
|---|---|---|
| Local-language YouTube creator content (descriptions, transcripts) | Yes | Register, anchors, expert framing |
| Forum and Q&A posts with locale tags | When content exists | Category voice, sub-segment self-IDs |
| Local press and advisory blogs | Yes | Expert register, anchors |
| Business listings, retailer pages, real-estate aggregators | Yes (for anchors) | Address landmarks, agent descriptions |
| Facebook public group posts | Partly | Sub-segment voice when reachable |
| YouTube comment threads | Often **NOT** | Would carry buyer voice; render post-page-load |
| Reddit | **NOT** | Structurally blocked at user-agent level |
| WhatsApp / closed groups | **NOT** | Closed by design |

Plan probes against the reachable surfaces; name the unreachable ones in your gap-naming. Never pretend the unreachable surfaces returned content.

---

## When the locale is too small even for the niche

For very small towns or narrow cultural clusters, even category-level signal may be thin *within the exact locale*. The honest move is to **widen geographically** — probe the next-larger adjacent city or region for the same vertical, mark the widening explicitly in the file, and surface what you find. *"Locale-exact register content is thin; broader regional creator content carries the register and is included as adjacent signal."* The strategist knows the difference between exact-locale and adjacent-locale evidence and weights accordingly.

Do not widen so far that you are researching a different cultural cluster entirely. Adjacent within the same regional-language zone is fine; jumping to a different language region is not. When in doubt, surface less and name the gap; do not stretch the locale to manufacture richness.

---

## Where the outputs land in `research.md`

The two probes feed §3 of `research.md` (*The locale*). Extend §3 with two subsections:

- **`3a. Locale notes`** — register + anchors, in one short subsection (a paragraph or two; not a 30-line enumeration). Attributed evidence, honest gap-naming where signal is thin.
- **`3b. Sub-segments`** — one short paragraph per identified sub-segment, with its distinguishing markers. Three is plenty; cap at five.

The probes also feed back into the other sections of the file. When you surface a cultural anchor in §3a and the brand's website ignores it, note the absence in §1's *claim vs reality* section as part of the gap. When the locale's register diverges from the brand's stated voice, note the divergence in §5's *brand identity* judgment. Make the cross-references visible; the strategist reads the whole file and benefits when the threads tie together.
