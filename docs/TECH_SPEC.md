# MC Maxxing — Technical Spec

Version 0.1 · 24 Nov 2026 · Status: draft for build
Tags: **[DECIDED]** · **[ASSUMPTION]** default to build with, owner may change · **[VERIFY]** confirm against current docs before relying on it

---

## 1. Stack

| Layer | Choice | Status |
|---|---|---|
| Mobile | Flutter (Dart), **iOS first** | DECIDED |
| State / routing | Riverpod, go_router | ASSUMPTION |
| Local DB | drift (SQLite); Treasury tables encrypted (SQLCipher), key in iOS Keychain | ASSUMPTION |
| Health data | `health` Flutter package for HealthKit reads; native Swift channel for background delivery if the package can't | ASSUMPTION · VERIFY |
| Backend | Supabase: Postgres, Auth (email, Apple, Google), Edge Functions (TypeScript/Deno), Storage, pg_cron, Vault | DECIDED |
| Region | Supabase Singapore (closest to Indonesia) | ASSUMPTION · VERIFY UU PDP transfer rules |
| Push | APNs via Firebase Cloud Messaging | ASSUMPTION |
| On-device ML | Google ML Kit pose detection (Trials), Apple Vision OCR (receipts) | ASSUMPTION · VERIFY iOS support in Flutter plugins |
| Analytics / crashes | PostHog, Sentry | ASSUMPTION |
| LLM features | Claude API from Edge Functions (comprehension checks, patch-notes phrasing) | ASSUMPTION |

## 1b. Identifiers and accounts [DECIDED]

| Item | Value |
|---|---|
| Project / repo name | ReLife — https://github.com/rachmanridwan/re-life.git |
| Display name | MC Maxxing (placeholder) |
| iOS bundle ID | `id.co.jexa.relife` (reverse of the company domain jexa.co.id + project). Dev flavor: `id.co.jexa.relife.dev` |
| Flutter create | `flutter create --org id.co.jexa --project-name relife --platforms ios app` |
| Future extensions | `id.co.jexa.relife.widget` (home widget), `id.co.jexa.relife.share` (share extension) |
| Android package (later) | `id.co.jexa.relife` |
| Secrets | `.env` (git-ignored); template in `.env.example`. Owner supplies real keys later — use the `__TODO__` placeholders and fail loudly if missing |

## 2. Repo layout

```
ReLife/
  AGENTS.md                 instructions for coding agents (read first)
  README.md
  docs/                     PRD, GAME_DESIGN, PROGRESSION, TECH_SPEC, ROADMAP, DECISIONS
  design/                   exported screen sources (*.dc.html) + design README with tokens
  simulation/               progression_sim.py + results (reference implementation of the math)
  config/                   rules + catalogs as versioned JSON (seeded into Postgres)
    rules/v1.json           XP formula constants, curves, soft caps, weights, decline, E_ref
    workout_map.json        HKWorkoutActivityType -> skill
    source_whitelist.json   HealthKit source bundle IDs allowed as tier S
    norms/                  vo2max_cooper.json, pushup_acsm.json, rhr.json, hrv.json, plank.json
    achievements.json
    classes.json            families, specializations, rank requirements
    credentials.json        credential -> attribute bonus map
  app/                      Flutter app
    lib/design_system/      tokens, icons (55, from the canvas), components
    lib/features/<feature>/ data / domain / presentation per feature
    lib/core/               auth, sync, health, local db, analytics
    ios/                    native Swift: HealthKit background delivery, FamilyControls
  supabase/
    migrations/             SQL schema + RLS
    functions/              Edge Functions (TypeScript)
      _shared/engine/       rules engine (authoritative)
    seed/                   loads config/ into rules tables
```

## 3. Architecture

```
iPhone (Flutter)                                Supabase
-----------------                               --------
HealthKit reader ──normalize──► local event queue ──upload──► ingest fn ──► events (append-only)
Focus / Trials / habits / todos ─────────────────┘                          │
                                                                             ▼
GitHub / WakaTime / Strava ◄── OAuth + polling/webhooks ── connector fns ──► events
                                                                             │
                                          rules engine (versioned) ◄─────────┘
                                                │
                    xp_ledger, user_skills, character, attribute_snapshots, quests, classes
                                                │
Local cache (drift) ◄────────── realtime / pull ┘
Treasury: stays on device (encrypted). Only derived ratios may sync (opt-in).
```

