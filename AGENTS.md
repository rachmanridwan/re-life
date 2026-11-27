# Instructions for coding agents — MC Maxxing (ReLife)

Read this first, every session.

## Read order
1. `docs/PRD.md` — what we're building and why
2. `docs/GAME_DESIGN.md` — the rules (the core of the product)
3. `docs/PROGRESSION.md` — the numbers (curves, constants, simulation results)
4. `docs/TECH_SPEC.md` — stack, architecture, data model
5. `docs/ROADMAP.md` — milestones and acceptance criteria; work in this order
6. `docs/DECISIONS.md` — what's decided and what's still open
7. `design/README.md` — tokens, components and the screen files in `design/screens/` (the build reference for UI)
The live design canvas (owner-only) is https://claude.ai/artifact/AQkcFnfZhkrGT5fPPB4S66 — agents use the exported files in `design/`.

## Non-negotiable rules
1. **Only verified data moves the character.** Tier C (self-reported) data never changes attributes, skills, character level or class. Keep a test that proves it.
2. **No hard-coded game numbers.** Every constant comes from versioned rules (`config/rules/*.json` → `rules` table). If a number isn't in the docs or config, add it to config with a `// TUNABLE` note and list it in your summary.
3. **Stats are explainable.** Any stat change must be traceable to events and capability signals.
4. **Rewards never grant stats.** Achievements, quests, tutorials → cosmetics and Rested XP only.
5. **Treasury raw data never leaves the device.**
6. **Privacy by default.** No health or finance values in analytics, logs or LLM prompts.
7. **Match the design.** Build UI from `app/lib/design_system/` following `design/`; new screens reuse existing components and tokens.
8. **Secrets stay out of git.** Read keys from `.env`; never commit real values.

## Tags in the docs
- **[DECIDED]** build exactly this.
- **[PROPOSAL]** build as written unless the owner changes it.
- **[ASSUMPTION]** default choice so work can start; keep it easy to change.
- **[TUNABLE]** a config value.
- **[VERIFY]** confirm against current official docs before relying on it; record what you found in `docs/DECISIONS.md` or the relevant spec.

## Ask the owner before
- Changing anything tagged [DECIDED], or any XP/attribute formula.
- Collecting a new type of personal data, adding a new third-party service, or anything that costs money.
- Legal/compliance wording (privacy policy, consent text, disclaimers).
- Dropping or delaying a roadmap acceptance criterion.

## You may decide on your own
- Code structure inside the layout in TECH_SPEC §2, libraries for ordinary needs, test design.
- UI for screens not yet designed, using the component library.
- Values for [ASSUMPTION] items when blocked — record them in `docs/DECISIONS.md`.

## Working style
- One milestone at a time; finish with a short summary: what was built, what passed, open issues, new TUNABLEs/ASSUMPTIONs.
- Keep `docs/` current when behavior changes.
- Rules engine changes need golden tests against `simulation/` (`python simulation/progression_sim.py`).
