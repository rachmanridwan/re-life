# MC Maxxing — Product Requirements Document

Version 0.1 · 24 Nov 2026 · Owner: Rachman (jexa.co.id) · Status: draft for build
Working name: **MC Maxxing** (placeholder) · Repo: ReLife
Companion docs: `GAME_DESIGN.md` (rules), `PROGRESSION.md` (numbers), `TECH_SPEC.md` (architecture), `ROADMAP.md` (milestones), `DECISIONS.md` (decision log + open questions).
Design canvas (all screens + components): https://claude.ai/artifact/AQkcFnfZhkrGT5fPPB4S66

Tags: **[DECIDED]** · **[PROPOSAL]** · **[ASSUMPTION]** (a default chosen so the build can start; owner may change) · **[OPEN]**

---

## 1. Summary
MC Maxxing turns a person's real life into an MMORPG character sheet. Skills, attributes, level and class are computed from **verified data** (phone and watch sensors, connected platforms, proof), not from checkboxes. It also includes everyday productivity tools: habits, to-dos and a private finance planner (Treasury).

## 2. Problem and positioning
- "Life RPG" apps (Habitica, LifeForge, Solo Leveling-style apps, ulives) are self-reported to-do lists with XP. Their numbers mean nothing, and the RPG layer often adds friction.
- MC Maxxing's difference: **stats are earned from evidence**, measured where possible against real standards (VO₂max norms, strength norms, sleep guidelines), and they can go down when you stop. A level-50 here means something, at least to you.
- Personal only at launch (no social features). [DECIDED]

## 3. Target users [ASSUMPTION]
- **Primary:** 18–30, tech-comfortable, Gen Z/young millennial, iPhone owner, into games, self-improvement or fitness tracking. Many own or are open to a smartwatch.
- **Secondary:** developers/creators who want their craft (coding, design) reflected (GitHub/WakaTime integrations).
- **Launch market:** Indonesia first, English UI. [ASSUMPTION — UI language English is DECIDED; market is assumed]

## 4. Goals and success metrics
| Goal | Metric | Target |
|---|---|---|
| Fast activation | First verified XP within the first session | [TARGET TBD] |
| Connect data | Users with HealthKit connected on Day 0 | [TARGET TBD] |
| Learn the core rule | Users completing Training chapter 4 (verified habit) | [TARGET TBD] |
| Retention | D1 / D7 / D30 retention | [TARGET TBD] |
| Trust | Share of XP that is verified (tier S/A/B) | [TARGET TBD] |

## 5. Platform and stack [DECIDED]
- **iOS first, built in Flutter.** Android follows (Health Connect, app-usage, notification features).
- Backend: Supabase (Postgres + Auth + Edge Functions + Storage) [DECIDED], Singapore region [ASSUMPTION].
- Details: `TECH_SPEC.md`.

## 6. Scope

### 6.1 v1 (MVP)
| Area | Requirements |
|---|---|
| Auth | Sign up / log in with email, Apple, Google. Terms + privacy consent. Separate per-source consent for health data. |
| Prologue onboarding | Create character, connect HealthKit (+ optional GitHub/WakaTime/Strava), import history → XP, stat reveal, rewards. |
| Training tutorial | 6 short chapters (~10 min), any order, skippable, coach marks on real UI, checklists that tick from real data, instant placement results, First Quests for real-time proof. |
| Status window | Level + XP bar, classes, attribute radar + tiles (measured/earned), skill grid with verified + ghost bars, task XP bar, gear (connected sources). |
| Attribute breakdown | Capability vs effort split, capability signals with norms, contributing events with tier badges, last change explained, "at risk" marker. |
| Skill detail | Level, XP to next, attribute split, 14-day chart, sources, milestones. |
| Activity log | All events grouped by day, filters (verified/self/body/mind), upgrade-with-proof on self events. |
| Quests | Daily + weekly, auto-completing from data. |
| Habits | Verified (auto-checked) and manual habits, weekly grid, feeds WIL. |
| To-dos | Categories, size, plain/proof/linked kinds, task XP with daily cap. |
| Trials | Push-up (camera, on-device), Cooper 12-min run (GPS). |
| Focus sessions | Tagged sessions, foreground verification, optional distraction shield. |
| Classes | Families, specializations, rank ladder, dormant state, build planner (next-rank requirements). |
| Achievements | Starter catalog, displayed title. |
| Level-up moment | Modal with gains. |
| Decline + Inn | Daily recompute, grace, max drop, soft floor, Inn rest mode. |
| Weekly patch notes | Auto-generated weekly recap (buffs, nerfs, new content, known issues). |
| Treasury | Manual expense/income log, categories, budgets, savings goals, dashboard, Treasury score, on-device encryption. |
| Privacy center | View raw events, disconnect/delete per source, export data, delete account, Treasury key info. |
| Settings | Profile, notifications, subscription placeholder, security, tutorial replay. |

