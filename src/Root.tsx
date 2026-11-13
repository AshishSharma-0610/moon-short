import React from "react";
import { Composition } from "remotion";
import { MoonShort } from "./videos/moon/Short";
import { TOTAL, FPS } from "./videos/moon/story";

// 1080 x 1920 vertical; `npm run render` upscales x1.3333 to 1440 x 2560 (every post parameter scales with the output size).
export const Root: React.FC = () => (
  <Composition id="MoonShort" component={MoonShort} durationInFrames={TOTAL} fps={FPS} width={1080} height={1920} />
);
