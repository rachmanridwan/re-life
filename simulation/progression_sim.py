"""
MC Maxxing — progression simulation (v0.1, proposal for discussion)

What it does
1. Defines three player archetypes (casual / regular / hardcore) as daily activity patterns.
2. Converts activity into skill XP using the XP formula + daily soft cap from GAME_DESIGN.md.
3. Fits the skill and character XP curves so the archetypes hit the PACING TARGETS below.
4. Simulates attribute growth, a 30-day break, decline rules, and the Inn (rest) freeze.
5. Writes results to simulation/results/ (CSV + markdown tables used in docs/PROGRESSION.md).

Run:  python simulation/progression_sim.py
Deps: numpy, scipy
All numbers are tunables, not truths. Change PACING TARGETS or archetypes and re-run.
"""
import csv, math, os
import numpy as np
from scipy.optimize import least_squares

RNG = np.random.default_rng(42)
DAYS = 365 * 4
OUT = os.path.join(os.path.dirname(__file__), "results")
os.makedirs(OUT, exist_ok=True)

# ---------------------------------------------------------------- XP rules
SOFT_FULL = 90      # first 90 raw XP per skill per day count fully
SOFT_EXTRA = 150    # above that, extra XP approaches +150 asymptotically (daily max ~240)

def soft_cap(raw):
    if raw <= SOFT_FULL:
        return raw
    return SOFT_FULL + SOFT_EXTRA * (1 - math.exp(-(raw - SOFT_FULL) / SOFT_EXTRA))

# ---------------------------------------------------------------- archetypes
# skill: (minutes per active day, intensity multiplier, probability of activity that day)
ARCHETYPES = {
    "casual": {
        "walking": (30, 1.0, 0.80), "reading": (25, 1.0, 0.35), "sleep": (30, 1.0, 0.70),
    },
    "regular": {
        "walking": (45, 1.0, 0.90), "running": (35, 1.3, 0.40), "programming": (120, 1.0, 0.80),
        "reading": (30, 1.0, 0.50), "sleep": (40, 1.0, 0.85),
    },
    "hardcore": {
        "walking": (60, 1.0, 1.00), "running": (60, 1.4, 0.70), "lifting": (60, 1.3, 0.60),
        "programming": (180, 1.0, 0.90), "study": (60, 1.0, 0.80), "sleep": (45, 1.0, 0.95),
    },
}
MAIN_SKILL = {"casual": "walking", "regular": "programming", "hardcore": "programming"}

def daily_skill_xp(arch, days=DAYS):
    out = {s: np.zeros(days) for s in ARCHETYPES[arch]}
    for s, (mins, inten, p) in ARCHETYPES[arch].items():
        for d in range(days):
            if RNG.random() < p:
                raw = mins * inten * RNG.uniform(0.7, 1.3)
                out[s][d] = soft_cap(raw)
    return out

XP = {a: daily_skill_xp(a) for a in ARCHETYPES}

# ---------------------------------------------------------------- curve form
# total XP needed to reach level L (L=1 -> 0):  a * (L-1)^p
# (power curve: early levels fast, steady slowdown, max level reachable in ~1 year)
def curve(L, a, p):
    n = np.asarray(L, dtype=float) - 1
    return a * n ** p

def level_at(total_xp, params, max_lv=99):
    lv = 1
    for L in range(2, max_lv + 1):
        if total_xp >= curve(L, *params):
            lv = L
        else:
            break
    return lv

def day_reaching(cum, need):
    idx = np.argmax(cum >= need)
    return int(idx) + 1 if cum[idx] >= need else None

# ---------------------------------------------------------------- PACING TARGETS (proposal)
# Skill curve: (archetype, level, target day)
SKILL_TARGETS = [
    ("regular", 10, 4), ("regular", 30, 25), ("regular", 50, 80),
    ("regular", 75, 200), ("regular", 99, 365),
]
# Character curve uses total XP across all skills
CHAR_TARGETS = [
    ("regular", 10, 3), ("regular", 25, 18), ("regular", 50, 90),
    ("regular", 75, 210), ("regular", 99, 365),
]

def fit(targets, series_fn):
    def resid(p):
        a, pw = p
        r = []
        for arch, L, day in targets:
            cum = np.cumsum(series_fn(arch))
            need = curve(L, a, pw)
            have = cum[day - 1]
            r.append(math.log(max(need, 1)) - math.log(max(have, 1)))
        return r
    res = least_squares(resid, x0=[10, 2.0], bounds=([0.1, 1.0], [5000, 4.0]))
    return res.x

skill_series = lambda arch: XP[arch][MAIN_SKILL[arch]]
char_series = lambda arch: sum(XP[arch].values())
SKILL_P = fit(SKILL_TARGETS, skill_series)
CHAR_P = fit(CHAR_TARGETS, char_series)

# ---------------------------------------------------------------- attributes (AGI example)
# weights from GAME_DESIGN.md: running -> AGI 0.7, walking -> AGI 0.6
AGI_W = {"running": 0.7, "walking": 0.6, "cycling": 0.6}
HALF_LIFE = 30          # days, exponential weighting inside the 90-day window
WINDOW = 90
E_REF = 9000            # 90-day weighted AGI XP that counts as "maxed effort" (tunable)
GRACE_DAYS = 7          # no decline in the first 7 inactive days
MAX_DROP_PER_WEEK = 2   # display can fall at most 2 points per 7 days
FLOOR_RATIO = 0.6       # soft floor = max(day-0 rating, 60% of peak)
CAP0 = {"casual": 30, "regular": 45, "hardcore": 70}   # starting VO2max percentile

