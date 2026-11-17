"use client";

import { FormEvent, Fragment, useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Send, X } from "lucide-react";
import ByteBody, { ByteMood } from "./ByteBody";
import { suggestedQuestions } from "@/lib/byte";
import { profile } from "@/lib/data";

// Byte: a small terminal robot that wanders along the bottom of the screen.
// Click it to chat; answers come from /api/byte (AI with a scripted fallback).

const BYTE_W = 72;
const EDGE = 12;
const WALK_SPEED = 70; // px per second
const MAX_INPUT = 300;

type Mode = "walk" | "idle" | "sleep";
type Msg = { role: "user" | "assistant"; content: string };

const firstName = profile.name.split(" ")[0];
const GREETING: Msg = {
  role: "assistant",
  content: `Beep boop! I'm Byte, ${firstName}'s little helper bot. Ask me anything about him: his projects, skills, or how to reach him.`,
};

const rand = (min: number, max: number) => min + Math.random() * (max - min);

// Turns URLs, emails and the CV path in Byte's replies into links.
const LINK_RE = /(https?:\/\/[^\s)]+|[\w.+-]+@[\w-]+\.[\w.-]+|\/cv\/[^\s)]+\.pdf)/g;
function Linkified({ text }: { text: string }) {
  const parts = text.split(LINK_RE);
  return (
    <>
      {parts.map((part, i) => {
        if (i % 2 === 0) return <Fragment key={i}>{part}</Fragment>;
        const trail = part.match(/[.,!?]+$/)?.[0] ?? "";
        const clean = trail ? part.slice(0, -trail.length) : part;
        const href = clean.includes("@") && !clean.startsWith("http") ? `mailto:${clean}` : clean;
        const external = href.startsWith("http");
        return (
          <Fragment key={i}>
            <a
              href={href}
              target={external ? "_blank" : undefined}
              rel={external ? "noopener noreferrer" : undefined}
              className="text-primary underline underline-offset-2 break-all hover:text-primary-glow"
            >
              {clean}
            </a>
            {trail}
          </Fragment>
        );
      })}
    </>
  );
}

