# MC Maxxing — Build Roadmap

Version 0.1 · 24 Nov 2026 · For: coding agent + owner
Each milestone ends with a demo build on TestFlight (from M3 on). A milestone is done when every acceptance criterion passes. Sizes are rough (S ≤ 3 days, M ≤ 1 week, L ≤ 2 weeks of agent work).

---

## M0 — Foundations (M)
- Flutter app shell (iOS), Riverpod, go_router, drift, flavors (dev/prod).
- Design system: tokens, fonts (Inter, Space Grotesk, JetBrains Mono), 55-icon set, buttons, inputs, badges, progress, cards, tab bar — matching the canvas Components page.
- Supabase project, migrations scaffold, RLS baseline, CI (format, analyze, tests).
- Seed loader for `config/`.

**Accept:** app builds and runs on a device; component gallery screen matches the canvas; `supabase db reset` seeds rules v1; CI green.

## M1 — Auth + data ingestion (L)
- Email / Apple / Google auth; profile; consent screens (terms, privacy, per-source health consent).
- HealthKit connect, permission rationale, denied-permission flow.
- History import (≤ 365 days) and incremental sync (background delivery + on open).
- Event normalization, tiers, source whitelist, `wasUserEntered` handling, dedupe, plausibility holds.
- GitHub + WakaTime connectors (server-side OAuth). Strava optional.

**Accept:** a test account with Apple Watch data imports history; manual-entry samples land as tier C; duplicate workouts from two sources are merged; events visible in an admin query.

## M2 — Rules engine + progression (L)
- TypeScript engine: XP formula, soft cap, skill/character curves, attribute formulas (measured + earned + WIL), decline (grace, max drop, floor), Inn, Rested XP, task XP cap.
- Versioned rules; full recompute from ledger when version changes.
- Daily pg_cron job; golden tests against `simulation/`.

**Accept:** golden tests match simulation outputs within ±1 level/point; property test proves tier C never changes attributes; changing a weight in rules v2 and recomputing updates all projections.

## M3 — Core screens (L)
Status window, attribute breakdown, skill detail, activity log (filters, upgrade-with-proof), level-up modal, empty/loading/error/sync states.

**Accept:** screens match the canvas; every attribute number on the breakdown is traceable to events/signals; works offline from cache.

## M4 — Quests, habits, to-dos (M)
Quest generation + auto-completion, verified/manual habits, WIL adherence, to-do categories/sizes/kinds, task XP bar and cap, linked tasks (PR merged → close).

**Accept:** a verified sleep habit checks itself next morning; a plain to-do adds task XP but no attribute change; a linked GitHub task closes on merge.

## M5 — Prologue + Training (M)
Welcome, sign up/log in, create character, equip gear, history import moment, stat reveal, Prologue complete; Training hub (6 chapters, any order, skippable), coach marks, chapter checklists, rewards, instant placement results; First Quests; replay from Settings. All copy in string files (voice still open).

**Accept:** a new user can finish Prologue + all Training chapters in one session (~15 min); first verified XP appears in the first session; skipping Training lands on the status window with chapters available in Settings; First Quests complete from real data.

## M6 — Trials + focus sessions (L)
Push-up and plank Trials (on-device pose detection, no video stored), Cooper 12-min GPS Trial, capability signals + norm lookup, focus sessions with foreground verification, optional Shield (if entitlement approved).

**Accept:** push-up count within ±1 of manual count on 10 test sessions; Cooper result produces a VO₂max estimate and AGI capability; leaving the app > 30 s twice marks a focus session unverified.

## M7 — Classes, achievements, patch notes (M)
Class families/specializations/ranks, dormant logic, build planner, achievements catalog + displayed title, weekly patch notes.

**Accept:** failing a rank requirement for 14 days marks it dormant and it reactivates when met; achievements never change stats; patch notes list real buffs/nerfs with reasons.

## M8 — Treasury (M)
Manual log with keypad, categories, payment methods, budgets, savings goals, dashboard, Treasury score, SQLCipher storage, never synced raw.

**Accept:** Treasury data unreadable from the app's DB file without the Keychain key; no transaction rows exist server-side.

## M9 — Privacy, settings, legal (M)
Privacy center (raw events, per-source delete, export, delete account), settings, notifications, Inn check-in, medical disclaimer, privacy policy + terms screens, App Store health/privacy declarations. Legal review of UU PDP consent and data transfer (owner arranges).

**Accept:** export contains all user data; delete account removes server data and recomputes nothing left behind; App Store privacy labels complete.

## M10 — Beta hardening (M)
Analytics events (no health/finance values), Sentry, performance (status window < 1 s from cache), accessibility pass (Dynamic Type, VoiceOver), TestFlight beta.

**Accept:** crash-free sessions ≥ 99% in beta; VoiceOver can complete the Prologue.

## v1.5 (after beta)
Treasury auto-logging (share-sheet OCR, then email parsing), credential vault + bonus, AI comprehension checks, home-screen widget.

## v2
Android (Health Connect, app-usage INT/WIL, notification expense logging), bank aggregation, Premium, hybrid classes complete.

## Research tasks to run early (agent, in parallel with M0–M1)
1. HealthKit: confirm data types, `wasUserEntered`, background delivery from Flutter.
2. GitHub / WakaTime / Strava API terms and endpoints.
3. ML Kit pose detection on iOS via Flutter; on-device performance.
4. FamilyControls entitlement process.
5. Gmail restricted-scope requirements vs. forwarding-address approach; which Indonesian banks/e-wallets send transaction emails.
6. Norm tables to encode in `config/norms/` (Cooper VO₂max, ACSM push-ups/plank, resting HR, HRV).
