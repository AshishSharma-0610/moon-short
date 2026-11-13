"""Synthesised sound effects + room tone for "The Moon Rock Heist" (own DSP, no samples).
Every event time comes from timeline.py (voice cues), so it follows the voice-over when `npm run sync` re-times it."""
import numpy as np
import dsp
from dsp import SR, ns, tt, place, pan, st, lp, hp, bp, fades, colored, modal, dbg, TAU
import instruments as I
import sfx_gen as G
import timeline as T


# ---------------------------------------------------------------- generators
def thump(r, f=70.0, dur=0.32, heavy=1.0):
    t = tt(dur)
    y = np.sin(TAU * (f + 60 * np.exp(-t / 0.03)) * t) * np.exp(-t / 0.09) * heavy
    y += lp(r.standard_normal(len(t)), 900) * np.exp(-t / 0.012) * 0.5
    return fades(y, 0.001, 0.03)


def pop(r, f0=420.0, f1=980.0, dur=0.12):
    t = tt(dur)
    f = f0 + (f1 - f0) * (1 - np.exp(-t / 0.02))
    return fades(np.sin(np.cumsum(TAU * f / SR)) * np.exp(-t / 0.035), 0.0005, 0.02)


def boing(r, f0=170.0, f1=640.0, dur=0.55):
    """cartoon grow: pitch sweeps up with a springy wobble"""
    t = tt(dur)
    f = f0 + (f1 - f0) * (1 - np.exp(-t / 0.09)) + 38 * np.sin(TAU * 11 * t) * np.exp(-t / 0.25)
    y = np.sin(np.cumsum(TAU * f / SR)) + 0.35 * np.sin(np.cumsum(TAU * 2 * f / SR))
    return fades(y * np.exp(-t / 0.28) * 0.7, 0.004, 0.08)


def air(dur, r, peak=0.4, lo=500, hi=3200, gain=0.6):
    return G.whoosh(dur, r, peak=peak, f_lo=lo, f_hi=hi) * gain


def rub(dur, r, rate=2.4):
    """two hands rubbing: band-limited noise gated by the stroke rate (the manager's rub is sin(15 t) = 2.4 Hz)"""
    t = tt(dur)
    n = bp(r.standard_normal(len(t)), 1800, 6500) * (0.35 + 0.65 * np.abs(np.sin(TAU * rate * t / 2)) ** 1.5)
    return fades(n * 0.5, 0.05, 0.08)


def kaching(r):
    """cash-register bell + drawer: the ironic sting on the cut to the manager"""
    n = ns(1.2)
    y = np.zeros(n)
    t = tt(1.2)
    drawer = bp(r.standard_normal(n), 700, 3600) * np.exp(-t / 0.05) * 0.5
    y += drawer
    for k, t0 in enumerate([0.07, 0.15]):
        b = modal(1.0, [(2093 * (1 + 0.5 * k), 1.0, 0.5), (2637 * (1 + 0.5 * k), 0.6, 0.45), (5300, 0.25, 0.18), (7100, 0.12, 0.1)], r)
        i = ns(t0)
        y[i: i + len(b)] += b[: n - i] * (0.6 if k == 0 else 0.8)
    return fades(y, 0.001, 0.2)


def hollow(r, f=390.0):
    """a single empty-cart 'tok': a can knocking in a big metal basket"""
    y = modal(0.5, [(f, 1.0, 0.07), (f * 2.4, 0.4, 0.04), (f * 4.1, 0.2, 0.025)], r)
    t = tt(0.5)
    y += lp(r.standard_normal(len(t)), 2500) * np.exp(-t / 0.004) * 0.4
    return fades(y, 0.0005, 0.1)


def ping(f, r, dur=0.4):
    return I.musicbox(f, 0.5, r, dur)


def shimmer(r, dur=0.9, f0=900.0, f1=3600.0):
    """rising glassy swirl: the brain is being tricked"""
    t = tt(dur)
    y = np.zeros_like(t)
    for k in range(6):
        f = (f0 + (f1 - f0) * (t / dur) ** 1.4) * (1 + 0.5 * k) / 1.0
        y += np.sin(np.cumsum(TAU * np.minimum(f, 15000) / SR) + r.uniform(0, TAU)) * 0.2 / (k + 1)
    y *= np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 1.2 * (0.6 + 0.4 * np.sin(TAU * 9 * t))
    return fades(y, 0.02, 0.1)


