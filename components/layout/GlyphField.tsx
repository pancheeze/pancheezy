"use client";

import { useEffect, useRef } from "react";

// Site-wide background: a faint field of ASCII glyphs that matches the
// decrypting portrait. The field drifts slower than the page while scrolling
// (parallax), scrolling makes more glyphs scramble, idle glyphs scramble now
// and then, and glyphs near the pointer brighten.
//
// The glyphs live on an offscreen canvas that wraps vertically. Each frame
// only changed cells are redrawn there, and the visible canvas just copies it
// at the current scroll offset.

const GLYPHS = ".:+*#01<>/\\=-_[]{}?%&$@";
const NEUTRAL = [150, 150, 150];
const PALETTE = [
  [236, 163, 95], // primary (amber)
  [127, 168, 139], // secondary (sage)
  [122, 165, 196], // accent (steel blue)
];
const FONT_PX = 13;
const CELL_X = 18;
const CELL_Y = 22;
const FILL_RATE = 0.55; // share of cells that hold a glyph
const FPS = 30;
const PARALLAX = 0.25; // field speed relative to the page
const IDLE_SCRAMBLES_PER_SEC = 6;
const SCROLL_SCRAMBLES_PER_PX = 0.35; // extra scrambles per pixel scrolled
const MAX_SCRAMBLES_PER_FRAME = 60;
const SCRAMBLE_MS = 700;
const GLOW_RADIUS = 140;
const GLOW_BOOST = 0.2;
const GLOW_DECAY = 0.9; // per frame

type Cell = {
  x: number;
  y: number; // in field coordinates
  ch: string;
  rgb: number[];
  alpha: number;
  glow: number;
  scrambleUntil: number;
};

const randomGlyph = () => GLYPHS[Math.floor(Math.random() * GLYPHS.length)];

