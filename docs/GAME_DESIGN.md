# MC Maxxing — Game Design Spec

Version 0.1 · 24 Nov 2026 · Status: draft for build
Owner: Rachman · Working app name: **MC Maxxing** (placeholder) · Repo: ReLife

> Tags used in this doc
> **[DECIDED]** agreed with the product owner · **[PROPOSAL]** Claude's design, not yet discussed, build it as written unless told otherwise · **[TUNABLE]** a number that will be rebalanced; read it from config, never hard-code · **[VERIFY]** a platform/API fact to confirm during implementation

---

## 1. Core rule

**Only evidence moves your character.** [DECIDED]
- Verified data (sensors, connected platforms, proof) changes skills, attributes, level and class.
- Self-reported entries are shown in a separate grey **ghost bar** and never change attributes.
- Achievements, rewards and tutorials never grant stat points. They grant cosmetics, titles and Rested XP (a multiplier on future verified XP).

## 2. Three progression tracks [DECIDED]

| Track | Range | Measures | Can it drop? |
|---|---|---|---|
| Skills | Lv 1–99 | Lifetime verified effort in one activity | Never |
| Character level | Lv 1–99 | Total XP across all skills (+ capped task XP, §8) | Never |
| Attributes | 1–99 | Current form, partly anchored to real-world standards | Yes (§6) |

Pacing: a regular user reaches Lv 99 in about a year; attributes move much more slowly. [DECIDED] Curves live in `PROGRESSION.md`.

## 3. Trust tiers [DECIDED]

Every event carries a tier. The tier decides how its XP counts.

| Tier | Source | XP weight | Counts toward attributes |
|---|---|---|---|
| S — Sensor | Recorded by a device (iPhone motion, Apple Watch, whitelisted wearable apps) | 1.0 | Yes |
| A — Platform | OAuth-connected platform (GitHub, WakaTime, Strava) | 1.0 | Yes |
| B — Proof | Evidence attached (certificate link, photo, file) | 0.5 until reviewed, then 1.0 | Yes |
| C — Self | Typed in manually | 0 (ghost bar only) | No |

Rules:
- HealthKit samples with `HKMetadataKeyWasUserEntered = true` are tier C. [VERIFY key name]
- Tier S requires the sample's source to be on the **source whitelist** (config). Unknown sources → tier C until whitelisted.
- A ghost-bar event can be **upgraded** to tier B by attaching proof.

## 4. XP formula

```
event_xp   = active_minutes × intensity × tier_weight × device_bonus
intensity  = 1.0 default; HR zone 2 = 1.1, zone 3 = 1.3, zone 4+ = 1.5 (wearable);
             phone-only: from pace/cadence where available, else 1.0           [TUNABLE]
device_bonus ≤ 1.25 total uplift vs. phone-only for the same activity           [TUNABLE]
```

**Daily soft cap per skill** [TUNABLE]: the first 90 raw XP per skill per day count fully; above that, extra XP approaches +150 asymptotically (≈240/day max).
`eff = raw ≤ 90 ? raw : 90 + 150 × (1 − e^(−(raw−90)/150))`

**Non-minute sources** [PROPOSAL, TUNABLE]
| Source | XP |
|---|---|
| Steps | 1 XP per 150 steps (→ Walking) |
| Sleep | 40 XP for a night inside the user's target window and ≥ 7 h; scaled down linearly to 0 at < 5 h |
| GitHub merged PR | 20 XP base, +10 if reviewed by someone else; empty/trivial commits = 0; max 5 PRs/day |
| GitHub review given | 8 XP, max 5/day |
| Trial completed | 50 XP to the Trial's skill + capability update |
| Credential verified | 100 XP to linked skill + credential bonus (§5.3) |

**Newcomer boost** [DECIDED: first week · PROPOSAL: numbers]: 2× verified XP for 7 days after the Prologue. Applies to skill and character XP only, never to attribute effort. Doesn't stack with Rested XP (the higher one applies).

