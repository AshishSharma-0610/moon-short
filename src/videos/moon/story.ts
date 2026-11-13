// "The Moon Rock Heist": 24 shots, every one hung on a spoken word (timing.ts). Pure maths, no THREE.
// Camera grammar (reports/motion.md): symmetric smootherstep glides of 18-40 f; a reframe bigger than ~half a frame is a hard CUT;
// holds push in (0.15-0.35 %/f, ~0.6 %/f for ~35 f on punch words); rolls of 4-5 deg on emphasis; 7-frame sign-flipping impact kicks;
// reactions land LEAD (2 f) before their word. Coordinates are local to each set (sets.ts); world = local + SETX[place].
import { FPS, TOTAL, DUR, LEAD, Cue, ts, fs } from "./timing";
import { Place, SETX } from "./sets";
export { FPS, TOTAL, DUR, LEAD };

export type V3 = [number, number, number];
export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const deg = (d: number) => (d * Math.PI) / 180;
export type Light = "day" | "golden" | "night";
export type Expr = "neutral" | "stern" | "grin" | "laugh" | "whistle" | "nervous" | "shock" | "relief" | "relief_open" | "dazed" | "pained" | "smile" | "smile_closed" | "lick";
export type WhoId = "thad" | "thadp" | "girl" | "guard" | "sci1" | "sci2" | "collector" | "fbi1" | "fbi2";

// repeated words of the script, by occurrence
const TH0: Cue = ["Therefore", 0], TH1: Cue = ["Therefore", 1], BUT0: Cue = ["But", 0], BUT1: Cue = ["But", 1], THAD0: Cue = ["Thad", 0], THAD1: Cue = ["Thad", 1];
const T25: Cue = "twenty-five-year-old", T21: Cue = "twenty-one", SIX_LB: Cue = "six-hundred-pound";

// ---------------- camera helpers ----------------
export type Cam = { pos: V3; look: V3; fov: number; roll: number };
type Shot = Partial<Cam> & { pos: V3; look: V3 };
type CamFn = (f: number, f0: number) => Shot;
type Key = { at: Cue | number; off?: number; dur?: number; cut?: boolean; s: CamFn };
export const glide = (u: number) => { const x = clamp01(u); return x * x * x * (x * (6 * x - 15) + 10); };
const pushK = (f: number, f0: number, rate: number, punch = 0, n = 35) => {
  const x = Math.max(0, f - f0);
  let s = rate * x;
  if (punch > rate) for (let i = 0; i < Math.min(x, n); i++) s += (punch - rate) * Math.max(0, Math.min(1, (i + 0.5) / 8, (n - i - 0.5) / 8));
  return Math.exp(-s);
};
/** orbit camera: looks at `t` from `d` metres, yaw degrees around it (0 = from -z), height h; slow push-in; roll in degrees */
const O = (t: V3, d: number, yaw: number, h: number, fov = 40, roll = 0, rate = 0.0022, punch = 0, n = 35): CamFn => (f, f0) => {
  const k = pushK(f, f0, rate, punch, n), y = deg(yaw);
  return { pos: [t[0] + d * k * Math.sin(y), h + (t[1] - h) * (1 - k), t[2] - d * k * Math.cos(y)], look: t, fov, roll: deg(roll) };
};
const K = (at: Cue | number, s: CamFn, o: { off?: number; dur?: number; cut?: boolean } = {}): Key => ({ at, s, ...o });

// ---------------- shot table ----------------
type ActorD = { who: WhoId; pos: V3 | ((t: number) => V3); x: [Cue | number, Expr][]; show?: Cue };
type DofD = { at?: Cue | number; dur?: number; cInf: number; focus?: WhoId | V3 };
type ShotD = { place: Place; start: Cue | number; off?: number; light: Light; xfade?: number; cams: Key[]; actors: ActorD[]; dof: DofD[] };
const A = (who: WhoId, pos: V3 | ((t: number) => V3), x: [Cue | number, Expr][], o: Partial<ActorD> = {}): ActorD => ({ who, pos, x, ...o });

