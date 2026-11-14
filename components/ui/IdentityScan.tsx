"use client";

import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent, MouseEvent, PointerEvent } from "react";
import { profile } from "@/lib/data";

const PHOTO_SRC = "/images/ako.jpg";
// Region of the photo to reconstruct (fractions): head, neck and shoulders.
const CROP = { x: 0.2, y: 0.255, w: 0.6, h: 0.505 };
// Empty margin around the portrait inside the canvas, so scattered glyphs never hit a hard edge.
// The bottom needs little: the shoulders already dissolve there and the log sits right below.
const PAD = 0.04;
const PAD_BOTTOM = 0.015;

const FONT_FAMILY = '"Source Code Pro", ui-monospace, monospace';
const LINE_HEIGHT = 1.1;
// Sparse → dense; brighter photo pixels get denser glyphs.
const RAMP = ".'`^:;!i~+?]1|tfxvcJLCZ0Ookh*#M&8%B@";
const NOISE = "@#X9%&A7*?$0Z<>/\\=+";
const NOISE_RGB = [122, 165, 196]; // steel blue
const ACCENT_RGB = [236, 163, 95]; // orange
const SIZE_BUCKETS = [0.6, 0.8, 1, 1.2, 1.4, 1.6];

// One-shot timeline in ms, measured from when the intro loading screen clears.
const START_DELAY = 1200;
const MAX_APPEAR = 1300; // latest moment a glyph fades in
const MAX_TRAVEL = 1800; // longest glide to its target
const SETTLE = 150; // scramble time after arriving, before locking
const T_FORMED = MAX_APPEAR + MAX_TRAVEL + SETTLE;
// Leaves time for the last log line (starts at T_FORMED + 700) to finish typing.
const T_LOG_END = T_FORMED + 1900;

const GLYPH_MS = 70;
const FORM_FRAME_MS = 1000 / 30;
const IDLE_FRAME_MS = 1000 / 15;
const TYPE_MS = 18;

// Interaction physics, tuned per 60fps frame.
const HOVER_RADIUS = 60;
const HOVER_FORCE = 2.4;
const SPRING = 0.035;
const DAMPING = 0.86;
const WAVE_SPEED = 0.6; // px per ms
const WAVE_IMPULSE = 7;

// Click reveal of the real photo: a circle trailing the shockwave ring uncovers the photo, it holds,
// then a circle closing in on the face covers it with glyphs again.
const REVEAL_SPEED = 0.45; // px per ms, a little slower than the ring
const REVEAL_LAG = 120; // ms the reveal circle trails the ring
const REVEAL_SOFT = 40; // px, soft edge of the reveal circle
const REVEAL_HOLD = 5000;
const REVEAL_OUT = 1000;
const REVEAL_LINE_DELAY = 700; // when the log's reveal line starts typing

// Rising runes fade out over this many px near the canvas border.
const EDGE_SOFT = 28;

// Facts typed into the log, one per click on the portrait.
const FACTS: [string, string][] = [
  ["whoami", `${profile.name.toLowerCase().replace(/\s+/g, "_")} · full-stack dev · BSIT @ ${profile.universityShort}`],
  ["focus", "mobile apps · machine learning · web"],
  ["learning", "C++ (deep dive)"],
  ["projects", "ChickDetect · Motoshapi"],
  ["open_to", "collaborating on code projects"],
];

// Reconstruct once per page load; client-side navigation back to the hero shows the finished face.
let hasPlayed = false;

type Particle = {
  tx: number; // home position (whole pixels)
  ty: number;
  sx: number; // scattered start position
  sy: number;
  appear: number; // ms when it fades in
  travel: number; // ms spent gliding home
  scale: number; // starting size relative to the final glyph
  ch: string;
  r: number;
  g: number;
  b: number;
  alpha: number; // final opacity (< 1 where the shoulders dissolve)
};

// Enchanting-table style rune: rises from near the shoulders and fades out, then starts over.
type Rune = { x: number; y: number; phase: number; period: number; rise: number; alpha: number };

type Scene = {
  particles: Particle[];
  runes: Rune[];
  left: number; // top-left corner of the glyph grid
  top: number;
  cols: number;
  rows: number;
  cellW: number;
  cellH: number;
  fontSize: number;
  width: number;
  height: number;
};

// Deterministic pseudo-random values so every glyph has a stable personality.
function hash(a: number, b: number) {
  let h = (a * 374761393 + b * 668265263) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

function gauss(i: number, k: number) {
  const u = Math.max(hash(i, k), 1e-6);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * hash(i, k + 1));
}

const smoothstep = (x: number) => {
  const t = Math.min(Math.max(x, 0), 1);
  return t * t * (3 - 2 * t);
};

const rgba = (r: number, g: number, b: number, a: number) => `rgba(${r | 0},${g | 0},${b | 0},${a.toFixed(3)})`;

// The crop cuts through the shoulders at the sides and bottom; both the glyphs and the revealed
// photo dissolve towards those edges.
const edgeFade = (col: number, row: number, cols: number, rows: number) =>
  smoothstep(Math.min(Math.min(col, cols - 1 - col) / (cols * 0.13), (rows - 1 - row) / (rows * 0.14)));

// Opacity for a glyph drawn at (x, y): 0 at the canvas border, 1 once EDGE_SOFT px inside it.
function borderAlpha(scene: Scene, x: number, y: number) {
  return smoothstep(Math.min(x, scene.width - scene.cellW - x, y, scene.height - scene.cellH - y) / EDGE_SOFT);
}

