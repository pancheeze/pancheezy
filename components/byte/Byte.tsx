"use client";

import { CSSProperties, FormEvent, Fragment, PointerEvent as ReactPointerEvent, useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Send, X } from "lucide-react";
import PixelSprite from "./PixelSprite";
import { byteFrame, decryptFrame, Face, GRID_H, GRID_W, ICON_FRAME, Legs, Pixel } from "./sprites";
import { suggestedQuestions } from "@/lib/byte";
import { profile } from "@/lib/data";

// Byte: a pixel-art terminal robot that wanders along the bottom of the screen.
//   tap        -> he "decrypts" into a pixel chat icon (like the loading screen), and the chat opens
//   drag       -> he dangles ("whoa!"); throw him and he bounces around
//   shake      -> he gets dizzy
//   hold still -> petting: heart eyes and floating hearts
// Answers come from /api/byte (AI with a scripted fallback).

const W = GRID_W * 4; // 72px
const H = GRID_H * 4; // 76px
const EDGE = 12;
const BOTTOM = 12;
const WALK_SPEED = 70; // px/s
const GLIDE_SPEED = 1100; // px/s, running to the corner when the chat opens
const GRAVITY = 2600; // px/s^2
const DRAG_THRESHOLD = 6; // px before a press counts as a grab
const PET_DELAY = 500; // ms holding still before it counts as petting
const DECRYPT_MS = 700;
const DECRYPT_TICK = 45; // same tick as the loading screen
const MAX_INPUT = 300;

type Mode = "idle" | "walk" | "sleep" | "held" | "air" | "dizzy" | "pet" | "glide" | "icon";
type Msg = { role: "user" | "assistant"; content: string };

const firstName = profile.name.split(" ")[0];
const GREETING: Msg = {
  role: "assistant",
  content: `Beep boop! I'm Byte, ${firstName}'s little helper bot. Ask me anything about him: his projects, skills, or how to reach him.`,
};

const rand = (min: number, max: number) => min + Math.random() * (max - min);
const pick = <T,>(items: T[]) => items[Math.floor(Math.random() * items.length)];

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

function PixelHeart() {
  return (
    <svg viewBox="0 0 5 4" width="15" height="12" shapeRendering="crispEdges" aria-hidden>
      <path d="M0 0h2v1H0zM3 0h2v1H3zM0 1h5v1H0zM1 2h3v1H1zM2 3h1v1H2z" fill="#E8707A" />
    </svg>
  );
}

