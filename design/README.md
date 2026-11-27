# Design source

Exported from the design canvas on 2026-11-26: https://claude.ai/artifact/AQkcFnfZhkrGT5fPPB4S66 (owner-only link; these files are the copy agents should use).

Each `*.dc.html` file is one screen (390 × 844 iPhone frame unless noted). Styles are inline, so the markup *is* the spec: colors, spacing, radii, font sizes and copy. The `<script>` block at the bottom of each file holds the sample data and, for interactive screens, the behavior. The files need the canvas runtime to render; read them as source, don't try to open them in a browser.

## Design tokens
| Token | Value |
|---|---|
| Ink (text, primary buttons) | #111113 |
| Paper (app background) | #F5F5F2 |
| Surface (cards) | #FFFFFF |
| Border | #E4E4E0 |
| Muted text | #5E5E66 |
| Accent (measured stats, links) | #4338CA · tint #EEF0FF / #F2F3FF · text on tint #3730A3 |
| Earned stats | #0F766E · tint #EEF7F5 · text on tint #115E59 |
| Success | #16A34A · tint #ECFDF3 · text #166534 |
| Warning | #D97706 · text #B45309 |
| Dark surfaces (onboarding/tutorial) | #111113 · #1C1C22 · #26262E |
| Radius | cards 20 · tiles 14 · buttons 12–16 · pills 999 |
| Fonts | Space Grotesk (headings), Inter (UI), JetBrains Mono (all numbers) |
| Touch targets | ≥ 44 pt |

## Shared components
- `Icon.dc.html` — 55 stroke icons on a 24 grid; the path data in its script is the icon set to port.
- `TabBar.dc.html` — bottom navigation (Status, Log, Quests, Treasury).
- `Components.dc.html` — component library sheet (buttons, inputs, badges, progress, cards).

## End-to-end flow
`Flow.dc.html` — the whole app journey on one board: Entry → Prologue → Training → Core app (tab bar, every screen reachable from each tab) + system events.

## Clickable prototype
In the canvas, open Play on `Welcome` to click through sign-up → Prologue → Training → the core app. Every screen links to the next one.

## Screens by area
| Area | Files |
|---|---|
| Core | Main (status window), Breakdown, Quests, Treasury, Log, SkillDetail |
| Auth & onboarding | Welcome, SignUp, Login, CreateCharacter, EquipGear, Reveal, PrologueComplete |
| Features | Trial, Focus, Classes, Achievements, LevelUp, NewHabit, AddExpense, Credentials, PatchNotes, Settings |
| Avatar & face scan (v2) | FaceSetup, FaceScan, FaceAdjust (live 3D, cel-shaded; source in `prototypes/avatar3d/`) |
| Tutorial (Training) | TutMap (Training hub + First Quests), TutIntro, TutCoach, TutChecklist, TutReward, TutFinale |

Sample data on screens (names, numbers, rank/class names) is placeholder.
