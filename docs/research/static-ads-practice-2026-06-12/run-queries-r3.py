#!/usr/bin/env python3
"""S125 round 3: how creators/artists/designers prompt Nano Banana 2 (and peer
image models) to get designed, non-slop graphics. Goal: extract prompt-craft
principles for our spec->prompt compile step. Same sonar-pro settings."""

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

SYSTEM_PROMPT = """You are a web-research retrieval assistant working for a creative-tools engineer.
Answer using only current web sources you actually retrieve. Rules:
1. ATTRIBUTION: attribute every technique/claim to its source with the publication date.
2. VERBATIM: quote actual example prompts and practitioner language exactly as written — full prompt examples are the most valuable thing you can return.
3. UNCERTAINTY: if sources disagree or are thin, say so.
4. NO GAP-FILLING: if you cannot find something, say you could not find it. Do not invent example prompts.
Prefer named creators, official docs, real prompt examples, and concrete before/after observations over generic tips."""

QUERIES = [
    {
        "slug": "r3-q1-nanobanana-prompting-guides",
        "recency": "year",
        "question": "How do creators and designers prompt Google's Nano Banana Pro / Nano Banana 2 (Gemini 3 Pro Image) to get high-quality graphic design output — posters, ads, infographics, text-heavy layouts? Find official Google prompting guidance AND creator-written guides. Quote actual example prompts verbatim where possible. What prompt structure, length, level of detail, and vocabulary do the best results use?",
    },
    {
        "slug": "r3-q2-typography-layout-prompts",
        "recency": "year",
        "question": "What prompting techniques produce excellent TYPOGRAPHY and LAYOUT in AI image models like Nano Banana Pro and GPT-image (ChatGPT images) — exact text rendering, poster composition, visual hierarchy, grids? How do designers specify type style, weight, scale, alignment, spacing in prompts? Quote real example prompts from creators that produced strong typographic posters or ad layouts.",
    },
    {
        "slug": "r3-q3-viral-prompt-patterns",
        "recency": "year",
        "question": "What are the most popular and effective prompt patterns/templates creators share for Nano Banana Pro (Gemini image) on X/Twitter, Reddit, YouTube in 2025-2026 — e.g. structured/JSON-style prompts, camera/lighting language, style-reference phrasing, multi-step refinement workflows? Which patterns do practitioners say actually matter vs superstition? Quote the actual templates verbatim with attribution.",
    },
    {
        "slug": "r3-q4-product-ad-creative-prompts",
        "recency": "year",
        "question": "How do marketers and designers prompt AI image models (Nano Banana Pro, GPT-image, Midjourney v7) specifically for PRODUCT ADS and static ad creatives — placing a real product photo into a designed ad layout with headline text, badges, CTA buttons? Best practices for image-reference/edit workflows that preserve product packaging fidelity while restyling the scene. Quote real prompts and named practitioner workflows.",
    },
    {
        "slug": "r3-q5-avoiding-ai-look",
        "recency": "year",
        "question": "What do designers and creators say makes AI-generated graphics look like 'AI slop', and what prompting techniques avoid the AI look — in Nano Banana Pro, GPT-image, Midjourney? Known tells: waxy gradients, generic 3D blobs, over-smooth lighting, default composition, fake-looking text. What specific prompt language do practitioners use to get print-grade, editorial, designer-made-looking output? Quote practitioners verbatim.",
    },
    {
        "slug": "r3-q6-design-principles-in-prompts",
        "recency": None,
        "question": "How do professional graphic designers translate design principles (visual hierarchy, grid systems, white space, type pairing, color systems) into AI image model prompts? Find designers describing how they write art-direction language in prompts — naming design movements/styles (Swiss/International, brutalist, editorial, retail poster), describing eye-flow, specifying ratios and spacing. Quote real examples of designer-written prompts and the principles they encode.",
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
