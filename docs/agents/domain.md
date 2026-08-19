# Domain Docs

How the engineering skills should consume this repo's domain documentation when exploring the codebase.

## Before exploring, read these

- **`CONTEXT.md`** at the repo root — definitions of project-specific terms (Fuel, Distance, Planet, Tammy, Emotion State, Food Scan, Quick-Log, Planet Report).
- **`docs/adr/`** — architectural decisions (0001: Two-Gauge system, 0002: Idempotency, 0003: Hybrid Vision, 0004: Text/Emotion Sprite Sync).

If any of these files don't exist, **proceed silently**.

## File structure

Single-context repo:

```
/
├── CONTEXT.md
├── docs/adr/
│   ├── 0001-star-travel-two-gauge-and-lifecycle.md
│   ├── 0002-idempotency-and-retro-backfill.md
│   ├── 0003-hybrid-vision-pipeline.md
│   └── 0004-text-emotion-sprite-sync-over-audio.md
└── src/
```

## Use the glossary's vocabulary

When your output names a domain concept (in an issue title, a refactor proposal, a hypothesis, a test name), use the term as defined in `CONTEXT.md`. Don't drift to synonyms the glossary explicitly avoids.

## Flag ADR conflicts

If your output contradicts an existing ADR, surface it explicitly rather than silently overriding.