// Opacity at point (px, py): 1 in the middle of an oval inscribed in the canvas, fading to 0 at its
// rim, so moving glyphs and shockwave rings stay round rather than tracing the canvas rectangle.
function ovalAt(scene: Scene, px: number, py: number) {
  const nx = (px - scene.width / 2) / (scene.width / 2);
  const ny = (py - scene.height / 2) / (scene.height / 2);
  return 1 - smoothstep((Math.hypot(nx, ny) - 0.8) / 0.2);
}

// Same, for a glyph whose top-left corner is at (x, y).
const ovalAlpha = (scene: Scene, x: number, y: number) => ovalAt(scene, x + scene.cellW / 2, y + scene.cellH / 2);

function buildScene(img: HTMLImageElement, width: number, ctx: CanvasRenderingContext2D): Scene {
  const pad = Math.round(width * PAD);
  const gridW = width - pad * 2;

  // Whole-pixel font size so glyphs render crisply; the cell width follows the font's advance.
  ctx.font = `100px ${FONT_FAMILY}`;
  const glyphRatio = ctx.measureText("M").width / 100;
  const targetCols = width >= 400 ? 76 : 60;
  const fontSize = Math.max(6, Math.round(gridW / targetCols / glyphRatio));
  const cellW = fontSize * glyphRatio;
  const cellH = Math.round(fontSize * LINE_HEIGHT);
  const cols = Math.floor(gridW / cellW);
  const left = pad + (gridW - cols * cellW) / 2;

  const sw = img.naturalWidth * CROP.w;
  const sh = img.naturalHeight * CROP.h;
  // Keeps the photo's true proportions: rows account for the glyph cell's aspect ratio.
  const rows = Math.round(cols * (sh / sw) * (cellW / cellH));
  const height = pad + rows * cellH + Math.round(width * PAD_BOTTOM);

  const sample = document.createElement("canvas");
  sample.width = cols;
  sample.height = rows;
  const sctx = sample.getContext("2d", { willReadFrequently: true })!;
  sctx.imageSmoothingQuality = "high";
  sctx.drawImage(img, img.naturalWidth * CROP.x, img.naturalHeight * CROP.y, sw, sh, 0, 0, cols, rows);
  const data = sctx.getImageData(0, 0, cols, rows).data;

  const lum: number[] = [];
  const isBg: boolean[] = [];
  for (let i = 0; i < cols * rows; i++) {
    const r = data[i * 4], g = data[i * 4 + 1], b = data[i * 4 + 2];
    lum.push((0.299 * r + 0.587 * g + 0.114 * b) / 255);
    // The photo has a plain white backdrop: near-white, low-saturation pixels are background.
    isBg.push(Math.min(r, g, b) > 228 && Math.max(r, g, b) - Math.min(r, g, b) < 24);
  }

  // Edge cells where dark hair blends into the white backdrop come out as bright grey and
  // read as a halo; drop light, unsaturated cells that touch the background (skin stays, it is warm).
  const edgeBg = isBg.map((bg, i) => {
    if (bg) return true;
    const row = Math.floor(i / cols), col = i % cols;
    const touchesBg =
      (col > 0 && isBg[i - 1]) || (col < cols - 1 && isBg[i + 1]) ||
      (row > 0 && isBg[i - cols]) || (row < rows - 1 && isBg[i + cols]);
    const r = data[i * 4], g = data[i * 4 + 1], b = data[i * 4 + 2];
    return touchesBg && lum[i] > 0.45 && Math.max(r, g, b) - Math.min(r, g, b) < 40;
  });

  // Gentle, order-preserving contrast stretch: glyph density follows the photo's own tones.
  const sorted = lum.filter((_, i) => !edgeBg[i]).sort((a, b) => a - b);
  const lo = sorted[Math.floor(sorted.length * 0.02)] ?? 0;
  const hi = sorted[Math.floor(sorted.length * 0.98)] ?? 1;

  const cx = width / 2;
  const cy = pad + rows * cellH * 0.38; // roughly the middle of the face
  const maxDist = Math.hypot(width / 2, height / 2);

  const particles: Particle[] = [];
  const runes: Rune[] = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const i = row * cols + col;
      if (edgeBg[i]) continue;

      const fade = edgeFade(col, row, cols, rows);
      const tx = Math.round(left + col * cellW);
      const ty = pad + row * cellH;

      if (hash(i, 21) > fade ** 0.7) {
        // Dropped from the portrait; some become runes drifting up past the contour.
        if (hash(i, 22) < 0.22 * (1 - fade) && fade > 0.05) {
          runes.push({
            x: tx + gauss(i, 23) * cellW * 2,
            y: Math.min(ty + gauss(i, 25) * cellH, height - cellH),
            phase: hash(i, 27),
            period: 3200 + hash(i, 28) * 2800,
            rise: cellH * (2.5 + hash(i, 29) * 3),
            alpha: 0.2 + 0.4 * (1 - fade),
          });
        }
        continue;
      }

      const t = Math.min(Math.max((lum[i] - lo) / Math.max(hi - lo, 0.01), 0), 1);
      // Lift dark tones (hair, tie) so they stay visible on the dark page; shape is untouched.
      let r = data[i * 4], g = data[i * 4 + 1], b = data[i * 4 + 2];
      const peak = Math.max(r, g, b, 1);
      if (peak < 110) {
        const k = 110 / peak;
        r = Math.min(255, r * k);
        g = Math.min(255, g * k);
        b = Math.min(255, b * k);
      }

      // Organic order: loosely centre-outward with plenty of randomness.
      const dist = Math.hypot(tx - cx, ty - cy) / maxDist;
      particles.push({
        tx,
        ty,
        // Not clamped to the canvas: glyphs may start out of view and fade in as they drift inward.
        sx: tx + gauss(i, 1) * width * 0.16,
        sy: ty + gauss(i, 3) * height * 0.13,
        appear: Math.min(dist * 700 + hash(i, 5) * 650, MAX_APPEAR),
        travel: 900 + hash(i, 6) * (MAX_TRAVEL - 900),
        scale: SIZE_BUCKETS[Math.floor(hash(i, 7) * SIZE_BUCKETS.length)],
        ch: RAMP[Math.round(t * (RAMP.length - 1))],
        r: r | 0,
        g: g | 0,
        b: b | 0,
        alpha: 0.35 + 0.65 * fade,
      });
    }
  }

  return { particles, runes, left, top: pad, cols, rows, cellW, cellH, fontSize, width, height };
}

