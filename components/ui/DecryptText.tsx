"use client";

import { useEffect, useState } from "react";

type DecryptTextProps = {
  words: string[];
  /** How long each word stays fully readable (ms). */
  hold?: number;
  /** Time between animation frames (ms). */
  frame?: number;
  /** Frames of pure noise before letters start resolving. */
  scrambleFrames?: number;
  className?: string;
};

const GLYPHS = "!<>-_\\/[]{}=+*^?#%&$@01";

function glyph() {
  return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
}

// Letters before `resolved` show the real word; the rest are random glyphs.
function scramble(target: string, resolved: number) {
  let out = "";
  for (let i = 0; i < target.length; i++) {
    const ch = target[i];
    out += i < resolved || ch === " " ? ch : glyph();
  }
  return out;
}

export default function DecryptText({
  words,
  hold = 2000,
  frame = 40,
  scrambleFrames = 8,
  className = "",
}: DecryptTextProps) {
  const [index, setIndex] = useState(0);
  const [display, setDisplay] = useState(words[0] ?? "");

  useEffect(() => {
    if (words.length < 2) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let frameTimer: ReturnType<typeof setInterval> | undefined;
    const holdTimer = setTimeout(() => {
      const next = (index + 1) % words.length;
      const target = words[next];

      if (reduceMotion) {
        setDisplay(target);
        setIndex(next);
        return;
      }

      let f = 0;
      frameTimer = setInterval(() => {
        f++;
        const resolved = Math.max(0, f - scrambleFrames);
        if (resolved >= target.length) {
          clearInterval(frameTimer);
          setDisplay(target);
          setIndex(next);
        } else {
          setDisplay(scramble(target, resolved));
        }
      }, frame);
    }, reduceMotion ? hold * 2 : hold);

    return () => {
      clearTimeout(holdTimer);
      if (frameTimer) clearInterval(frameTimer);
    };
  }, [index, words, hold, frame, scrambleFrames]);

  return (
    <span className={className}>
      {/* Screen readers get the list once instead of every scrambled frame. */}
      <span className="sr-only">{words.join(", ")}</span>
      <span aria-hidden="true">{display}</span>
    </span>
  );
}
