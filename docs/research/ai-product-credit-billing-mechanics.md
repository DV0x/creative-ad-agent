# AI Product Credit & Billing Mechanics Research

**Date:** 2026-04-03
**Scope:** How 6 AI generation products handle credit/token deduction, failure recovery, and billing units

---

## Summary Table

| Product | Billing Unit | Deduction Timing | Failure Handling |
|---------|-------------|-----------------|------------------|
| Midjourney | GPU seconds (metered) | During generation (actual compute time) | Pre-processing failures: no charge. Mid-generation failures: unclear -- no documented per-job refund policy |
| ChatGPT Plus/Pro | Messages (rate-limited) | At send time (rolling window) | No public documentation on whether failed responses count |
| Jasper AI | Per seat (unlimited words) | N/A -- no per-generation billing | N/A -- unlimited usage with fair-use throttling |
| Runway ML | Credits per second (video) or per unit (images) | Upon completion (not before generation starts) | Auto-refund on generation error (within minutes); stuck generations auto-cancel in 1-2 hours with refund |
| Leonardo.ai | Tokens per generation | Upon completion (when images appear on screen) | API failures: tokens refunded. Web app failures: not explicitly documented |
| Replicate | Compute seconds (per-second billing) | Post-completion (deducted from prepaid balance or billed in arrears) | Public models: failed runs are NOT charged. Cancelled runs: charged for time used. Private models: failed AND cancelled runs are billed |

---

## 1. Midjourney

### Billing Unit
GPU time, measured in minutes/hours. One image prompt typically takes ~1 minute of GPU time. One video prompt takes ~8 minutes. Turbo mode consumes 2x fast time per image.

### When Credits Are Deducted
**During generation.** GPU time is metered from the moment processing starts to completion. Queue wait time is NOT counted -- only actual GPU compute time. This is fundamentally a metered-usage model, not a pre-deduction or post-deduction model. You can verify consumption by running `/info` before and after a generation to see the delta.

**Confidence: HIGH** -- This is directly stated in Midjourney's official documentation on GPU Speed modes.

### Failure Handling
- **Pre-processing failures** (command validation, prompt rejection, content moderation blocks): No GPU time consumed. The job never reaches GPU allocation.
- **Mid-generation failures** (server errors during processing): Midjourney does NOT have a documented per-job refund mechanism for GPU time consumed during failed generations. The `/info` command shows cumulative usage but there is no "credit back" system for individual failed jobs.
- **Refund policy**: Only available if total account usage is under 20 GPU minutes lifetime. This is a subscription refund, not a per-generation credit-back. Once purchased, extra Fast hours cannot be refunded.

### Key Details
- Fast hours do NOT roll over month-to-month
- Purchased extra Fast hours expire after 60 days
- Relax mode: unlimited, no time deduction, but slower generation
- The `/info` command shows remaining fast time as `X / Y` (current / monthly allotment)

### Gaps
No official documentation found on what happens to GPU time when a generation fails mid-process. Community reports suggest the time IS consumed. **Confidence: MEDIUM** on failure handling -- based on absence of refund documentation rather than explicit confirmation.

---

## 2. ChatGPT Plus / Pro

### Billing Unit
**Messages** within rolling time windows. This is NOT a credit/token system -- it is a rate limit on a flat subscription.

### Current Limits (as of early 2026)
- **ChatGPT Plus ($20/mo):** 150 GPT-4o messages per 3-hour rolling window. 100 o3 messages per week (Sunday UTC reset). 300 o4-mini messages daily (midnight UTC reset).
- **ChatGPT Pro ($200/mo):** Unlimited messages across all models, including exclusive models (o1 Pro mode).
- Each model has an **independent quota** -- using GPT-4o does not reduce o3 or o4-mini availability.

### When Messages Are Counted
**At send time.** Each message starts an individual timer. A message sent at 2:15 PM frees its slot at 5:15 PM (for 3-hour windows). This creates continuous rolling recovery, not fixed reset times.

**Confidence: HIGH** -- Multiple sources confirm the rolling window mechanism with per-message timestamps.