// The real photo, aligned exactly with the glyph grid: white backdrop removed, shoulders dissolved.
function buildPhoto(img: HTMLImageElement, scene: Scene, dpr: number) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(scene.width * dpr);
  canvas.height = Math.round(scene.height * dpr);
  const c = canvas.getContext("2d", { willReadFrequently: true })!;
  c.imageSmoothingQuality = "high";
  c.drawImage(
    img,
    img.naturalWidth * CROP.x,
    img.naturalHeight * CROP.y,
    img.naturalWidth * CROP.w,
    img.naturalHeight * CROP.h,
    scene.left * dpr,
    scene.top * dpr,
    scene.cols * scene.cellW * dpr,
    scene.rows * scene.cellH * dpr,
  );

  const image = c.getImageData(0, 0, canvas.width, canvas.height);
  const px = image.data;
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const i = (y * canvas.width + x) * 4;
      if (px[i + 3] === 0) continue;
      const r = px[i], g = px[i + 1], b = px[i + 2];
      const min = Math.min(r, g, b);
      // Neutral light pixels are the white backdrop (or hair blended into it); coloured ones are kept.
      let a = Math.max(r, g, b) - min > 40 ? 1 : Math.min(Math.max((250 - min) / 100, 0), 1);
      if (a > 0 && a < 1) {
        // Un-blend the white so hair edges come out dark instead of a light halo.
        px[i] = Math.max(0, (r - (1 - a) * 255) / a);
        px[i + 1] = Math.max(0, (g - (1 - a) * 255) / a);
        px[i + 2] = Math.max(0, (b - (1 - a) * 255) / a);
      }
      a *= edgeFade((x / dpr - scene.left) / scene.cellW, (y / dpr - scene.top) / scene.cellH, scene.cols, scene.rows);
      px[i + 3] = Math.round(a * 255);
    }
  }

  // Trim the silhouette by about a pixel so no pale fringe from the white backdrop survives
  // around the ears and collar.
  const radius = Math.max(1, Math.round(dpr));
  const alpha = new Uint8ClampedArray(canvas.width * canvas.height);
  for (let i = 0; i < alpha.length; i++) alpha[i] = px[i * 4 + 3];
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const i = y * canvas.width + x;
      if (alpha[i] === 0) continue;
      let min = alpha[i];
      for (let dy = -radius; dy <= radius && min > 0; dy++) {
        const yy = y + dy;
        if (yy < 0 || yy >= canvas.height) continue;
        for (let dx = -radius; dx <= radius; dx++) {
          const xx = x + dx;
          if (xx < 0 || xx >= canvas.width) continue;
          min = Math.min(min, alpha[yy * canvas.width + xx]);
        }
      }
      px[i * 4 + 3] = min;
    }
  }
  c.putImageData(image, 0, 0);
  return canvas;
}

type Circle = { x: number; y: number; r: number };

type Reveal = {
  x: number; // where the photo is uncovered from (the click)
  y: number;
  t0: number;
  cover: number; // radius at which the whole canvas is uncovered
  outAt: number; // when the return starts
  out: Circle; // circle the photo shrinks into on the way back (r = its starting radius)
  scrambled: boolean; // glyphs already told to scramble back in
};

const coverRadius = (scene: Scene, x: number, y: number) =>
  Math.max(Math.hypot(x, y), Math.hypot(scene.width - x, y), Math.hypot(x, scene.height - y), Math.hypot(scene.width - x, scene.height - y)) +
  REVEAL_SOFT;

function startReveal(scene: Scene, x: number, y: number, now: number): Reveal {
  const cover = coverRadius(scene, x, y);
  const fx = scene.width / 2;
  const fy = scene.top + scene.rows * scene.cellH * 0.38; // middle of the face
  return {
    x,
    y,
    t0: now,
    cover,
    outAt: now + REVEAL_LAG + cover / REVEAL_SPEED + REVEAL_HOLD,
    out: { x: fx, y: fy, r: coverRadius(scene, fx, fy) },
    scrambled: false,
  };
}

// The photo-revealing circle at `now`, or null once the reveal has finished.
function revealCircle(rv: Reveal, now: number): Circle | null {
  if (now < rv.outAt) {
    return { x: rv.x, y: rv.y, r: Math.min(Math.max((now - rv.t0 - REVEAL_LAG) * REVEAL_SPEED, 0), rv.cover) };
  }
  const k = (now - rv.outAt) / REVEAL_OUT;
  if (k >= 1) return null;
  return { x: rv.out.x, y: rv.out.y, r: rv.out.r * (1 - smoothstep(k)) };
}

// How far (x, y) is inside the circle: 1 well inside, 0 outside, linear across the soft edge.
const insideCircle = (c: Circle, x: number, y: number) =>
  Math.min(Math.max((c.r - Math.hypot(x - c.x, y - c.y)) / REVEAL_SOFT, 0), 1);