- **Authoritative compute is server-side** (Edge Functions + pg_cron). The app shows server projections from its local cache and may show an optimistic preview for just-logged events.
- The engine is a pure TypeScript module with **golden tests generated from `simulation/progression_sim.py`** so numbers match the reference.
- **Daily job** (pg_cron, per time zone bucket at 04:00 local): recompute attributes, decline/grace/floor, dormant classes, quest generation, Inn bookkeeping.
- **Weekly job**: patch notes generation.

## 4. Data model (Postgres, all tables with RLS: user can only read own rows)

| Table | Key columns | Notes |
|---|---|---|
| profiles | id, display_name, avatar, birth_year, sex_for_norms, tz, focus_goals[], main_class_id | sex/age only for norm lookup, optional |
| sources | id, user_id, kind (healthkit, github, wakatime, strava, …), status, scopes, token_ref (Vault) | |
| events | id, user_id, source_id, external_id, kind, activity, start_at, end_at, quantity jsonb, tier (S/A/B/C), device, was_user_entered, source_bundle, hold_reason, created_at | append-only; unique (source_id, external_id) |
| event_links | event_id, merged_into_event_id | dedupe result |
| rules | version, json, active_from | versioned config from `config/rules` |
| xp_ledger | id, user_id, event_id, rules_version, skill_id, raw_xp, eff_xp, tier, counts_to_attr bool | derived, rebuildable |
| skills | id, name, icon, family, attr_weights jsonb | seeded |
| user_skills | user_id, skill_id, total_xp, verified_xp, ghost_xp, level | projection |
| character | user_id, total_xp, task_xp_today, level, rested_pool | projection |
| capability_signals | id, user_id, attr, kind (vo2max, pushup_trial, rhr, …), value, percentile, measured_at, source_event_id | |
| attribute_snapshots | user_id, date, attr, effort, capability, raw, shown, peak, floor, reason jsonb | one row per attr per day |
| habits / habit_checks | habit def (verify_source, rule, days) / per-day result | |
| quests / user_quests | template / instance (target, progress, status) | |
| todos | id, user_id, title, category, size, kind (plain/proof/linked), link_rule jsonb, proof_ref, done_at | |
| trials / trial_results | protocol / result + capability update | |
| focus_sessions | id, user_id, skill_tag, planned_min, actual_min, interruptions, verified | |
| credentials | id, user_id, kind, attr, level, verify_url, proof_ref, status, bonus, verified_at | |
| classes / user_classes | catalog / rank, status (active/dormant), since | |
| achievements / user_achievements | catalog / unlocked_at | |
| inn_stays | user_id, start_date, end_date | |
| patch_notes | user_id, week, json | |
| review_queue | id, user_id, item_type, item_id, status, reviewer, notes | proof review |

Local-only (device): `treasury_transactions`, `treasury_budgets`, `treasury_goals`, `treasury_accounts` (SQLCipher).

## 5. Integrations

### 5.1 HealthKit (iOS) [VERIFY each type and the background delivery mechanism]
Read only: step count, walking/running distance, active energy, workouts (with activity type, duration, HR stats), heart rate, resting heart rate, HRV (SDNN), sleep analysis, VO₂max, mindful minutes.
- History import on first connect: as far back as HealthKit allows, max 365 days processed for XP (older data only seeds baselines). [ASSUMPTION]
- `wasUserEntered` → tier C. Source bundle not in `source_whitelist.json` → tier C.
- Background delivery via observer queries; fall back to sync on app open.

### 5.2 GitHub, WakaTime, Strava
- OAuth handled server-side; tokens in Supabase Vault.
- GitHub: merged PRs and reviews by the user (polling every 6 h or webhook if available). [VERIFY]
- WakaTime: daily summaries of active coding time. [VERIFY]
- Strava: activities; respect Strava API agreement and display rules. [VERIFY]

### 5.3 Trials
- Push-ups/plank: camera + on-device pose detection; video frames never stored or uploaded; only the count, duration and a confidence score are sent.
- Cooper: foreground GPS run, 12-minute timer; reject if GPS gaps > 20 s total or speed implausible.