### What Counts as a "Message"
User-sent messages. Documentation consistently refers to user actions ("send messages"). AI responses do not appear to consume a separate message slot.

**Confidence: MEDIUM** -- OpenAI's documentation is deliberately vague about exact counting mechanics. The phrasing consistently refers to user sends, but OpenAI states limits "may vary based on system conditions."

### Failure Handling
**Not publicly documented.** OpenAI does not disclose whether a failed response (network error, server error, content filter block) counts against the message limit. The "Regenerate" button is available when responses fail, but whether regeneration costs a message slot is undisclosed.

### When Limits Are Hit
ChatGPT automatically downgrades to a smaller model (GPT-4.1 mini) and continues the conversation. Conversation history and context are preserved.

### Key Details
- OpenAI intentionally keeps rate limit mechanics opaque -- "no real numbers" publicly
- Limits can change dynamically based on system load
- Tool actions in the background also count toward limits (web browsing, code interpreter, etc.)

### Gaps
OpenAI provides no public specification on: (1) whether failed responses count, (2) whether tool invocations within a single response each count as separate messages, (3) exact mechanics of "dynamic" limit adjustment. **Confidence: LOW** on the precise counting implementation.

---

## 3. Jasper AI

### Billing Unit
**Per seat** (flat subscription). Jasper has transitioned to unlimited word generation on ALL plans.

### Current Pricing (2026)
- **Pro:** $59/mo ($49/mo annual) -- 1 seat, unlimited words, Jasper Art included
- **Business:** Custom pricing -- multiple seats, unlimited words, API access, SSO

### When Credits Are Deducted
**N/A -- no per-generation billing exists.** Jasper no longer uses word credits. All plans include unlimited text and image generation. There is no tracking of individual word counts or generation counts for billing purposes.

**Confidence: HIGH** -- Multiple sources confirm unlimited words across all plans, and Jasper's own pricing page shows per-seat billing only.

### Historical Context
Jasper previously used a word-credit system (e.g., 20,000 words/month on the Starter plan, with 5,000 additional words purchasable for $10). This system was retired when Jasper restructured to per-seat pricing with unlimited output. The exact date of transition is not precisely documented but appears to have occurred in 2024-2025.

### Failure Handling
**N/A.** Since there is no per-generation cost, failures have no billing impact. A failed generation simply means the user tries again.

### Fair Use Policy
Despite "unlimited" branding, Jasper maintains a Fair Use Policy:
- Specific numerical limits are NOT publicly disclosed
- Jasper states "95%+ of users fall well within the parameters"
- Exceeding limits can result in: throttling, access limitation, workspace lock + warning, or account suspension
- Parameters "may be listed elsewhere in other Documentation" (not in the public policy page)

### Gaps
The actual fair-use thresholds are opaque. It is impossible to determine from public documentation at what point throttling begins. Whether image generation (Jasper Art) has separate limits from text generation is also undisclosed. **Confidence: MEDIUM** on whether "unlimited" truly means unlimited for heavy users.

---

## 4. Runway ML

### Billing Unit
**Credits.** Purchased at $0.01 per credit. Credit costs vary by:
- **Model:** Gen4.5 (12 credits/sec), Gen4 Turbo (5 credits/sec), Veo 3.1 with audio (40 credits/sec)
- **Output type:** Video is per-second. Images are per-generation (e.g., Gen4 Image: 5 credits for 720p, 8 for 1080p). Audio varies (per character, per second, or flat rate)

### When Credits Are Deducted
**Upon generation completion.** Credits are NOT deducted before generation begins. Runway's help documentation explicitly states: "If a generation fails before you are charged credits, the credits are not deducted."

This means the system attempts generation first, and charges only upon successful completion.

**Confidence: HIGH** -- Directly from Runway's official help center articles on credit refunds and credit troubleshooting.

### Failure Handling
- **Generation error:** Credits automatically returned to account within a few minutes. Returned as "paid credits."
- **Stuck generation:** Automatically cancels after 1-2 hours and credits are refunded.
- **Successful but unwanted output:** Credits are consumed. "All generations in Credits Mode cost credits regardless of how they come out or if you choose to download the output."