// Draws the photo masked to the reveal circle, using the same soft edge as `insideCircle`.
function drawPhotoCircle(
  ctx: CanvasRenderingContext2D,
  scene: Scene,
  photo: HTMLCanvasElement,
  buffer: HTMLCanvasElement,
  c: Circle,
  dpr: number,
) {
  if (c.r <= 0) return;
  const b = buffer.getContext("2d")!;
  b.globalCompositeOperation = "source-over";
  b.clearRect(0, 0, buffer.width, buffer.height);
  b.drawImage(photo, 0, 0);
  b.globalCompositeOperation = "destination-in";
  const g = b.createRadialGradient(c.x * dpr, c.y * dpr, Math.max(c.r - REVEAL_SOFT, 0) * dpr, c.x * dpr, c.y * dpr, c.r * dpr);
  g.addColorStop(0, "rgba(0,0,0,1)");
  g.addColorStop(1, "rgba(0,0,0,0)");
  b.fillStyle = g;
  b.fillRect(0, 0, buffer.width, buffer.height);
  b.globalCompositeOperation = "source-over";
  ctx.drawImage(buffer, 0, 0, scene.width, scene.height);
}

function drawRunes(ctx: CanvasRenderingContext2D, scene: Scene, t: number, fadeIn: number) {
  if (fadeIn <= 0) return;
  ctx.font = `${scene.fontSize}px ${FONT_FAMILY}`;
  scene.runes.forEach((rune, i) => {
    const progress = t / rune.period + rune.phase;
    const frac = progress % 1;
    const x = rune.x + Math.sin(frac * Math.PI * 2) * scene.cellW * 0.6;
    const y = rune.y - frac * rune.rise;
    const a = rune.alpha * fadeIn * Math.sin(frac * Math.PI) * borderAlpha(scene, x, y);
    ctx.fillStyle = rgba(NOISE_RGB[0], NOISE_RGB[1], NOISE_RGB[2], a);
    // A fresh glyph for every rise.
    ctx.fillText(NOISE[Math.floor(hash(i, Math.floor(progress)) * NOISE.length)], Math.round(x), Math.round(y));
  });
}

// Formation frame: every glyph fades in somewhere in the cloud, glides home scrambling, then locks.
function drawForming(ctx: CanvasRenderingContext2D, scene: Scene, t: number) {
  ctx.clearRect(0, 0, scene.width, scene.height);
  ctx.textBaseline = "top";
  const tick = Math.floor(t / GLYPH_MS);
  let locked = 0;

  for (const bucket of SIZE_BUCKETS) {
    ctx.font = `${Math.round(scene.fontSize * bucket)}px ${FONT_FAMILY}`;
    for (let i = 0; i < scene.particles.length; i++) {
      const p = scene.particles[i];
      if (t < p.appear) continue;
      const prog = Math.min((t - p.appear) / p.travel, 1);
      const e = 1 - (1 - prog) ** 3;
      // Glyphs shrink or grow towards the final size; draw each in its nearest size bucket.
      const size = p.scale + (1 - p.scale) * e;
      const nearest = SIZE_BUCKETS.reduce((a, b) => (Math.abs(b - size) < Math.abs(a - size) ? b : a));
      if (nearest !== bucket) continue;

      const isLocked = t >= p.appear + p.travel + SETTLE;
      if (isLocked) {
        locked++;
        ctx.fillStyle = rgba(p.r, p.g, p.b, p.alpha);
        ctx.fillText(p.ch, p.tx, p.ty);
        continue;
      }
      const x = p.sx + (p.tx - p.sx) * e;
      const y = p.sy + (p.ty - p.sy) * e;
      const fadeIn = Math.min((t - p.appear) / 250, 1);
      // The oval limit relaxes as the glyph nears home, so edge-of-shoulder glyphs never pop in.
      const o = ovalAlpha(scene, x, y);
      const a = fadeIn * ((0.3 + 0.45 * hash(i, 9)) * (1 - e) + p.alpha * e) * (o + (1 - o) * e);
      if (a <= 0.005) continue;
      ctx.fillStyle = rgba(
        NOISE_RGB[0] + (p.r - NOISE_RGB[0]) * e,
        NOISE_RGB[1] + (p.g - NOISE_RGB[1]) * e,
        NOISE_RGB[2] + (p.b - NOISE_RGB[2]) * e,
        a,
      );
      ctx.fillText(NOISE[Math.floor(hash(tick, i) * NOISE.length)], x, y);
    }
  }

  drawRunes(ctx, scene, t, Math.min(Math.max((t - MAX_APPEAR) / 800, 0), 1));
  return locked / Math.max(scene.particles.length, 1);
}

// The finished portrait, cached so the still state is a single image copy.
function renderPortrait(scene: Scene, dpr: number) {
  const cache = document.createElement("canvas");
  cache.width = Math.round(scene.width * dpr);
  cache.height = Math.round(scene.height * dpr);
  const c = cache.getContext("2d")!;
  c.scale(dpr, dpr);
  c.textBaseline = "top";
  c.font = `${scene.fontSize}px ${FONT_FAMILY}`;
  for (const p of scene.particles) {
    c.fillStyle = rgba(p.r, p.g, p.b, p.alpha);
    c.fillText(p.ch, p.tx, p.ty);
  }
  return cache;
}

// ---- Interaction physics ---------------------------------------------------

// `reach` is how far the push travels; `fade` is the radius at which the visible ring has faded out
// (the same for every click). `push` is false for a ring that is only drawn, not felt by the glyphs.
type Wave = { x: number; y: number; t0: number; id: number; reach: number; fade: number; push: boolean };

const RING_SEGMENTS = 96;

