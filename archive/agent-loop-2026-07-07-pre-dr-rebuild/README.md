# Archive — agent-loop before the DR rebuild (2026-07-07)

Snapshot taken immediately before the S141→S142 DR rebuild replaced the stage roster
(research/comp/strategy/cell-generate → collect/market/create/buy).

- `agent-loop/` — the full agent-loop code as it was (node_modules, runs/, proof/runs/, .cache excluded).
- `agent-skills/` — copy of `agent/.claude/skills/` at the same moment (the plugin binders are
  symlinks into that folder, so archiving agent-loop alone would not have preserved the methods).

Context: docs/SESSION_141_GENERICNESS_PROOF_LOOP_AND_SWIPE_BANK_2026-07-07.md and the session that
followed it (production audit → proof loop → slop diagnosis → DR creative rebuild).
