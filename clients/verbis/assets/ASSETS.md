# Verbis — Asset inventory

_Harvested from the live workshop page 2026-07-01. Stored in `from-website/`._

## What we have (real, usable)
| Asset | File | Notes / usability |
|---|---|---|
| **Trainer photo** | `from-website/trainer/parth-trainer.jpg` | Parthasarathy, navy bandhgala, smiling, warm event bokeh bg. Croppable to a cut-out for poster track. ~900px — fine for feed, get higher-res if we scale. |
| **Real PTE score cards ×4** | `from-website/scorecards/full-*.png` | Genuine Pearson reports, names/IDs redacted, candidate photos visible. **Our #1 proof asset.** ~1080px, clean. |
| **Score cards — FACE-REDACTED** | `scorecards-redacted/card-*.png` | Same 4 cards with the candidate photo black-boxed (merges w/ existing name redaction → reads as a real, privacy-protected report). **These are the ad-safe versions — use these, not `from-website/scorecards/`.** |
| ~~Student testimonial stills~~ | `from-website/video-posters/*` | ❌ **DO NOT USE — contain student faces** (client rule: no student faces in ads). Kept for reference only. |
| **Google reviews** | `google-reviews.md` | 4.9★ / 492 reviews + best quotes (incl. a PTE review naming Partha). Recreate as on-brand cards. |
| **Logo — REAL, transparent** | `logo/verbis-logo-horizontal.png` (1800×806), `logo/verbis-logo-stacked.png` (1400×1755) | The real 4-tile gold/teal mark + "VERBIS EDU · STUDY-SETTLE-INVEST ABROAD". Rasterised transparent from the site SVGs. **Composite this in — never let AI draw the wordmark.** |
| **Google review badge — REAL** | `google-badge.png` (900×252), real 4-colour G at `logo/google-g.png` | Rebuilt to match the site's inline badge (real Google "G" + 4.9 ★★★★★ + "491 Google reviews"). **Use on every review creative; composite, don't AI-draw.** |

## Brand system (from `workshop-tokens.css`)
- **Gold/amber (primary accent):** `#FBBD29` · light `#FCD56A` · soft `#FEF3D6` · dark `#E0A50F`
- **Deep teal (dark grounds):** `#1A6475` · `#0E4852` · `#092F37` · `#061E23` · green-teal `#1F8866`
- **Warm cream (backgrounds):** `#F9F7F3` · `#F7F5F0` · `#F5F0EA`
- **Ink:** `#1A1A1A` · **Red accent (urgency):** `#C2362F`
- **Font:** **Exo 2** (geometric sans)
> Palette = **gold + deep teal + warm cream**. This is our edge: the competitor feed is a sea of navy/blue (Leap, Rahul, Yocket). Gold-on-teal stands apart. Do NOT use Pearson's magenta/teal (that's only on the score cards).

## 🔑 Creative discovery — the score cards prove our hook
The real reports show students with **sub-79 individual skills but high overall scores** — this is *true, specific proof* for the "it's the format, not your English" reframe:
| Student | Reading | Overall | The story |
|---|---|---|---|
| full-aarti | **65** | **83** | Scored 65 in Reading — still walked out with 83 overall. |
| full-nidhi | **78** | **90** | 78 in Reading (below 79!) — yet a perfect **90** overall. |
| full-rahul | 88 | **90** | Perfect 90. |
| full-first | 84 | **90** | Perfect 90. |

**Use these real numbers instead of any invented story.** "She scored 65 in Reading and still hit 83 — that's not luck, that's the system" is honest, concrete, and unbeatable. No fabrication.

## Rules & gaps
- 🚫 **No student faces in any ad** (client rule). Score-card faces redacted ✅; testimonial stills dropped.
- ⏳ **Client is sending a clean cut-out photo of Parthasarathy** (transparent/plain bg) → needed for the poster/face track (A1/A2/A3/B2). Web-res `parth-trainer.jpg` is a fallback only.
- Optional: higher-res score-card originals if these compress badly at render.
- ✅ Google reviews captured (no screenshot dependency — we rebuild on-brand).