export default function Byte() {
  const [ready, setReady] = useState(false);
  const [x, setX] = useState(0);
  const [walkMs, setWalkMs] = useState(0);
  const [facing, setFacing] = useState<1 | -1>(-1);
  const [mode, setMode] = useState<Mode>("idle");
  const [hovered, setHovered] = useState(false);
  const [bubble, setBubble] = useState(false);
  const [look, setLook] = useState({ x: 0, y: 0 });
  const [reducedMotion, setReducedMotion] = useState(false);

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([GREETING]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [justAnswered, setJustAnswered] = useState(false);

  const xRef = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const byteRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const maxX = () => Math.max(EDGE, window.innerWidth - BYTE_W - EDGE);

  const moveTo = useCallback((target: number, speed = WALK_SPEED) => {
    const dist = Math.abs(target - xRef.current);
    if (dist < 2) return 0;
    const ms = (dist / speed) * 1000;
    setFacing(target > xRef.current ? 1 : -1);
    setWalkMs(ms);
    setX(target);
    xRef.current = target;
    return ms;
  }, []);

  // ----- Wandering brain -----
  const nextAction = useCallback((forceWalk = false) => {
    clearTimeout(timer.current);
    const roll = forceWalk ? 0 : Math.random();

    if (roll < 0.6) {
      // Walk somewhere new, at least a little way from here.
      let target = rand(EDGE, maxX());
      if (Math.abs(target - xRef.current) < 80) target = xRef.current > maxX() / 2 ? EDGE + rand(0, 60) : maxX() - rand(0, 60);
      const ms = moveTo(target);
      setMode("walk");
      timer.current = setTimeout(() => {
        setMode("idle");
        setBubble(Math.random() < 0.45); // sometimes say "ask me" on arrival
        timer.current = setTimeout(() => nextAction(), rand(2500, 5000));
      }, ms);
    } else if (roll < 0.88) {
      // Stand around and look left and right.
      setMode("idle");
      setFacing((f) => (f === 1 ? -1 : 1));
      timer.current = setTimeout(() => nextAction(), rand(2000, 4000));
    } else {
      // Nap.
      setMode("sleep");
      setBubble(false);
      timer.current = setTimeout(() => nextAction(), rand(7000, 11000));
    }
  }, [moveTo]);

  // Start: appear near the right edge, then begin wandering.
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setReducedMotion(reduce);
    const start = maxX() - 40 < EDGE ? EDGE : maxX() - 40;
    xRef.current = start;
    setX(start);
    setReady(true);
    if (reduce) {
      setBubble(true);
      return;
    }
    timer.current = setTimeout(() => {
      setBubble(true);
      timer.current = setTimeout(() => nextAction(true), 3000);
    }, 2500);
    return () => clearTimeout(timer.current);
  }, [nextAction]);

  // Hide the "ask me" bubble a few seconds after it appears.
  useEffect(() => {
    if (!bubble || hovered) return;
    const t = setTimeout(() => setBubble(false), 4500);
    return () => clearTimeout(t);
  }, [bubble, hovered]);

  // Keep Byte on screen when the window is resized.
  useEffect(() => {
    const onResize = () => {
      if (xRef.current > maxX()) {
        xRef.current = maxX();
        setWalkMs(0);
        setX(maxX());
      }
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Eyes follow the mouse.
  useEffect(() => {
    let frame = 0;
    const onMove = (e: MouseEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const r = byteRef.current?.getBoundingClientRect();
        if (!r) return;
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        const clamp = (v: number) => Math.max(-1, Math.min(1, v));
        // Eyes are drawn unflipped, so undo the facing flip.
        setLook({ x: clamp(((e.clientX - cx) / 300) * facing), y: clamp((e.clientY - cy) / 300) });
      });
    };
    window.addEventListener("mousemove", onMove);
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(frame);
    };
  }, [facing]);

  // ----- Chat -----
  const openChat = () => {
    clearTimeout(timer.current);
    setBubble(false);
    setMode("idle");
    setOpen(true);
    // Hurry to the right edge, under the chat window.
    if (!reducedMotion) {
      const ms = moveTo(maxX(), 260);
      if (ms) {
        setMode("walk");
        timer.current = setTimeout(() => {
          setMode("idle");
          setFacing(-1);
        }, ms);
      }
    }
  };

  const closeChat = () => {
    setOpen(false);
    if (!reducedMotion) timer.current = setTimeout(() => nextAction(true), 2000);
  };

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeChat();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, thinking]);

  const ask = async (question: string) => {
    const q = question.trim().slice(0, MAX_INPUT);
    if (!q || thinking) return;
    const history = [...messages, { role: "user" as const, content: q }];
    setMessages(history);
    setInput("");
    setThinking(true);
    try {
      const res = await fetch("/api/byte", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Skip the canned greeting; the server has its own instructions.
        body: JSON.stringify({ messages: history.slice(1) }),
      });
      const data = await res.json().catch(() => ({}));
      const reply = typeof data.reply === "string" ? data.reply : "Bzzt! My circuits got tangled. Try asking again?";
      setMessages((m) => [...m, { role: "assistant", content: reply }]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: "Bzzt! I couldn't connect. Check your internet and try again?" }]);
    } finally {
      setThinking(false);
      setJustAnswered(true);
      setTimeout(() => setJustAnswered(false), 1800);
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    ask(input);
  };

  if (!ready) return null;

  const walking = mode === "walk" && !reducedMotion;
  const mood: ByteMood = thinking
    ? "think"
    : justAnswered || hovered
      ? "happy"
      : mode === "sleep" && !open
        ? "sleep"
        : "normal";
  const showBubble = !open && (bubble || hovered) && mode !== "sleep";
  // Keep the bubble inside the screen when Byte is near an edge.
  const bubbleSide = typeof window !== "undefined" && x > window.innerWidth / 2 ? "right" : "left";

  return (
    <>
      {/* Chat window */}
      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-label={`Chat with Byte about ${firstName}`}
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-[104px] right-3 z-[80] flex max-h-[min(500px,calc(100dvh-140px))] w-[min(360px,calc(100vw-24px))] origin-bottom-right flex-col overflow-hidden rounded-2xl border border-white/10 bg-surface/95 shadow-glass backdrop-blur-md"
          >
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <p className="font-mono text-sm text-text-secondary">
                <span className="text-secondary">byte</span>@pancheezy:<span className="text-accent">~</span>$
              </p>
              <button
                onClick={closeChat}
                aria-label="Close chat"
                className="rounded-md p-1 text-text-secondary transition-colors hover:bg-white/5 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4" aria-live="polite">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <p
                    className={`max-w-[85%] whitespace-pre-line rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                      m.role === "user"
                        ? "rounded-br-sm bg-primary/90 text-[#080A0D]"
                        : "rounded-bl-sm border border-white/10 bg-base/60 text-text"
                    }`}
                  >
                    {m.role === "assistant" ? <Linkified text={m.content} /> : m.content}
                  </p>
                </div>
              ))}
              {thinking && (
                <div className="flex justify-start" aria-label="Byte is typing">
                  <p className="flex gap-1 rounded-2xl rounded-bl-sm border border-white/10 bg-base/60 px-3.5 py-3">
                    {[0, 1, 2].map((d) => (
                      <motion.span
                        key={d}
                        className="h-1.5 w-1.5 rounded-full bg-primary"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 0.9, repeat: Infinity, delay: d * 0.15 }}
                      />
                    ))}
                  </p>
                </div>
              )}
              {messages.length === 1 && !thinking && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {suggestedQuestions.map((q) => (
                    <button
                      key={q}
                      onClick={() => ask(q)}
                      className="rounded-full border border-primary/40 px-3 py-1.5 text-xs text-primary transition-colors hover:bg-primary/10"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <form onSubmit={onSubmit} className="flex items-center gap-2 border-t border-white/10 px-3 py-3">
              <span className="font-mono text-sm text-secondary" aria-hidden>
                &gt;
              </span>
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                maxLength={MAX_INPUT}
                placeholder={`Ask about ${firstName}...`}
                aria-label={`Ask Byte about ${firstName}`}
                className="min-w-0 flex-1 bg-transparent font-mono text-[16px] text-white placeholder:text-text-muted focus:outline-none sm:text-sm"
              />
              <button
                type="submit"
                disabled={!input.trim() || thinking}
                aria-label="Send"
                className="rounded-lg bg-primary p-2 text-[#080A0D] transition-opacity hover:bg-primary-glow disabled:opacity-40"
              >
                <Send size={16} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Byte himself */}
      <motion.div
        className="pointer-events-none fixed bottom-3 left-0 z-[80]"
        initial={false}
        animate={{ x }}
        transition={{ duration: walkMs / 1000, ease: "linear" }}
        onAnimationComplete={() => setWalkMs(0)}
      >
        <div className="relative">
          <AnimatePresence>
            {showBubble && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.8 }}
                transition={{ duration: 0.2 }}
                className={`absolute bottom-[88px] whitespace-nowrap rounded-full bg-white px-3 py-1.5 font-mono text-xs font-semibold text-[#080A0D] shadow-glass ${
                  bubbleSide === "right" ? "right-6 origin-bottom-right" : "left-6 origin-bottom-left"
                }`}
              >
                ask me!
                <span
                  aria-hidden
                  className={`absolute -bottom-1 h-2.5 w-2.5 rotate-45 bg-white ${bubbleSide === "right" ? "right-4" : "left-4"}`}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {mode === "sleep" && !open && (
            <span aria-hidden className="byte-zzz absolute -top-2 right-1 font-pixel text-sm text-secondary">
              z
            </span>
          )}

          <motion.button
            ref={byteRef}
            type="button"
            onClick={() => (open ? closeChat() : openChat())}
            // Touch screens fire fake hover/focus on tap that never ends, so only
            // a real mouse or keyboard focus counts as hovering.
            onPointerEnter={(e) => {
              if (e.pointerType !== "mouse") return;
              setHovered(true);
              if (mode === "sleep") setMode("idle");
            }}
            onPointerLeave={(e) => e.pointerType === "mouse" && setHovered(false)}
            onFocus={(e) => e.currentTarget.matches(":focus-visible") && setHovered(true)}
            onBlur={() => setHovered(false)}
            aria-label={open ? "Close chat with Byte" : `Chat with Byte, ${firstName}'s assistant`}
            aria-expanded={open}
            data-cursor-hover
            className="pointer-events-auto block rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            animate={reducedMotion ? undefined : { y: hovered ? -8 : 0 }}
            whileTap={{ scale: 0.92 }}
            transition={{ type: "spring", stiffness: 500, damping: 18 }}
          >
            <span className="block transition-transform duration-200" style={{ transform: `scaleX(${facing})` }}>
              <ByteBody mood={mood} walking={walking} look={look} />
            </span>
          </motion.button>
        </div>
      </motion.div>
    </>
  );
}