const PED: V3 = [4.0, 0.93, 15.0], SAFE_P: V3 = [0.3, 0, 11.0];
const SCI1_P: V3 = [3.4, 0, 13.4], SCI2_P: V3 = [4.7, 0, 13.6];
const BED_ROCKS: V3[] = [[-0.8, 0.88, 7.4], [0.2, 0.88, 8.2], [0.9, 0.88, 7.0], [-0.3, 0.88, 8.6], [0.6, 0.88, 7.8], [-1.0, 0.88, 8.4], [0.4, 0.88, 6.6], [-0.6, 0.88, 6.8]];
const CASE_P: V3 = [2.3, 0.9, 9.0];
const THAD_HOT: V3 = [-0.55, 0, 6.6], THAD_DESK: V3 = [3.6, 0, 7.4];

const SHOT_DEFS: ShotD[] = [
  // 1 hook: a NASA intern tiptoes into the vault at night (the glowing samples in the distance)
  { place: "lab", start: 0, light: "night",
    cams: [K(0, O([0.9, 1.7, 10.0], 12.5, 10, 2.2, 48)), K("snuck", O([1.2, 1.5, 9.0], 8.0, -8, 1.8, 44, -2.3), { dur: 28 })],
    actors: [A("thad", (t) => [lerp(0.4, 1.2, clamp01(t / 3.6)), 0, lerp(5.0, 7.5, clamp01(t / 3.6))], [[0, "whistle"], ["snuck", "nervous"]])],
    dof: [{ cInf: 12, focus: "thad" }] },
  // 2 "stole twenty-one million dollars worth of Apollo moon rocks": the samples glow, the cash piles up
  { place: "lab", start: "stole", light: "night",
    cams: [K("stole", O([3.2, 1.3, 14.0], 5.2, -15, 1.6, 40)), K(T21, O([2.6, 1.3, 13.4], 6.4, 10, 1.6, 44, 2.3), { dur: 24 })],
    actors: [A("thad", [3.3, 0, 12.6], [["stole", "grin"], ["dollars", "laugh"]])], dof: [{ cInf: 12, focus: "thad" }] },
  // 3 "and scattered them across a hotel bed": the rocks fly onto the bed
  { place: "hotel", start: "scattered", off: -4, light: "golden", xfade: 8,
    cams: [K("scattered", O([-0.2, 1.5, 7.6], 8.6, 0, 1.9, 50), { off: -4 })],
    actors: [A("thad", [-1.0, 0, 6.0], [["scattered", "grin"]])], dof: [{ cInf: 12, focus: "thad" }] },
  // 4 "just so he could tell a girl they had sex on the moon": the moon thought cloud, the girl laughs
  { place: "hotel", start: ["just", 0], light: "golden",
    cams: [K(["just", 0], O([0.0, 1.5, 6.6], 7.4, -8, 1.6, 48)), K(["moon", 1], O([0.2, 1.6, 6.6], 4.6, 12, 1.5, 40, 2.3, 0.003, 0.006), { dur: 22, off: -4 })],
    actors: [A("thad", THAD_HOT, [[["just", 0], "grin"]]), A("girl", [0.75, 0, 6.8], [[["just", 0], "smile"], ["girl", "smile"], [["moon", 1], "laugh"]])], dof: [{ cInf: 12, focus: "thad" }] },
  // 5 "Thad Roberts wanted to pull off the ultimate romantic gesture": roses and hearts
  { place: "hotel", start: THAD0, light: "golden",
    cams: [K(THAD0, O([0.1, 1.5, 6.6], 4.6, 12, 1.5, 40, -2.3)), K("gesture", O([0.0, 1.5, 6.6], 3.4, -8, 1.4, 34, 2.3), { dur: 24 })],
    actors: [A("thad", [0, 0, 6.6], [[THAD0, "smile_closed"], ["romantic", "relief"]])], dof: [{ cInf: 12, focus: "thad" }] },
  // 6 "Therefore, he used his intern clearance late at night to bypass security at Johnson Space Center": the gate, the badge
  { place: "gate", start: TH0, light: "night", xfade: 8,
    cams: [K(TH0, O([3.0, 1.8, 12.0], 11.5, -15, 2.2, 50)), K("clearance", O([2.5, 1.4, 10.4], 4.8, 8, 1.6, 40, -2.3), { dur: 24, off: -4 })],
    actors: [A("thad", [2.3, 0, 9.4], [[TH0, "grin"], ["bypass", "smile_closed"]]), A("guard", [3.7, 0, 12.0], [[TH0, "stern"], ["bypass", "dazed"]])],
    dof: [{ cInf: 12, focus: "thad" }] },
  // 7 "But the moon rocks were locked inside a six-hundred-pound steel safe"
  { place: "lab", start: BUT0, light: "night",
    cams: [K(BUT0, O([-0.3, 1.4, 11.0], 6.8, 0, 1.8, 46)), K(SIX_LB, O([-0.2, 1.2, 11.0], 4.4, -12, 1.4, 40, 2.3, 0.003, 0.006), { dur: 22, off: -4 })],
    actors: [A("thad", [-0.9, 0, 11.8], [[BUT0, "grin"], ["locked", "shock"], ["safe", "pained"]])], dof: [{ cInf: 12, focus: "thad" }] },
  // 8 "Therefore, he loaded the entire safe onto a dolly"
  { place: "lab", start: TH1, light: "night",
    cams: [K(TH1, O([0.3, 1.3, 11.5], 8, 10, 1.7, 48)), K("dolly", O([0.3, 1.2, 11.3], 5.6, -10, 1.4, 42, -2.3), { dur: 22, off: -4 })],
    actors: [A("thad", [1.6, 0, 12.7], [[TH1, "grin"], ["loaded", "pained"], ["dolly", "relief"]])], dof: [{ cInf: 12, focus: "thad" }] },
  // 9 "wheeled it past security": the dolly rolls past the snoozing guard
  { place: "gate", start: "wheeled", light: "night",
    cams: [K("wheeled", O([2.2, 1.4, 11.0], 12, -10, 1.8, 54))],
    actors: [A("guard", [3.7, 0, 12.0], [["wheeled", "dazed"]]), A("thad", (t) => [lerp(5.6, -0.8, clamp01((t - (ts("wheeled") - 0.2)) / 1.8)), 0, 9.4], [["wheeled", "whistle"]])],
    dof: [{ cInf: 12, focus: "thad" }] },
  // 10 "into a getaway car, and drove straight to a nearby hotel": the safe goes in, the car roars off
  { place: "gate", start: "getaway", light: "night",
    cams: [K("getaway", O([0.2, 1.3, 8.0], 8.4, -15, 1.6, 48)), K("drove", O([2.0, 1.2, 8.0], 10, -30, 1.4, 50, 2.3), { dur: 30, off: -4 })],
    actors: [A("thad", [-0.7, 0, 6.8], [["getaway", "grin"], ["drove", "laugh"]])], dof: [{ cInf: 12, focus: "thad" }] },
  // 11 "You see, these weren't just rocks": pristine samples, proud scientists (daylight lab)
  { place: "lab", start: "You", light: "day", xfade: 8,
    cams: [K("You", O([4.0, 1.5, 14.4], 7.8, -15, 1.7, 48)), K("pristine", O([4.0, 1.3, 14.8], 5.4, 8, 1.5, 42, 2.3), { dur: 22, off: -4 })],
    actors: [A("sci1", SCI1_P, [["You", "smile"], ["pristine", "relief"]]), A("sci2", SCI2_P, [["You", "grin"]])], dof: [{ cInf: 12, focus: "sci1" }] },
  // 12 "scientists had spent thirty years preserving in nitrogen chambers": the mist
  { place: "lab", start: "scientists", light: "day",
    cams: [K("scientists", O([5.0, 1.5, 12.8], 8.2, -20, 1.7, 48)), K("nitrogen", O([5.0, 1.5, 12.8], 6.4, 8, 1.5, 44, -2.3), { dur: 24 })],
    actors: [A("sci1", [4.5, 0, 13.0], [["scientists", "relief"]]), A("sci2", [5.6, 0, 13.2], [["scientists", "smile_closed"], ["nitrogen", "grin"]])], dof: [{ cInf: 12, focus: "sci1" }] },
  // 13 "To get to them, Thad smashed the sealed containers open with a hammer"
  { place: "hotel", start: "get", off: -2, light: "golden", xfade: 8,
    cams: [K("get", O([0.4, 1.3, 7.0], 6.2, -12, 1.6, 44), { off: -2 }), K("smashed", O([0.4, 1.1, 7.4], 4.6, 8, 1.4, 38, -2.3, 0.003, 0.006), { cut: true, off: -3 })],
    actors: [A("thad", [0.2, 0, 6.0], [["get", "stern"], ["smashed", "grin"], ["hammer", "laugh"]])], dof: [{ cInf: 12, focus: "thad" }] },
  // 14 "instantly contaminating three billion years of lunar history": dust everywhere
  { place: "hotel", start: "instantly", light: "golden",
    cams: [K("instantly", O([0, 1.4, 7.6], 5.6, 10, 1.5, 42, 2.3))],
    actors: [A("thad", [-0.4, 0, 6.2], [["instantly", "shock"], ["contaminating", "pained"]])], dof: [{ cInf: 12, focus: "thad" }] },
  // 15 "three billion years of lunar history": the scientists' horror (lab, day)
  { place: "lab", start: "three", light: "day", xfade: 8,
    cams: [K("three", O([4.0, 1.6, 13.4], 6.4, -10, 1.7, 46, -2.3), { dur: 24 })],
    actors: [A("sci1", SCI1_P, [["three", "shock"], ["history", "pained"]]), A("sci2", SCI2_P, [["three", "dazed"]])], dof: [{ cInf: 12, focus: "sci1" }] },
  // 16 "with bedsheets, dust, and sweat": the sweaty aftermath
  { place: "hotel", start: "bedsheets", off: -4, light: "golden", xfade: 8,
    cams: [K("bedsheets", O([0, 1.2, 7.6], 4.8, -12, 1.4, 42, 2.3), { off: -4 })],
    actors: [A("thad", [-0.2, 0, 6.2], [["bedsheets", "nervous"], ["sweat", "pained"]])], dof: [{ cInf: 12, focus: "thad" }] },
  // 17 "Desperate for cash, he posted a listing online to sell the stolen moon dust": the laptop
  { place: "hotel", start: "Desperate", light: "golden",
    cams: [K("Desperate", O([3.6, 1.3, 8.2], 4.6, -15, 1.6, 40)), K("sell", O([3.6, 1.3, 8.2], 3.4, 10, 1.5, 34, 2.3), { dur: 22 })],
    actors: [A("thad", THAD_DESK, [["Desperate", "pained"], ["listing", "nervous"], ["sell", "grin"]])], dof: [{ cInf: 12, focus: "thad" }] },
  // 18 "to a Belgian mineral collector": the collector in his tweed cap (Florida diner, day)
  { place: "diner", start: "Belgian", light: "day", xfade: 8,
    cams: [K("Belgian", O([-1.0, 1.4, 9.2], 5.0, 12, 1.6, 42)), K("collector", O([-0.8, 1.5, 9.2], 3.8, -10, 1.5, 36, 2.3), { dur: 22 })],
    actors: [A("collector", [-1.0, 0, 9.2], [["Belgian", "smile"], ["mineral", "relief"]])], dof: [{ cInf: 12, focus: "collector" }] },
  // 19 "But the collector immediately called the FBI": the agents appear
  { place: "diner", start: BUT1, light: "day",
    cams: [K(BUT1, O([1.2, 1.5, 9.0], 9.2, -10, 1.7, 50))],
    actors: [A("collector", [-0.6, 0, 9.0], [[BUT1, "shock"], ["called", "stern"]]), A("fbi1", [1.7, 0, 9.4], [["FBI", "grin"]], { show: "called" }), A("fbi2", [3.0, 0, 9.2], [["FBI", "whistle"]], { show: "FBI" })],
    dof: [{ cInf: 12, focus: "collector" }] },
  // 20 "Undercover agents set up a fake sting in Florida": loud shirts, palms in the window
  { place: "diner", start: "Undercover", light: "day",
    cams: [K("Undercover", O([2.3, 1.5, 9.0], 6.6, -12, 1.6, 46)), K("Florida", O([2.4, 1.4, 9.0], 4.8, 10, 1.5, 40, -2.3), { dur: 22 })],
    actors: [A("fbi1", [1.6, 0, 9.4], [["Undercover", "whistle"], ["sting", "grin"]]), A("fbi2", [3.0, 0, 9.2], [["Undercover", "grin"], ["Florida", "laugh"]])], dof: [{ cInf: 12, focus: "fbi1" }] },
  // 21 "met Thad at a restaurant": Thad walks into the trap
  { place: "diner", start: "met", light: "day",
    cams: [K("met", O([1.4, 1.5, 9.0], 9.4, 0, 1.8, 52))],
    actors: [A("thad", [-0.2, 0, 9.0], [["met", "smile"], ["restaurant", "grin"]]), A("fbi1", [1.9, 0, 9.4], [["met", "grin"]]), A("fbi2", [3.1, 0, 9.2], [["met", "laugh"]])], dof: [{ cInf: 12, focus: "thad" }] },
  // 22 "and slapped him in handcuffs before a single dollar changed hands": the cuffs click, the cash untouched
  { place: "diner", start: "slapped", off: -3, light: "day",
    cams: [K("slapped", O([1.3, 1.3, 8.8], 8.2, 8, 1.6, 48, 0, 0.003), { off: -3 }), K("dollar", O([2.3, 1.1, 9.0], 4.6, -10, 1.5, 40, -2.3), { dur: 22 })],
    actors: [A("thad", [-0.2, 0, 9.0], [["slapped", "shock"], ["dollar", "pained"]]), A("fbi1", [1.5, 0, 9.4], [["slapped", "grin"]]), A("fbi2", [2.8, 0, 9.2], [["slapped", "laugh"]])],
    dof: [{ cInf: 12, focus: "thad" }] },
  // 23 "He served six years in federal prison": the cell, the tally wall
  { place: "cell", start: "served", off: -3, light: "day", xfade: 8,
    cams: [K("served", O([0, 1.4, 4.4], 5.6, 0, 1.5, 44, 0, 0.0018), { off: -3 }), K("six", O([1.0, 1.5, 6.0], 4.0, -15, 1.6, 40, 2.3), { dur: 24 })],
    actors: [A("thadp", [0, 0, 4.6], [["served", "stern"], ["federal", "pained"]])], dof: [{ cInf: 10, focus: "thadp" }] },
  // 24 "making it the most expensive date in human history": the endless receipt (golden hour)
  { place: "cell", start: "making", light: "golden", xfade: 8,
    cams: [K("making", O([0.2, 1.1, 3.4], 3.8, -10, 1.2, 40, 0, 0.002)), K("history", O([0.2, 2.2, 3.4], 11, 12, 2.9, 46), { dur: 40, off: -8 })],
    actors: [A("thadp", [0.2, 0, 6.6], [["making", "stern"], ["expensive", "dazed"]])], dof: [{ cInf: 10, focus: "thadp" }, { at: "history", dur: 40, cInf: 0 }] },
];