def wobble(r, dur=0.9):
    """the brain pulsing: a wobbling soft 'woo-woo' (pulse rate matches fxBrain, 12 rad/s)"""
    t = tt(dur)
    f = 330 + 60 * np.sin(12 * t)
    y = np.sin(np.cumsum(TAU * f / SR)) * (0.6 + 0.4 * np.sin(12 * t)) * np.exp(-t / 0.7)
    return fades(y * 0.5, 0.02, 0.15)


def ding_dong(r):
    """door chime as we step out into the golden evening"""
    a = I.vibes(659.0, 0.6, r, dur=1.4, damp=0.9)
    b = I.vibes(523.0, 0.6, r, dur=1.6, damp=1.1)
    y = np.zeros(ns(1.7))
    y[: len(a)] += a
    k = ns(0.42)
    y[k: k + len(b)] += b[: len(y) - k]
    return y


def bip(r, f=2750.0, dur=0.09):
    t = tt(dur)
    return fades((np.sin(TAU * f * t) + 0.3 * np.sin(TAU * 2 * f * t)) * 0.5, 0.002, 0.01)


def cart_roll(dur, r, level=1.0, heavy=False):
    """wheels on tile: a rumble + a cloud of tiny wire rattles"""
    t = tt(dur)
    rum = lp(colored(len(t), r, 1.0, 40), 220) * (0.7 + 0.3 * np.sin(TAU * 3.1 * t))
    rat = G.rattle(dur, r, density=26 if not heavy else 14, heavy=heavy)
    rat = rat[: len(t)] if len(rat) >= len(t) else np.pad(rat, (0, len(t) - len(rat)))
    return fades((rum * 0.9 + rat * 0.22) * level, 0.2, 0.25)


def room_tone(dur, r):
    """fluorescent hum (120 Hz + harmonics) + air handling + a distant murmur of shoppers"""
    t = tt(dur)
    hum = (np.sin(TAU * 120 * t) + 0.5 * np.sin(TAU * 240 * t + 1) + 0.25 * np.sin(TAU * 360 * t + 2)) * 0.012
    air_ = lp(colored(len(t), r, 1.0, 30), 700) * 0.05
    mur = G.babble(dur, r, 150.0, 1.0)
    mur = lp(mur[: len(t)], 1400) * 0.018
    return st(hum + air_ + mur)


# ---------------------------------------------------------------- new generators for this story
def jet(dur, r, peak=0.45):
    """a jet passing: a rising-then-falling band of noise + low rumble (doppler-ish)"""
    t = tt(dur); n = r.standard_normal(len(t))
    c = 500 + 1800 * np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 1.5
    y = np.zeros_like(t)
    for k, f in enumerate([400, 900, 1700, 3200]):
        y += bp(n, f * 0.8, f * 1.8) * (0.8 / (k + 1)) * (0.6 + 0.8 * np.sin(np.pi * t / dur) ** (1 + k * 0.6))
    y += lp(r.standard_normal(len(t)), 160) * 1.2
    return fades(y * np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 1.3 * peak, 0.05, 0.1)

def click(r, f=2400.0, dur=0.05):
    t = tt(dur); return fades(bp(r.standard_normal(len(t)), f * 0.6, f * 1.6) * np.exp(-t / 0.008), 0.0005, 0.01)

def snip(r):
    """scissors: two quick metallic 'shk' strokes"""
    y = np.zeros(ns(0.4))
    for k, t0 in enumerate([0.0, 0.11]):
        c = modal(0.25, [(3800, 1.0, 0.03), (5600, 0.6, 0.02), (7400, 0.3, 0.015)], r) + bp(r.standard_normal(ns(0.25)), 2500, 9000) * np.exp(-tt(0.25) / 0.02) * 0.8
        i = ns(t0); y[i:i + len(c)] += c[: len(y) - i] * (1.0 - 0.15 * k)
    return fades(y, 0.0005, 0.08)

