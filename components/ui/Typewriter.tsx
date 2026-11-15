"use client";

import { useEffect, useState } from "react";

type TypewriterProps = {
  words: string[];
  typeSpeed?: number;
  deleteSpeed?: number;
  pause?: number;
  className?: string;
};

export default function Typewriter({
  words,
  typeSpeed = 70,
  deleteSpeed = 40,
  pause = 1500,
  className = "",
}: TypewriterProps) {
  const [index, setIndex] = useState(0);
  const [text, setText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduceMotion(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (words.length === 0) return;
    const word = words[index % words.length];

    // Reduced motion: show whole phrases, swapping them slowly.
    if (reduceMotion) {
      setText(word);
      const t = setTimeout(() => setIndex((i) => (i + 1) % words.length), pause * 2);
      return () => clearTimeout(t);
    }

    let delay: number;
    if (!deleting && text === word) {
      delay = pause;
    } else if (deleting && text === "") {
      delay = typeSpeed * 4;
    } else {
      delay = deleting ? deleteSpeed : typeSpeed;
    }

    const t = setTimeout(() => {
      if (!deleting && text === word) {
        setDeleting(true);
      } else if (deleting && text === "") {
        setDeleting(false);
        setIndex((i) => (i + 1) % words.length);
      } else {
        setText(deleting ? word.slice(0, text.length - 1) : word.slice(0, text.length + 1));
      }
    }, delay);
    return () => clearTimeout(t);
  }, [text, deleting, index, words, typeSpeed, deleteSpeed, pause, reduceMotion]);

  return (
    <span className={className}>
      {/* Screen readers get the full list once instead of every keystroke. */}
      <span className="sr-only">{words.join(", ")}</span>
      <span aria-hidden="true">
        <span className="text-primary">&gt;</span> {text}
        <span className="typewriter-cursor">█</span>
      </span>
    </span>
  );
}
