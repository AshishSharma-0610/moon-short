// The five 3D sets of "The Moon Rock Heist" (NASA lab, NASA gate at night, hotel room, Florida diner, prison cell) and every prop, all procedural (no model files), all two-tone toon materials.
// Sets sit 150 m apart on the x axis (SETX); a shot only shows its own set. Local coordinates: floor y = 0, +z = away from the camera's default side.
import * as THREE from "three";
import { Batch, lam, flat, PAL, box, bar, mat4, V, UNIT, CYL, SPH, CAP, ceilTex, muralTex, glassTex } from "./base";
import { ctex, rng, rep } from "./paint";

export type Place = "lab" | "gate" | "hotel" | "diner" | "cell";
export const SETX: Record<Place, number> = { lab: 0, gate: 150, hotel: 300, diner: 450, cell: 600 };

// ---------------- painted textures ----------------
const checker = (key: string, c1: string, c2: string, grout: string) => ctex(key, 512, 512, (g, r) => {
  const cols = [c1, c2];
  for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) {
    g.fillStyle = cols[(i + j) % 2]; g.fillRect(i * 256, j * 256, 256, 256);
    for (let k = 0; k < 6; k++) { g.fillStyle = "rgba(255,255,255,0.06)"; g.beginPath(); g.ellipse(i * 256 + r() * 256, j * 256 + r() * 256, 40 + r() * 60, 20 + r() * 30, r() * 3, 0, 7); g.fill(); }
  }
  g.strokeStyle = grout; g.lineWidth = 3;
  for (const v of [0, 256, 512]) { g.beginPath(); g.moveTo(v, 0); g.lineTo(v, 512); g.moveTo(0, v); g.lineTo(512, v); g.stroke(); }
});
const planks = (key: string, base: string, line: string) => ctex(key, 512, 512, (g, r) => {
  g.fillStyle = base; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 8; i++) { g.fillStyle = `rgba(80,40,10,${0.05 + r() * 0.08})`; g.fillRect(0, i * 64, 512, 64); g.fillStyle = line; g.fillRect(0, i * 64, 512, 3); }
  g.fillStyle = line; for (let i = 0; i < 8; i++) g.fillRect(((i * 211) % 512), i * 64, 3, 64);
});
const asphalt = () => ctex("runway", 512, 512, (g, r) => {
  g.fillStyle = "#6b7390"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(30,30,60,${0.04 + r() * 0.06})`; g.beginPath(); g.ellipse(r() * 512, r() * 512, 30 + r() * 60, 8 + r() * 20, r() * 3, 0, 7); g.fill(); }
  g.fillStyle = "#f4f1e6"; g.fillRect(246, 40, 20, 160); g.fillRect(246, 300, 20, 160);
  g.fillStyle = "#f2c94a"; g.fillRect(0, 0, 512, 8);
});
const facade = (c: string, win: string) => ctex("facade" + c, 512, 256, (g) => {
  g.fillStyle = c; g.fillRect(0, 0, 512, 256);
  g.fillStyle = win;
  for (let y = 0; y < 3; y++) for (let x = 0; x < 8; x++) g.fillRect(24 + x * 62, 24 + y * 76, 36, 52);
});
const cityTex = () => ctex("city", 256, 256, (g, r) => {
  g.fillStyle = "#8d96c2"; g.fillRect(0, 0, 256, 256);
  g.fillStyle = "#f6e9b0";
  for (let i = 0; i < 70; i++) g.fillRect(6 + (i % 10) * 25, 10 + Math.floor(i / 10) * 34, 10, 16 + r() * 4);
});
const cardTex = (half: 0 | 1 | 2) => ctex("card" + half, 512, 320, (g) => {
  g.save();
  if (half === 1) { g.beginPath(); g.rect(0, 0, 256, 320); g.clip(); }
  if (half === 2) { g.beginPath(); g.rect(256, 0, 256, 320); g.clip(); }
  const gr = g.createLinearGradient(0, 0, 512, 320); gr.addColorStop(0, "#ffe28a"); gr.addColorStop(0.5, "#ffc93c"); gr.addColorStop(1, "#e89a1a");
  g.fillStyle = gr; g.fillRect(0, 0, 512, 320);
  g.fillStyle = "#3a2a1a"; g.fillRect(0, 36, 512, 46);                  // magnetic stripe
  g.strokeStyle = "#7a4a0a"; g.lineWidth = 22; g.lineCap = "round";      // infinity sign: "unlimited"
  g.beginPath(); g.moveTo(256, 190); g.bezierCurveTo(200, 110, 110, 120, 110, 195); g.bezierCurveTo(110, 265, 200, 270, 256, 190);
  g.bezierCurveTo(312, 110, 402, 120, 402, 195); g.bezierCurveTo(402, 265, 312, 270, 256, 190); g.stroke();
  g.strokeStyle = "#fff6c8"; g.lineWidth = 6; g.stroke();
  g.restore();
});
const earthTex = () => ctex("earth", 512, 256, (g, r) => {
  g.fillStyle = "#3d7be0"; g.fillRect(0, 0, 512, 256);
  g.fillStyle = "#58b04f"; g.strokeStyle = "#2c7a32"; g.lineWidth = 3;
  for (const [x, y, w, h] of [[90, 80, 70, 60], [120, 160, 40, 50], [250, 70, 60, 40], [270, 140, 50, 70], [380, 80, 80, 50], [420, 170, 40, 30]] as const) { g.beginPath(); g.ellipse(x, y, w, h, r() * 1, 0, 7); g.fill(); g.stroke(); }
});

// ---------------- helpers ----------------
const plane = (g: THREE.Object3D, w: number, h: number, mat: THREE.Material, p: THREE.Vector3, rx = 0, ry = 0, shadow = false) => {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  m.rotation.set(rx, ry, 0); m.position.copy(p); m.castShadow = false; m.receiveShadow = !shadow || true; g.add(m); return m;
};
type R = { x0: number; x1: number; z0: number; z1: number; h: number };
/** floor + ceiling (+light strips) + 3 closed walls; `open` skips a wall */
const shell = (g: THREE.Group, r: R, floor: THREE.Material, walls: { L?: string; R?: string; B?: string; F?: string }, ceil = true, strips = true) => {
  const { x0, x1, z0, z1, h } = r, W = x1 - x0, L = z1 - z0, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
  plane(g, W, L, floor, V(cx, 0, cz), -Math.PI / 2);
  if (ceil) plane(g, W, L, lam("ceilP" + W, () => ({ map: rep(ceilTex(), W / 2, L / 2) })), V(cx, h, cz), Math.PI / 2);
  const mural = (bg: string, len: number) => lam("mur" + bg + len, () => ({ map: rep(muralTex(bg, bg.slice(1)), len / 8, 1) }));
  if (walls.L) plane(g, L, h, mural(walls.L, L), V(x0, h / 2, cz), 0, Math.PI / 2);
  if (walls.R) plane(g, L, h, mural(walls.R, L), V(x1, h / 2, cz), 0, -Math.PI / 2);
  if (walls.B) plane(g, W, h, mural(walls.B, W), V(cx, h / 2, z1), 0, Math.PI);
  if (walls.F) plane(g, W, h, mural(walls.F, W), V(cx, h / 2, z0), 0, 0);
  if (ceil && strips) {
    const light = new THREE.MeshBasicMaterial({ color: new THREE.Color(3.0, 2.9, 2.6), fog: false });
    for (let z = z0 + 3; z < z1; z += 5.5) { const m = new THREE.Mesh(UNIT, light); m.scale.set(W - 2, 0.06, 0.5); m.position.set(cx, h - 0.04, z); g.add(m); }
  }
};
const seat = (b: Batch, x: number, z: number, c: string, head: string) => {
  box(b, flat(c), 0.9, 0.28, 0.8, x, 0.38, z);            // cushion
  box(b, flat(c), 0.9, 1.0, 0.2, x, 0.9, z + 0.4);         // back (behind the person)
  box(b, flat(head), 0.5, 0.3, 0.14, x, 1.5, z + 0.4);     // headrest
  for (const s of [-1, 1]) box(b, flat("#3a3550"), 0.09, 0.28, 0.75, x + s * 0.5, 0.62, z);  // arms
  box(b, flat("#3a3550"), 0.8, 0.22, 0.7, x, 0.11, z);     // base
};



// ---------------- textures ----------------
/** the NASA "meatball" as a simple emblem: blue disc, white stars, red chevron, white orbit ring. NO lettering. */
const nasaTex = () => ctex("nasa", 512, 512, (g, r) => {
  g.fillStyle = "#ffffff"; g.fillRect(0, 0, 512, 512);
  g.save(); g.beginPath(); g.arc(256, 256, 238, 0, 7); g.clip();
  g.fillStyle = "#1a45a6"; g.fillRect(0, 0, 512, 512);
  g.fillStyle = "#ffffff"; for (let i = 0; i < 70; i++) { g.beginPath(); g.arc(r() * 512, r() * 512, 1.5 + r() * 3.2, 0, 7); g.fill(); }
  g.fillStyle = "#e32934"; g.beginPath(); g.moveTo(40, 392); g.bezierCurveTo(150, 300, 250, 250, 330, 120); g.lineTo(372, 112); g.bezierCurveTo(330, 230, 250, 330, 120, 430); g.closePath(); g.fill();
  g.beginPath(); g.moveTo(236, 300); g.bezierCurveTo(300, 270, 400, 300, 470, 340); g.lineTo(458, 380); g.bezierCurveTo(380, 330, 310, 330, 250, 350); g.closePath(); g.fill();
  g.strokeStyle = "#ffffff"; g.lineWidth = 9; g.beginPath(); g.ellipse(256, 262, 215, 86, -0.55, 0, 7); g.stroke();
  g.restore();
  g.strokeStyle = "#ffffff"; g.lineWidth = 16; g.beginPath(); g.arc(256, 256, 244, 0, 7); g.stroke();
});
const laptopTex = () => ctex("listing", 256, 192, (g) => {
  g.fillStyle = "#e8f0ff"; g.fillRect(0, 0, 256, 192);
  g.fillStyle = "#1a45a6"; g.fillRect(0, 0, 256, 26);
  g.fillStyle = "#9aa6c0"; g.beginPath(); g.arc(70, 100, 38, 0, 7); g.fill(); g.fillStyle = "#c6cddd"; g.beginPath(); g.arc(58, 88, 12, 0, 7); g.fill();
  g.fillStyle = "#58b04f"; g.fillRect(130, 70, 100, 18); g.fillRect(130, 100, 70, 14); g.fillStyle = "#e32934"; g.fillRect(130, 130, 100, 22);
});
const receiptTex = () => ctex("receipt", 256, 512, (g, r) => {
  g.fillStyle = "#fbf6e8"; g.fillRect(0, 0, 256, 512);
  for (let y = 22; y < 500; y += 26) {
    g.fillStyle = "rgba(60,50,80,0.6)"; g.fillRect(14, y, 60 + r() * 100, 7);
    g.fillStyle = "#58b04f"; for (let k = 0; k < 4 + Math.floor(r() * 5); k++) { g.beginPath(); g.arc(236 - k * 15, y + 3, 6, 0, 7); g.fill(); }
  }
  g.fillStyle = "#e32934"; g.fillRect(0, 0, 256, 10);
});
const talliesTex = () => ctex("tally", 512, 384, (g) => {
  g.fillStyle = "#b8bfd0"; g.fillRect(0, 0, 512, 384);
  g.strokeStyle = "#2a2f45"; g.lineWidth = 6; g.lineCap = "round";
  for (let n = 0; n < 6; n++) { const x0 = 40 + (n % 3) * 150, y0 = 50 + Math.floor(n / 3) * 150; for (let k = 0; k < 4; k++) { g.beginPath(); g.moveTo(x0 + k * 22, y0); g.lineTo(x0 + k * 22, y0 + 90); g.stroke(); } g.beginPath(); g.moveTo(x0 - 10, y0 + 70); g.lineTo(x0 + 82, y0 + 14); g.stroke(); }
});
const emblem = (g: THREE.Object3D, rad: number, p: THREE.Vector3, ry: number) => {
  const m = new THREE.Mesh(new THREE.CircleGeometry(rad, 48), lam("nasa", () => ({ map: nasaTex() })));
  m.position.copy(p); m.rotation.y = ry; m.receiveShadow = true; g.add(m); return m;
};
const solid = (c: string) => lam("w" + c, () => ({ color: c }));
/** floor + ceiling (+light strips) + closed walls with plain colours */
const room = (g: THREE.Group, r: R, floor: THREE.Material, walls: { L?: string; R?: string; B?: string; F?: string }, ceil = true, strips = true, ceilCol = "#e8edf6") => {
  const { x0, x1, z0, z1, h } = r, W = x1 - x0, L = z1 - z0, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
  plane(g, W, L, floor, V(cx, 0, cz), -Math.PI / 2);
  if (ceil) plane(g, W, L, solid(ceilCol), V(cx, h, cz), Math.PI / 2);
  if (walls.L) plane(g, L, h, solid(walls.L), V(x0, h / 2, cz), 0, Math.PI / 2);
  if (walls.R) plane(g, L, h, solid(walls.R), V(x1, h / 2, cz), 0, -Math.PI / 2);
  if (walls.B) plane(g, W, h, solid(walls.B), V(cx, h / 2, z1), 0, Math.PI);
  if (walls.F) plane(g, W, h, solid(walls.F), V(cx, h / 2, z0), 0, 0);
  if (ceil && strips) { const light = new THREE.MeshBasicMaterial({ color: new THREE.Color(3.0, 2.9, 2.6), fog: false }); for (let z = z0 + 3; z < z1; z += 5) { const m = new THREE.Mesh(UNIT, light); m.scale.set(W - 2, 0.06, 0.5); m.position.set(cx, h - 0.04, z); g.add(m); } }
};
const glow = (c = 3.0) => new THREE.MeshBasicMaterial({ color: new THREE.Color(c, c * 0.92, c * 0.7), fog: false });
const lampPost = (g: THREE.Object3D, b: Batch, x: number, z: number, h = 5) => { box(b, flat("#3a3f58"), 0.14, h, 0.14, x, h / 2, z); box(b, flat("#3a3f58"), 0.9, 0.1, 0.1, x + 0.4, h, z); const m = new THREE.Mesh(CYL, glow(3.2)); m.scale.set(0.34, 0.08, 0.34); m.position.set(x + 0.8, h - 0.08, z); g.add(m); };

// ---------------- NASA LAB (the vault) ----------------
export const buildLab = () => {
  const g = new THREE.Group(), b = new Batch(), r: R = { x0: -8, x1: 8, z0: 0, z1: 18, h: 4.5 };
  room(g, r, lam("labFloor", () => ({ map: rep(checker("labchk", "#eef3fb", "#cdd9f0", "rgba(90,110,170,0.5)"), 8, 9) })), { L: "#dfe8f6", R: "#dfe8f6", B: "#c3cfe8", F: "#dfe8f6" });
  const steel = flat("#9aa6c0"), dark = flat("#3a3f58");
  // the vault door: steel disc, wheel, bolts, hinged frame
  box(b, flat("#5a6580"), 4.2, 3.8, 0.5, 0, 1.9, 17.85);
  b.add(CYL, steel, mat4(0, 1.7, 17.5, 1.6, 0.4, 1.6, 0, Math.PI / 2, 0)); b.add(CYL, flat("#c6cddd"), mat4(0, 1.7, 17.28, 0.5, 0.15, 0.5, 0, Math.PI / 2, 0));
  for (let a = 0; a < 6; a++) bar(b, flat("#c6cddd"), V(0, 1.7, 17.2), V(Math.cos(a * 1.047) * 1.0, 1.7 + Math.sin(a * 1.047) * 1.0, 17.2), 0.1);
  for (let a = 0; a < 12; a++) b.add(SPH, flat("#c6cddd"), mat4(Math.cos(a * 0.5236) * 1.35, 1.7 + Math.sin(a * 0.5236) * 1.35, 17.28, 0.09, 0.09, 0.09));
  // gloveboxes along both walls (white cabinets, blue glass, gloves) + a sample pedestal
  for (const sx of [-1, 1]) for (const z of [4.5, 8.5, 12.5]) {
    box(b, flat("#f4f7ff"), 1.4, 1.1, 2.8, sx * 6.9, 0.55, z); box(b, flat("#dfe8f6"), 1.5, 0.12, 3.0, sx * 6.9, 1.16, z);
    box(b, flat("#9fd0f0"), 1.2, 0.9, 2.5, sx * 6.9 - sx * 0.1, 1.7, z); box(b, flat("#f4f7ff"), 1.45, 0.14, 2.8, sx * 6.9, 2.2, z);
    for (const dz of [-0.6, 0.6]) b.add(CYL, flat("#e8edf6"), mat4(sx * 6.1, 1.3, z + dz, 0.2, 0.34, 0.2, 0, 0, Math.PI / 2));
  }
  box(b, flat("#cfd5dc"), 1.2, 0.9, 1.2, 4.0, 0.45, 15.0); box(b, dark, 1.3, 0.06, 1.3, 4.0, 0.93, 15.0);
  b.build(g, true, true);
  emblem(g, 1.7, V(-7.95, 3.0, 9.0), Math.PI / 2);
  return g;
};

// ---------------- NASA GATE (outdoors at night) ----------------
export const buildGate = () => {
  const g = new THREE.Group(), b = new Batch();
  plane(g, 400, 300, lam("apron", () => ({ map: rep(asphalt(), 14, 10) })), V(0, -0.01, 80), -Math.PI / 2);
  box(b, flat("#dfe5f2"), 34, 8, 4, 0, 4, 34); box(b, flat(PAL.navy), 34, 0.8, 4.4, 0, 8.2, 34); box(b, flat("#5a6580"), 3.6, 3.4, 0.5, 0, 1.7, 31.8);
  // security booth with a lit window, barrier arm, lamp posts, kerb
  box(b, flat("#e8edf6"), 3.2, 2.6, 2.6, 7, 1.3, 12); box(b, flat(PAL.red), 3.6, 0.25, 3.0, 7, 2.75, 12); box(b, flat("#3a3f58"), 0.3, 1.3, 0.3, 4.2, 0.65, 11);
  for (let i = 0; i < 6; i++) box(b, i % 2 ? flat("#fbf6e8") : flat(PAL.red), 0.7, 0.2, 0.2, 3.6 - i * 0.7 - 0.35, 1.2, 11);
  lampPost(g, b, -7, 6); lampPost(g, b, 11, 6); lampPost(g, b, -7, 22); lampPost(g, b, 11, 22);
  for (let x = -14; x < 14; x += 1.4) box(b, flat("#f2c94a"), 0.7, 0.05, 0.25, x, 0.02, 2.2);
  b.build(g, true, true);
  const fac = new THREE.Mesh(new THREE.PlaneGeometry(34, 7), lam("facadeN", () => ({ map: rep(facade("#dfe5f2", "#ffd27a"), 2, 1) }))); fac.position.set(0, 4, 31.95); fac.rotation.y = Math.PI; g.add(fac);
  const win = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.2), glow(2.6)); win.position.set(7, 1.7, 10.68); win.rotation.y = Math.PI; g.add(win);
  emblem(g, 3.0, V(0, 5.2, 31.9), Math.PI);
  // the moon (HDR, fog-free) and stars
  const moon = new THREE.Mesh(new THREE.CircleGeometry(7, 40), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.2, 2.3, 2.6), fog: false })); moon.position.set(-30, 42, 150); moon.rotation.y = Math.PI; g.add(moon);
  const rr = rng(8);
  for (let i = 0; i < 70; i++) { const s = new THREE.Mesh(SPH, new THREE.MeshBasicMaterial({ color: new THREE.Color(2.2, 2.2, 2.6), fog: false })); const sc = 0.25 + rr() * 0.5; s.scale.set(sc, sc, sc); s.position.set(-90 + rr() * 180, 20 + rr() * 80, 120 + rr() * 30); g.add(s); }
  return g;
};

// ---------------- HOTEL ROOM (warm golden) ----------------
export const buildHotel = () => {
  const g = new THREE.Group(), b = new Batch(), r: R = { x0: -5, x1: 5, z0: 0, z1: 12, h: 3.2 };
  room(g, r, lam("hotelFloor", () => ({ map: rep(planks("hplanks", "#9a6238", "rgba(60,30,10,0.7)"), 5, 6) })), { L: "#d9a27a", R: "#d9a27a", B: "#c98a62", F: "#d9a27a" }, true, false, "#efe0cc");
  const wood = flat("#6a3a22");
  box(b, wood, 2.5, 0.45, 2.6, 0, 0.225, 8.0); box(b, flat("#fbf6e8"), 2.3, 0.3, 2.4, 0, 0.6, 8.0); box(b, flat("#e8d4b8"), 2.3, 0.08, 1.5, 0, 0.79, 7.4);
  box(b, wood, 2.7, 1.5, 0.22, 0, 1.1, 9.45); for (const x of [-0.6, 0.6]) box(b, flat("#fbf6e8"), 0.8, 0.22, 0.5, x, 0.85, 8.9);
  for (const sx of [-1, 1]) { box(b, wood, 0.7, 0.6, 0.6, sx * 1.9, 0.3, 9.0); b.add(CYL, flat("#e8d4b8"), mat4(sx * 1.9, 0.9, 9.0, 0.06, 0.5, 0.06)); }
  box(b, flat("#8a2f3c"), 3.5, 0.02, 2.5, 0, 0.011, 6.5);
  box(b, flat("#7a4a2a"), 2.2, 0.8, 1.0, 3.6, 0.4, 8.5); box(b, flat("#b98350"), 2.4, 0.06, 1.1, 3.6, 0.83, 8.5); box(b, flat(PAL.red), 0.6, 0.5, 0.6, 3.6, 0.3, 7.6);
  for (let i = 0; i < 28; i++) { const rr = rng(i + 3); b.add(CYL, flat(i % 3 ? "#e32934" : "#f28fb0"), mat4(-1.4 + rr() * 2.8, 0.8 + (rr() < 0.5 ? 0 : 0.02), 6.9 + rr() * 2.2, 0.09, 0.006, 0.07, rr() * 3)); }
  // window + curtains
  box(b, flat("#efe0cc"), 10, 0.9, 0.3, 0, 0.45, 12); box(b, flat("#efe0cc"), 10, 0.5, 0.3, 0, 2.95, 12); for (const x of [-5, -2.4, 2.4, 5]) box(b, flat("#efe0cc"), 2.6, 3.2, 0.3, x, 1.6, 12);
  for (const sx of [-1, 1]) box(b, flat("#8a2f3c"), 0.8, 2.3, 0.25, sx * 2.5, 1.65, 11.8);
  b.build(g, true, true);
  const sky = new THREE.MeshBasicMaterial({ map: glassTex(false), color: new THREE.Color(2.0, 1.6, 1.2), fog: false });
  const gl = new THREE.Mesh(new THREE.PlaneGeometry(5, 1.8), sky); gl.position.set(0, 1.8, 12.4); gl.rotation.y = Math.PI; g.add(gl);
  for (const sx of [-1, 1]) { const m = new THREE.Mesh(CYL, glow(2.4)); m.scale.set(0.3, 0.3, 0.3); m.position.set(sx * 1.9, 1.15, 9.0); g.add(m); }
  return g;
};

// ---------------- FLORIDA DINER ----------------
export const buildDiner = () => {
  const g = new THREE.Group(), b = new Batch(), r: R = { x0: -7, x1: 7, z0: 0, z1: 14, h: 3.6 };
  room(g, r, lam("dinerFloor", () => ({ map: rep(checker("dchk", "#f6f1e6", "#e2453c", "rgba(120,40,40,0.5)"), 7, 7) })), { L: "#59c7b4", R: "#59c7b4", F: "#59c7b4" }, true, true);
  // the back wall is mostly window: palm trees and sunny Florida beyond
  box(b, flat("#59c7b4"), 14, 0.9, 0.3, 0, 0.45, 14); box(b, flat("#59c7b4"), 14, 0.7, 0.3, 0, 3.25, 14);
  for (const x of [-7, -2.4, 2.4, 7]) box(b, flat("#59c7b4"), 0.5, 3.6, 0.3, x, 1.8, 14);
  plane(g, 400, 300, lam("grass", () => ({ color: "#a8d070" })), V(0, -0.01, 150), -Math.PI / 2);
  const sky = new THREE.MeshBasicMaterial({ map: glassTex(true), color: new THREE.Color(1.5, 1.6, 1.8), fog: false });
  const sk = new THREE.Mesh(new THREE.PlaneGeometry(80, 40), sky); sk.position.set(0, 14, 40); sk.rotation.y = Math.PI; g.add(sk);
  for (const [x, z, h] of [[-4, 22, 9], [3.5, 26, 11], [9, 20, 8], [-9, 28, 10]] as const) {
    bar(b, flat("#8a5a34"), V(x, 0, z), V(x + 0.8, h, z), 0.5);
    for (let k = 0; k < 7; k++) { const a = (k / 7) * 6.28; bar(b, flat("#3fae4a"), V(x + 0.8, h, z), V(x + 0.8 + Math.cos(a) * 3.2, h - 1.5 + Math.sin(a) * 0.4, z + Math.sin(a) * 3.2), 0.35); }
  }
  // booths (vinyl benches facing each other over a table), counter with stools, neon palm
  for (const x of [-4.2, 0, 4.2]) {
    box(b, flat("#fbf6e8"), 1.8, 0.1, 1.0, x, 0.82, 9.0); box(b, flat("#cfd5dc"), 0.2, 0.8, 0.2, x, 0.4, 9.0);
    for (const sz of [-1, 1]) { box(b, flat("#e2453c"), 1.8, 0.45, 0.6, x, 0.3, 9.0 + sz * 1.05); box(b, flat("#e2453c"), 1.8, 0.9, 0.18, x, 0.9, 9.0 + sz * 1.45); }
  }
  box(b, flat("#fbf6e8"), 0.9, 1.1, 8, -6.2, 0.55, 5.5); box(b, flat("#2a5fd0"), 1.0, 0.08, 8.1, -6.2, 1.14, 5.5);
  for (let i = 0; i < 4; i++) { b.add(CYL, flat("#e2453c"), mat4(-5.2, 0.7, 2.5 + i * 1.8, 0.28, 0.1, 0.28)); b.add(CYL, flat("#cfd5dc"), mat4(-5.2, 0.35, 2.5 + i * 1.8, 0.05, 0.7, 0.05)); }
  b.build(g, true, true);
  const neon = new THREE.MeshBasicMaterial({ color: new THREE.Color(3.0, 0.8, 1.6), fog: false });
  for (let k = 0; k < 4; k++) { const m = new THREE.Mesh(UNIT, neon); m.scale.set(0.08, 0.9, 0.08); m.position.set(-6.9, 2.7, 6.5 + k * 0.35); m.rotation.x = (k - 1.5) * 0.4; g.add(m); }
  return g;
};

// ---------------- PRISON CELL ----------------
export const buildCell = () => {
  const g = new THREE.Group(), b = new Batch(), r: R = { x0: -4, x1: 4, z0: 0, z1: 8, h: 3.2 };
  room(g, r, lam("cellFloor", () => ({ map: rep(checker("cellchk", "#a3a9ba", "#929ab0", "rgba(60,70,100,0.5)"), 4, 4) })), { L: "#b8bfd0", R: "#b8bfd0", F: "#b8bfd0" }, true, false, "#c6cddd");
  box(b, flat("#b8bfd0"), 8, 3.2, 0.3, 0, 1.6, 8.15);
  // bunk, toilet, sink, the tally wall, a high barred window
  box(b, flat("#5a6580"), 1.6, 0.12, 3.2, -3.0, 0.5, 4.0); box(b, flat("#e8edf6"), 1.5, 0.12, 3.0, -3.0, 0.62, 4.0); box(b, flat("#5a6580"), 1.6, 0.12, 3.2, -3.0, 1.55, 4.0); box(b, flat("#e8edf6"), 1.5, 0.12, 3.0, -3.0, 1.67, 4.0);
  for (const z of [2.5, 5.5]) for (const y of [0.5, 1.1]) box(b, flat("#3a3f58"), 0.1, 1.2, 0.1, -3.7, 0.6 + y * 0, z);
  box(b, flat("#e8edf6"), 0.6, 0.5, 0.6, 3.3, 0.25, 7.3); box(b, flat("#e8edf6"), 0.6, 0.3, 0.5, 3.3, 1.0, 7.3);
  for (let x = -1.2; x <= 1.2; x += 0.4) box(b, flat("#3a3f58"), 0.08, 1.2, 0.1, x + 0.0, 2.3, 7.9);
  b.build(g, true, true);
  const tal = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 2.25), lam("tally", () => ({ map: talliesTex() }))); tal.position.set(1.5, 1.5, 7.97); tal.rotation.y = Math.PI; g.add(tal);
  const win = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.9), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.6, 2.4, 2.0), fog: false })); win.position.set(0, 2.3, 7.98); win.rotation.y = Math.PI; g.add(win);
  return g;
};

// ---------------- props ----------------
const rockGeo = (() => {
  const r = rng(21), geo = new THREE.IcosahedronGeometry(0.5, 1), pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) { const k = 0.78 + r() * 0.4; pos.setXYZ(i, pos.getX(i) * k, pos.getY(i) * k * 0.8, pos.getZ(i) * k); }
  geo.computeVertexNormals();
  return geo;
})();
export const makeRock = (glowing = false) => {
  const g = new THREE.Group();
  const m = new THREE.Mesh(rockGeo, glowing ? new THREE.MeshBasicMaterial({ color: new THREE.Color(1.5, 1.7, 2.3), fog: false }) : lam("rock", () => ({ color: "#aeb2c2", flatShading: true })));
  m.scale.set(0.22, 0.22, 0.22); m.castShadow = m.receiveShadow = true; g.add(m);
  const m2 = new THREE.Mesh(rockGeo, glowing ? new THREE.MeshBasicMaterial({ color: new THREE.Color(1.1, 1.3, 1.9), fog: false }) : lam("rock2", () => ({ color: "#8a8fa4", flatShading: true }))); m2.scale.set(0.12, 0.1, 0.12); m2.position.set(0.1, 0.05, 0.06); g.add(m2);
  return g;
};
export const makeSafe = () => {
  const g = new THREE.Group(), b = new Batch(), green = flat("#4a6a5a");
  box(b, green, 1.0, 1.3, 0.9, 0, 0.65, 0); box(b, flat("#5c8070"), 0.82, 1.1, 0.06, 0, 0.7, -0.46);
  b.add(CYL, flat("#d8b25a"), mat4(0, 0.75, -0.5, 0.17, 0.06, 0.17, 0, Math.PI / 2, 0)); bar(b, flat("#d8b25a"), V(0.2, 0.75, -0.5), V(0.36, 0.75, -0.5), 0.05);
  bar(b, flat("#d8b25a"), V(-0.28, 0.45, -0.5), V(-0.28, 1.0, -0.5), 0.05);
  for (const x of [-0.4, 0.4]) for (const z of [-0.35, 0.35]) box(b, flat("#2a2f45"), 0.12, 0.08, 0.12, x, 0.04, z);
  b.build(g, true, true);
  const d = new THREE.Group(); d.name = "dolly"; d.visible = false;
  const db = new Batch(), st = flat("#5a6580");
  for (const x of [-0.4, 0.4]) bar(db, st, V(x, 0.2, 0.55), V(x, 2.0, 0.65), 0.07);
  box(db, st, 1.0, 0.07, 0.6, 0, 0.2, 0.2); bar(db, st, V(-0.4, 2.0, 0.65), V(0.4, 2.0, 0.65), 0.09);
  for (const x of [-0.5, 0.5]) db.add(CYL, flat("#2a2f45"), mat4(x, 0.2, 0.3, 0.2, 0.1, 0.2, 0, 0, Math.PI / 2));
  db.build(d, true, false); g.add(d);
  return g;
};
export const makeCar = () => {
  const g = new THREE.Group(), b = new Batch(), red = flat("#d0373b");
  box(b, red, 1.8, 0.7, 4.3, 0, 0.7, 0); box(b, red, 1.6, 0.65, 2.3, 0, 1.35, -0.2);
  box(b, flat("#2a3a5a"), 1.62, 0.5, 2.0, 0, 1.38, -0.2); box(b, flat("#2a3a5a"), 1.5, 0.4, 0.05, 0, 1.38, 0.97); box(b, flat("#cfd5dc"), 1.9, 0.18, 0.2, 0, 0.45, 2.2); box(b, flat("#cfd5dc"), 1.9, 0.18, 0.2, 0, 0.45, -2.2);
  for (const sx of [-1, 1]) for (const z of [-1.4, 1.4]) { b.add(CYL, flat("#2a2f45"), mat4(sx * 0.9, 0.38, z, 0.38, 0.28, 0.38, 0, 0, Math.PI / 2)); b.add(CYL, flat("#cfd5dc"), mat4(sx * 0.93, 0.38, z, 0.2, 0.3, 0.2, 0, 0, Math.PI / 2)); }
  b.build(g, true, true);
  for (const sx of [-1, 1]) { const h = new THREE.Mesh(UNIT, glow(3.2)); h.scale.set(0.35, 0.2, 0.06); h.position.set(sx * 0.6, 0.75, 2.17); g.add(h); const t = new THREE.Mesh(UNIT, new THREE.MeshBasicMaterial({ color: new THREE.Color(3, 0.2, 0.2), fog: false })); t.scale.set(0.35, 0.16, 0.06); t.position.set(sx * 0.6, 0.78, -2.17); g.add(t); }
  return g;
};
export const makeLaptop = () => {
  const g = new THREE.Group(), b = new Batch();
  box(b, flat("#cfd5dc"), 0.6, 0.04, 0.42, 0, 0.02, 0); box(b, flat("#cfd5dc"), 0.6, 0.4, 0.03, 0, 0.24, 0.2);
  b.build(g, true, false);
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.54, 0.34), new THREE.MeshBasicMaterial({ map: laptopTex(), color: new THREE.Color(1.4, 1.4, 1.5), fog: false })); scr.position.set(0, 0.24, 0.18); scr.rotation.y = Math.PI; g.add(scr);
  return g;
};
export const makeBadge = () => {
  const g = new THREE.Group(), b = new Batch();
  box(b, flat("#fbf6e8"), 0.34, 0.46, 0.02, 0, 0, 0); box(b, flat("#1a45a6"), 0.34, 0.1, 0.022, 0, 0.18, 0); box(b, flat("#e8c4a0"), 0.18, 0.18, 0.022, 0, 0.0, 0); box(b, flat("#e32934"), 0.34, 0.05, 0.022, 0, -0.18, 0);
  b.build(g, false, false);
  return g;
};
export const makeHammer = () => {
  const g = new THREE.Group(), b = new Batch();
  bar(b, flat("#8a5a34"), V(0, 0, 0), V(0, 0.9, 0), 0.08); box(b, flat("#5a6580"), 0.34, 0.2, 0.2, 0, 0.95, 0);
  b.build(g, true, false);
  return g;
};
export const makeShard = () => { const g = new THREE.Group(), b = new Batch(); box(b, flat("#bfe4ff"), 0.14, 0.02, 0.1, 0, 0, 0); b.build(g, false, false); return g; };
export const makeCuffs = () => {
  const g = new THREE.Group();
  for (const s of [-1, 1]) { const t = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.03, 8, 20), flat("#cfd5dc")); t.name = s < 0 ? "L" : "R"; t.position.x = s * 0.2; t.castShadow = true; g.add(t); }
  const b = new Batch(); bar(b, flat("#cfd5dc"), V(-0.08, 0, 0), V(0.08, 0, 0), 0.03); b.build(g, false, false);
  return g;
};
export const makeCase = () => {
  const g = new THREE.Group(), b = new Batch();
  box(b, flat("#6a3a22"), 0.9, 0.3, 0.6, 0, 0.15, 0); box(b, flat("#d8b25a"), 0.92, 0.04, 0.62, 0, 0.3, 0); box(b, flat("#58b04f"), 0.8, 0.06, 0.5, 0, 0.32, 0); box(b, flat("#6a3a22"), 0.9, 0.5, 0.05, 0, 0.58, 0.3);
  b.build(g, true, true);
  return g;
};
export const makeRoses = () => {
  const g = new THREE.Group(), b = new Batch();
  for (let i = 0; i < 7; i++) { const a = (i / 7) * 6.28, x = Math.cos(a) * 0.12, z = Math.sin(a) * 0.12; bar(b, flat("#3fae4a"), V(0, 0, 0), V(x, 0.4, z), 0.02); b.add(SPH, flat(i % 2 ? "#e32934" : "#f06a8a"), mat4(x, 0.44, z, 0.07, 0.07, 0.07)); }
  b.build(g, true, false);
  return g;
};
export const makeReceipt = () => {
  const g = new THREE.Group();
  const strip = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1), lam("receiptT", () => ({ map: rep(receiptTex(), 1, 2), side: THREE.DoubleSide })));
  strip.name = "strip"; strip.rotation.x = -Math.PI / 2; strip.position.set(0, 0.02, 0.5); strip.receiveShadow = true; g.add(strip);
  const roll = new THREE.Mesh(CYL, flat("#fbf6e8")); roll.scale.set(0.09, 1.2, 0.09); roll.rotation.z = Math.PI / 2; roll.position.set(0, 0.06, 0); roll.name = "roll"; roll.castShadow = true; g.add(roll);
  return g;
};
export const makeCash = () => {
  const g = new THREE.Group(), b = new Batch();
  box(b, flat("#58b04f"), 0.5, 0.14, 0.24, 0, 0.07, 0); box(b, flat(PAL.cream), 0.506, 0.146, 0.07, 0, 0.07, 0); box(b, flat("#3d8a3a"), 0.52, 0.02, 0.26, 0, 0.15, 0);
  b.build(g, true, true);
  return g;
};