### 5.3b Face scan (v2)
- Native Swift module (platform channel) using ARKit face tracking on TrueDepth devices; guided capture over 4 angles (~20 s).
- On-device fitting: face mesh → face-shape parameters (0–100) + skin tone; output is a small JSON of slider values.
- Raw mesh and frames are held in memory only and discarded after fitting. Nothing from the scan is uploaded or logged.
- Fallback for devices without TrueDepth: manual editor (optionally Vision face landmarks from one photo, also on-device).
- Apple rule: face-mapping data may not be used for advertising, marketing or data mining; disclose in the privacy policy. [VERIFY current App Store guideline wording]
- UU PDP: biometric data → explicit separate consent. [VERIFY with legal]

### 5.4 Focus sessions
- Verified if the app stays foreground (≤ 2 interruptions under 30 s).
- Optional distraction shield using FamilyControls / ManagedSettings / DeviceActivity — needs Apple's Family Controls entitlement. [VERIFY approval process]

## 6. Treasury auto-logging [DECIDED: wanted; approach PROPOSAL]
iOS cannot read other apps' notifications or SMS. Options, in build order:
1. **Share-sheet / screenshot capture (v1.5):** user shares a transfer receipt or e-wallet screenshot → on-device OCR (Vision) → parsed transaction for confirmation.
2. **Email parsing (v1.5):** bank and e-wallet transaction emails.
   - Option A: Gmail/Outlook OAuth read on device, parse on device. Gmail read scopes are restricted and need Google's security assessment. [VERIFY cost/time]
   - Option B: per-user forwarding address (inbound email webhook) → server parses → delivers parsed transaction to the device → raw email deleted immediately (retention 0). Simpler to ship; raw finance email touches the server briefly.
   - Parser: template per sender (BCA, Mandiri, BNI, BRI, Jago, GoPay, OVO, DANA, ShopeePay — [VERIFY which send transaction emails]), LLM fallback with no storage.
3. **Android (v2):** NotificationListenerService on bank/e-wallet app notifications, parsed on device. [VERIFY Play policy]
4. **Bank aggregation (v2):** Indonesian account-information providers. [VERIFY licensing/cost]

All auto-logged items arrive as "pending" until the user confirms (first 2 weeks) or auto-confirm after the user enables it.

## 7. Anti-cheat (engine)
- Source whitelist, `wasUserEntered`, tiers.
- Dedupe overlapping events across sources.
- Plausibility holds (thresholds in rules JSON).
- Daily soft cap per skill; Task XP cap.
- Proof review: AI pre-check (certificate URL resolves, name match) + manual review of a sample. [ASSUMPTION]

## 8. Security and privacy
- RLS on every table; Edge Functions use service role only server-side.
- Encryption at rest (Supabase) + Treasury SQLCipher on device.
- Data export (JSON + CSV) and account deletion as self-serve features.
- Per-source disconnect deletes that source's events and triggers recompute.
- No health or finance data in analytics events; analytics uses IDs and counts only.
- LLM calls: no raw health data; only the minimum text needed (e.g. book title + chapter for comprehension questions).

## 9. Testing
- Rules engine: unit tests + golden tests from the simulation + property test "tier C never changes attributes".
- Flutter: widget tests for design-system components, integration tests for the Prologue flow.
- HealthKit: fixtures of real-shaped samples (manual entry, watch, third-party source).

## 10. iOS-first constraints (none block the build)

| Area | Effect on iOS | Handling |
|---|---|---|
| Build machine | iOS apps need macOS + Xcode to build, sign and upload | Use a Mac or a cloud macOS CI (e.g. Codemagic, GitHub Actions macOS runners); Apple Developer Program account required |
| Testing health data | Simulator has limited HealthKit and no Apple Watch data | Test on a physical iPhone (+ Apple Watch for wearable paths) with fixture data |
| App usage data | Apps can't read other apps' usage time | INT effort from focus sessions; WIL uses Adherence + Rhythm only (Restraint is Android-only) |
| Expense auto-logging | Apps can't read other apps' notifications or SMS | Share-sheet/screenshot OCR + email parsing on iOS; notification logging on Android (v2) |
| Background sync | HealthKit background delivery is OS-throttled | Sync on app open + background delivery; never promise real-time |
| Focus shield | Family Controls needs a special Apple entitlement | Ship foreground verification first; add shield if approved |
| App Review | Health apps get extra review; HealthKit data can't be used for ads | Clear usage descriptions, privacy labels, no ad SDKs on health data |
| Market | Most phones in Indonesia are Android | iPhone-first beta is fine; plan Android (v2) for reach |