**Deduplication**: events from different sources overlapping ≥ 50% in time and same activity class are merged; keep the higher tier, then the richer data.

**Plausibility holds** [TUNABLE]: events exceeding thresholds are held (not credited) and shown as "Needs a check": > 60,000 steps/day; running pace < 2:50 /km over > 1 km; cycling > 60 km/h sustained; > 10 h of one skill in a day; workout claiming zone 4+ without HR data.

## 5. Attributes

Six attributes, classic MMORPG naming. [DECIDED]

| Attr | Name | Group | Measures |
|---|---|---|---|
| STR | Strength | Measured | Physical power |
| AGI | Agility | Measured | Cardio, speed, endurance |
| VIT | Vitality | Measured | Recovery, sleep, cardiovascular basics |
| INT | Intelligence | Earned | Learning |
| DEX | Dexterity | Earned | Craft, making things |
| WIL | Willpower | Earned (derived) | Consistency |

Finance is **not** an attribute; it lives in Treasury (§10). [DECIDED]

### 5.1 Measured attributes (STR, AGI, VIT)

```
Effort      = min(1, sqrt(E90 / E_ref[attr]))          E90 = exponentially-weighted 90-day attribute XP
                                                        (half-life 30 days), scaled to a 90-day sum
Capability  = percentile vs. age/sex norms ÷ 100        (from the latest valid capability signal)
Attribute   = 99 × (w_cap × Capability + w_eff × Effort) × confidence_cap
```

| Attr | w_cap / w_eff | E_ref (90-day XP) | Capability signals (norm source) | Confidence cap without wearable |
|---|---|---|---|---|
| STR | 0.3 / 0.7 | 7,000 [TUNABLE] | Push-up and plank Trials (ACSM norms), lift proof videos (IPF GL points) | none |
| AGI | 0.5 / 0.5 | 9,000 [TUNABLE] | VO₂max (Cooper Institute norms), best 1K/5K pace, Cooper 12-min Trial: VO₂max = (m − 504.9) / 44.73 | none |
| VIT | 0.7 / 0.3 | 4,000 [TUNABLE] | Resting HR and HRV vs. age norms + own baseline; sleep duration 7–9 h and regularity | 60 |

- No capability signal yet → that half shows **Unrated** until a Trial or wearable provides one; the attribute is shown as "??" only if *both* parts are empty.
- Norm tables are implemented directly in the algorithm (config files). [DECIDED]
- Body weight, BMI and body fat are **not** used. [DECIDED earlier: avoid eating-disorder triggers]

### 5.2 Earned attributes (INT, DEX)

No external standard required; credentials only add. [DECIDED]

```
Attribute = min(99, 99 × (0.75 × Effort + 0.25 × Consistency) + credential_bonus)
Effort      as in 5.1 (E_ref INT 6,000 / DEX 8,000) [TUNABLE]
Consistency = share of the last 90 days with ≥ 15 min verified activity in the attribute's skills
```

### 5.3 Credential bonus [DECIDED: +10 max]
- Each verified credential adds +1 to +5 depending on level (map in config), max +10 per attribute.
- Link-verified = full value. Photo upload = half until reviewed.
- Full value for 24 months, then 50% permanently. [PROPOSAL]
- Examples of mapped scales: CEFR A1–C2 (language), certification tiers (associate → professional → expert), graded music exams.

### 5.4 WIL (Willpower)

```
WIL = 99 × (0.7 × Adherence + 0.3 × Rhythm)      (iOS)
WIL = 99 × (0.6 × Adherence + 0.2 × Rhythm + 0.2 × Restraint)   (Android, later)
Adherence = verified habit checks passed ÷ checks scheduled, last 90 days (Inn days excluded)
Rhythm    = regularity of sleep and wake times (from VIT data), 0–1
Restraint = screen-time habit success (Android UsageStats only)
```
iOS cannot read other apps' usage, so Restraint is Android-only. [VERIFY: Screen Time API gives no raw usage numbers to apps]