// ---------------- resolved shots ----------------
const frameOf = (c: Cue | number, off = 0) => fs(c) + off;
export type ShotInfo = { id: number; a: number; b: number; place: Place; light: Light };
export const SHOTS: ShotInfo[] = SHOT_DEFS.map((d, i) => ({ id: i + 1, a: i === 0 ? 0 : frameOf(d.start, d.off ?? 0), b: 0, place: d.place, light: d.light }));
SHOTS.forEach((s, i) => { s.b = i + 1 < SHOTS.length ? SHOTS[i + 1].a : TOTAL; if (!(s.b > s.a)) throw new Error(`shot ${s.id} is empty: check voice/words.json (npm run sync)`); });
export const XFADE: Record<number, number> = {};
SHOT_DEFS.forEach((d, i) => { if (d.xfade) XFADE[i + 1] = d.xfade; });
export const FLASH_AT = SHOTS[2].a; // 4-frame white flash after the hook
export const shotAt = (f: number) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];
export const layersAt = (f: number): { id: number; alpha: number }[] => {
  for (const s of SHOTS) {
    const x = XFADE[s.id];
    if (x && f >= s.a - x / 2 && f < s.a + x / 2) return [{ id: s.id - 1, alpha: 1 }, { id: s.id, alpha: (f - (s.a - x / 2) + 1) / (x + 1) }];
  }
  return [{ id: shotAt(f).id, alpha: 1 }];
};
export const originOf = (id: number): number => SETX[SHOTS[id - 1].place];

