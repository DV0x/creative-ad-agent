# Floor-grader baseline — 2026-05-15

First-generation shippability rubric, 6 binary checks per campaign.
See `axial-coding-SYNTHESIS.md` for rubric definitions.

**Caveat:** `campaign_files` only stores latest state (overwritten on follow-ups).
Campaigns with `followups > 0` may show iterated content for hooks/research/prompts.
Images use `version=1` so reflect true first-gen output.

## Summary

**Overall floor pass rate:** 4/18 = **22%**

| Check | Pass / Total | Rate |
|---|---|---|
| F1 — Right brand | 15/18 | 83% |
| F2 — Right locale | 15/18 | 83% |
| F3 — No fabrication | 10/18 | 56% |
| F4 — Hook in image | 13/18 | 72% |
| F5 — Refs deployed | 15/18 | 83% |
| F6 — Action CTA | 10/18 | 56% |

## Per-campaign results

| Env | Campaign | Followups | F1 | F2 | F3 | F4 | F5 | F6 | All |
|---|---|---|---|---|---|---|---|---|---|
| prod | `mn3egfu1pjxp5r` Ravilagrandhotel | 0 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | **PASS** |
| prod | `mn4fy5gosonhqt` Verbisedu | 1 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | **PASS** |
| prod | `mn7az22inyrf68` Verbisedu | 7 | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | fail |
| prod | `mniw0gw4pqn6xu` Traya | 0 | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ | fail |
| prod | `mp2lfp269caapa` Twt-2 — @ @ create two awesome ads f | 5 | ✓ | ✗ | ✗ | ✗ | ✗ | ✓ | fail |
| prod | `mp2v002v6n7lb4` Creat — @ @ create a conversion camp | 2 | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | fail |
| prod | `mp3q9e5n9d2f81` Opti — @ @ create two ads for .in/ | 5 | ✓ | ✓ | ✗ | ✓ | ✓ | ✗ | fail |
| prod | `mp40awylzb2gch` Thewholetruthfoods Ads | 0 | ✓ | ✗ | ✗ | ✓ | ✓ | ✗ | fail |
| staging | `mn308y6w6e43dw` Bewakoof | 2 | ✓ | ✓ | ✗ | ✓ | ✓ | ✓ | fail |
| staging | `mn4ogmsbujom9y` Mamaearth | 4 | ✗ | ✓ | ✓ | ✗ | ✓ | ✗ | fail |
| staging | `mn9ulfufiarpro` Theratefinder | 9 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | **PASS** |
| staging | `mnjwlnnlelx5wf` Dailyobjects Ads | 4 | ✓ | ✓ | ✗ | ✗ | ✓ | ✗ | fail |
| staging | `mnka70u46w19q8` Gonoise — In photorealistic style for | 6 | ✓ | ✓ | ✓ | ✗ | ✓ | ✓ | fail |
| staging | `molat687fo6wad` Guardian — Collections/whey-protein | 1 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | **PASS** |
| staging | `moldlidaxv97ly` Theratefinder Ads | 0 | ✓ | ✓ | ✗ | ✓ | ✓ | ✓ | fail |
| staging | `moo0j70x7xapvv` Arjuninfra Ads | 0 | ✗ | ✗ | ✗ | ✓ | ✓ | ✗ | fail |
| staging | `mosi22bwouky66` Twt-1 — @ @ create 2 ads for for w | 10 | ✓ | ✓ | ✗ | ✓ | ✓ | ✗ | fail |
| staging | `mp3zdim0g07tlu` Creat — @ @ create two ads for .in/ | 2 | ✓ | ✓ | ✓ | ✓ | ✗ | ✓ | fail |

## Per-campaign detail

### PROD — `campaign_mn3egfu1pjxp5r` — Ravilagrandhotel

- followups: 0 · research: ✓ · hooks: ✓ · images: 2
- **F1 Right brand:** ✓ — match: ravilagrandhotel.in
- **F2 Right locale:** ✓ — IN locale, no USD leak
- **F3 No fabrication:** ✓ — 5 nums all traced
- **F4 Hook in image:** ✓ — 1/2 images have hook content
- **F5 Refs deployed:** ✓ — no refs uploaded (skipped)
- **F6 Action CTA:** ✓ — 5/6 action, 1 soft

### PROD — `campaign_mn4fy5gosonhqt` — Verbisedu

- followups: 1 · research: ✓ · hooks: ✓ · images: 1
- **F1 Right brand:** ✓ — match: verbisedu.com
- **F2 Right locale:** ✓ — IN locale, no USD leak
- **F3 No fabrication:** ✓ — no numbers in hooks (skipped)
- **F4 Hook in image:** ✓ — 1/1 images have hook content
- **F5 Refs deployed:** ✓ — no refs uploaded (skipped)
- **F6 Action CTA:** ✓ — 6 CTAs all action-shaped