type Sim = {
  x: Float32Array;
  y: Float32Array;
  vx: Float32Array;
  vy: Float32Array;
  scrambleUntil: Float64Array;
  lastWave: Int32Array;
};

function createSim(scene: Scene): Sim {
  const n = scene.particles.length;
  const sim: Sim = {
    x: new Float32Array(n),
    y: new Float32Array(n),
    vx: new Float32Array(n),
    vy: new Float32Array(n),
    scrambleUntil: new Float64Array(n),
    lastWave: new Int32Array(n),
  };
  scene.particles.forEach((p, i) => {
    sim.x[i] = p.tx;
    sim.y[i] = p.ty;
  });
  return sim;
}

// Advances the simulation; returns whether anything is still moving or scrambled.
function stepSim(scene: Scene, sim: Sim, now: number, dt: number, pointer: { x: number; y: number } | null, waves: Wave[]) {
  let active = false;
  const damp = DAMPING ** dt;
  for (let i = 0; i < scene.particles.length; i++) {
    const p = scene.particles[i];
    let vx = sim.vx[i];
    let vy = sim.vy[i];
    const x = sim.x[i];
    const y = sim.y[i];

    // The cursor pushes nearby glyphs away and scrambles them.
    if (pointer) {
      const dx = x - pointer.x;
      const dy = y - pointer.y;
      const d2 = dx * dx + dy * dy;
      if (d2 < HOVER_RADIUS * HOVER_RADIUS) {
        const d = Math.sqrt(d2) || 1;
        const f = (1 - d / HOVER_RADIUS) ** 2 * HOVER_FORCE * dt;
        vx += (dx / d) * f;
        vy += (dy / d) * f;
        sim.scrambleUntil[i] = now + 220;
      }
    }

    // Shockwave rings kick each glyph once as they pass it.
    for (const w of waves) {
      if (!w.push || sim.lastWave[i] >= w.id) continue;
      const dx = x - w.x;
      const dy = y - w.y;
      const d = Math.hypot(dx, dy) || 1;
      if (d > (now - w.t0) * WAVE_SPEED) continue;
      const kick = WAVE_IMPULSE * (1 - 0.5 * Math.min(d / w.reach, 1));
      vx += (dx / d) * kick;
      vy += (dy / d) * kick;
      sim.scrambleUntil[i] = now + 500 + hash(i, w.id) * 500;
      sim.lastWave[i] = w.id;
    }

    // Spring home.
    vx = (vx + (p.tx - x) * SPRING * dt) * damp;
    vy = (vy + (p.ty - y) * SPRING * dt) * damp;
    let nx = x + vx * dt;
    let ny = y + vy * dt;
    if (Math.abs(vx) + Math.abs(vy) < 0.02 && Math.abs(nx - p.tx) + Math.abs(ny - p.ty) < 0.3) {
      nx = p.tx;
      ny = p.ty;
      vx = 0;
      vy = 0;
    } else {
      active = true;
    }
    if (now < sim.scrambleUntil[i]) active = true;
    sim.x[i] = nx;
    sim.y[i] = ny;
    sim.vx[i] = vx;
    sim.vy[i] = vy;
  }
  return active;
}

function drawLive(
  ctx: CanvasRenderingContext2D,
  scene: Scene,
  sim: Sim,
  now: number,
  waves: Wave[],
  photo: { layer: HTMLCanvasElement; buffer: HTMLCanvasElement; circle: Circle; dpr: number } | null,
) {
  ctx.clearRect(0, 0, scene.width, scene.height);
  ctx.textBaseline = "top";
  ctx.font = `${scene.fontSize}px ${FONT_FAMILY}`;
  const tick = Math.floor(now / GLYPH_MS);

  for (let i = 0; i < scene.particles.length; i++) {
    const p = scene.particles[i];
    const x = sim.x[i];
    const y = sim.y[i];
    // Glyphs give way to the photo inside the reveal circle.
    const hidden = photo ? insideCircle(photo.circle, x + scene.cellW / 2, y + scene.cellH / 2) : 0;
    if (hidden >= 1) continue;
    const off = Math.abs(x - p.tx) + Math.abs(y - p.ty);
    if (off < 0.5 && now >= sim.scrambleUntil[i]) {
      ctx.fillStyle = rgba(p.r, p.g, p.b, p.alpha * (1 - hidden));
      ctx.fillText(p.ch, p.tx, p.ty);
      continue;
    }
    // Displaced glyphs scramble, cool towards blue and fade with distance from home; far-flung ones
    // also fade towards the oval's rim so the scattered cloud stays round.
    const k = Math.min(off / 30, 1);
    const o = ovalAlpha(scene, x, y);
    const a = p.alpha * (1 - 0.55 * k) * (o + (1 - o) * (1 - k)) * (1 - hidden);
    if (a <= 0.005) continue;
    ctx.fillStyle = rgba(
      p.r + (NOISE_RGB[0] - p.r) * k,
      p.g + (NOISE_RGB[1] - p.g) * k,
      p.b + (NOISE_RGB[2] - p.b) * k,
      a,
    );
    ctx.fillText(NOISE[Math.floor(hash(tick, i) * NOISE.length)], Math.round(x), Math.round(y));
  }

  if (photo) drawPhotoCircle(ctx, scene, photo.layer, photo.buffer, photo.circle, photo.dpr);

  // A faint ring marks each shockwave as it expands.
  for (const w of waves) {
    // The click timestamp can land just after this frame's timestamp; never draw a negative radius.
    const r = Math.max((now - w.t0) * WAVE_SPEED, 0);
    const a = 0.3 * (1 - Math.min(r / w.fade, 1));
    if (a <= 0 || r === 0) continue;
    // Drawn in short arcs, each faded by the oval at its position, so the ring stays visible over
    // the portrait and melts away towards the rim instead of being cut by the canvas edge.
    ctx.lineWidth = 1;
    for (let s = 0; s < RING_SEGMENTS; s++) {
      const a0 = (s / RING_SEGMENTS) * Math.PI * 2;
      const a1 = ((s + 1) / RING_SEGMENTS) * Math.PI * 2;
      const mid = (a0 + a1) / 2;
      const segA = a * ovalAt(scene, w.x + Math.cos(mid) * r, w.y + Math.sin(mid) * r);
      if (segA <= 0.005) continue;
      ctx.strokeStyle = rgba(ACCENT_RGB[0], ACCENT_RGB[1], ACCENT_RGB[2], segA);
      ctx.beginPath();
      ctx.arc(w.x, w.y, r, a0, a1);
      ctx.stroke();
    }
  }

  drawRunes(ctx, scene, now, 1);
}

