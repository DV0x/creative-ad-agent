#!/usr/bin/env python3
"""S125 deep research: how performance marketers actually run static ads.
Fires 8 Perplexity sonar-pro queries in parallel, saves raw JSON per query.
Mirrors the mini-eval harness settings (sonar-pro, search_context_size=high,
subject-binding system prompt)."""

import json, os, sys, time
import urllib.request
from concurrent.futures import ThreadPoolExecutor

OUTDIR = os.path.dirname(os.path.abspath(__file__))

# Read key from repo-root .env.local
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
Be thorough and concrete. Prefer named practitioners, named agencies, named tools, real numbers, and direct quotes over generic summaries."""

QUERIES = [
    {
        "slug": "q1-production-workflow",
        "recency": "year",
        "question": "How do direct-response / performance marketing creative teams and DTC ad agencies actually produce static image ads for Meta (Facebook/Instagram) in 2025-2026? Describe the end-to-end production workflow step by step: who is involved (creative strategist, copywriter, graphic designer, media buyer), what a creative brief contains, how long one static ad takes to produce, what design tools are used (Figma, Canva, Photoshop, AI tools), and how many static variations are typically produced per concept. Cite named agencies or practitioners describing their real workflow.",
    },
    {
        "slug": "q2-concept-origination",
        "recency": None,
        "question": "How do creative strategists at performance marketing agencies come up with ad concepts and angles for DTC/e-commerce brands? Describe the specific research and ideation methods used in practice: customer review mining, Reddit/community mining, competitor research via Meta Ad Library and swipe-file tools (Foreplay, Atria), Eugene Schwartz customer awareness stages, angle/persona matrices, 'concepts vs variations' frameworks. Cite named practitioners or agencies describing their actual concept-generation process, with direct quotes where possible.",
    },
    {
        "slug": "q3-what-wins-statics",
        "recency": "year",
        "question": "What types of static image ads perform best on Meta (Facebook/Instagram) for DTC/e-commerce brands in 2025-2026? Compare specific formats: 'ugly ads' / native lo-fi statics, text-heavy 'reminder' statics, advertorial/listicle statics, us-vs-them comparison charts, testimonial/review-screenshot statics, meme-style ads, whiteboard/notes-app style, and polished designed 'poster' ads. What does performance data and practitioner consensus say about which formats win, for which audiences, and why?",
    },
    {
        "slug": "q4-volume-testing-economics",
        "recency": "year",
        "question": "How many ad creatives do successful DTC brands and performance agencies test per month on Meta in 2025-2026, and what percentage become winners? How has Meta's Andromeda algorithm update changed creative volume and creative diversity requirements? What is the practitioner consensus on creative testing structure (cost caps, ABO vs CBO testing, when to kill an ad, ratio of iterations-on-winners vs brand-new concepts)? Give real numbers from named sources.",
    },
    {
        "slug": "q5-named-practitioner-methods",
        "recency": None,
        "question": "How do well-known Meta ads creative practitioners describe their creative process — for example Dara Denney, Barry Hott, Sarah Levinger, Alex Cooper / The Ad Professor, Jess Bachman, Nick Theriot, Ash Melwani, Zach Stuck, Foreplay's Zac Porter? What frameworks do they teach for going from customer research to a winning ad concept (e.g. concepts vs variations, message-first vs visual-first, hook hierarchy, 'make ads that don't look like ads')? Quote their actual language.",
    },
    {
        "slug": "q6-big-idea-vs-angle",
        "recency": None,
        "question": "In Meta performance marketing, what matters more for ad performance: the creative 'big idea' (a clever concept or visual leap, like award-winning advertising) or the message/angle/offer match to the customer? What do practitioners and case studies say about clever award-style creative versus direct 'boring' ads for conversion? Is there evidence that performance teams systematically generate winning concepts through process (research, frameworks, volume) rather than creative genius? Cite specific practitioner debates or data.",
    },
    {
        "slug": "q7-india-d2c-creative",
        "recency": "year",
        "question": "What does winning Meta (Facebook/Instagram) ad creative look like for Indian D2C brands in 2025-2026? Consider examples like The Whole Truth Foods, Nutrabay, supplements and packaged food brands, quick-commerce creative (Zepto, Blinkit print/social campaigns), accessories brands like DailyObjects. What creative styles, formats, languages, and price/offer presentations convert in the Indian market? Which agencies or in-house teams are known for the best Indian D2C performance creative?",
    },
    {
        "slug": "q8-ai-tools-state",
        "recency": "year",
        "question": "Which AI tools are performance marketers actually using in 2025-2026 to generate static ad creative (e.g. AdCreative.ai, Arcads, Icon, Pencil, Omneky, Canva AI, Midjourney / GPT-image / Nano Banana workflows), and what do practitioners honestly say about output quality — including 'AI slop' criticism? Where do AI ad generators fail compared to human creative teams, and what parts of the process do practitioners say remain uniquely human (concept, taste, strategy)? Quote real practitioner opinions.",
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


with ThreadPoolExecutor(max_workers=8) as ex:
    results = list(ex.map(run_query, QUERIES))

total_cost = 0.0
for slug, data in results:
    with open(os.path.join(OUTDIR, f"{slug}.json"), "w") as f:
        json.dump(data, f, indent=2)
    total_cost += (data.get("usage", {}).get("cost", {}) or {}).get("total_cost", 0)

print(f"\nDone. {len(results)} queries, total cost ${total_cost:.3f}")
print(f"Raw JSON in {OUTDIR}")