### PROD — `campaign_mn7az22inyrf68` — Verbisedu

- followups: 7 · research: ✓ · hooks: ✓ · images: 4
- **F1 Right brand:** ✓ — match: verbisedu.com
- **F2 Right locale:** ✓ — IN locale, no USD leak
- **F3 No fabrication:** ✓ — 2 nums all traced
- **F4 Hook in image:** ✓ — 1/1 images have hook content
- **F5 Refs deployed:** ✓ — no refs uploaded (skipped)
- **F6 Action CTA:** ✗ — no CTAs detectable

### PROD — `campaign_mniw0gw4pqn6xu` — Traya

- followups: 0 · research: ✓ · hooks: ✓ · images: 2
- **F1 Right brand:** ✗ — no research URL found
- **F2 Right locale:** ✓ — IN locale, no USD leak
- **F3 No fabrication:** ✓ — 2 nums all traced
- **F4 Hook in image:** ✓ — 1/2 images have hook content
- **F5 Refs deployed:** ✓ — no refs uploaded (skipped)
- **F6 Action CTA:** ✓ — 4/6 action, 2 soft

### PROD — `campaign_mp2lfp269caapa` — Twt-2 — @  @  create two awesome ads for this

- followups: 5 · research: ✓ · hooks: ✓ · images: 4
- **F1 Right brand:** ✓ — match: thewholetruthfoods.com
- **F2 Right locale:** ✗ — USD in hooks for IN brand
- **F3 No fabrication:** ✗ — untraced: 50k
- **F4 Hook in image:** ✗ — no prompts
- **F5 Refs deployed:** ✗ — 1 refs uploaded, 0/4 prompts use them
- **F6 Action CTA:** ✓ — 4/6 action, 2 soft

### PROD — `campaign_mp2v002v6n7lb4` — Creat — @  @  create a conversion campaign with

- followups: 2 · research: ✓ · hooks: ✓ · images: 7
- **F1 Right brand:** ✓ — match: optimumnutrition.co.in
- **F2 Right locale:** ✓ — IN locale, no USD leak
- **F3 No fabrication:** ✓ — 4 nums all traced
- **F4 Hook in image:** ✗ — 6/7 images stripped of hook content
- **F5 Refs deployed:** ✗ — 2 refs, only 1/7 prompts use them
- **F6 Action CTA:** ✗ — 1/2 soft CTAs (e.g. "See your options")

### PROD — `campaign_mp3q9e5n9d2f81` — Opti — @  @  create two ads for  .in/

- followups: 5 · research: ✓ · hooks: ✓ · images: 2
- **F1 Right brand:** ✓ — match: optimumnutrition.co.in
- **F2 Right locale:** ✓ — IN locale, no USD leak
- **F3 No fabrication:** ✗ — untraced: 100, 100%, 0%
- **F4 Hook in image:** ✓ — 1/2 images have hook content
- **F5 Refs deployed:** ✓ — no refs uploaded (skipped)
- **F6 Action CTA:** ✗ — no CTAs detectable

### PROD — `campaign_mp40awylzb2gch` — Thewholetruthfoods Ads

- followups: 0 · research: ✓ · hooks: ✓ · images: 2
- **F1 Right brand:** ✓ — match: thewholetruthfoods.com
- **F2 Right locale:** ✗ — USD in hooks for IN brand
- **F3 No fabrication:** ✗ — untraced: 6m, 50k
- **F4 Hook in image:** ✓ — 2/2 images have hook content
- **F5 Refs deployed:** ✓ — no refs uploaded (skipped)
- **F6 Action CTA:** ✗ — no CTAs detectable

### STAGING — `campaign_mn308y6w6e43dw` — Bewakoof

- followups: 2 · research: ✓ · hooks: ✓ · images: 4
- **F1 Right brand:** ✓ — match: bewakoof.com
- **F2 Right locale:** ✓ — IN locale, no USD leak
- **F3 No fabrication:** ✗ — untraced: 1000
- **F4 Hook in image:** ✓ — 4/4 images have hook content
- **F5 Refs deployed:** ✓ — no refs uploaded (skipped)
- **F6 Action CTA:** ✓ — 4/6 action, 2 soft

### STAGING — `campaign_mn4ogmsbujom9y` — Mamaearth

- followups: 4 · research: ✓ · hooks: ✓ · images: 1
- **F1 Right brand:** ✗ — MISMATCH: user=mamaearth.in research=mamaearth.com
- **F2 Right locale:** ✓ — locale unknown (skipped)
- **F3 No fabrication:** ✓ — no numbers in hooks (skipped)
- **F4 Hook in image:** ✗ — 1/1 images stripped of hook content
- **F5 Refs deployed:** ✓ — no refs uploaded (skipped)
- **F6 Action CTA:** ✗ — 1/1 soft CTAs (e.g. "Explore the collection")

