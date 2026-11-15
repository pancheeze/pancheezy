"use client";

import { useEffect, useMemo, useState } from "react";

type TypewriterProps = {
  words: string[];
  prompt?: string;
  typeSpeed?: number;
  deleteSpeed?: number;
  pause?: number;
  className?: string;
};

type Token = { text: string; cls: string };

const GLYPHS = "!<>-_\\/[]{}=+*^?#%&$01";
// How many scrambled characters run ahead of the typed text.
const SCRAMBLE_AHEAD = 3;

const KEYWORDS = new Set(["while", "const", "let", "return", "if", "for", "new", "true", "false"]);

// Tiny highlighter: comments, strings, keywords, function calls, tags, punctuation.
const TOKEN_RE =
  /(\/\/.*$)|("[^"]*")|(<\/?|\/?>)|([A-Za-z_][\w-]*(?=\())|([A-Za-z_][\w-]*)|([{}()[\].,;:@+])|(\s+)|(.)/g;

function highlight(line: string): Token[] {
  const tokens: Token[] = [];
  let m: RegExpExecArray | null;
  TOKEN_RE.lastIndex = 0;
  while ((m = TOKEN_RE.exec(line))) {
    const [text, comment, str, tag, fn, ident, punc] = m;
    let cls = "text-white";
    if (comment) cls = "text-text-muted italic";
    else if (str) cls = "text-accent";
    else if (tag || punc) cls = "text-text-secondary";
    else if (fn) cls = "text-primary";
    else if (ident) {
      if (KEYWORDS.has(ident)) cls = "text-secondary";
      else if (/^[A-Z]/.test(ident)) cls = "text-primary";
    }
    tokens.push({ text, cls });
  }
  return tokens;
}

function randomGlyphs(n: number) {
  let out = "";
  for (let i = 0; i < n; i++) out += GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
  return out;
}

export default function Typewriter({
  words,
  prompt = "paul@pup:~$",
  typeSpeed = 55,
  deleteSpeed = 25,
  pause = 1800,
  className = "",
}: TypewriterProps) {
  const [index, setIndex] = useState(0);
  const [count, setCount] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const [noise, setNoise] = useState("");
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduceMotion(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const word = words.length ? words[index % words.length] : "";
  const tokens = useMemo(() => highlight(word), [word]);

  useEffect(() => {
    if (!word) return;

    // Reduced motion: show whole phrases and swap them slowly.
    if (reduceMotion) {
      setCount(word.length);
      setNoise("");
      const t = setTimeout(() => setIndex((i) => (i + 1) % words.length), pause * 2);
      return () => clearTimeout(t);
    }

    const full = !deleting && count === word.length;
    const empty = deleting && count === 0;
    const delay = full ? pause : empty ? typeSpeed * 5 : deleting ? deleteSpeed : typeSpeed;

    const t = setTimeout(() => {
      if (full) {
        setNoise("");
        setDeleting(true);
      } else if (empty) {
        setDeleting(false);
        setIndex((i) => (i + 1) % words.length);
      } else if (deleting) {
        setCount((c) => c - 1);
      } else {
        const next = count + 1;
        setCount(next);
        setNoise(randomGlyphs(Math.min(SCRAMBLE_AHEAD, word.length - next)));
      }
    }, delay);
    return () => clearTimeout(t);
  }, [count, deleting, word, words.length, typeSpeed, deleteSpeed, pause, reduceMotion]);

  // Render the highlighted tokens up to `count` characters.
  let remaining = count;
  const visible = tokens.map((tok, i) => {
    if (remaining <= 0) return null;
    const text = tok.text.slice(0, remaining);
    remaining -= text.length;
    return (
      <span key={i} className={tok.cls}>
        {text}
      </span>
    );
  });

  return (
    <span className={`font-mono ${className}`}>
      {/* Screen readers get the list once instead of every keystroke. */}
      <span className="sr-only">{words.join(", ")}</span>
      <span aria-hidden="true" className="whitespace-pre-wrap break-words">
        <span className="text-secondary">{prompt}</span>{" "}
        {visible}
        <span className="text-primary/60">{noise}</span>
        <span className="typewriter-cursor">▋</span>
      </span>
    </span>
  );
}