// ---------------- camera ----------------
const mix = (a: Cam, b: Cam, k: number): Cam => ({
  pos: a.pos.map((v, i) => v + (b.pos[i] - v) * k) as V3, look: a.look.map((v, i) => v + (b.look[i] - v) * k) as V3,
  fov: a.fov + (b.fov - a.fov) * k, roll: a.roll + (b.roll - a.roll) * k,
});
const full = (c: Shot): Cam => ({ fov: 40, roll: 0, ...c });
type KeyR = { f: number; dur: number; cut: boolean; s: CamFn };
const KEYS: KeyR[][] = SHOT_DEFS.map((d, i) => d.cams.map((k, j) => ({ f: j === 0 ? SHOTS[i].a : frameOf(k.at, k.off ?? 0), dur: k.dur ?? 24, cut: j === 0 ? true : !!k.cut, s: k.s })));
const run = (keys: KeyR[], f: number): Cam => {
  let cur = full(keys[0].s(f, keys[0].f));
  for (let i = 1; i < keys.length; i++) {
    const k = keys[i];
    if (f < k.f) break;
    cur = k.cut ? full(k.s(f, k.f)) : mix(cur, full(k.s(f, k.f)), glide((f - k.f) / k.dur));
  }
  return cur;
};
// impact kicks: 7-frame sign-flipping offsets (3 px per unit at 640 px)
const KICKS: [number, number][] = [[ts("smashed") + 0.05, 1.0], [ts("slapped") + 0.12, 1.0]];
export const kickAt = (t: number) => {
  let a = 0;
  for (const [t0, g] of KICKS) { const n = Math.floor((t - t0) * FPS + 1e-6); if (n >= 0 && n < 7) a += g * (n % 2 ? -1 : 1) * (1 - n / 7) ** 1.5; }
  return a;
};
export const camAt = (id: number, f: number): Cam => {
  const ox = originOf(id), c0 = run(KEYS[id - 1], f), a = kickAt(f / FPS);
  const c: Cam = { ...c0, pos: [c0.pos[0] + ox, c0.pos[1], c0.pos[2]], look: [c0.look[0] + ox, c0.look[1], c0.look[2]] };
  if (!a) return c;
  const d: V3 = [c.look[0] - c.pos[0], c.look[1] - c.pos[1], c.look[2] - c.pos[2]];
  const L = Math.hypot(...d), h = Math.hypot(d[0], d[2]) || 1, m = (3 / 640) * Math.tan((c.fov * Math.PI) / 360) * L * a;
  return { ...c, look: [c.look[0] - (d[2] / h) * m, c.look[1] + 0.6 * m, c.look[2] + (d[0] / h) * m], roll: c.roll + a * 0.004 };
};
export const keyFrames = (id: number) => KEYS[id - 1].map((k) => k.f);

