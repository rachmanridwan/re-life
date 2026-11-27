# MC Maxxing — Decisions Log & Open Questions

Update this file whenever a decision is made. Newest at the bottom of each section.

## 1. Decided

| # | Date | Decision |
|---|---|---|
| 1 | 2026-11-24 | Product: real-life stats shown as an MMORPG character sheet; personal only, no social at launch. |
| 2 | 2026-11-24 | Mobile first; product for others, not just the owner. Clean, original look with RPG mechanics. |
| 3 | 2026-11-24 | Stats must be verified. Self-reported entries go to a separate ghost bar and never affect attributes. |
| 4 | 2026-11-24 | Wearables optional but they change XP/stats (intensity bonus, capability signals, VIT cap without wearable). |
| 5 | 2026-11-24 | Six attributes with classic names: STR, AGI, VIT, INT, DEX, WIL. Max 99. Level and attributes progress at different paces. |
| 6 | 2026-11-24 | Finance is not an attribute; it is a separate private module (Treasury). |
| 7 | 2026-11-24 | Global standards apply to STR/AGI/VIT (device requirements allowed). INT/DEX/WIL use effort + consistency; standards must not block them. Credential bonus applies (max +10). |
| 8 | 2026-11-24 | Classes: real-life archetypes in MMORPG structure, modern/Gen Z naming, English, multiple classes allowed. |
| 9 | 2026-11-24 | Productivity tools included: habits, to-dos, Treasury (expense log, dashboard). |
| 10 | 2026-11-24 | Tutorial: Prologue + Placement Week with rewards; **play-ahead pacing** after the Prologue. *(Superseded by #25.)* |
| 11 | 2026-11-24 | Character level comes from total XP. |
| 12 | 2026-11-24 | A class becomes **dormant** when its attribute requirement drops. |
| 13 | 2026-11-24 | To-dos earn XP; categories decide any attribute effect. |
| 14 | 2026-11-24 | Expense auto-logging wanted (email and bank-app notifications where the platform allows). |
| 15 | 2026-11-24 | Working name: **MC Maxxing**. |
| 16 | 2026-11-24 | Norm tables (Cooper, ACSM, etc.) are implemented directly in the algorithm; no separate licensing step. |
| 17 | 2026-11-24 | **iOS first, Flutter.** |
| 18 | 2026-11-24 | Claude owns the progression simulation; pacing to be discussed later. |
| 19 | 2026-11-24 | A regular user reaches max level (99) in about **one year**. Attributes stay much slower than level. Curves switched to a power curve (PROGRESSION v0.2). |
| 20 | 2026-11-24 | Backend: **Supabase**. |
| 21 | 2026-11-24 | Mac available for iOS builds. **XP boost for the first week** after onboarding (casual-pace fix). |
| 22 | 2026-11-24 | Avatar (v2) is shaped by **performance only**: STR/AGI/VIT change body, INT/DEX/WIL change gear and effects, class changes outfit. User picks own base body. No body mass / fat % input. |
| 23 | 2026-11-24 | Avatar rendering: **3D**. |
| 24 | 2026-11-26 | Project name ReLife; bundle ID `id.co.jexa.relife`; repo https://github.com/rachmanridwan/re-life.git; accounts and keys are placeholders until the owner provides them. |
| 25 | 2026-11-26 | Tutorial is **Prologue + Training** (6 chapters, ~10 min, any order), finishable in one sitting; replaces Placement Week. Real-time proofs become optional First Quests. Training is skippable. Push-up Trial stays in Training. |
| 26 | 2026-11-26 | Face scan for character creation (v2): **stylized likeness** (style B). Hard rule: scan processed and deleted on device, only slider values saved. Body comes from stats only. |
| 27 | 2026-11-26 | Avatar art direction: **3D anime / video-game style, cel-shaded with outlines** (not cartoonish, not photoreal). Procedural WebGL prototype on the canvas sets the look and the slider contract; final art by a 3D artist. |

## 2. Open questions

| # | Question | Default used for the build |
|---|---|---|
| O1 | Attribute decline mechanism (GAME_DESIGN §6): grace 7 days, −2/week max, floor 60% of peak, Inn 30 days/year — OK? | Build as written |
| O2 | To-do rules (GAME_DESIGN §8): plain tasks → Task XP only (cap 100/day); proof/linked → attributes. Should on-time planned tasks count toward WIL? | No WIL effect |
| O3 | Mid-level pacing and casual pace (PROGRESSION.md §5–6) | Use v0.2 curves |
| O4 | What keeps users going after Lv 99 (prestige, seasons, attributes as the long game)? | Attributes + classes are the long game; no prestige in v1 |
| O5 | Tutorial narrative voice: Future You, System, mascot, or hybrid? Personalized ("Future Rachman")? | Hybrid, generic "Future You"; copy in string files |
| O6 | Final names: app, ranks, classes | Placeholders from GAME_DESIGN §7 |
| O7 | Supabase region (Singapore) vs. UU PDP data-transfer rules | Singapore, pending legal check |
| O8 | Launch market and persona (Indonesia, 18–30?) | As in PRD §3 |
| O9 | Dark mode for the core app | Light core, dark onboarding/tutorial (as designed) |
| O10 | Treasury email auto-logging: Gmail OAuth (restricted scope review) vs. forwarding address | Research first (ROADMAP research task 5) |
| O11 | Monetization and price | Free v1, Premium in v2, price TBD |
| O12 | Minimum age | 17+ |
| O13 | Proof review: who reviews (AI, human, both)? | AI pre-check + human sample |
| O14 | 3D avatar art source: Claude-built procedural model, open-licensed base model, AI-generated + cleanup, or hired 3D artist? | Not in v1; placeholder avatar card on status window |