def agi_series(arch, break_start=None, break_len=30, inn=False):
    days = 730
    daily = sum(XP[arch].get(s, np.zeros(DAYS))[:days] * w for s, w in AGI_W.items())
    daily = daily.copy()
    if break_start is not None:
        daily[break_start:break_start + break_len] = 0
    decay = 0.5 ** (1 / HALF_LIFE)
    weights = np.array([decay ** k for k in range(WINDOW)])
    cap = CAP0[arch]
    shown, peak, day0, last_active, frozen = [], 0, None, 0, False
    for d in range(days):
        lo = max(0, d - WINDOW + 1)
        win = daily[lo:d + 1][::-1]
        e = float(np.dot(win, weights[:len(win)])) * (WINDOW / weights.sum())
        effort = min(1.0, math.sqrt(e / E_REF))   # sqrt: early gains fast, top end needs real volume
        # capability (percentile) drifts toward a target set by recent effort
        target = CAP0[arch] + 40 * effort
        tau = 120 if target > cap else 60      # slow to build, faster to lose
        cap += (target - cap) / tau
        raw = 99 * (0.5 * min(cap, 99) / 100 + 0.5 * effort)
        if daily[d] > 0:
            last_active = d
        in_break = break_start is not None and break_start <= d < break_start + break_len
        frozen = inn and in_break
        if not shown:
            val = raw; day0 = raw
        else:
            prev = shown[-1]
            if raw >= prev or frozen:
                val = raw if not frozen else prev
            elif d - last_active < GRACE_DAYS:
                val = prev
            else:
                floor = max(day0, FLOOR_RATIO * peak)
                val = max(raw, prev - MAX_DROP_PER_WEEK / 7, min(prev, floor))
        peak = max(peak, val)
        shown.append(val)
    return np.array(shown)

# ---------------------------------------------------------------- reports
def write_tables():
    lines = []
    lines.append("## Fitted curves\n")
    lines.append(f"Skill curve: total_xp(L) = {SKILL_P[0]:.3f} * (L-1)^{SKILL_P[1]:.4f}\n")
    lines.append(f"Character curve: total_xp(L) = {CHAR_P[0]:.3f} * (L-1)^{CHAR_P[1]:.4f}\n")

    lines.append("\n## XP needed per level (selected)\n")
    lines.append("| Level | Skill total XP | Character total XP |\n|---|---|---|\n")
    for L in [2, 5, 10, 20, 30, 40, 50, 60, 70, 75, 80, 90, 92, 99]:
        lines.append(f"| {L} | {curve(L, *SKILL_P):,.0f} | {curve(L, *CHAR_P):,.0f} |\n")

    lines.append("\n## Pacing: day each level is reached\n")
    lines.append("| Archetype | Main skill | Avg main-skill XP/day | Skill Lv10 | Lv30 | Lv50 | Lv75 | Lv99 | Avg total XP/day | Char Lv10 | Lv25 | Lv50 | Lv75 | Lv99 |\n")
    lines.append("|---|---|---|---|---|---|---|---|---|---|---|---|---|---|\n")
    for a in ARCHETYPES:
        sc = np.cumsum(skill_series(a)); cc = np.cumsum(char_series(a))
        def fmt(x): return "—" if x is None else (f"{x}d" if x < 365 else f"{x/365:.1f}y")
        row = [a, MAIN_SKILL[a], f"{skill_series(a).mean():.0f}"]
        row += [fmt(day_reaching(sc, curve(L, *SKILL_P))) for L in (10, 30, 50, 75, 99)]
        row += [f"{char_series(a).mean():.0f}"]
        row += [fmt(day_reaching(cc, curve(L, *CHAR_P))) for L in (10, 25, 50, 75, 99)]
        lines.append("| " + " | ".join(row) + " |\n")
    lines.append("\n(— = not reached within 4 simulated years)\n")

    lines.append("\n## Levels at checkpoints\n")
    lines.append("| Archetype | Day 7 | Day 30 | Day 90 | Day 180 | Day 270 | Year 1 | Year 2 |\n|---|---|---|---|---|---|---|---|\n")
    for a in ARCHETYPES:
        sc = np.cumsum(skill_series(a)); cc = np.cumsum(char_series(a))
        cells = [f"S{level_at(sc[d-1], SKILL_P)} / C{level_at(cc[d-1], CHAR_P)}" for d in (7, 30, 90, 180, 270, 365, 730)]
        lines.append(f"| {a} | " + " | ".join(cells) + " |\n")
    lines.append("\nS = main skill level, C = character level.\n")

    lines.append("\n## AGI attribute scenarios (1–99)\n")
    lines.append("| Scenario | Day 0 | Day 30 | Day 90 | Day 199 (before break) | Day 229 (end of 30-day break) | Day 290 | Day 365 | Day 730 |\n|---|---|---|---|---|---|---|---|---|\n")
    scen = [
        ("casual", None, False), ("regular", None, False), ("hardcore", None, False),
        ("regular + 30-day break", 199, False), ("regular + break, Inn freeze on", 199, True),
    ]
    rows_csv = []
    for name, bs, inn in scen:
        arch = name.split(" ")[0]
        s = agi_series(arch, break_start=bs, inn=inn)
        pts = [0, 29, 89, 198, 228, 289, 364, 729]
        lines.append(f"| {name} | " + " | ".join(f"{s[p]:.0f}" for p in pts) + " |\n")
        rows_csv.append((name, s))
    with open(os.path.join(OUT, "agi_daily.csv"), "w", newline="") as f:
        w = csv.writer(f); w.writerow(["day"] + [n for n, _ in rows_csv])
        for d in range(730):
            w.writerow([d] + [f"{s[d]:.2f}" for _, s in rows_csv])

    with open(os.path.join(OUT, "summary.md"), "w") as f:
        f.writelines(lines)
    print("".join(lines))

if __name__ == "__main__":
    write_tables()