function drawStill(ctx: CanvasRenderingContext2D, scene: Scene, cache: HTMLCanvasElement, now: number, runes: boolean) {
  ctx.clearRect(0, 0, scene.width, scene.height);
  ctx.drawImage(cache, 0, 0, scene.width, scene.height);
  ctx.textBaseline = "top";
  if (runes) drawRunes(ctx, scene, now, 1);
}

// ---- Terminal log -------------------------------------------------------

type Segment = { text: string; className: string };
type LogLine = { at: number; segments: Segment[] };

const OK = "text-secondary";
const BUSY = "text-primary";
const DIM = "text-text-muted";
const VALUE = "text-white";

const leader = (label: string, width: number) => ` ${label} ${".".repeat(Math.max(width - label.length, 3))} `;

function buildLog(t: number, progress: number, scene: Scene | null, compact: boolean): LogLine[] {
  const w = compact ? 20 : 25;
  const formed = t >= T_FORMED;
  const pct = formed ? 100 : Math.floor(progress * 100);
  const subject = profile.name.toLowerCase().replace(/\s+/g, "_");
  const role = `bsit@${profile.universityShort.toLowerCase()}`;

  return [
    {
      at: 0,
      segments: [
        { text: "$ ", className: OK },
        { text: "./identity --reconstruct ako.jpg", className: VALUE },
      ],
    },
    {
      at: 250,
      segments: [
        { text: "[ OK ]", className: OK },
        { text: leader("spawning glyphs", w), className: DIM },
        { text: String(scene?.particles.length ?? 0), className: VALUE },
      ],
    },
    {
      at: 600,
      segments: [
        { text: formed ? "[ OK ]" : "[ .. ]", className: formed ? OK : BUSY },
        { text: leader("assembling facial matrix", w), className: DIM },
        { text: `${String(pct).padStart(2, "0")}%`, className: formed ? VALUE : BUSY },
      ],
    },
    {
      at: T_FORMED,
      segments: [
        { text: "[ OK ]", className: OK },
        { text: " identity reconstructed · ", className: DIM },
        { text: scene ? `${scene.cols}×${scene.rows} glyphs` : "", className: VALUE },
      ],
    },
    {
      at: T_FORMED + 350,
      segments: [
        { text: "[ OK ]", className: OK },
        { text: " identity verified ", className: DIM },
        { text: "✓", className: OK },
      ],
    },
    {
      at: T_FORMED + 700,
      segments: [
        { text: "> ", className: BUSY },
        { text: "subject=", className: DIM },
        { text: subject, className: VALUE },
        { text: "  role=", className: DIM },
        { text: role, className: VALUE },
        { text: "  status=", className: DIM },
        { text: "online", className: OK },
      ],
    },
  ];
}

function TypedSegments({ segments, typed }: { segments: Segment[]; typed: number }) {
  let budget = typed;
  return (
    <>
      {segments.map((seg, j) => {
        const shown = seg.text.slice(0, Math.max(budget, 0));
        budget -= seg.text.length;
        return shown ? (
          <span key={j} className={seg.className}>
            {shown}
          </span>
        ) : null;
      })}
    </>
  );
}

const Cursor = () => (
  <span className="ml-1 inline-block h-[1.1em] w-[0.6em] translate-y-[0.15em] animate-pulse bg-primary" aria-hidden />
);

type TypedLine = { segments: Segment[]; typed: number };

const REVEAL_LINE: Segment[] = [
  { text: "> ", className: BUSY },
  { text: "decrypt --raw ako.jpg", className: VALUE },
  { text: " → ", className: DIM },
  { text: "identity confirmed ✓", className: OK },
];

