#!/usr/bin/env python3
"""S125 round 2: are the classic DR static formats still working in 2026,
and what does current winning creative actually look like? 6 queries,
tighter recency. Same sonar-pro/high-context settings as round 1."""

import json, os, sys, time
import urllib.request
from concurrent.futures import ThreadPoolExecutor

OUTDIR = os.path.dirname(os.path.abspath(__file__))

key = None
envpath = os.path.join(OUTDIR, "..", "..", "..", ".env.local")
with open(envpath) as f:
    for line in f:
        line = line.strip()
        if line.startswith("PERPLEXITY_API_KEY"):
            key = line.split("=", 1)[1].strip().strip('"').strip("'")
if not key:
    sys.exit("PERPLEXITY_API_KEY not found in .env.local")

SYSTEM_PROMPT = """You are a web-research retrieval assistant working for a performance-marketing analyst.
Answer the question using only current web sources you actually retrieve. Follow these rules without exception:
1. SUBJECT-BINDING: Preserve the exact subject of every fact and number. NEVER attach a number or claim to a different entity than the source does.
2. ATTRIBUTION: Attribute every fact/claim to its source and include the publication date as shown.
3. VERBATIM VOICE: Quote real practitioner language as it actually appears; do not smooth or paraphrase it.
4. UNCERTAINTY: If sources disagree, or a claim is dated or uncertain, say so plainly rather than silently picking one.
5. NO GAP-FILLING: If you cannot find something, say you could not find it. Never estimate or fabricate to fill a silence.
Be thorough and concrete. Prefer named practitioners, named agencies, named tools, real numbers, and direct quotes over generic summaries. Distinguish clearly between evidence from 2026, 2025, and older."""

QUERIES = [
    {
        "slug": "r2-q1-formats-still-working",
        "recency": "year",
        "question": "Are the classic direct-response static ad formats — us-vs-them comparison charts, testimonial/review screenshots, notes-app statics, before/after, listicles — still performing on Meta in 2025-2026, or are they fatigued/saturated? Find practitioners explicitly saying these formats still work OR explicitly saying they are burned out/overused and what they replaced them with. Distinguish format-level fatigue (the whole pattern stops working market-wide) from execution-level fatigue (one brand's ad wears out). Quote real practitioner language with dates.",
    },
    {
        "slug": "r2-q2-whats-winning-right-now",
        "recency": "month",
        "question": "What ad creative formats and styles are winning on Meta (Facebook/Instagram) for DTC/e-commerce RIGHT NOW, as of May-June 2026? Find the most recent breakdowns from creative strategists, swipe-file roundups, 'what's working in Meta ads this month' posts, agency newsletters, Foreplay/Motion/Creative OS content. List specific named formats with descriptions and any performance claims.",
    },
    {
        "slug": "r2-q3-emerging-new-formats",
        "recency": "year",
        "question": "What NEW or emerging static ad formats appeared in Meta advertising in 2025-2026 that did not exist or were rare before? Examples to verify or refute: fake-UI statics (iMessage/WhatsApp chat screenshots, Reddit-thread screenshots, Google-search-bar statics, ChatGPT-conversation screenshots), AI-generated surreal/bending-reality visuals, editorial/magazine-style statics, long-text 'founder letter' statics, meme formats. Which of these are practitioners actually reporting as winners, with quotes and dates?",
    },
    {
        "slug": "r2-q4-trend-reports-data",
        "recency": "year",
        "question": "What do large-scale creative performance studies and trend reports from 2025-2026 say about which Meta ad creative formats perform best? Specifically look for: Motion's creative trends reports / '550,000 ads' style studies, Foreplay trend reports, Triple Whale or Varos benchmark data, Meta's own published creative best-practice data, any agency report aggregating performance across many ad accounts. Report their specific findings about static formats with numbers where available.",
    },
    {
        "slug": "r2-q5-india-current-formats",
        "recency": "year",
        "question": "What static ad formats are Indian D2C brands actually running on Meta (Facebook/Instagram) in 2025-2026? Look for breakdowns of Indian Meta Ad Library findings, Indian performance marketing agencies describing winning static creative for supplements, food, beauty, accessories brands, Hinglish ad copy patterns, price/offer presentation in Indian statics. Do designed/polished poster-style ads work better in the Indian market than in Western markets, or does lo-fi/native also win in India? Quote sources with dates.",
    },
    {
        "slug": "r2-q6-why-old-formats-persist",
        "recency": None,
        "question": "In direct-response advertising, why do the same ad formats (problem-agitate-solution, us-vs-them, testimonial, before/after, advertorial) keep working for decades? Find practitioner and expert explanations of format durability vs creative fatigue: the argument that buyer psychology is constant so formats persist while executions rotate, evidence of how often a proven format stops working market-wide, and what actually causes an ad format to die. Quote named copywriters, creative strategists, or studies.",
    },
]


def run_query(q):
    body = {
        "model": "sonar-pro",
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": q["question"]},
        ],
        "web_search_options": {"search_context_size": "high"},
    }
    if q["recency"]:
        body["search_recency_filter"] = q["recency"]
    req = urllib.request.Request(
        "https://api.perplexity.ai/chat/completions",
        data=json.dumps(body).encode(),
        headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
        method="POST",
    )
    t0 = time.time()
    try:
        with urllib.request.urlopen(req, timeout=300) as resp:
            data = json.loads(resp.read())
    except Exception as e:
        print(f"[{q['slug']}] ERROR after {time.time()-t0:.0f}s: {e}", flush=True)
        return q["slug"], {"error": str(e)}
    dur = time.time() - t0
    cost = (data.get("usage", {}).get("cost", {}) or {}).get("total_cost", 0)
    nsrc = len(data.get("search_results", []) or [])
    print(f"[{q['slug']}] ok {dur:.0f}s sources={nsrc} cost=${cost:.4f}", flush=True)
    return q["slug"], data


with ThreadPoolExecutor(max_workers=6) as ex:
    results = list(ex.map(run_query, QUERIES))

total_cost = 0.0
for slug, data in results:
    with open(os.path.join(OUTDIR, f"{slug}.json"), "w") as f:
        json.dump(data, f, indent=2)
    total_cost += (data.get("usage", {}).get("cost", {}) or {}).get("total_cost", 0)

print(f"\nDone. {len(results)} queries, total cost ${total_cost:.3f}")