### 5.5 Skill → attribute weights [PROPOSAL, TUNABLE]
Each row sums to 1.0. XP is **split, never copied**.

| Skill | STR | AGI | VIT | INT | DEX | Verified source (iOS) |
|---|---|---|---|---|---|---|
| Walking | — | 0.6 | 0.4 | — | — | HealthKit steps |
| Running | 0.1 | 0.7 | 0.2 | — | — | HK workouts (running), Strava |
| Cycling | 0.2 | 0.6 | 0.2 | — | — | HK workouts, Strava |
| Swimming | 0.3 | 0.5 | 0.2 | — | — | HK workouts |
| Strength training | 0.8 | — | 0.2 | — | — | HK workouts (traditional/functional strength) |
| Calisthenics | 0.6 | 0.2 | 0.2 | — | — | HK workouts, push-up Trials |
| HIIT / cardio | 0.3 | 0.5 | 0.2 | — | — | HK workouts |
| Yoga / mobility | 0.2 | 0.4 | 0.4 | — | — | HK workouts |
| Martial arts | 0.4 | 0.4 | — | — | 0.2 | HK workouts |
| Racket & team sports | 0.2 | 0.6 | 0.2 | — | — | HK workouts |
| Sleep | — | — | 1.0 | — | — | HK sleep analysis |
| Mindfulness | — | — | 0.6 | 0.4 | — | HK mindful minutes (whitelisted sources only) |
| Programming | — | — | — | 0.4 | 0.6 | WakaTime, GitHub, focus sessions |
| Design | — | — | — | 0.2 | 0.8 | Focus sessions (tagged) |
| Music practice | — | — | — | 0.3 | 0.7 | Focus sessions (tagged) |
| Writing | — | — | — | 0.5 | 0.5 | Focus sessions (tagged) |
| Language learning | — | — | — | 1.0 | — | Focus sessions (tagged), credentials |
| Study / courses | — | — | — | 1.0 | — | Focus sessions (tagged), credentials |
| Reading | — | — | — | 1.0 | — | Focus sessions (tagged), AI comprehension checks (tier B) |

WIL receives no split XP; it is computed (§5.4).
The full HKWorkoutActivityType → skill mapping is a config file (`config/workout_map.json`), owned by the agent. [VERIFY type list]

## 6. Attribute decline [PROPOSAL — new, not yet discussed]

Attributes show **current form**, so they can fall. The design goal: honest, slow, never humiliating.

**What never drops:** skill levels, character level, achievements, titles, earned classes (they go dormant, §7.3).

**Why an attribute falls**
1. *Effort fades*: E90 is exponentially weighted (half-life 30 days), so inactivity lowers Effort smoothly.
2. *Capability ages*: a capability signal is full weight for 60 days, then its weight slides linearly to 50% at 180 days unless refreshed (new Trial, new wearable reading). If the real measurement itself gets worse (VO₂max falls), it falls.