function TerminalLog({
  t,
  progress,
  scene,
  compact,
  fact,
  reveal,
}: {
  t: number;
  progress: number;
  scene: Scene | null;
  compact: boolean;
  fact: TypedLine | null;
  reveal: TypedLine | null;
}) {
  const lines = buildLog(t, progress, scene, compact).filter((line) => t >= line.at);
  const done = t >= T_LOG_END;
  const revealShown = reveal && reveal.typed > 0;
  return (
    <div aria-live="off" className="mt-1 w-full font-mono text-[9.5px] leading-relaxed tracking-wide sm:text-[10.5px]">
      {lines.map((line, i) => (
        <div key={i} className="whitespace-pre-wrap break-words">
          {/* Type each line out character by character from the moment it appears. */}
          <TypedSegments segments={line.segments} typed={Math.floor((t - line.at) / TYPE_MS)} />
          {i === lines.length - 1 && !fact && <Cursor />}
        </div>
      ))}
      {/* Reserved lines for the latest click fact and photo reveal, so the layout never shifts. */}
      {done && (
        <>
          <div className="min-h-[1.625em] whitespace-pre-wrap break-words">
            {fact && <TypedSegments segments={fact.segments} typed={fact.typed} />}
            {fact && !revealShown && <Cursor />}
          </div>
          <div className="min-h-[1.625em] whitespace-pre-wrap break-words">
            {revealShown && (
              <>
                <TypedSegments segments={reveal.segments} typed={reveal.typed} />
                <Cursor />
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// Types a line out one character at a time, starting `delay` ms after each new `trigger`.
function useTyped(trigger: number, delay: number) {
  const [typed, setTyped] = useState(0);
  useEffect(() => {
    if (trigger < 0) return;
    setTyped(0);
    let id = 0;
    const begin = window.setTimeout(() => {
      id = window.setInterval(() => setTyped((n) => n + 1), TYPE_MS);
    }, delay);
    const end = window.setTimeout(() => clearInterval(id), delay + TYPE_MS * 80);
    return () => {
      clearTimeout(begin);
      clearTimeout(end);
      clearInterval(id);
    };
  }, [trigger, delay]);
  return typed;
}

// ---- Component ------------------------------------------------------------

type Api = {
  // "reveal" starts the photo reveal, "return" cuts a running reveal short, "ignored" does nothing.
  shockwave: (x: number, y: number) => "reveal" | "return" | "ignored";
  pointer: (x: number, y: number) => void;
  leave: () => void;
};

export default function IdentityScan() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const apiRef = useRef<Api | null>(null);
  const [log, setLog] = useState(() => ({ t: hasPlayed ? T_LOG_END : -1, progress: hasPlayed ? 1 : 0 }));
  const [scene, setScene] = useState<Scene | null>(null);
  const [compact, setCompact] = useState(false);
  const [factIndex, setFactIndex] = useState(-1);
  const factTyped = useTyped(factIndex, 0);
  // The reveal line types once the photo starts to appear.
  const revealTyped = useTyped(factIndex, REVEAL_LINE_DELAY);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let current: Scene | null = null;
    let cache: HTMLCanvasElement | null = null;
    let photoLayer: HTMLCanvasElement | null = null;
    let photoBuffer: HTMLCanvasElement | null = null; // scratch canvas for masking the photo
    let reveal: Reveal | null = null;
    let staticReveal = false; // reduced-motion reveal showing
    let revealTimer = 0;
    let sim: Sim | null = null;
    let img: HTMLImageElement | null = null;
    let dpr = 1;
    let raf = 0;
    let timer = 0;
    let start = 0;
    let lastFrame = 0;
    let lastStep = 0;
    let formed = hasPlayed || reduceMotion;
    let started = false;
    let moving = false;
    let onScreen = true;
    let cancelled = false;
    let pointer: { x: number; y: number } | null = null;
    let waves: Wave[] = [];
    let waveId = 0;

    const layout = () => {
      if (!img) return;
      const width = wrap.clientWidth;
      if (!width) return;
      current = buildScene(img, width, ctx);
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(current.width * dpr);
      canvas.height = Math.round(current.height * dpr);
      canvas.style.height = `${current.height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cache = renderPortrait(current, dpr);
      photoLayer = buildPhoto(img, current, dpr);
      photoBuffer = document.createElement("canvas");
      photoBuffer.width = photoLayer.width;
      photoBuffer.height = photoLayer.height;
      sim = createSim(current);
      waves = [];
      reveal = null;
      setScene(current);
      setCompact(width < 330);
      if (formed) drawStill(ctx, current, cache, performance.now(), !reduceMotion);
    };

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (!current || !cache || !sim) return;

      if (!formed) {
        if (now - lastFrame < FORM_FRAME_MS) return;
        lastFrame = now;
        if (!start) start = now;
        const t = now - start;
        if (t < T_FORMED) {
          setLog({ t, progress: drawForming(ctx, current, t) });
          return;
        }
        formed = true;
        hasPlayed = true;
      }

      // Keep typing the remaining log lines, then hold the finished log.
      if (start && now - start < T_LOG_END) setLog({ t: now - start, progress: 1 });
      else if (start) setLog((prev) => (prev.t === T_LOG_END ? prev : { t: T_LOG_END, progress: 1 }));

      const circle = reveal ? revealCircle(reveal, now) : null;
      if (reveal && !circle) reveal = null;
      if (pointer || waves.length || moving || reveal) {
        // Interactive: full-rate physics while anything is disturbed.
        const dt = Math.min((now - (lastStep || now - 16.7)) / 16.7, 3);
        lastStep = now;
        waves = waves.filter((w) => (now - w.t0) * WAVE_SPEED < w.reach);
        if (reveal && !reveal.scrambled && now >= reveal.outAt) {
          // Glyphs closing back in over the photo scramble before locking in.
          reveal.scrambled = true;
          for (let i = 0; i < current.particles.length; i++) {
            sim.scrambleUntil[i] = now + 300 + hash(i, 31) * 600;
          }
        }
        // Hover is paused while the photo is showing.
        moving = stepSim(current, sim, now, dt, reveal ? null : pointer, waves);
        const photo =
          circle && photoLayer && photoBuffer ? { layer: photoLayer, buffer: photoBuffer, circle, dpr } : null;
        drawLive(ctx, current, sim, now, waves, photo);
        lastFrame = now;
        return;
      }
      // Still: the cached portrait plus slow rising runes.
      lastStep = 0;
      if (now - lastFrame < IDLE_FRAME_MS) return;
      lastFrame = now;
      drawStill(ctx, current, cache, now, true);
    };

    const run = () => {
      if (reduceMotion || !started || raf || !onScreen || document.hidden) return;
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };

    apiRef.current = {
      shockwave: (x, y) => {
        if (!formed || !current || !cache || !photoLayer) return "ignored";
        const scene = current, portrait = cache, layer = photoLayer;

        if (reduceMotion) {
          if (staticReveal) {
            // A second click goes straight back to the portrait.
            clearTimeout(revealTimer);
            staticReveal = false;
            drawStill(ctx, scene, portrait, 0, false);
            return "return";
          }
          // No animation: show the photo, then the portrait again after the hold.
          staticReveal = true;
          ctx.clearRect(0, 0, scene.width, scene.height);
          ctx.drawImage(layer, 0, 0, scene.width, scene.height);
          revealTimer = window.setTimeout(() => {
            staticReveal = false;
            drawStill(ctx, scene, portrait, 0, false);
          }, REVEAL_HOLD);
          return "reveal";
        }

        const now = performance.now();
        // Every click shows the same ring, wherever it lands.
        const ring = (push: boolean) =>
          waves.push({
            x,
            y,
            t0: now,
            id: ++waveId,
            reach: Math.hypot(scene.width, scene.height),
            fade: Math.max(scene.width, scene.height) * 0.7,
            push,
          });

        if (reveal) {
          if (now >= reveal.outAt) return "ignored"; // already closing back in
          // Skip the rest of the hold. If the photo is still spreading, close back from where it
          // is now instead of jumping to the full-size circle.
          const c = revealCircle(reveal, now);
          if (c && c.r < reveal.cover) reveal.out = c;
          reveal.outAt = now;
          ring(false); // visual only: the photo is showing, there are no glyphs to push
          run();
          return "return";
        }

        ring(true);
        reveal = startReveal(scene, x, y, now);
        run();
        return "reveal";
      },
      pointer: (x, y) => {
        if (reduceMotion || !formed) return;
        pointer = { x, y };
        run();
      },
      leave: () => {
        pointer = null;
      },
    };

    const visibility = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      if (onScreen) run();
      else stop();
    });
    const onVisibilityChange = () => (document.hidden ? stop() : run());
    let lastWidth = 0;
    const resize = new ResizeObserver(() => {
      if (wrap.clientWidth === lastWidth) return;
      lastWidth = wrap.clientWidth;
      layout();
    });

    const photo = new Image();
    photo.src = PHOTO_SRC;
    Promise.all([photo.decode(), document.fonts?.load(`16px ${FONT_FAMILY}`).catch(() => undefined)])
      .then(() => {
        if (cancelled) return;
        img = photo;
        lastWidth = wrap.clientWidth;
        layout();
        resize.observe(wrap);
        visibility.observe(wrap);
        document.addEventListener("visibilitychange", onVisibilityChange);
        if (formed) {
          hasPlayed = true;
          setLog({ t: T_LOG_END, progress: 1 });
          started = true;
          run();
          return;
        }
        // Wait for the intro loading screen to clear so the reconstruction is actually seen.
        timer = window.setTimeout(() => {
          started = true;
          run();
        }, START_DELAY);
      })
      .catch(() => setLog({ t: T_LOG_END, progress: 1 }));

    return () => {
      cancelled = true;
      apiRef.current = null;
      clearTimeout(timer);
      clearTimeout(revealTimer);
      stop();
      resize.disconnect();
      visibility.disconnect();
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  const localPoint = (e: { clientX: number; clientY: number }) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const ready = log.t >= T_LOG_END;
  const nextFact = () => {
    if (ready) setFactIndex((i) => i + 1);
  };
  const onClick = (e: MouseEvent<HTMLDivElement>) => {
    const { x, y } = localPoint(e);
    if (apiRef.current?.shockwave(x, y) === "reveal") nextFact();
  };
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();
    if (scene && apiRef.current?.shockwave(scene.width / 2, scene.height * 0.4) === "reveal") nextFact();
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const { x, y } = localPoint(e);
    apiRef.current?.pointer(x, y);
  };

  const fact =
    factIndex >= 0
      ? (() => {
          const [cmd, value] = FACTS[factIndex % FACTS.length];
          return {
            typed: factTyped,
            segments: [
              { text: "> ", className: BUSY },
              { text: cmd, className: VALUE },
              { text: " → ", className: DIM },
              { text: value, className: OK },
            ],
          };
        })()
      : null;
  const reveal = factIndex >= 0 ? { segments: REVEAL_LINE, typed: revealTyped } : null;

  return (
    // On desktop the hero centres this block on the full screen; the top margin shifts it into the
    // space below the fixed navbar so the larger size never slides under it.
    <div className="w-[min(560px,calc((100svh_-_242px)/1.11),84vw)] min-w-[230px] lg:mt-20">
      <div
        ref={wrapRef}
        role="button"
        tabIndex={0}
        aria-label={`ASCII portrait of ${profile.name}. Activate to reveal the original photo and a fact.`}
        className="cursor-crosshair touch-pan-y rounded-lg focus:outline-none focus-visible:ring-1 focus-visible:ring-primary/60"
        onClick={onClick}
        onKeyDown={onKeyDown}
        onPointerMove={onPointerMove}
        onPointerLeave={() => apiRef.current?.leave()}
        onPointerCancel={() => apiRef.current?.leave()}
      >
        <canvas ref={canvasRef} aria-hidden className="block w-full" />
      </div>
      {log.t >= 0 && (
        <TerminalLog t={log.t} progress={log.progress} scene={scene} compact={compact} fact={fact} reveal={reveal} />
      )}
    </div>
  );
}