def alarm(r, dur=0.8):
    t = tt(dur); f = np.where((t * 4) % 1 < 0.5, 620.0, 840.0)
    return fades(np.sin(np.cumsum(TAU * f / SR)) * 0.35 * (0.8 + 0.2 * np.sin(TAU * 8 * t)), 0.01, 0.1)

def gulp(r):
    t = tt(0.18); f = 260 - 140 * t / 0.18
    return fades(np.sin(np.cumsum(TAU * f / SR)) * np.exp(-t / 0.07) * 0.8, 0.002, 0.04)

def whistle(r, dur=0.4, f0=2300.0, f1=3200.0):
    t = tt(dur); f = f0 + (f1 - f0) * (t / dur) ** 0.7 + 25 * np.sin(TAU * 38 * t)
    return fades((np.sin(np.cumsum(TAU * f / SR)) + 0.4 * lp(r.standard_normal(len(t)), 6000)) * 0.4, 0.01, 0.05)

def sad_horn(r):
    """'wah wah wah wahhh': four falling sawtooth notes through a moving low-pass (the classic losing sting)"""
    out = np.zeros(ns(2.2)); t0 = 0.0
    for k, (f, d) in enumerate([(247.0, 0.38), (233.0, 0.38), (220.0, 0.38), (196.0, 0.95)]):
        t = tt(d); ph = np.cumsum(TAU * (f + (8 * np.sin(TAU * 6 * t) if k == 3 else 0)) / SR)
        y = sum(np.sin(h * ph) / h for h in range(1, 9)) * (0.5 + 0.3 * np.sin(np.pi * t / d))
        y = 0.5 * lp(y, 700) + 0.5 * lp(y, 1500) * np.sin(np.pi * t / d) ** 0.5
        i = ns(t0); y = fades(y * 0.45, 0.02, 0.08); out[i:i + len(y)] += y[: len(out) - i]; t0 += d + 0.02
    return out

def paper(r, dur=0.5):
    t = tt(dur); return fades(bp(r.standard_normal(len(t)), 1800, 7000) * (0.5 + 0.5 * np.sin(TAU * 17 * t)) ** 2 * np.exp(-t / 0.3) * 0.5, 0.01, 0.1)

def pa_chime(r):
    a = I.vibes(784.0, 0.5, r, dur=1.0, damp=1.0); b = I.vibes(622.0, 0.5, r, dur=1.4, damp=1.0)
    y = np.zeros(ns(1.7)); y[: len(a)] += a; k = ns(0.38); y[k:k + len(b)] += b[: len(y) - k]
    return y

def coin_cascade(r, dur=0.9):
    y = np.zeros(ns(dur))
    for t0 in np.sort(r.uniform(0, dur * 0.8, 14)):
        c = G.clink(r, 2600 + r.uniform(-500, 900), 0.1); i = ns(t0); y[i:i + len(c)] += c[: len(y) - i] * r.uniform(0.35, 0.8)
    return y

def tick(r, f=900.0):
    t = tt(0.04); return fades(np.sin(TAU * f * t) * np.exp(-t / 0.006), 0.0003, 0.01)

def laugh(r, n=4, f0=240.0):
    """'ha ha ha ha': short voiced bursts through a vowel-ish band"""
    y = np.zeros(ns(0.2 * n + 0.1))
    for k in range(n):
        d = 0.11; t = tt(d); f = f0 * (1 + 0.06 * (k % 2)) * (1 - 0.04 * k)
        v = (np.sin(TAU * f * t) + 0.5 * np.sin(TAU * 2 * f * t) + 0.3 * np.sin(TAU * 3 * f * t)) * np.sin(np.pi * t / d) ** 1.5
        v = bp(v + 0.2 * r.standard_normal(len(t)), 600, 1800)
        i = ns(0.17 * k); y[i:i + len(v)] += v[: len(y) - i] * 0.8
    return fades(y, 0.005, 0.05)

def can_open(r):
    """psst: a soda can tab"""
    t = tt(0.5)
    return fades(hp(r.standard_normal(len(t)), 4500) * np.exp(-t / 0.18) * 0.5, 0.001, 0.08) + np.pad(click(r, 3200), (0, ns(0.5) - ns(0.05)))[: len(t)] * 0.6

