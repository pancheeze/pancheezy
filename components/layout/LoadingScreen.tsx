"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { profile } from "@/lib/data";

// Intro screen: the name decrypts letter by letter from random glyphs, with a
// terminal progress line, then fades into the site. Same length as before (1.1s).

const GLYPHS = "!<>-_\\/[]{}=+*^?#%&$@01";
const SHOW_MS = 1100;
const DECRYPT_MS = 800; // all letters settled by this point
const TICK_MS = 45;

// Deterministic placeholder so the server and client render the same first frame.
const placeholder = (text: string) =>
  [...text].map((c, i) => (c === " " ? " " : GLYPHS[(i * 7) % GLYPHS.length])).join("");

export default function LoadingScreen() {
  const name = profile.name.toUpperCase();
  const reduceMotion = useReducedMotion();
  const [loading, setLoading] = useState(true);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const start = performance.now();
    const tick = setInterval(() => setElapsed(performance.now() - start), TICK_MS);
    const done = setTimeout(() => setLoading(false), SHOW_MS);
    return () => {
      clearInterval(tick);
      clearTimeout(done);
    };
  }, []);

  const progress = reduceMotion ? 1 : Math.min(1, elapsed / DECRYPT_MS);
  // Each letter settles at its own point in the sweep, left to right.
  const shown =
    elapsed === 0 && !reduceMotion
      ? placeholder(name)
      : [...name]
          .map((c, i) => {
            if (c === " " || progress >= (i + 1) / name.length) return c;
            return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
          })
          .join("");

  return (
    <AnimatePresence>
      {loading && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-base px-6"
          role="status"
          aria-label="Loading portfolio"
        >
          <div className="flex flex-col items-center gap-5 text-center">
            <span
              aria-hidden
              className="font-pixel text-2xl font-bold tracking-wide text-white sm:text-4xl"
            >
              {[...shown].map((c, i) => (
                <span key={i} className={c === name[i] ? "" : "text-primary/80"}>
                  {c}
                </span>
              ))}
            </span>
            <p aria-hidden className="font-mono text-xs text-text-secondary sm:text-sm">
              <span className="text-primary">&gt;</span> decrypting portfolio
              <span className="text-white"> {Math.round(progress * 100)}%</span>
              {progress >= 1 && <span className="text-secondary"> ✓</span>}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