### STAGING — `campaign_mn9ulfufiarpro` — Theratefinder

- followups: 9 · research: ✓ · hooks: ✓ · images: 6
- **F1 Right brand:** ✓ — match: theratefinder.ca
- **F2 Right locale:** ✓ — CA locale, no INR leak
- **F3 No fabrication:** ✓ — 4 nums all traced
- **F4 Hook in image:** ✓ — 6/6 images have hook content
- **F5 Refs deployed:** ✓ — no refs uploaded (skipped)
- **F6 Action CTA:** ✓ — 4/6 action, 2 soft

### STAGING — `campaign_mnjwlnnlelx5wf` — Dailyobjects Ads

- followups: 4 · research: ✓ · hooks: ✓ · images: 8
- **F1 Right brand:** ✓ — match: dailyobjects.com
- **F2 Right locale:** ✓ — locale unknown (skipped)
- **F3 No fabrication:** ✗ — untraced: 1,000, $1,000
- **F4 Hook in image:** ✗ — 6/6 images stripped of hook content
- **F5 Refs deployed:** ✓ — no refs uploaded (skipped)
- **F6 Action CTA:** ✗ — no CTAs detectable

### STAGING — `campaign_mnka70u46w19q8` — Gonoise — In photorealistic style for   targeting

- followups: 6 · research: ✓ · hooks: ✓ · images: 7
- **F1 Right brand:** ✓ — match: gonoise.com
- **F2 Right locale:** ✓ — IN locale, no USD leak
- **F3 No fabrication:** ✓ — 3 nums all traced
- **F4 Hook in image:** ✗ — 3/5 images stripped of hook content
- **F5 Refs deployed:** ✓ — no refs uploaded (skipped)
- **F6 Action CTA:** ✓ — 4/6 action, 2 soft

### STAGING — `campaign_molat687fo6wad` — Guardian — Collections/whey-protein

- followups: 1 · research: ✓ · hooks: ✓ · images: 7
- **F1 Right brand:** ✓ — match: guardian.in
- **F2 Right locale:** ✓ — IN locale, no USD leak
- **F3 No fabrication:** ✓ — 4 nums all traced
- **F4 Hook in image:** ✓ — 2/2 images have hook content
- **F5 Refs deployed:** ✓ — no refs uploaded (skipped)
- **F6 Action CTA:** ✓ — 4/6 action, 2 soft

### STAGING — `campaign_moldlidaxv97ly` — Theratefinder Ads

- followups: 0 · research: ✓ · hooks: ✓ · images: 1
- **F1 Right brand:** ✓ — match: theratefinder.ca
- **F2 Right locale:** ✓ — CA locale, no INR leak
- **F3 No fabrication:** ✗ — untraced: 16,000
- **F4 Hook in image:** ✓ — 1/1 images have hook content
- **F5 Refs deployed:** ✓ — no refs uploaded (skipped)
- **F6 Action CTA:** ✓ — 2/3 action, 1 soft

### STAGING — `campaign_moo0j70x7xapvv` — Arjuninfra Ads

- followups: 0 · research: ✓ · hooks: ✗ · images: 2
- **F1 Right brand:** ✗ — no research URL found
- **F2 Right locale:** ✗ — missing research/hooks
- **F3 No fabrication:** ✗ — missing research/hooks
- **F4 Hook in image:** ✓ — 2/2 images have hook content
- **F5 Refs deployed:** ✓ — no refs uploaded (skipped)
- **F6 Action CTA:** ✗ — no CTAs detectable

### STAGING — `campaign_mosi22bwouky66` — Twt-1 — @  @  create 2 ads for   for whey

- followups: 10 · research: ✓ · hooks: ✓ · images: 4
- **F1 Right brand:** ✓ — match: thewholetruthfoods.com
- **F2 Right locale:** ✓ — IN locale, no USD leak
- **F3 No fabrication:** ✗ — untraced: 000000, 50k
- **F4 Hook in image:** ✓ — 4/4 images have hook content
- **F5 Refs deployed:** ✓ — no refs uploaded (skipped)
- **F6 Action CTA:** ✗ — 2/3 soft CTAs (e.g. "See the truth")

### STAGING — `campaign_mp3zdim0g07tlu` — Creat — @  @  create two ads for  .in/

- followups: 2 · research: ✓ · hooks: ✓ · images: 2
- **F1 Right brand:** ✓ — match: optimumnutrition.co.in
- **F2 Right locale:** ✓ — IN locale, no USD leak
- **F3 No fabrication:** ✓ — 5 nums all traced
- **F4 Hook in image:** ✓ — 1/2 images have hook content
- **F5 Refs deployed:** ✗ — 1 refs uploaded, 0/2 prompts use them
- **F6 Action CTA:** ✓ — 5/6 action, 1 soft