### Credit Priority
Monthly plan credits are consumed before purchased credits.

### API vs. Web App
The API pricing page shows a different model for real-time features: "2 credits upfront, then 2 credits per 6 seconds" for avatar sessions. This is the only documented case of upfront deduction.

### Key Details
- Credits do NOT roll over month-to-month
- Enterprise credits can have different rollover terms (negotiable)

### Gaps
The exact moment of deduction within the generation lifecycle (at the moment of completion? when the video is available for download? during a post-processing step?) is not specified at sub-process level. **Confidence: MEDIUM** on the precise moment within the completion phase.

---

## 5. Leonardo.ai

### Billing Unit
**Tokens.** Token costs vary significantly by feature:
- Basic image generation (768x768): 1 token per image
- With Alchemy/PMv3: 16 tokens per image
- Full 3D Texture: 30 tokens per generation
- Upscale/Unzoom: 5 tokens each
- Multiple variations multiply the cost (4 images = ~4x single cost)

### When Tokens Are Deducted
**Upon completion.** Tokens are deducted "when images appear on your screen." The token cost is displayed on the generate button before you click it (so you know the cost beforehand), but the actual deduction occurs after the generation completes and results are delivered.

In Flow State mode, tokens are deducted as each batch of images appears (scrolling, "More Like This", or manual "Generate").

Viewing, sharing, or downloading previously generated images does NOT consume tokens.

**Confidence: MEDIUM** -- The "when images appear on screen" language comes from the Flow State documentation. Standard generation deduction timing is less explicitly documented.

### Failure Handling
- **API failures:** Tokens are refunded. Leonardo's documentation states: "If you got charged credits but your generations failed via API, the credits will get refunded back into your account."
- **Web app failures:** Not explicitly documented. No official statement found on whether web app generation failures result in automatic token refunds.

### Token Allocation
- **Free plan:** 150 tokens daily (reset every 24 hours)
- **Apprentice:** 8,500 tokens/month
- **Artisan:** 25,000 tokens/month
- **Maestro:** 60,000 tokens/month

### Key Details
- Paid plan tokens roll over for up to 3 months (lost on cancellation)
- Free plan tokens reset daily, no rollover
- Token cost varies dramatically by model and features (1 token to 30+ tokens per generation)

### Gaps
The web app failure refund policy is undocumented. Whether tokens are "reserved" during generation (preventing race conditions with concurrent generations) is unknown. Whether partial generations (e.g., 3 of 4 images succeed) result in partial charges is undocumented. **Confidence: LOW** on web app failure handling.

---

## 6. Replicate

### Billing Unit
**Compute time** (per second) for most models. Some LLMs use per-token pricing. The minimum billable unit is 1 second or 1 token.

### When Billing Occurs
**Post-completion.** Two billing models:
- **Prepaid:** Usage deducted from purchased credit balance as predictions complete. "We'll deduct your usage from your credit balance as you go."
- **Arrears:** Billed at the beginning of the following month for previous month's usage. Early charges may trigger when usage crosses certain thresholds for the first time.

There is NO pre-authorization or hold mechanism documented. Predictions that run slightly over a zero balance can occur ("In rare cases, a prediction may run over your credit balance").

**Confidence: HIGH** -- Directly from Replicate's official billing documentation.

### Failure Handling
**Differs by model type:**

| Scenario | Public/Official Models | Private Models & Deployments |
|----------|----------------------|------------------------------|
| Run succeeds | Charged for predict_time | Charged for instance uptime |
| Run fails | **NOT charged** | **Charged** (billed for active instance time) |
| Run cancelled by user | Charged for time used up to cancellation point | **Charged** (billed for active instance time) |
| Run aborted (never started) | No charge | No charge |

This is the most granular and clearly documented failure policy of all products researched.

**Confidence: HIGH** -- Directly from Replicate's billing documentation. The distinction between public and private model billing on failure is explicitly stated.

### The `predict_time` Metric
Every terminated prediction includes a `metrics.predict_time` field showing CPU/GPU seconds used. This excludes queue wait time and only counts active processing time.