### 6.2 v1.5
- Treasury **auto-logging from email** (bank/e-wallet transaction emails) and share-sheet/screenshot receipt capture. [DECIDED: wanted]
- Credential vault (link + photo verification, credential bonus).
- AI comprehension checks for reading (tier B).
- Home-screen widget.

### 6.3 v2
- Android app (Health Connect, app-usage based INT/WIL, notification-based expense auto-logging). [DECIDED: wanted]
- Bank-account sync through an Indonesian account-aggregation provider.
- Premium tier.
- Hybrid classes complete, more Trials.
- **3D avatar** shaped by performance (GAME_DESIGN §13), with optional **face scan** → stylized face (scan never leaves the phone; §13.1).

### 6.4 Out of scope (for now)
- Social features, leaderboards, public profiles. [DECIDED]
- Body weight/BMI/body fat as stats. [DECIDED]
- Medical advice of any kind.

## 7. Screens
All v1 screens exist on the design canvas (pages: Core screens, Auth & onboarding, Features, Tutorial, Components).

| Page | Screens |
|---|---|
| Core | Status window, Attribute breakdown, Quests/Habits/To-do, Treasury, Activity log, Skill detail |
| Auth & onboarding | Welcome, Sign up, Log in, Create character, Equip gear, Stat reveal, Prologue complete |
| Features | Trial (push-ups), Focus session, Classes & build planner, Achievements, Level-up, New habit, Add expense, Credential vault, Patch notes, Settings & privacy |
| Tutorial | Training hub + First Quests, Chapter intro, Coach mark, Chapter checklist, Chapter complete, Training complete / placement results |
| Components | Tokens, 55-icon set, buttons, inputs, badges, progress, cards, tab bar |
| End-to-end flow | One board with the whole journey (Entry → Prologue → Training → Core app + system events) |
| Avatar & face scan (v2) | Face setup + consent, guided scan, face editor |

**Not yet designed** (agent designs from the component library, matching existing screens): empty states, loading/syncing, errors and sync failure, permission-denied flows, notification center, paywall, Trials hub, Cooper GPS Trial, to-do create/edit, budget & goal editing, profile edit, data export, Inn check-in, home widget. Dark mode for the core app: **[OPEN]** (onboarding is dark, core is light).

## 8. Functional requirements (key rules)
1. Unverified (tier C) data must never change attributes, skills, character level or class. *(Test: property test over the rules engine.)*
2. Every stat change must be explainable: the breakdown shows which events and signals produced it.
3. Rules (weights, curves, caps) are versioned data. Changing a version recomputes all users from the event ledger.
4. Attributes recompute daily at 04:00 local time; skills/level update on event ingestion.
5. Treasury raw transactions stay on device; only derived ratios may sync (optional, encrypted).
6. Users can delete any source's data, or everything, at any time; deletion recomputes stats.
7. Achievements/rewards grant only cosmetics and Rested XP.

## 9. Non-functional requirements
- **Privacy:** health and finance data are "specific personal data" under UU PDP (Law 27/2022). Explicit, separate consent; minimum data; encryption at rest and in transit; data stored in-region where possible. [VERIFY with legal]
- **Apple rules:** HealthKit data not used for ads or sold; privacy policy required; health app review. [VERIFY]
- **Disclaimer:** VO₂max, heart rate and sleep readings are informational, not medical advice.
- **Age:** 17+ at launch. [ASSUMPTION]
- **Performance:** status window renders from local cache < 1 s; sync in background.
- **Offline:** app usable offline; events queue and sync later.
- **Accessibility:** 44 pt touch targets, 4.5:1 contrast, Dynamic Type support, VoiceOver labels on icons.
- **Localization-ready:** all copy in string files (Bahasa Indonesia later).

## 10. Monetization [ASSUMPTION]
- Free: everything in v1.
- Premium (v2): bank/email auto-logging, advanced insights, longer history, extra cosmetics. Price: [YOUR PRICE].

## 11. Risks
| Risk | Mitigation |
|---|---|
| iOS limits (no app-usage data, no reading other apps' notifications) | Focus sessions + Shield for INT/WIL; email parsing for Treasury on iOS |
| Gmail read scopes are restricted (security assessment, time and cost) | Start with forwarding-address + share-sheet capture; Gmail OAuth later [VERIFY] |
| Stat drops feel punishing | Grace, max drop, soft floor, Inn, clear explanations |
| Gaming the system | Tiers, source whitelist, dedupe, plausibility holds, daily soft caps |
| Health/finance compliance | Legal review before public launch (ROADMAP M9) |

## 12. Open questions
See `DECISIONS.md` §2.