export default function Byte() {
  const [ready, setReady] = useState(false);
  const [mode, setModeState] = useState<Mode>("idle");
  const [form, setForm] = useState<"byte" | "icon">("byte");
  const [scramble, setScramble] = useState<Pixel[] | null>(null);
  const [facing, setFacing] = useState<1 | -1>(-1);
  const [step, setStep] = useState(0);
  const [blink, setBlink] = useState(false);
  const [look, setLook] = useState<-1 | 0 | 1>(0);
  const [hovered, setHovered] = useState(false);
  const [shaken, setShaken] = useState(false);
  const [bubble, setBubble] = useState<string | null>(null);
  const [bubbleSide, setBubbleSide] = useState<"left" | "right">("right");
  const [hearts, setHearts] = useState<number[]>([]);

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([GREETING]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);

  // Movement lives in refs and is drawn straight to the DOM every frame.
  const pos = useRef({ x: 0, y: 0, vx: 0, vy: 0 });
  const modeRef = useRef<Mode>("idle");
  const target = useRef(0);
  const onArrive = useRef<(() => void) | null>(null);
  const flight = useRef({ impact: 0 });
  const reduced = useRef(false);
  const shakenRef = useRef(false);
  const openRef = useRef(false);
  const wanderTimer = useRef<ReturnType<typeof setTimeout>>();
  const bubbleTimer = useRef<ReturnType<typeof setTimeout>>();
  const elRef = useRef<HTMLDivElement>(null);
  const decrypting = useRef(false);
  const shown = useRef<Pixel[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const press = useRef<{
    id: number;
    startX: number;
    startY: number;
    offX: number;
    offY: number;
    dragging: boolean;
    petTimer?: ReturnType<typeof setTimeout>;
    samples: { t: number; x: number; y: number }[];
    lastDir: number;
    flips: number[];
    wasSleeping: boolean;
  } | null>(null);

  const maxX = () => Math.max(EDGE, window.innerWidth - W - EDGE);
  const maxY = () => Math.max(0, window.innerHeight - H - BOTTOM - 70);

  const setMode = useCallback((m: Mode) => {
    modeRef.current = m;
    setModeState(m);
  }, []);

  const say = useCallback((text: string | null, ms = 1800) => {
    clearTimeout(bubbleTimer.current);
    setBubbleSide(pos.current.x > window.innerWidth / 2 ? "right" : "left");
    setBubble(text);
    if (text) bubbleTimer.current = setTimeout(() => setBubble(null), ms);
  }, []);

  // ----- Wandering brain -----
  const walkTo = useCallback(
    (x: number, then: () => void) => {
      target.current = x;
      onArrive.current = then;
      setFacing(x > pos.current.x ? 1 : -1);
      setMode("walk");
    },
    [setMode]
  );

  const nextAction = useCallback(
    (forceWalk = false) => {
      clearTimeout(wanderTimer.current);
      if (reduced.current || openRef.current) return;
      const roll = forceWalk ? 0 : Math.random();
      const schedule = (ms: number) => (wanderTimer.current = setTimeout(() => nextAction(), ms));

      if (roll < 0.6) {
        let x = rand(EDGE, maxX());
        if (Math.abs(x - pos.current.x) < 80) x = pos.current.x > maxX() / 2 ? EDGE + rand(0, 60) : maxX() - rand(0, 60);
        walkTo(x, () => {
          setMode("idle");
          if (Math.random() < 0.45) say("ask me!", 4500);
          schedule(rand(2500, 5000));
        });
      } else if (roll < 0.88) {
        setMode("idle");
        setFacing((f) => (f === 1 ? -1 : 1));
        schedule(rand(2000, 4000));
      } else {
        setMode("sleep");
        say(null);
        schedule(rand(7000, 11000));
      }
    },
    [say, setMode, walkTo]
  );

  const settle = useCallback(
    (delay = 1500) => {
      clearTimeout(wanderTimer.current);
      wanderTimer.current = setTimeout(() => nextAction(true), delay);
    },
    [nextAction]
  );

  // Called when Byte hits the ground and stops bouncing.
  const land = useCallback(() => {
    const p = pos.current;
    p.y = 0;
    p.vx = 0;
    p.vy = 0;
    if (shakenRef.current || flight.current.impact > 1500) {
      setMode("dizzy");
      say(pick(["@_@", "the room is spinning", "ugh... dizzy"]), 2200);
      setTimeout(() => {
        if (modeRef.current !== "dizzy") return;
        shakenRef.current = false;
        setShaken(false);
        setMode("idle");
        settle(1200);
      }, 2400);
    } else {
      setMode("idle");
      if (flight.current.impact > 700) say(pick(["oof!", "nailed it", "safe!"]));
      settle();
    }
    flight.current.impact = 0;
  }, [say, setMode, settle]);

  // ----- Animation loop -----
  useEffect(() => {
    if (!ready) return;
    let raf = 0;
    let last = performance.now();
    let lastStep = -1;
    if (elRef.current) elRef.current.style.transform = `translate3d(${pos.current.x}px, 0, 0)`;
    const tick = (now: number) => {
      const dt = Math.min(0.04, (now - last) / 1000);
      last = now;
      const p = pos.current;
      const m = modeRef.current;

      if (m === "walk" || m === "glide") {
        const speed = m === "glide" ? GLIDE_SPEED : WALK_SPEED;
        const d = target.current - p.x;
        if (Math.abs(d) <= speed * dt) {
          p.x = target.current;
          if (m === "glide") p.y = 0;
          const cb = onArrive.current;
          onArrive.current = null;
          cb?.();
        } else {
          p.x += Math.sign(d) * speed * dt;
        }
        if (m === "glide") p.y = Math.max(0, p.y - GLIDE_SPEED * dt);
        if (m === "walk") {
          const s = Math.floor(now / 180) % 2;
          if (s !== lastStep) {
            lastStep = s;
            setStep(s);
          }
        }
      } else if (m === "air") {
        p.vy -= GRAVITY * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.x < EDGE) {
          p.x = EDGE;
          p.vx = Math.abs(p.vx) * 0.55;
        } else if (p.x > maxX()) {
          p.x = maxX();
          p.vx = -Math.abs(p.vx) * 0.55;
        }
        if (p.y > maxY()) {
          p.y = maxY();
          p.vy = -Math.abs(p.vy) * 0.4;
        }
        if (p.y <= 0) {
          p.y = 0;
          flight.current.impact = Math.max(flight.current.impact, -p.vy);
          if (p.vy < -420) {
            p.vy = -p.vy * 0.38;
            p.vx *= 0.7;
          } else {
            land();
          }
        }
        if (Math.abs(p.vx) > 40) setFacing(p.vx > 0 ? 1 : -1);
      }

      if (elRef.current) elRef.current.style.transform = `translate3d(${p.x}px, ${-p.y}px, 0)`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [ready, land]);

  // ----- Start -----
  useEffect(() => {
    reduced.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const start = Math.max(EDGE, maxX() - 40);
    pos.current.x = start;
    target.current = start;
    setReady(true);
    if (reduced.current) {
      say("ask me!", 6000);
      return;
    }
    wanderTimer.current = setTimeout(() => {
      say("ask me!", 4500);
      wanderTimer.current = setTimeout(() => nextAction(true), 3000);
    }, 2500);
    return () => {
      clearTimeout(wanderTimer.current);
      clearTimeout(bubbleTimer.current);
    };
  }, [nextAction, say]);

  // Keep Byte on screen when the window is resized.
  useEffect(() => {
    const onResize = () => {
      const p = pos.current;
      p.x = Math.min(p.x, maxX());
      p.y = Math.min(p.y, maxY());
      if (openRef.current) p.x = maxX();
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Blink now and then.
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const loop = () => {
      t = setTimeout(() => {
        setBlink(true);
        t = setTimeout(() => {
          setBlink(false);
          loop();
        }, 130);
      }, rand(2800, 5200));
    };
    loop();
    return () => clearTimeout(t);
  }, []);

  // Eyes follow the mouse (one pixel left/right), only with a real mouse.
  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    const onMove = (e: MouseEvent) => {
      const cx = pos.current.x + W / 2;
      const d = (e.clientX - cx) * facing;
      setLook(d > 60 ? 1 : d < -60 ? -1 : 0);
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [facing]);

  // Floating hearts while being petted.
  useEffect(() => {
    if (mode !== "pet") return;
    let n = 0;
    const id = setInterval(() => {
      const key = Date.now() + n++;
      setHearts((h) => [...h.slice(-5), key]);
      setTimeout(() => setHearts((h) => h.filter((k) => k !== key)), 1200);
    }, 350);
    return () => clearInterval(id);
  }, [mode]);

  // ----- Chat open / close (with the "decrypt" transition) -----
  const runDecrypt = useCallback((to: Pixel[], done?: () => void) => {
    const from = shown.current;
    if (reduced.current) {
      done?.();
      return;
    }
    decrypting.current = true;
    setScramble(decryptFrame(from, to, 0));
    const start = performance.now();
    const id = setInterval(() => {
      const t = (performance.now() - start) / DECRYPT_MS;
      if (t >= 1) {
        clearInterval(id);
        decrypting.current = false;
        setScramble(null);
        done?.();
        return;
      }
      setScramble(decryptFrame(from, to, t));
    }, DECRYPT_TICK);
  }, []);

  const openChat = useCallback(() => {
    clearTimeout(wanderTimer.current);
    openRef.current = true;
    say(null);
    shakenRef.current = false;
    setShaken(false);
    setFacing(1);
    setForm("icon");
    runDecrypt(ICON_FRAME);
    target.current = maxX();
    onArrive.current = () => setMode("icon");
    setMode(reduced.current ? "icon" : "glide");
    if (reduced.current) pos.current = { x: maxX(), y: 0, vx: 0, vy: 0 };
    setTimeout(() => setOpen(true), reduced.current ? 0 : DECRYPT_MS - 150);
  }, [runDecrypt, say, setMode]);

  const closeChat = useCallback(() => {
    setOpen(false);
    openRef.current = false;
    setTimeout(() => {
      setForm("byte");
      setMode("idle");
      runDecrypt(byteFrame("happy", "stand", 0), () => say(pick(["bye for now!", "come back anytime!", "beep boop!"])));
      settle(2400);
    }, 180);
  }, [runDecrypt, say, setMode, settle]);

  const toggleChat = () => (openRef.current ? closeChat() : openChat());

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeChat();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, closeChat]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, thinking]);

  // ----- Pointer: tap, drag, throw, shake, pet -----
  const onPointerDown = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0 || decrypting.current) return;
    const p = pos.current;
    const top = window.innerHeight - BOTTOM - H - p.y;
    press.current = {
      id: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      offX: e.clientX - p.x,
      offY: e.clientY - top,
      dragging: false,
      samples: [{ t: performance.now(), x: e.clientX, y: e.clientY }],
      lastDir: 0,
      flips: [],
      wasSleeping: modeRef.current === "sleep",
    };
    e.currentTarget.setPointerCapture(e.pointerId);
    if (openRef.current) return; // the chat icon only taps
    press.current.petTimer = setTimeout(() => {
      if (!press.current || press.current.dragging) return;
      clearTimeout(wanderTimer.current);
      onArrive.current = null;
      setMode("pet");
      say(pick(["hehe", "that tickles!", "more pats pls", "<3"]), 2500);
    }, PET_DELAY);
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLButtonElement>) => {
    const pr = press.current;
    if (!pr || pr.id !== e.pointerId || openRef.current) return;
    const moved = Math.hypot(e.clientX - pr.startX, e.clientY - pr.startY);

    if (!pr.dragging) {
      if (moved < DRAG_THRESHOLD) return;
      // Start of a grab.
      pr.dragging = true;
      clearTimeout(pr.petTimer);
      clearTimeout(wanderTimer.current);
      onArrive.current = null;
      setHovered(false);
      setMode("held");
      say(pr.wasSleeping ? "huh?!" : pick(["whoa!", "hey!", "put me down!", "wheee?"]), 1500);
    }

    const p = pos.current;
    p.x = Math.max(EDGE, Math.min(maxX(), e.clientX - pr.offX));
    p.y = Math.max(0, Math.min(maxY(), window.innerHeight - BOTTOM - H - (e.clientY - pr.offY)));

    const now = performance.now();
    const prev = pr.samples[pr.samples.length - 1];
    pr.samples.push({ t: now, x: e.clientX, y: e.clientY });
    pr.samples = pr.samples.filter((s) => now - s.t < 100);

    // Shake detection: lots of quick left/right direction changes.
    const dx = e.clientX - prev.x;
    if (Math.abs(dx) > 4) {
      const dir = Math.sign(dx);
      if (pr.lastDir && dir !== pr.lastDir) {
        pr.flips = [...pr.flips.filter((t) => now - t < 1000), now];
        if (pr.flips.length >= 5 && !shakenRef.current) {
          shakenRef.current = true;
          setShaken(true);
          say(pick(["stop shaking me!", "@_@", "aaaaah!"]), 1800);
        }
      }
      pr.lastDir = dir;
      setFacing(dir > 0 ? 1 : -1);
    }
  };

  const endPress = (e: ReactPointerEvent<HTMLButtonElement>, cancelled: boolean) => {
    const pr = press.current;
    if (!pr || pr.id !== e.pointerId) return;
    press.current = null;
    clearTimeout(pr.petTimer);

    if (pr.dragging) {
      // Release: throw with the finger's recent velocity.
      const s = pr.samples;
      const first = s[0];
      const lastS = s[s.length - 1];
      const dt = Math.max(16, lastS.t - first.t) / 1000;
      const clamp = (v: number) => Math.max(-2600, Math.min(2600, v));
      const p = pos.current;
      p.vx = cancelled ? 0 : clamp((lastS.x - first.x) / dt);
      p.vy = cancelled ? 0 : clamp(-(lastS.y - first.y) / dt);
      flight.current.impact = 0;
      if (reduced.current) {
        land();
        return;
      }
      if (Math.hypot(p.vx, p.vy) > 900) say(pick(["wheee!", "I can fly!", "yeet!"]), 1400);
      else if (p.y > 140) say(pick(["uh oh", "not again!", "aaah!"]), 1200);
      setMode("air");
      return;
    }

    if (modeRef.current === "pet") {
      setMode("idle");
      say(pick(["thanks! :)", "I feel loved", "hehe"]), 1600);
      settle(1800);
      return;
    }

    if (!cancelled) toggleChat();
  };

  // ----- Asking questions -----
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
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    ask(input);
  };

  if (!ready) return null;

  // ----- Pick the pose -----
  let face: Face = blink ? "blink" : "normal";
  let legs: Legs = "stand";
  if (mode === "walk") legs = step ? "stepB" : "stepA";
  if (mode === "sleep") face = "sleep";
  if (hovered && (mode === "idle" || mode === "walk")) face = "happy";
  if (mode === "held") {
    face = shaken ? "dizzy" : "surprised";
    legs = "dangle";
  }
  if (mode === "air") {
    face = shaken ? "dizzy" : "surprised";
    legs = "tuck";
  }
  if (mode === "dizzy") face = "dizzy";
  if (mode === "pet") face = "love";
  const settled = form === "icon" ? ICON_FRAME : byteFrame(face, legs, look);
  if (!scramble) shown.current = settled;
  const pixels = scramble ?? settled;
  const showBubble = !!bubble && form === "byte" && !open && mode !== "sleep";
  const lifted = hovered && (mode === "idle" || mode === "walk") && !reduced.current;

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
              <p className="font-pixel text-sm text-text-secondary">
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
                        className="h-1.5 w-1.5 bg-primary"
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

      {/* Byte himself. Position is set every frame by the animation loop. */}
      <div
        ref={elRef}
        className="pointer-events-none fixed left-0 z-[80] will-change-transform"
        style={{ bottom: BOTTOM }}
      >
        <div className="relative">
          <AnimatePresence>
            {showBubble && (
              <motion.div
                key="bubble"
                initial={{ opacity: 0, y: 6, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.8 }}
                transition={{ duration: 0.18 }}
                className={`byte-bubble absolute bottom-[80px] whitespace-nowrap bg-white px-3 py-1.5 font-pixel text-xs text-[#080A0D] ${
                  bubbleSide === "right" ? "right-4 origin-bottom-right" : "left-4 origin-bottom-left"
                }`}
              >
                {bubble}
                <span
                  aria-hidden
                  className={`absolute -bottom-[6px] h-[6px] w-[6px] bg-white ${bubbleSide === "right" ? "right-5" : "left-5"}`}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {mode === "sleep" && form === "byte" && (
            <span aria-hidden className="byte-zzz absolute -top-3 right-0 font-pixel text-sm text-secondary">
              z
            </span>
          )}
          {hearts.map((k, i) => (
            <span
              key={k}
              aria-hidden
              className="byte-heart absolute -top-2"
              style={{ left: 14 + ((k * 17 + i * 23) % 44) }}
            >
              <PixelHeart />
            </span>
          ))}

          <button
            type="button"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={(e) => endPress(e, false)}
            onPointerCancel={(e) => endPress(e, true)}
            // Keyboard (Enter/Space) clicks have detail 0; pointer taps are handled above.
            onClick={(e) => e.detail === 0 && toggleChat()}
            onContextMenu={(e) => e.preventDefault()}
            onPointerEnter={(e) => {
              if (e.pointerType !== "mouse" || press.current) return;
              setHovered(true);
              if (modeRef.current === "sleep") {
                setMode("idle");
                say("huh? oh, hi!", 1500);
                settle(2500);
              }
            }}
            onPointerLeave={(e) => e.pointerType === "mouse" && setHovered(false)}
            aria-label={open ? "Close chat with Byte" : `Chat with Byte, ${firstName}'s assistant`}
            aria-expanded={open}
            data-cursor-hover
            className="byte-btn pointer-events-auto block cursor-grab select-none rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary active:cursor-grabbing"
            style={{ touchAction: "none", WebkitTouchCallout: "none" } as CSSProperties}
          >
            <span
              className="block transition-transform duration-150"
              style={{ transform: `translateY(${lifted ? -8 : 0}px) scaleX(${form === "icon" ? 1 : facing})` }}
            >
              <PixelSprite pixels={pixels} typing={thinking} />
            </span>
          </button>
        </div>
      </div>
    </>
  );
}
