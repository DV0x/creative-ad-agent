# Mini-eval harness

Tests **one apprentice binder in isolation** — give it a canned fixture, let it
produce its deliverable in a single `query()`, score the deliverable. No Durable
Object, no sandbox, no orchestrator, no staging deploy: a binder behaves the
same wherever the SDK runs, so this is a plain local Node script. It is **dev
tooling, not the product runtime**.

It exists so every binder in the first-principles redesign can be proven
standalone *before* the orchestrator loop is built (Phase 1, Step 0). See
`docs/eval-corpus/implementation-plan.md` §5.

## Run

From `cloudflare/`:

```bash
npx tsx eval/mini-eval/run-mini-eval.ts strategy
```

Reads `ANTHROPIC_API_KEY` from the repo-root `.env.local`. Writes a scored
markdown report to `eval/mini-eval/results/<binder>-<date>.md`.

## Layout

```
run-mini-eval.ts          the runner — env load, binder inlining, run, judge, report
apprentices/<name>.ts     the apprentice definition (identity, binder paths, model, pass rule)
rubrics/<name>.md         the scoring rubric the LLM judge grades against
fixtures/<name>/<brand>/  canned input per fixture: research.md, competitors.md,
                          founder-facts.md, meta.json
results/                  generated reports
```

## How it scores

- The apprentice runs with the binder **inlined into its system prompt** (not
  via the Skill tool) — the mini-eval tests binder *content*, not skill-trigger
  reliability.
- An **LLM judge** (Opus) grades The Bet against `rubrics/<name>.md`, returning
  a per-criterion pass/fail. The **overall** verdict is computed deterministically
  by the harness from the apprentice's `passRule` — not left to the judge.
- A **number-traceability** check is reported as an advisory (numbers in the
  deliverable absent from the research) — not a pass/fail gate.

## Adding a fixture

Create `fixtures/<binder>/<brand>/` with `research.md`, `competitors.md`,
`founder-facts.md`, and a `meta.json`:

```json
{ "brand": "Brand Name", "date": "2026-05-19", "shape": "audience test", "notes": "why this fixture exists" }
```

Fixtures must be **held-out** brands — never the brands used as worked examples
inside a binder, or the apprentice is handed the answer.

## Adding an apprentice

Add `apprentices/<name>.ts` exporting an `Apprentice`, register it in the
`APPRENTICES` map in `run-mini-eval.ts`, and add `rubrics/<name>.md` + fixtures.
