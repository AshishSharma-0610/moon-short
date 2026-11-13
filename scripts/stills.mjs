
// npm run stills: render key frames to out/stills
// Usage:
// npm run stills
// npm run stills -- 36 120 250

import { spawnSync } from "node:child_process";
import { readFileSync, mkdirSync } from "node:fs";

const shots = JSON.parse(
  readFileSync("voice/shots.json", "utf8")
).shots;

const words = JSON.parse(
  readFileSync("voice/words.json", "utf8")
);

const w = words.words;

const frameAt = (i) => Math.round(w[i].s * 30);

const total = Math.ceil(words.duration * 30);

// Default frames to render
const def = [
  4,
  frameAt(2) + 14,
  frameAt(9) + 2,
  frameAt(13) + 6,
  frameAt(17) + 4,
  frameAt(19) + 6,
  frameAt(23) + 4,
  frameAt(24) + 4,
  frameAt(31) + 4,
  total - 3,
];

// Allow custom frame numbers from command line
const frames =
  process.argv.length > 2
    ? process.argv.slice(2).map(Number)
    : [...new Set(def)].sort((a, b) => a - b);

mkdirSync("out/stills", { recursive: true });

const npx = process.platform === "win32" ? "npx.cmd" : "npx";

for (const f of frames) {
  console.log(`still frame ${f}`);

  const r = spawnSync(
    npx,
    [
      "remotion",
      "still",
      "src/index.ts",
      "MoonShort",
      `out/stills/f${String(f).padStart(3, "0")}.png`,
      `--frame=${f}`,
      "--scale=0.5",
      "--gl=angle",
    ],
    {
      stdio: "inherit",
      shell: process.platform === "win32",
    }
  );

  if (r.status !== 0) {
    process.exit(r.status ?? 1);
  }
}

console.log("done: out/stills/*.png");