// ---------------- actors ----------------
export type ActorState = { who: WhoId; pos: V3; expr: Expr; walk: boolean; wave: number };
export const actorsAt = (id: number, t: number): ActorState[] => {
  const d = SHOT_DEFS[id - 1], ox = SETX[d.place], out: ActorState[] = [];
  for (const a of d.actors) {
    if (a.show !== undefined && t < ts(a.show) - 0.1) continue;
    const p = typeof a.pos === "function" ? a.pos(t) : a.pos;
    let expr: Expr = a.x[0][1];
    for (const [c, e] of a.x) if (t >= ts(c) - LEAD) expr = e;
    out.push({ who: a.who, pos: [p[0] + ox, p[1], p[2]], expr, walk: false, wave: 0 });
  }
  return out;
};
const eyesOf = (id: number, who: WhoId, t: number): V3 => { const a = actorsAt(id, t).find((x) => x.who === who); return a ? [a.pos[0], 1.45, a.pos[2]] : [0, 1.45, 0]; };

// ---------------- lens ----------------
type DofE = { f: number; dur: number; cInf: number; focus?: (f: number) => V3 };
export const DOF: DofE[] = [];
SHOT_DEFS.forEach((d, i) => {
  const id = i + 1;
  d.dof.forEach((e, j) => {
    const f = j === 0 ? SHOTS[i].a : frameOf(e.at ?? SHOTS[i].a, 0), foc = e.focus;
    DOF.push({ f, dur: e.dur ?? 0, cInf: e.cInf, focus: foc === undefined ? undefined : typeof foc === "string" ? (ff) => eyesOf(id, foc, ff / FPS) : () => [foc[0] + SETX[d.place], foc[1], foc[2]] });
  });
});
DOF.sort((a, b) => a.f - b.f);
export const dofAt = (f: number) => {
  let i = 0; while (i + 1 < DOF.length && f >= DOF[i + 1].f) i++;
  const d = DOF[i], p = DOF[Math.max(0, i - 1)], k = d.dur ? Math.min(1, (f - d.f) / d.dur) : 1;
  return { cInf: p.cInf + (d.cInf - p.cInf) * k, focus: d.focus };
};
export const focusAt = (id: number, f: number): V3 => { const d = dofAt(f); return d.focus ? d.focus(f) : camAt(id, f).look; };