### Key Details
- Public models: billed only for active processing time
- Private models/deployments: billed for ALL time instances are online (setup, idle, and active)
- When credit hits zero: new work is blocked, running infrastructure is shut down
- Auto-reload available: configurable threshold ($5 minimum) and reload amount ($15 minimum balance)

### Gaps
Whether the `predict_time` for a failed prediction is always exactly zero (or could be non-zero for a failure that occurs after some processing) is not explicitly documented. The documentation says "failed runs are not charged" for public models, but it is unclear whether a run that processes for 10 seconds then fails would have predict_time=10 but $0 charge. **Confidence: MEDIUM** on the interaction between predict_time and the no-charge-on-failure policy.

---

## Cross-Product Analysis

### Deduction Patterns

Three distinct patterns emerge:

1. **Metered during processing** (Midjourney): GPU time is counted in real-time as the generation runs. No discrete "charge" event -- it is continuous accumulation.

2. **Deduct on completion** (Runway, Leonardo.ai, Replicate): The system attempts the generation first, then charges upon success. Failures result in no charge or automatic refunds.

3. **Rate limiting, not billing** (ChatGPT, Jasper): No per-generation charge. Usage is capped by message counts (ChatGPT) or fair-use policy (Jasper) on flat subscriptions.

### Failure Recovery Patterns

| Pattern | Products | User Impact |
|---------|----------|-------------|
| Auto-refund on failure | Runway, Leonardo (API), Replicate (public models) | Low friction -- credits return automatically |
| No charge on failure | Replicate (public models) | Zero friction -- never deducted in the first place |
| Charged on failure | Replicate (private models), Midjourney (likely) | Higher friction -- user absorbs failed generation cost |
| No per-generation cost | ChatGPT, Jasper | Failures have no billing impact |

### Implications for Building a Credit System

If designing a credit/billing system for an AI generation product:

1. **Deduct-on-completion is the most user-friendly pattern** for variable-cost generation tasks. Runway and Leonardo demonstrate this -- the user is never in a state where they paid but received nothing.

2. **Pre-deduction with refund** is an alternative but requires building refund infrastructure and creates a worse user experience (seeing credits drop then return).

3. **The Replicate model is most transparent** for developers: clear rules per model type, explicit predict_time metric, and unambiguous failure handling.

4. **Metered billing (Midjourney) works for subscription models** where the billing unit is time, not discrete outputs. This avoids the question of "what counts as a generation" but makes cost less predictable per output.

5. **Fair-use unlimited (Jasper) works when marginal cost is low** and the product charges enough per seat to absorb heavy usage. Requires backend monitoring and throttling infrastructure.

---

## Gaps & Uncertainties

### What I Could NOT Verify
1. **Midjourney mid-generation failure handling**: No official documentation found on whether GPU time consumed during a generation that fails mid-process is deducted or reversed. Community sentiment suggests it IS consumed, but no authoritative source confirms this.

2. **ChatGPT failed response counting**: OpenAI deliberately keeps rate limit mechanics opaque. Whether a server error counts against the message limit is unknown.

3. **Leonardo.ai web app failure refund**: Only API failure refunds are documented. The web app may or may not have the same automatic refund behavior.

4. **Jasper fair-use numerical limits**: The actual thresholds for throttling are not public. Impossible to determine at what volume "unlimited" stops being unlimited.

5. **Replicate predict_time on failed runs**: Whether a prediction that processes for N seconds before failing reports predict_time=N or predict_time=0 is not explicitly documented, though the "not charged" policy for public models is clear regardless.

6. **Runway exact deduction moment**: Whether credits are deducted at the instant of completion or during a brief post-processing window is not documented at sub-process level.

### What Would Change These Findings
- Midjourney launching a credit-back system for failed generations (currently absent)
- OpenAI publishing detailed rate limit mechanics (currently opaque)
- Jasper introducing usage-based pricing or metering (currently seat-only)
- Runway or Leonardo.ai changing from post-completion to pre-deduction (currently post-completion)

---

## Sources