export default function GlyphField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const field = document.createElement("canvas");
    const fctx = field.getContext("2d");
    if (!canvas || !ctx || !fctx) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const spacing = coarse ? 1.35 : 1; // sparser on phones and tablets

    let cells: Cell[] = [];
    let width = 0;
    let height = 0;
    let fieldH = 0;
    let dpr = 1;
    let frame = 0;
    let lastFrame = 0;
    let scrambleBudget = 0;
    let lastScrollY = window.scrollY;
    let drawnOffset = -1;
    const pointer = { x: -1e4, y: -1e4, moved: false };

    const offsetFor = (scrollY: number) =>
      reduceMotion ? 0 : (((scrollY * PARALLAX) % fieldH) + fieldH) % fieldH;

    const drawCell = (c: Cell, now: number) => {
      fctx.clearRect(c.x - 1, c.y - 1, CELL_X, CELL_Y);
      const scrambling = now < c.scrambleUntil;
      const a = Math.min(0.5, c.alpha + c.glow * GLOW_BOOST + (scrambling ? 0.05 : 0));
      fctx.fillStyle = `rgba(${c.rgb[0]},${c.rgb[1]},${c.rgb[2]},${a.toFixed(3)})`;
      fctx.fillText(scrambling ? randomGlyph() : c.ch, c.x, c.y);
    };

    // Copy the wrapping field onto the screen at the current scroll offset.
    const blit = (offset: number) => {
      const off = Math.round(offset * dpr) / dpr;
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(field, 0, 0, field.width, field.height, 0, -off, width, fieldH);
      if (fieldH - off < height) {
        ctx.drawImage(field, 0, 0, field.width, field.height, 0, fieldH - off, width, fieldH);
      }
      drawnOffset = offset;
    };

    const build = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      const rowH = CELL_Y * spacing;
      const rows = Math.ceil(height / rowH) + 1;
      fieldH = rows * rowH; // whole rows, so the wrap is seamless

      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      field.width = Math.round(width * dpr);
      field.height = Math.round(fieldH * dpr);
      fctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      fctx.font = `${FONT_PX}px "Source Code Pro", ui-monospace, monospace`;
      fctx.textBaseline = "top";

      cells = [];
      for (let r = 0; r < rows; r++) {
        for (let x = 6; x < width; x += CELL_X * spacing) {
          if (Math.random() > FILL_RATE) continue;
          const accent = Math.random() < 0.28;
          let alpha = 0.03 + Math.random() * 0.05;
          if (Math.random() < 0.02) alpha += 0.1; // a few brighter "signal" glyphs
          cells.push({
            x,
            y: 6 + r * rowH,
            ch: randomGlyph(),
            rgb: accent ? PALETTE[Math.floor(Math.random() * PALETTE.length)] : NEUTRAL,
            alpha,
            glow: 0,
            scrambleUntil: 0,
          });
        }
      }
      fctx.clearRect(0, 0, width, fieldH);
      const now = performance.now();
      for (const c of cells) drawCell(c, now);
      lastScrollY = window.scrollY;
      blit(offsetFor(lastScrollY));
    };

    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);
      if (now - lastFrame < 1000 / FPS) return;
      const dt = Math.min(now - lastFrame, 200);
      lastFrame = now;

      // Scrolling adds scrambles on top of the idle rate.
      const scrollY = window.scrollY;
      const scrolled = Math.abs(scrollY - lastScrollY);
      lastScrollY = scrollY;
      scrambleBudget += (IDLE_SCRAMBLES_PER_SEC * dt) / 1000 + scrolled * SCROLL_SCRAMBLES_PER_PX;
      scrambleBudget = Math.min(scrambleBudget, MAX_SCRAMBLES_PER_FRAME);
      while (scrambleBudget >= 1 && cells.length) {
        scrambleBudget -= 1;
        const c = cells[Math.floor(Math.random() * cells.length)];
        c.scrambleUntil = now + SCRAMBLE_MS * (0.6 + Math.random() * 0.8);
      }

      const offset = offsetFor(scrollY);

      // Brighten glyphs near the pointer (pointer mapped into field space).
      if (pointer.moved) {
        pointer.moved = false;
        const py = (pointer.y + offset) % fieldH;
        for (const c of cells) {
          let dy = Math.abs(c.y - py);
          dy = Math.min(dy, fieldH - dy); // the field wraps
          const d = Math.hypot(c.x - pointer.x, dy);
          if (d < GLOW_RADIUS) c.glow = Math.max(c.glow, 1 - d / GLOW_RADIUS);
        }
      }

      let dirty = false;
      for (const c of cells) {
        const scrambling = now < c.scrambleUntil;
        const settling = !scrambling && c.scrambleUntil !== 0;
        if (settling) {
          c.ch = randomGlyph(); // settle on a new glyph
          c.scrambleUntil = 0;
        }
        if (c.glow > 0) {
          c.glow *= GLOW_DECAY;
          if (c.glow < 0.02) c.glow = 0;
        }
        if (scrambling || settling || c.glow > 0) {
          drawCell(c, now);
          dirty = true;
        }
      }

      if (dirty || offset !== drawnOffset) blit(offset);
    };

    const start = () => {
      if (reduceMotion || frame) return;
      lastFrame = performance.now();
      lastScrollY = window.scrollY;
      frame = requestAnimationFrame(tick);
    };
    const stop = () => {
      cancelAnimationFrame(frame);
      frame = 0;
    };

    let resizeTimer: ReturnType<typeof setTimeout> | undefined;
    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(build, 200);
    };
    const onPointer = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.moved = true;
    };
    const onVisibility = () => (document.hidden ? stop() : start());

    let cancelled = false;
    // Wait for the monospace font so glyphs render in Source Code Pro.
    document.fonts.ready.then(() => {
      if (cancelled) return;
      build();
      start();
    });

    window.addEventListener("resize", onResize);
    window.addEventListener("pointermove", onPointer, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cancelled = true;
      stop();
      clearTimeout(resizeTimer);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onPointer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10"
    />
  );
}