**Display smoothing** (what the user sees)
- Recomputed once a day at 04:00 local time.
- Increases show immediately.
- **Grace period:** no decrease during the first 7 days of inactivity in that attribute.
- **Max drop:** −2 points per 7 days per attribute.
- **Soft floor:** never below max(Day-0 rating, 60% of the attribute's all-time peak) through inactivity alone. A worse real measurement can go below the floor.

**The Inn (rest mode)**
- User checks into the Inn for illness, travel, exams, holidays: attribute decline and WIL scheduling pause. XP can still be earned.
- 30 Inn days per rolling year, minimum stay 3 days. [TUNABLE]
- Framed as rest, never as failure.

**Communication**
- "At risk" marker on an attribute 3 days before its grace period ends ("AGI may drop in 3 days — one cardio session keeps it").
- Drops appear in the weekly patch notes under "Nerfs" with the reason. No push notification for a drop.
- The attribute breakdown always explains the last change.

Simulated effect (regular user, 30-day break): AGI 62 → 56, back to 61 within 60 days of returning. With Inn: no drop. See `PROGRESSION.md`.

## 7. Classes and ranks

### 7.1 Structure [DECIDED]
A class = **family** (from dominant attributes) + **specialization** (from top skill). Users can hold several classes and pick a main. Names are placeholders. [DECIDED: modern / Gen Z direction, final names later]

| Family | Attributes | Base classes (placeholder names) |
|---|---|---|
| Body | STR / AGI / VIT | Lifter (strength), Runner (endurance), Swimmer, Fighter (martial arts), Mover (yoga + VIT) |
| Mind | INT | Polyglot (languages), Scholar (study), Reader |
| Craft | DEX | Builder (programming), Creator (design), Musician |
| Hybrid | two families ≥ 60 | Coach (body + mind), Founder (mind + craft), Performer (body + craft) |
| Rare | all six ≥ 50, within 10 of each other | Main Character |

### 7.2 Ranks
`Rookie → Grinder → Locked In → Cracked → Goated → Legend` (placeholders)

| Rank | Specialization skill | Family attribute | WIL |
|---|---|---|---|
| Rookie | Lv 10 | — | — |
| Grinder | Lv 30 | ≥ 40 | — |
| Locked In | Lv 50 | ≥ 60 | ≥ 50 |
| Cracked | Lv 75 | ≥ 75 | ≥ 70 |
| Goated | Lv 90 | ≥ 85 | ≥ 80 |
| Legend | Lv 99 | ≥ 90 | ≥ 85 |

### 7.3 Dormant classes [DECIDED]
If an attribute or WIL requirement of the current rank is failed for 14 consecutive days (excluding Inn days), the rank becomes **dormant**: greyed out, kept in history, not shown as main. It reactivates the day the requirement is met again. Skill-level requirements never fail (skills don't drop).

## 8. To-dos and task XP [DECIDED: to-dos earn XP · PROPOSAL: the rules below]

Every to-do has a **category**. The category decides what the XP can touch.

| Category | Linked skill pool | Attributes it can affect |
|---|---|---|
| Body | Body skills | STR / AGI / VIT — only via linked or proof tasks |
| Study | Study, Language, Reading | INT — only via linked or proof tasks |
| Build | Programming, Design, Music, Writing | DEX / INT — only via linked or proof tasks |
| Money | — | None (feeds Treasury quests) |
| Life admin | — | None |
| People | — | None |

Three kinds of task:

| Kind | How it completes | XP | Where XP goes |
|---|---|---|---|
| Plain | User ticks it | Size S/M/L = 10 / 25 / 50 | **Task XP**: counts toward character level, capped at 100 Task XP/day. Never attributes. |
| Proof | User attaches evidence | 50% of the size XP until reviewed | The category's skill → attributes (tier B) |
| Linked | A verified outcome closes it (PR merged, certificate verified, run synced) | The outcome's own XP + size bonus | The category's skill → attributes (tier A/S) |

- Task XP has its own small bar on the status window so it's visible but clearly separate.
- **Open question:** should on-time completion of plain tasks planned ≥ 24 h ahead count toward WIL (max 20% of WIL)? Default for build: **no**.

## 9. Habits, quests, Trials, focus sessions

**Habits** [DECIDED]
- Verified habits are bound to a data source and auto-checked; they feed WIL Adherence.
- Manual habits keep streaks only (ghost); never WIL.
- iOS verifiable habit types: sleep window, steps, workouts per week, focus minutes, coding (WakaTime/GitHub), mindfulness. Screen-time habits are Android-only.

**Quests** [PROPOSAL]
- Daily: 3 quests + 1 optional Trial. Weekly: 2 quests.
- Composition: 1 for the lowest *focus* attribute, 1 from an existing habit, 1 easy win (≥ 80% likely from history).
- Targets relative to the user's 14-day median (e.g. steps = 110% of median, rounded, capped at 15,000).
- Quests auto-complete from data. No manual completion.
- Reward: quest XP bonus = 20% of the underlying event XP (same tier rules) + Rested XP for weekly quests.

**Trials** [DECIDED concept · PROPOSAL protocols]
| Trial | Protocol | Verification | Updates |
|---|---|---|---|
| Push-ups | Max reps in 60 s, chest to ~fist height | On-device pose detection counts reps; video never leaves the phone | STR capability (ACSM norms) |
| Plank | Max hold | Pose detection | STR capability |
| Cooper run | Max distance in 12 min | GPS + motion | AGI capability (VO₂max estimate) |
| Resting HR check | 3-min seated reading | Watch | VIT capability |
- Each Trial can be retaken once per 7 days. Job-change Trials gate class unlocks (optional bonus, not mandatory). [PROPOSAL]

**Focus sessions** (iOS) [PROPOSAL]
- User picks a skill tag (Study, Programming, Design, Music, Writing, Reading, Language) and a length.
- Verified (tier S) if the app stays in the foreground or the session's Shield is active, with ≤ 2 interruptions under 30 s.
- Optional distraction shield via Screen Time API (FamilyControls). [VERIFY entitlement approval needed]

## 10. Treasury [DECIDED concept]
- Separate module, always private, never affects attributes, level or class.
- Features: expense/income log, categories, recurring items, budgets, savings goals, dashboard.
- **Treasury score (0–100)** [PROPOSAL weights]: savings rate 30% · budget adherence 25% · emergency fund months (target 3–6) 20% · bills paid on time 15% · month-to-month consistency 10%.
- Label: "Verified" when ≥ 80% of the month's transactions came from auto-logging; else "Self-tracked".
- Auto-logging (wanted [DECIDED]): see TECH_SPEC §6.

## 11. Achievements [PROPOSAL starter catalog]
Cosmetic only. Types: milestone, standard-based, consistency, Trial, hidden.

| ID | Name | Condition |
|---|---|---|
| ms_skill_10 / 30 / 50 / 75 / 99 | Skill milestones | Any skill reaches the level |
| ms_char_25 / 50 / 75 / 99 | Character milestones | Character level |
| ms_total_1m | Millionaire | 1,000,000 lifetime XP |
| std_vo2_good / excellent / superior | Engine | VO₂max band reached (Cooper) |
| std_cefr_b2 / c1 | Certified | Verified CEFR level |
| std_sleep_30 | Well Rested | 30 nights in 7–9 h window |
| cons_streak_7 / 30 / 100 / 365 | Streaks | Consecutive days with any verified activity |
| cons_who_12 | By the Book | 12 weeks meeting WHO 150 min activity |
| cons_habit_auto | Autopilot | First verified habit set up (Training ch. 4) |
| trial_first | First Trial | Any Trial completed |
| trial_pushup_pb | New PB | Beat own push-up record |
| trial_cooper | Touch Grass | Complete the Cooper Trial |
| tut_prologue | Prologue Complete | Finish the Prologue |
| tut_placed | Placed | Finish Training |
| hid_night_owl | Night Owl Reformed | 14 nights in bed before 23:00 after ≥ 14 nights after 01:00 |
| hid_comeback | Comeback Arc | Regain a peak attribute after a drop of ≥ 5 |
| hid_inn | Well Rested Traveller | Use the Inn and return within the stay |

## 12. Tutorial [DECIDED: finishable in one sitting · skippable · push-up Trial stays]

The whole tutorial can be completed in one session (~15 min). Nothing is locked by days.
Principle: a chapter completes on the **setup action** inside the app; anything that needs real time becomes an optional **First Quest**.

**Prologue** (required, ~4 min)
1. Create character (name, avatar, up to 3 focus goals)
2. Equip gear (connect HealthKit + optional sources)
3. Import history → past data becomes XP (first level-ups within 2 minutes)
4. Stat reveal (Unrated → revealed)
5. Prologue complete → title, frame, Rested XP pool; 2× newcomer boost starts (§4)

**Training** (skippable as a whole or per chapter, any order, ~10 min total)
| # | Title | Teaches | Action (completes the chapter) | Reward |
|---|---|---|---|---|
| 1 | Status tour | Character sheet, measured vs earned, ghost bar | Coach-mark tour of the status window | Rested XP |
| 2 | Prove it | Measured stats | 30-second push-up Trial (camera) | First Trial + STR rated |
| 3 | Lock in | Earned stats, verification | 2-minute focus session | Rested XP |
| 4 | Make it automatic | WIL | Set up one verified habit | Autopilot badge |
| 5 | Pick a path | Classes | Choose a target class | Rested XP |
| 6 | Gear & data | To-dos, Treasury, privacy | Add a to-do, log one expense, open privacy center | Rested XP |

- Status window shows "Training n/6" until finished or dismissed. Skip anytime; replay from Settings.
- **Training complete**: placement results computed immediately from imported history + anything done in Training. Rewards: "Placed" frame + Rested XP.

**First Quests** (optional, no deadline, appear after Training or skip)
| Quest | Completes when | Reward |
|---|---|---|
| Pass your first habit check | The verified habit passes (usually that night) | Rested XP |
| Touch grass | Cooper Trial or a 20-min outdoor walk | Touch Grass badge |
| First 7-day streak | 7 consecutive days with verified activity | Frame |
| Read your first patch notes | First weekly recap opened | Rested XP |

**Narrative voice — open.** Copy lives in a strings file. Default: hybrid (System voice for events, "Future You" for story beats). [ASSUMPTION]

## 13. Avatar (v2) [DECIDED: 3D, performance-only · PROPOSAL: mapping]

- The user designs a **base body** in the Prologue (height, build, skin tone, hair, face). Stats only add on top of it.
- **No body mass, body fat or BMI input**, ever. No body type is presented as better.
- **Art direction [DECIDED]: 3D anime / video-game style** — cel-shaded with ink outlines, big expressive eyes, stylized proportions. Not chibi/cartoonish, not photoreal. Reference prototype: `design/prototypes/avatar3d/`.
- 3D (glTF/.glb) with blend shapes driven by attributes and face parameters; body changes move in steps and update with the daily attribute recompute.

| Driver | Visual effect |
|---|---|
| STR | Muscle definition, shoulder/arm build (blend shapes, 4 tiers: <30, 30–54, 55–79, 80+) |
| AGI | Posture, lighter stance, livelier idle animation (same tiers) |
| VIT | Skin glow, eye brightness, energetic vs. tired idle (tired after a poor night) |
| INT / DEX / WIL | Gear and effects, not body: glasses/book, tools/laptop, flame aura at high WIL |
| Main class | Outfit set |
| Achievements | Cosmetic accessories and frames |

- v1 ships a placeholder avatar card on the status window (initials badge) so the layout is ready.
- Art source is open (DECISIONS O14): Claude-built stylized prototype first, upgrade path to open-licensed or artist-made models without changing the stat mapping.

### 13.1 Face scan (v2) [DECIDED: stylized likeness · scan stays on device]
- Optional step in Create character: **Scan my face** or **Build it myself**. Also reachable from Settings → Face & avatar.
- **Style B — stylized likeness in the anime/game art style:** the scan *measures* the face and fills the face editor's sliders; it never puts a photoreal face on the avatar.
- Face parameter contract (0–100): `fw, jaw, eye, sp, nose, lips, brow`; plus `skin`, `eyeColor`, `hairColor`, `hair`, `glasses`, `beard`. See `design/prototypes/avatar3d/README.md`.
- Measured values (0–100 each): face width, jaw, cheekbones, eye size, eye spacing, nose width, lips, brows (+ more as the head model grows, ~20–30 total) and skin tone (sampled, snapped to the palette). Hair, beard and glasses are chosen from a library.
- **Hard rule:** the raw scan (depth mesh, camera frames) is processed on the phone and deleted immediately. Only the final slider values and choices are stored. Never uploaded, never used for anything except the avatar.
- Separate explicit consent before scanning (biometric data). Users can redo or delete at any time.
- Body is never taken from the scan; it comes from stats (§13).