def gavel(r):
    y = modal(0.5, [(190, 1.0, 0.06), (430, 0.7, 0.045), (950, 0.35, 0.03)], r)
    t = tt(0.5); y += lp(r.standard_normal(len(t)), 3000) * np.exp(-t / 0.006) * 0.6
    return fades(y, 0.0005, 0.12)

# ---------------------------------------------------------------- the sound design
def design(seed=5):
    r = dsp.rng(seed)
    N = ns(T.DUR)
    sfx = np.zeros((2, N + SR * 2))
    amb = room_tone(T.DUR + 1.0, dsp.rng(seed + 1))[:, : N + SR * 2]
    amb = np.pad(amb, ((0, 0), (0, max(0, N + SR * 2 - amb.shape[1]))))
    ev = []

    def at(t, label, x, g=1.0, p=0.0):
        x = np.asarray(x)
        place(sfx, pan(x, p) if x.ndim == 1 else x, t, g)
        ev.append((t, label))

    S = T.shot_start
    ts = T.ts
    # --- shots 1-2: the midnight vault
    at(0.1, "vault door creak", G.swing_squeak(r, 0.4, True), 0.4, -0.3)
    for k in range(4): at(0.5 + 0.8 * k, f"tiptoe {k + 1}", G.stroll_step(r, 0.3), 0.35, 0.1 * (k % 2))
    at(ts("Apollo") - 0.1, "glow shimmer", shimmer(r, 1.0, 800, 3200), 0.45, 0.2)
    n = 15
    for i in range(n): at(ts("twenty-one") + (ts("dollars") + 0.4 - ts("twenty-one")) * i / n, f"cash stack {i + 1}", thump(r, 140 + 4 * (i % 5), 0.12, 0.5), 0.45, 0.1)
    at(ts("dollars"), "ka-ching: twenty-one million", kaching(r), 0.9, 0.0)
    # --- shots 3-5: the hotel romance
    for i, w in enumerate(["scattered", "them", "across", "hotel", "bed"]):
        at(ts(w) + 0.25 - 0.4, f"rock {i + 1} whoosh", air(0.4, r, 0.5, 900, 4000, 0.45), 0.5, -0.4 + 0.2 * i); at(ts(w) + 0.25, f"rock {i + 1} lands", thump(r, 110 + 8 * i, 0.18, 0.7), 0.6, -0.4 + 0.2 * i)
    at(ts("tell"), "music-box twinkle", I.musicbox(1319.0, 0.5, r, dur=1.4), 0.5, 0.2)
    at(ts("moon", 1), "giggle", laugh(r, 3, 330.0), 0.55, 0.3)
    at(ts("romantic"), "heart twinkle", I.glock(1976.0, 0.5, r, dur=1.2), 0.5, 0.0)
    # --- shot 6: the gate
    at(S(6), "night crickets", G.breeze(3.0, r, 0.5, 0.2, 0.3), 0.3, 0.0)
    at(ts("clearance"), "badge beep", bip(r), 0.7, 0.3); at(ts("bypass"), "barrier whirr", air(0.8, r, 0.4, 200, 900, 0.5), 0.5, 0.3)
    # --- shots 7-8: the safe
    for k in range(6): at(ts("locked") + 0.12 * k, f"dial click {k + 1}", tick(r, 1100), 0.45, 0.0)
    at(ts("six-hundred-pound"), "heavy thud", thump(r, 55, 0.5, 1.4), 0.9, 0.0); at(ts("six-hundred-pound"), "gulp", gulp(r), 0.4, 0.2)
    at(ts("dolly") - 0.1, "dolly squeak", G.swing_squeak(r, 0.35, True), 0.5, 0.0); at(ts("dolly"), "safe thump", thump(r, 70, 0.3, 1.0), 0.8, 0.0)
    # --- shots 9-10: past the sleeping guard, into the car, away
    at(ts("wheeled") - 0.2, "dolly wheels", cart_roll(1.8, r, 0.7, True), 0.7, 0.0)
    for k in range(2): at(ts("wheeled") + 0.1 + 0.9 * k, f"guard snore {k + 1}", wobble(r, 0.8), 0.4, 0.3)
    at(ts("car") + 0.25, "trunk thump", thump(r, 80, 0.3, 1.1), 0.8, 0.0)
    at(ts("drove") - 0.15, "engine roar", jet(2.6, r, 0.5), 0.6, 0.0); at(ts("drove"), "tyre screech", air(0.9, r, 0.6, 1500, 6000, 0.7), 0.55, 0.0)
    # --- shots 11-12: pristine samples
    at(ts("pristine"), "pristine glint", I.glock(2093.0, 0.5, r, dur=1.0), 0.5, 0.2)
    for k in range(3): at(ts("nitrogen") + 0.25 * k, f"nitrogen hiss {k + 1}", air(0.5, r, 0.5, 3000, 9000, 0.5), 0.5, 0.2 * (k - 1))
    # --- shots 13-16: the smash
    at(ts("smashed") - 0.25, "hammer swing", air(0.3, r, 0.7, 400, 2500, 0.8), 0.7, 0.0)
    at(ts("smashed"), "SMASH", coin_cascade(r, 0.9), 1.0, 0.0); at(ts("smashed"), "smash thump", thump(r, 65, 0.4, 1.4), 1.0, 0.0)
    for k in range(4): at(ts("instantly") + 0.15 * k + 0.1, f"dust whump {k + 1}", thump(r, 90, 0.3, 0.5), 0.4, -0.4 + 0.27 * k)
    at(ts("three"), "scientists gasp", gulp(r), 0.6, -0.2); at(ts("three") + 0.2, "scientists gasp 2", gulp(r), 0.6, 0.2); at(ts("history"), "low sting", thump(r, 60, 0.6, 1.0), 0.6, 0.0)
    for i, w in enumerate(["bedsheets", "dust", "sweat"]): at(ts(w), f"drip {i + 1}", pop(r, 700, 300), 0.5, 0.0)
    # --- shot 17: the listing
    for k in range(10): at(ts("Desperate") + 0.9 + 0.22 * k, f"typing {k + 1}", tick(r, 1200 + 40 * (k % 3)), 0.4, 0.0)
    at(ts("online"), "listing posted: ding", ding_dong(r), 0.5, 0.0)
    # --- shots 18-22: the sting
    at(ts("Belgian"), "collector ting", I.vibes(659.0, 0.5, r, dur=1.0, damp=0.6), 0.4, -0.2)
    for k in range(3): at(ts("But", 1) - 0.1 + 0.28 * k, f"phone ring {k + 1}", bip(r, 1900, 0.12), 0.55, 0.0)
    at(ts("FBI"), "dun-dun", thump(r, 70, 0.5, 1.3), 0.9, 0.0); at(ts("FBI") + 0.3, "dun-dun 2", thump(r, 52, 0.7, 1.3), 0.9, 0.0)
    at(ts("Florida"), "tropical bird", whistle(r, 0.3, 2800, 3800), 0.4, 0.3)
    at(ts("met"), "door chime", ding_dong(r), 0.5, 0.0)
    for k in range(2): at(ts("slapped") + 0.08 * k, f"cuff click {k + 1}", click(r, 2200 - 400 * k), 0.8, 0.0)
    at(ts("slapped"), "cuff stinger", thump(r, 70, 0.4, 1.3), 0.9, 0.0); at(ts("slapped") + 0.1, "cuff clink", G.clink(r, 3000, 0.2), 0.6, 0.2)
    # --- shots 23-24: prison, the receipt
    at(S(23), "cell door clang", G.clink(r, 700, 0.4), 0.7, 0.0); at(S(23), "cell door thud", thump(r, 60, 0.5, 1.2), 0.8, 0.0)
    for k in range(6): at(ts("six") + 0.2 * k, f"tally {k + 1}", tick(r, 700), 0.4, 0.2)
    at(ts("making") - 0.2, "receipt unrolls", paper(r, 2.8), 0.6, 0.0); at(ts("making"), "sad horn", sad_horn(r), 0.5, 0.0)
    at(ts("history"), "final glint + clink", G.clink(r, 3300, 0.16), 0.5, 0.3)
    return sfx[:, :N], amb[:, :N], sorted(ev)
