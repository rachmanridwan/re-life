# MC Maxxing — Progression & Balancing

Version 0.2 · 24 Nov 2026 · Status: **simulation v0.2 — level pacing agreed (max level ≈ 1 year), details to tune**
Source of truth for numbers: `simulation/progression_sim.py` → `simulation/results/summary.md`.
Rule for the build: every constant below lives in versioned config (`config/rules/v1.json` → `rules` table). Never hard-code.

## 1. Pacing targets

| Who | Target | Status |
|---|---|---|
| Regular user (≈ 200 verified XP/day) | Character and main skill reach **Lv 99 in about 1 year** | DECIDED |
| Regular user | Lv 10 in the first week, Lv 30 in ~1 month, Lv 50 in ~3 months, Lv 75 in ~7 months | PROPOSAL |
| Hardcore user (≈ 400 XP/day) | Lv 99 in ~7–8 months | result |
| Casual user (≈ 50 XP/day) | Lv 10 in the first week, Lv 50 in ~9 months, Lv 99 in ~4 years | result |
| Attributes | Much slower than level: casual ≈ 40, regular ≈ 65, hardcore ≈ 90+ even after a year. Attributes measure real ability, not grind | DECIDED (principle) |

## 2. Archetypes used

| Archetype | Daily pattern (minutes × intensity, probability per day) | Avg verified XP/day |
|---|---|---|
| Casual | Walk 30 (80%), read 25 (35%), sleep (70%) | 54 total, 24 main skill |
| Regular | Walk 45 (90%), run 35×1.3 (40%), code 120 (80%), read 30 (50%), sleep (85%) | 201 total, 94 main skill |
| Hardcore | Walk 60 (100%), run 60×1.4 (70%), lift 60×1.3 (60%), code 180 (90%), study 60 (80%), sleep (95%) | 396 total, 140 main skill |

Daily soft cap per skill applied (GAME_DESIGN §4). Task XP is not in the simulation yet.

## 3. Curves (v0.2) — power curve

```
Skill:     total_xp(L) = 0.898 × (L − 1)^2.2965
Character: total_xp(L) = 2.472 × (L − 1)^2.2541
```

| Level | Skill total XP | Character total XP |
|---|---|---|
| 5 | 22 | 56 |
| 10 | 140 | 350 |
| 20 | 776 | 1,886 |
| 30 | 2,051 | 4,891 |
| 50 | 6,840 | 15,954 |
| 75 | 17,627 | 40,403 |
| 90 | 26,932 | 61,249 |
| 99 | 33,601 | 76,103 |

v0.1 used an exponential curve (OSRS-style). It can't hit "Lv 99 in one year" without rushing the middle levels, so v0.2 uses a power curve: fast early levels, steady slowdown, no wall at the end.

## 4. Results

**Day each level is reached**

| Archetype | Skill Lv10 | Lv30 | Lv50 | Lv75 | Lv99 | Char Lv10 | Lv25 | Lv50 | Lv75 | Lv99 |
|---|---|---|---|---|---|---|---|---|---|---|
| Casual | 7d | 81d | 279d | 2.0y | 3.9y | 7d | 62d | 289d | 2.0y | 3.9y |
| Regular | 4d | 29d | 80d | 197d | 364d | 3d | 20d | 83d | 207d | 1.1y |
| Hardcore | 1d | 14d | 46d | 127d | 243d | 1d | 8d | 39d | 100d | 190d |

**Levels at checkpoints** (S = main skill, C = character)

| Archetype | Day 7 | Day 30 | Day 90 | Day 180 | Day 270 | Year 1 | Year 2 |
|---|---|---|---|---|---|---|---|
| Casual | S10 / C10 | S19 / C18 | S31 / C29 | S40 / C40 | S49 / C48 | S56 / C55 | S74 / C74 |
| Regular | S12 / C15 | S31 / C31 | S53 / C52 | S72 / C71 | S86 / C84 | S99 / C96 | S99 / C99 |
| Hardcore | S22 / C24 | S41 / C44 | S65 / C72 | S87 / C96 | S99 / C99 | S99 / C99 | S99 / C99 |

**AGI attribute (1–99)** — unchanged by the level curve, on purpose

| Scenario | Day 0 | Day 30 | Day 90 | Day 199 | Day 229 (after 30-day break) | Day 290 | Day 365 | Day 730 |
|---|---|---|---|---|---|---|---|---|
| Casual | 18 | 30 | 38 | 40 | 40 | 41 | 42 | 42 |
| Regular | 29 | 45 | 59 | 61 | 63 | 64 | 64 | 65 |
| Hardcore | 43 | 71 | 87 | 93 | 94 | 94 | 94 | 95 |
| Regular + 30-day break | 29 | 45 | 59 | 61 | **54** | 60 | 63 | 65 |
| Regular + break, Inn on | 29 | 45 | 59 | 61 | **61** | 61 | 63 | 65 |

A regular user is Lv 96–99 after a year while AGI sits around 64. Day-0 attribute values are low only because the simulation starts empty; in the app, history import fills the 90-day window.

## 5. Consequences of max level in a year (to discuss)
1. **After Lv 99, what keeps people going?** Options: prestige ("Rebirth" resets level for a cosmetic star, skills stay), seasons, attributes and classes as the long game, uncapped total XP shown as a number. Recommended: attributes + classes are the long game; add prestige later. [OPEN]
2. **Class ranks need skill Lv 99 for Legend**, which now arrives in ~1 year for regular users. Rank attribute and WIL requirements (90 / 85) keep Legend rare. Fine as is.
3. **Casual users need ~4 years** to max. Decided: 2× XP boost for the first week after onboarding (not yet in the simulation).

## 6. Other open tuning items
1. E_ref for STR, VIT, INT, DEX is a starting guess; only AGI was simulated.
2. Task XP cap (100/day) is not simulated. At the cap it is half a regular user's daily XP, so it would cut time-to-max by about a third. Suggest 50/day.
3. Decline constants (7-day grace, −2/week, 60% floor) give a ~10% drop over a month off. Confirm that feels fair.

## 7. How to rerun
```
pip install numpy scipy
python simulation/progression_sim.py
```
Edit `SKILL_TARGETS`, `CHAR_TARGETS`, archetypes or decline constants at the top of the script. Results go to `simulation/results/`.