### Midjourney
- [GPU Speed (Fast, Relax, Turbo) -- Midjourney Docs](https://docs.midjourney.com/hc/en-us/articles/32016412137741-GPU-Speed-Fast-Relax-Turbo) -- Primary, current
- [Info Command -- Midjourney Docs](https://docs.midjourney.com/hc/en-us/articles/32084927086861-Info-Command) -- Primary, current
- [Subscription Fast Time Expiration -- Midjourney Docs](https://docs.midjourney.com/hc/en-us/articles/27870521824653-Subscription-Fast-Time-Expiration) -- Primary, current
- [Requesting a Refund -- Midjourney Docs](https://docs.midjourney.com/hc/en-us/articles/25386088618253-Requesting-a-Refund) -- Primary, current
- [Purchasing Extra Fast Time -- Midjourney Docs](https://docs.midjourney.com/hc/en-us/articles/33570952624141-Purchasing-Extra-Fast-Time) -- Primary, current

### ChatGPT
- [ChatGPT Plus Usage Limits 2026 -- LaoZhang AI Blog](https://blog.laozhang.ai/en/posts/chatgpt-plus-usage-limits) -- Secondary, current (Jan 2026), detailed rolling window analysis
- [ChatGPT Plus Limits 2026 -- GLBGPT](https://www.glbgpt.com/hub/chatgpt-plus-limits-explained-what-users-need-to-know-in-2025/) -- Secondary, current
- [ChatGPT Pricing Guide 2026 -- Fello AI](https://felloai.com/chatgpt-pricing-guide-free-go-plus-pro-alternatives-october-2025/) -- Secondary, current
- [What is ChatGPT Plus -- OpenAI Help Center](https://help.openai.com/en/articles/6950777-what-is-chatgpt-plus) -- Primary, current

### Jasper AI
- [Plans & Pricing -- Jasper](https://www.jasper.ai/pricing) -- Primary, current
- [Fair Use Policy -- Jasper Help Center](https://help.jasper.ai/hc/en-us/articles/18618630845339-Fair-Use-Policy) -- Primary, current
- [Usage Policies -- Jasper](https://www.jasper.ai/legal/usage-policies) -- Primary, current
- [Jasper AI Pricing 2026 -- BloggingLift](https://blogginglift.com/jasper-ai-pricing/) -- Secondary, current

### Runway ML
- [How Do Credits Work -- Runway Help](https://help.runwayml.com/hc/en-us/articles/15124877443219-How-do-credits-work) -- Primary, current
- [Can I Have Credits Refunded -- Runway Help](https://help.runwayml.com/hc/en-us/articles/34266159290003-Can-I-have-credits-refunded) -- Primary, current
- [API Pricing & Costs -- Runway Dev Docs](https://docs.dev.runwayml.com/guides/pricing/) -- Primary, current
- [How to Troubleshoot Credit Discrepancy -- Runway Help](https://help.runwayml.com/hc/en-us/articles/26116703542803-How-to-troubleshoot-a-credit-discrepancy) -- Primary, current

### Leonardo.ai
- [Token Usage -- Leonardo.ai Help Center](https://intercom.help/leonardo-ai/en/articles/8044033-token-usage) -- Primary, current
- [Tokens FAQ -- Leonardo.ai Help Center](https://intercom.help/leonardo-ai/en/articles/9044700-tokens-faq) -- Primary, current
- [Flow State -- Leonardo.ai Help Center](https://intercom.help/leonardo-ai/en/articles/10002805-flow-state) -- Primary, current
- [Refund Policy -- Leonardo.ai](https://leonardo.ai/refund-policy/) -- Primary, current
- [Leonardo.ai Pricing](https://leonardo.ai/pricing) -- Primary, current

### Replicate
- [Billing -- Replicate Docs](https://replicate.com/docs/topics/billing) -- Primary, current
- [Prepaid Credit -- Replicate Docs](https://replicate.com/docs/topics/billing/prepaid-credit) -- Primary, current
- [Prediction Lifecycle -- Replicate Docs](https://replicate.com/docs/topics/predictions/lifecycle) -- Primary, current
- [Pricing -- Replicate](https://replicate.com/pricing) -- Primary, current