// ---------------- props (pools: rock 24, rockg 6, safe 1, car 1, laptop 1, badge 1, hammer 1, shard 16, cuffs 1, case 1, roses 1, receipt 1, cash 24) ----------------
export type PropKind = "rock" | "rockg" | "safe" | "car" | "laptop" | "badge" | "hammer" | "shard" | "cuffs" | "case" | "roses" | "receipt" | "cash";
export type PropInst = { k: PropKind; i: number; pos: V3; yaw?: number; roll?: number; s?: number; p?: number; face?: boolean };
const hash = (n: number) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const popS = (t: number, t0: number) => { const u = (t - t0) / 0.18; return u < 0 ? 0 : u > 1 ? 1 : 1 + 0.3 * Math.sin(Math.PI * u) * (1 - u); };
const bedRocks = (n: number, from = 0): PropInst[] => BED_ROCKS.slice(0, n).map((p, i) => ({ k: "rock" as const, i: from + i, pos: p, yaw: i * 1.3, s: 1 }));
const stacks = (t: number, t0: number, t1: number, max: number, at: (i: number) => V3): PropInst[] => {
  const n = Math.floor(clamp01((t - t0) / Math.max(0.2, t1 - t0)) * max), out: PropInst[] = [];
  for (let i = 0; i < n; i++) out.push({ k: "cash", i, pos: at(i), yaw: 0.05 * (i % 3), s: popS(t, t0 + ((t1 - t0) * i) / max) });
  return out;
};
export const SNIP_AT = () => ts("slapped") + 0.12;
export const propsAt = (id: number, t: number): PropInst[] => {
  const ox = SETX[SHOT_DEFS[id - 1].place], out: PropInst[] = [], bob = 0.05 * Math.sin(t * 2.6);
  switch (id) {
    case 1: for (let i = 0; i < 3; i++) out.push({ k: "rockg", i, pos: [PED[0] - 0.3 + i * 0.3, PED[1] + 0.12 + bob * (i % 2 ? 1 : -1), PED[2] + (i % 2) * 0.2], yaw: i, s: 1.4 }); break;
    case 2: {
      for (let i = 0; i < 3; i++) out.push({ k: "rockg", i, pos: [PED[0] - 0.3 + i * 0.3, PED[1] + 0.12 + bob * (i % 2 ? 1 : -1), PED[2] + (i % 2) * 0.2], yaw: i, s: 1.4 });
      out.push(...stacks(t, ts(T21), ts("dollars") + 0.4, 15, (i) => [0.8 + (i % 5) * 0.62, 0, 11.6 + Math.floor(i / 5) * 0.4]));
    } break;
    case 3: {
      const W = ["scattered", "them", "across", "hotel", "bed"] as const;
      W.forEach((w, i) => {
        const land = ts(w) + 0.25, u = clamp01((t - (land - 0.4)) / 0.4), a: V3 = [-1.0, 1.5, 6.0], e = BED_ROCKS[i];
        if (t < land - 0.4) return;
        out.push({ k: "rock", i, pos: [lerp(a[0], e[0], u), lerp(a[1], e[1], u) + 1.0 * 4 * u * (1 - u), lerp(a[2], e[2], u)], yaw: u * 6, s: u < 1 ? 1 : popS(t, land) });
      });
    } break;
    case 4: out.push(...bedRocks(8)); break;
    case 5: out.push(...bedRocks(8), { k: "roses", i: 0, pos: [0.55, 1.0 + bob * 0.5, 6.3], face: true, s: 1.8 }); break;
    case 6: out.push({ k: "badge", i: 0, pos: [2.65, 1.3, 8.6], face: true, s: 1.7 }); break;
    case 7: out.push({ k: "safe", i: 0, pos: SAFE_P, face: true, s: 1, p: 0 }); break;
    case 8: out.push({ k: "safe", i: 0, pos: SAFE_P, face: true, s: 1, p: smooth((t - ts("loaded")) / 0.9) }); break;
    case 9: { const x = lerp(5.6, -0.8, clamp01((t - (ts("wheeled") - 0.2)) / 1.8)); out.push({ k: "safe", i: 0, pos: [x - 0.0, 0, 10.2], face: true, s: 1, p: 1 }); } break;
    case 10: {
      const tc = ts("car") + 0.25, drive = Math.max(0, t - ts("drove")), x = 1.0 + 7 * drive * drive * 0.5 + 6 * Math.max(0, drive - 1.2);
      if (t < tc) out.push({ k: "safe", i: 0, pos: [-1.0 + clamp01((t - (ts("getaway") - 0.2)) / (tc - ts("getaway") + 0.2)) * 1.6, 0, 8.0], face: true, s: 1, p: 1 });
      out.push({ k: "car", i: 0, pos: [x, 0, 8.0], yaw: Math.PI / 2 });
    } break;
    case 11: out.push({ k: "rockg", i: 0, pos: [PED[0], PED[1] + 0.14 + bob, PED[2]], s: 1.6 }); break;
    case 12: out.push({ k: "rockg", i: 0, pos: [PED[0], PED[1] + 0.14 + bob, PED[2]], s: 1.6 }); break;
    case 13: {
      const ta = ts("smashed"), q = clamp01((t - (ta - 0.45)) / 0.45), ang = lerp(-2.3, 0.25, q * q);
      out.push(...bedRocks(8, 0), { k: "hammer", i: 0, pos: [0.6, 1.3, 6.5], roll: ang, face: true, s: 1.3 });
      if (t < ta) out.push({ k: "case", i: 0, pos: [0.45, 0.88, 7.3], s: 1.0, face: true });
      else for (let i = 0; i < 16; i++) { const tau = t - ta; if (tau > 1.0) break; out.push({ k: "shard", i, pos: [0.45 + (hash(i) - 0.5) * 3.2 * tau, 0.95 + 2.2 * tau - 4.9 * tau * tau * 0.5, 7.3 + (hash(i + 7) - 0.5) * 2.2 * tau], roll: tau * 9 + i, yaw: i }); }
    } break;
    case 14: case 16: out.push(...bedRocks(8)); break;
    case 17: out.push({ k: "laptop", i: 0, pos: [3.6, 0.93, 8.5], face: true, s: 1.5 }); break;
    case 20: case 21: out.push({ k: "case", i: 0, pos: CASE_P, face: true, s: 1.0 }, ...stacks(t, 0, 0.1, 3, (i) => [CASE_P[0] - 0.2 + i * 0.2, CASE_P[1] + 0.31, CASE_P[2]])); break;
    case 22: {
      const q = clamp01((t - (ts("slapped") - 0.1)) / 0.25);
      out.push({ k: "case", i: 0, pos: CASE_P, face: true, s: 1.0 }, ...stacks(t, 0, 0.1, 3, (i) => [CASE_P[0] - 0.2 + i * 0.2, CASE_P[1] + 0.31, CASE_P[2]]), { k: "cuffs", i: 0, pos: [-0.2, 1.05, 8.6], face: true, s: 1.6, p: q });
    } break;
    case 24: { const L = lerp(0.4, 9.5, clamp01((t - (ts("making") - 0.2)) / (ts("history") + 0.5 - ts("making") + 0.2))); out.push({ k: "receipt", i: 0, pos: [0.2, 0, 6.0], yaw: Math.PI, p: L, s: 1 }); } break;
  }
  return out.map((p) => ({ ...p, pos: [p.pos[0] + ox, p.pos[1], p.pos[2]] as V3 }));
};

/** times (s) at which an actor changes expression in shot `id`: a blink hides each swap */
export const swapsOf = (id: number, who: WhoId): number[] => SHOT_DEFS[id - 1].actors.filter((a) => a.who === who).flatMap((a) => a.x.slice(1).map(([c]) => ts(c)));
