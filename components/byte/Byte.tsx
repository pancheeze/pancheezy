"use client";

import { CSSProperties, FormEvent, Fragment, PointerEvent as ReactPointerEvent, useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Send, X } from "lucide-react";
import PixelSprite from "./PixelSprite";
import { byteFrame, CAMERA_FRAME, decryptFrame, Face, GRID_H, GRID_W, hackerize, ICON_FRAME, Legs, Pixel, withNightcap, withShades } from "./sprites";
import Link from "next/link";
import { actionsFor, ByteAction, suggestedQuestions } from "@/lib/byte";
import { profile, projects } from "@/lib/data";

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
const PARK_BELOW = 768; // px: on narrower screens (and any touch screen) Byte stays in the corner
const GLYPH_CHARS = "01#$%<>/*+=;";
const GLOW_COLORS = ["#ECA35F", "#7FA88B", "#7AA5C4"]; // same order and 6s loop as .byte-glow in globals.css
const GLOW_CYCLE_MS = 6000;
const TYPE_MS = 38; // per character in the terminal prompt
const ASK_EVERY_MS = 15_000; // parked Byte repeats "ask me about ..." at most this often
const CHAT_KEY = "byte-chat-v2"; // localStorage: the chat is remembered for returning visitors
const CHAT_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const LAST_SEEN_KEY = "byte-last-seen";
const WELCOME_BACK_AFTER_MS = 30 * 60 * 1000;
const MAX_SAVED = 40;
const SECRET_MS = 4200; // how long a secret-word reaction lasts

// Secret words: typed anywhere on the page (keyboard) or sent as a chat message on their own.
type Secret = "love" | "boss" | "camera" | "hacker";
const SECRET_WORDS: Record<string, Secret> = { zel: "love", paul: "boss", pancheeze: "camera", sudo: "hacker" };
const SECRET_LINES: Record<Secret, string[]> = {
  love: ["zel?! ♥ heart.exe overflowing", "♥ hi zel! ♥", "zel detected ♥ ♥ ♥"],
  boss: ["creator detected. hi boss", "paul! the guy who built me", "all systems nominal, boss"],
  camera: ["say cheeze!"],
  hacker: ["access granted", "welcome, root", "hacking the mainframe... jk"],
};
const SECRET_REPLIES: Record<Secret, string> = {
  love: "♥ ♥ ♥ Zel! My heart.exe just overflowed. You must be someone very special to Paul.",
  boss: "Creator detected 😎 Hi boss! All systems running smoothly.",
  camera: "Say cheeze! 📸 *click*",
  hacker: "Access granted. Welcome, root. (Just kidding, I only know about Paul 😄)",
};
// Every 3rd reminder is one of these, in turn. "zel" is never named: it's meant for one person.
const SECRET_HINTS = [
  "i know secret words 👀",
  "what happens if you type paul? 😎",
  "type pancheeze and smile 📸",
  "one secret word is just for someone special ♥",
];
const secretHint = (n: number) => SECRET_HINTS[Math.floor(n / 3) % SECRET_HINTS.length];
const isNightNow = () => {
  const h = new Date().getHours();
  return h >= 22 || h < 5;
};

type Mode = "idle" | "walk" | "sleep" | "held" | "air" | "dizzy" | "pet" | "glide" | "icon";
type Msg = { role: "user" | "assistant"; content: string };

const firstName = profile.name.split(" ")[0];
const ASK_ME = `ask me about ${firstName.toLowerCase()}`;
const GREETING: Msg = {
  role: "assistant",
  content: `Beep boop! I'm Byte, ${firstName}'s little helper bot. Ask me anything about him: his projects, skills, or how to reach him.`,
};

function loadChat(): Msg[] {
  if (typeof window === "undefined") return [GREETING];
  try {
    const stored = JSON.parse(localStorage.getItem(CHAT_KEY) ?? "null") as { savedAt?: number; messages?: unknown } | null;
    if (!stored || typeof stored.savedAt !== "number" || Date.now() - stored.savedAt > CHAT_TTL_MS) return [GREETING];
    const saved = stored.messages;
    if (!Array.isArray(saved)) return [GREETING];
    const valid = saved.filter(
      (m): m is Msg => (m?.role === "user" || m?.role === "assistant") && typeof m?.content === "string"
    );
    return valid.length > 1 ? valid : [GREETING];
  } catch {
    return [GREETING];
  }
}

function saveChat(messages: Msg[]) {
  try {
    if (messages.length > 1)
      localStorage.setItem(
        CHAT_KEY,
        JSON.stringify({ savedAt: Date.now(), messages: [GREETING, ...messages.slice(1).slice(-MAX_SAVED)] })
      );
  } catch {
    // Private mode or storage blocked: the chat just won't be remembered.
  }
}

const shouldPark = () => window.innerWidth < PARK_BELOW || window.matchMedia("(pointer: coarse)").matches;
const randomGlyph = () => GLYPH_CHARS[Math.floor(Math.random() * GLYPH_CHARS.length)];

// Glyph particles: released into the screen at Byte's position (not attached to him), so when he
// walks or is thrown they're left behind and stream out as a trail. Simulated in the animation loop
// and drawn straight to the DOM, so they don't re-render React.
type Spark = {
  el: HTMLSpanElement;
  chars: string; // characters it scrambles through
  x: number; // viewport px (top-left)
  y: number;
  vx: number; // px/s
  vy: number;
  age: number; // s
  life: number;
  seed: number;
  lastScramble: number;
};
const SPARK_LIFE = [1.6, 2.2]; // s
const SPARK_SCRAMBLE_S = 0.6; // characters "decrypt" for this long, then settle
const SPARK_BUOYANCY = -14; // px/s^2, they float up a little faster over time
const SPARK_DRAG = 1.8; // horizontal slow-down per second
const SPARK_MAX = 12;
// Squash & stretch: two springs (horizontal squish from walls, vertical from floor/ceiling).
const SQUASH_K = 420; // stiffness
const SQUASH_C = 16; // damping (low enough for a jelly wobble)
const SQUASH_MAX = 0.35;
// Scroll wobble: a rotation spring kicked by changes in scroll speed.
const LEAN_K = 260;
const LEAN_C = 9;
const LEAN_MAX = 12; // deg
// Parachute: gentle drops from high up float down instead of falling.
const CHUTE_MIN_HEIGHT = 140; // px above the floor
const CHUTE_FALL = 115; // px/s terminal speed
const CHUTE_SWAY = 46; // px/s side-to-side
const BURST_GLYPHS = 14; // contact-form celebration

// Section tips: typed once per visit when the section scrolls into view.
const capstone = projects.find((p) => /capstone/i.test(p.category))?.name;
const SECTION_TIPS: [string, string][] = [
  ["projects", capstone ? `psst, ${capstone} is his capstone` : "ask me about any project"],
  ["skills", "ask me what he's best at"],
  ["contact", `say hi to ${profile.name.split(" ")[0].toLowerCase()}!`],
];
const TIPS_KEY = "byte-tips";

/** Pixel umbrella-parachute in the site's colors, with strings down to Byte's shoulders. 24 x 14 grid at 4x. */
function PixelChute() {
  const BANDS = ["#ECA35F", "#7FA88B", "#7AA5C4"];
  const rows: [number, number, number][] = [
    [0, 7, 16],
    [1, 4, 19],
    [2, 2, 21],
    [3, 1, 22],
    [4, 0, 23],
    [5, 0, 23],
  ];
  const rects: { x: number; y: number; c: string; o?: number }[] = [];
  for (const [y, a, b] of rows)
    for (let x = a; x <= b; x++) rects.push({ x, y, c: BANDS[Math.floor(x / 8)], o: y <= 1 ? 0.85 : 1 });
  // Scalloped hem.
  for (let x = 0; x < 24; x++) if (x % 6 !== 5) rects.push({ x, y: 6, c: BANDS[Math.floor(x / 8)] });
  // Strings: canopy edges/centre down to Byte's shoulders (his body starts 3 columns in).
  const line = (x0: number, y0: number, x1: number, y1: number) => {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
    for (let i = 0; i <= n; i++)
      rects.push({ x: Math.round(x0 + ((x1 - x0) * i) / n), y: Math.round(y0 + ((y1 - y0) * i) / n), c: "#98A2AB", o: 0.8 });
  };
  line(1, 7, 6, 13);
  line(22, 7, 17, 13);
  return (
    <svg viewBox="0 0 24 14" width={96} height={56} shapeRendering="crispEdges" aria-hidden className="block">
      {rects.map((r, i) => (
        <rect key={i} x={r.x} y={r.y} width="1" height="1" fill={r.c} opacity={r.o ?? 1} />
      ))}
    </svg>
  );
}

type SquashState = {
  x: { d: number; v: number; hold: number };
  y: { d: number; v: number; hold: number };
  ox: string;
  oy: string;
};
/** Splat: squish along one axis, anchored on the side that was hit. */
function kickSquash(s: SquashState, axis: "x" | "y", amount: number, side: string) {
  const a = s[axis];
  a.d = Math.max(a.d, Math.min(SQUASH_MAX, amount));
  a.v = 0;
  if (axis === "x") s.ox = side;
  else s.oy = side;
}

const sparkEvery = (m: Mode, moving: boolean) => (m === "air" || m === "held" ? 0.09 : moving ? 0.28 : 0.65); // s

/** Types the text out like a terminal, with a blinking block cursor. Width is reserved so it doesn't jitter. */
function TypedPrompt({ text, instant }: { text: string; instant: boolean }) {
  const [shown, setShown] = useState(instant ? text.length : 0);
  useEffect(() => {
    if (instant) return;
    const id = setInterval(() => setShown((n) => (n >= text.length ? n : n + 1)), TYPE_MS);
    return () => clearInterval(id);
  }, [text, instant]);
  const caret = <span className="byte-caret ml-0.5 inline-block h-[0.95em] w-[0.5em] translate-y-[2px] bg-primary/80" />;
  return (
    <span className="relative inline-block">
      <span className="invisible">
        &gt; {text}
        {caret}
      </span>
      <span className="absolute inset-0">
        <span className="text-secondary">&gt; </span>
        {text.slice(0, shown)}
        {caret}
      </span>
    </span>
  );
}

const actionClass =
  "inline-flex items-center gap-1 rounded-full border border-secondary/40 px-2.5 py-1 text-xs text-secondary transition-colors hover:bg-secondary/10";

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
  const [messages, setMessages] = useState<Msg[]>(loadChat);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [typingElsewhere, setTypingElsewhere] = useState(false);
  // Starts the CSS color loop at the same point as the JS clock, so glyphs match the glow's color.
  const [glowDelay] = useState(() => (typeof performance === "undefined" ? 0 : -(performance.now() % GLOW_CYCLE_MS)));

  // Movement lives in refs and is drawn straight to the DOM every frame.
  const pos = useRef({ x: 0, y: 0, vx: 0, vy: 0 });
  const modeRef = useRef<Mode>("idle");
  const target = useRef(0);
  const onArrive = useRef<(() => void) | null>(null);
  const flight = useRef({ impact: 0 });
  const reduced = useRef(false);
  const parked = useRef(false);
  const lastAsk = useRef(0);
  const glyphLayer = useRef<HTMLDivElement>(null);
  const sparks = useRef<Spark[]>([]);
  const glyphsOnRef = useRef(false);
  const squashEl = useRef<HTMLSpanElement>(null);
  const leanEl = useRef<HTMLSpanElement>(null);
  // Squash springs: d = amount (0..SQUASH_MAX), v = velocity, hold = target while pushed against an edge.
  const squash = useRef<SquashState>({ x: { d: 0, v: 0, hold: 0 }, y: { d: 0, v: 0, hold: 0 }, ox: "center", oy: "bottom" });
  const chuteRef = useRef(false);
  const burst = useRef(0);
  const burstKind = useRef<"fan" | "rain">("fan");
  const [chute, setChute] = useState(false);
  // Secret words, night mode, the camera's flash and polaroid.
  const [special, setSpecial] = useState<Secret | null>(null);
  const specialRef = useRef<Secret | null>(null);
  const specialTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const [night, setNight] = useState(false);
  const nightRef = useRef(false);
  const [flash, setFlash] = useState(0); // key for the flash overlay (0 = none)
  const [polaroid, setPolaroid] = useState(0); // key for the polaroid (0 = none)
  const reminders = useRef(0);
  const pendingQuestion = useRef<string | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
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

      // Phones and small tablets: stay parked in the bottom-right corner so he never covers the page.
      if (parked.current) {
        if (Math.abs(pos.current.x - maxX()) > 2) {
          walkTo(maxX(), () => {
            setMode("idle");
            setFacing(-1);
            schedule(rand(3000, 6000));
          });
        } else if (Math.random() < (nightRef.current ? 0.45 : 0.3)) {
          setMode("sleep");
          say(null);
          schedule(rand(8000, 12000));
        } else {
          setMode("idle");
          // Remind visitors every ~15-20s, even after they've chatted with him (every 3rd time: the secret-word hint).
          if (Date.now() - lastAsk.current > ASK_EVERY_MS) {
            lastAsk.current = Date.now();
            const n = ++reminders.current;
            say(n % 3 === 0 ? secretHint(n) : ASK_ME, 4500);
          }
          schedule(rand(4000, 7000));
        }
        return;
      }

      if (roll < 0.6) {
        let x = rand(EDGE, maxX());
        if (Math.abs(x - pos.current.x) < 80) x = pos.current.x > maxX() / 2 ? EDGE + rand(0, 60) : maxX() - rand(0, 60);
        walkTo(x, () => {
          setMode("idle");
          if (Math.random() < 0.45) {
            const n = ++reminders.current;
            say(n % 3 === 0 ? secretHint(n) : ASK_ME, 4500);
          }
          schedule(rand(2500, 5000));
        });
      } else if (roll < (nightRef.current ? 0.75 : 0.88)) {
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
    if (chuteRef.current) {
      // Soft parachute landing: fold the canopy away.
      chuteRef.current = false;
      setChute(false);
      if (elRef.current) elRef.current.style.transformOrigin = "";
      flight.current.impact = 0;
      setMode("idle");
      say(pick(["safe!", "smooth landing", "touchdown!"]), 1800);
      settle(1800);
      return;
    }
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
    let prevX = pos.current.x;
    let prevY = pos.current.y;
    let sinceSpark = 0;
    let prevScroll = window.scrollY;
    let prevSv = 0;
    const lean = { a: 0, v: 0 }; // degrees, deg/s
    if (elRef.current) elRef.current.style.transform = `translate3d(${pos.current.x}px, 0, 0)`;

    const spawnSpark = (
      now: number,
      vx: number,
      vy: number,
      moving: boolean,
      fling?: { vx: number; vy: number; x?: number; y?: number }
    ) => {
      const layer = glyphLayer.current;
      if (!layer) return;
      const p = pos.current;
      const top = window.innerHeight - BOTTOM - H - p.y;
      let x: number;
      let y: number;
      if (fling) {
        // Bursts: from the top of his head, or from a given spot (offset from his top-left).
        x = p.x + (fling.x ?? rand(18, W - 22));
        y = top + (fling.y ?? rand(0, 14));
      } else if (moving) {
        // Released from the trailing side, so the stream lines up behind him.
        x = vx > 0 ? p.x + rand(-6, 12) : vx < 0 ? p.x + rand(W - 12, W + 6) : p.x + rand(0, W);
        y = top + rand(6, H - 20);
      } else {
        const side = Math.random();
        x = side < 0.35 ? p.x + rand(-14, 4) : side < 0.7 ? p.x + rand(W - 12, W + 4) : p.x + rand(12, W - 22);
        y = side < 0.7 ? top + rand(12, 46) : top + rand(-6, 6);
      }
      const phase = (now % GLOW_CYCLE_MS) / GLOW_CYCLE_MS;
      const sp = specialRef.current;
      const chars = sp === "love" ? "♥" : sp === "hacker" ? "01" : GLYPH_CHARS;
      const el = document.createElement("span");
      el.className = "byte-glyph font-mono";
      el.textContent = chars[Math.floor(Math.random() * chars.length)];
      el.style.color =
        sp === "love"
          ? pick(["#E8707A", "#F2A0B0"])
          : sp === "hacker"
            ? "#8FD19E"
            : GLOW_COLORS[Math.round(phase * GLOW_COLORS.length) % GLOW_COLORS.length];
      if (sp === "love") el.style.fontSize = "13px";
      layer.appendChild(el);
      sparks.current.push({
        el,
        chars,
        x,
        y,
        // A little of Byte's motion, reversed, so the trail stretches out behind him.
        vx: fling ? fling.vx : rand(-12, 12) - Math.max(-260, Math.min(260, vx)) * 0.18,
        vy: fling ? fling.vy : -rand(16, 34) + Math.max(-600, Math.min(600, vy)) * 0.05,
        age: 0,
        life: rand(SPARK_LIFE[0], SPARK_LIFE[1]),
        seed: Math.random() * 10,
        lastScramble: now,
      });
      if (sparks.current.length > SPARK_MAX) sparks.current.shift()?.el.remove();
    };

    const stepSparks = (now: number, dt: number) => {
      const list = sparks.current;
      for (let i = list.length - 1; i >= 0; i--) {
        const s = list[i];
        s.age += dt;
        if (s.age >= s.life) {
          s.el.remove();
          list.splice(i, 1);
          continue;
        }
        s.vx *= Math.exp(-SPARK_DRAG * dt);
        s.vy += SPARK_BUOYANCY * dt;
        s.x += (s.vx + Math.sin(s.age * 4 + s.seed) * 7) * dt; // gentle sway
        s.y += s.vy * dt;
        if (s.age < SPARK_SCRAMBLE_S && now - s.lastScramble > 80 && s.chars.length > 1) {
          s.el.textContent = s.chars[Math.floor(Math.random() * s.chars.length)];
          s.lastScramble = now;
        }
        const k = s.age / s.life;
        const opacity = k < 0.15 ? (k / 0.15) * 0.75 : k > 0.6 ? ((1 - k) / 0.4) * 0.75 : 0.75;
        s.el.style.opacity = opacity.toFixed(3);
        s.el.style.transform = `translate3d(${s.x.toFixed(1)}px, ${s.y.toFixed(1)}px, 0) rotate(${(s.vx * 0.25).toFixed(1)}deg)`;
      }
    };

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
        const sq = squash.current;
        if (chuteRef.current) {
          // Parachute: slow fall, swaying like a leaf.
          p.vy = Math.max(p.vy - GRAVITY * dt, -CHUTE_FALL);
          p.vx = Math.sin(now / 1000 * 2.2) * CHUTE_SWAY;
        } else {
          p.vy -= GRAVITY * dt;
        }
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.x < EDGE) {
          p.x = EDGE;
          if (!chuteRef.current) kickSquash(sq, "x", (Math.abs(p.vx) / 2600) * 0.7, "left");
          p.vx = Math.abs(p.vx) * 0.55;
        } else if (p.x > maxX()) {
          p.x = maxX();
          if (!chuteRef.current) kickSquash(sq, "x", (Math.abs(p.vx) / 2600) * 0.7, "right");
          p.vx = -Math.abs(p.vx) * 0.55;
        }
        if (p.y > maxY()) {
          p.y = maxY();
          kickSquash(sq, "y", (Math.abs(p.vy) / 2600) * 0.6, "top");
          p.vy = -Math.abs(p.vy) * 0.4;
        }
        if (p.y <= 0) {
          p.y = 0;
          flight.current.impact = Math.max(flight.current.impact, -p.vy);
          kickSquash(sq, "y", chuteRef.current ? 0.08 : (-p.vy / 2600) * 0.6, "bottom");
          if (p.vy < -420) {
            p.vy = -p.vy * 0.38;
            p.vx *= 0.7;
          } else {
            land();
          }
        }
        if (Math.abs(p.vx) > 40) setFacing(p.vx > 0 ? 1 : -1);
      }

      // Parachute swing: rotate around the canopy, in time with the sway.
      const swing = chuteRef.current && m === "air" ? Math.sin(now / 1000 * 2.2 - 0.6) * 7 : 0;
      if (elRef.current)
        elRef.current.style.transform = `translate3d(${p.x}px, ${-p.y}px, 0)${swing ? ` rotate(${swing.toFixed(2)}deg)` : ""}`;

      // Squash & stretch springs (pushed against an edge = hold; otherwise wobble back to normal).
      const sq = squash.current;
      for (const a of [sq.x, sq.y]) {
        a.v += (-SQUASH_K * (a.d - a.hold) - SQUASH_C * a.v) * dt;
        a.d = Math.max(-0.15, Math.min(SQUASH_MAX, a.d + a.v * dt));
      }
      // Scroll wobble: sudden changes in scroll speed kick a rotation spring; fast scrolling = crouch (grip).
      const sy = window.scrollY;
      const sv = dt > 0 ? (sy - prevScroll) / dt : 0;
      prevScroll = sy;
      const grounded = m === "idle" || m === "walk" || m === "sleep" || m === "pet" || m === "dizzy";
      if (grounded && !reduced.current) {
        lean.v += Math.max(-140, Math.min(140, (sv - prevSv) * 0.04));
        sq.y.hold = Math.min(0.12, Math.abs(sv) / 9000);
        if (sq.y.hold > 0.01) sq.oy = "bottom";
      } else if (!press.current) {
        sq.y.hold = 0;
      }
      prevSv = sv;
      lean.v += (-LEAN_K * lean.a - LEAN_C * lean.v) * dt;
      lean.a = Math.max(-LEAN_MAX, Math.min(LEAN_MAX, lean.a + lean.v * dt));

      const sx = 1 - sq.x.d + sq.y.d * 0.6;
      const syScale = 1 - sq.y.d + sq.x.d * 0.6;
      if (squashEl.current) {
        const idle = Math.abs(sx - 1) < 0.002 && Math.abs(syScale - 1) < 0.002;
        squashEl.current.style.transformOrigin = `${sq.ox} ${sq.oy}`;
        squashEl.current.style.transform = idle ? "" : `scale(${sx.toFixed(3)}, ${syScale.toFixed(3)})`;
      }
      if (leanEl.current) leanEl.current.style.transform = Math.abs(lean.a) < 0.05 ? "" : `rotate(${lean.a.toFixed(2)}deg)`;

      // Glyph particles
      const vx = dt > 0 ? (p.x - prevX) / dt : 0;
      const vy = dt > 0 ? (p.y - prevY) / dt : 0;
      prevX = p.x;
      prevY = p.y;
      const moving = Math.abs(vx) > 5 || Math.abs(vy) > 5;
      sinceSpark += dt;
      const every = specialRef.current === "love" ? 0.16 : sparkEvery(m, moving);
      if (glyphsOnRef.current && !reduced.current && sinceSpark >= every) {
        sinceSpark = 0;
        spawnSpark(now, vx, vy, moving);
      }
      if (burst.current > 0) {
        const n = burst.current;
        burst.current = 0;
        if (!reduced.current)
          for (let i = 0; i < n; i++) {
            if (burstKind.current === "rain") {
              // Hacker mode: green 0/1 rain falling from above him.
              spawnSpark(now, 0, 0, false, { vx: rand(-6, 6), vy: rand(80, 150), x: rand(-60, W + 60), y: rand(-150, -30) });
            } else {
              const angle = -Math.PI / 2 + rand(-1.1, 1.1); // fan upwards
              const speed = rand(90, 190);
              spawnSpark(now, 0, 0, false, { vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed });
            }
          }
      }
      stepSparks(now, dt);

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    const list = sparks.current;
    return () => {
      cancelAnimationFrame(raf);
      list.forEach((s) => s.el.remove());
      list.length = 0;
    };
  }, [ready, land]);

  // ----- Start -----
  useEffect(() => {
    reduced.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    parked.current = shouldPark();
    const start = parked.current ? maxX() : Math.max(EDGE, maxX() - 40);
    pos.current.x = start;
    target.current = start;
    nightRef.current = isNightNow();
    setNight(nightRef.current);
    // First line: welcome back (returning visitor) > night owl > the usual.
    let returning = false;
    try {
      const lastSeen = Number(localStorage.getItem(LAST_SEEN_KEY));
      returning = lastSeen > 0 && Date.now() - lastSeen > WELCOME_BACK_AFTER_MS;
      localStorage.setItem(LAST_SEEN_KEY, String(Date.now()));
    } catch {}
    const firstLine = returning ? "welcome back!" : nightRef.current ? "working late too?" : ASK_ME;
    lastAsk.current = Date.now();
    setReady(true);
    if (reduced.current) {
      say(firstLine, 6000);
      return;
    }
    wanderTimer.current = setTimeout(() => {
      say(firstLine, 4500);
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
      parked.current = shouldPark();
      const p = pos.current;
      p.x = Math.min(p.x, maxX());
      p.y = Math.min(p.y, maxY());
      if (openRef.current) p.x = maxX();
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Step out of the way while the visitor types in a form on the page (e.g. the contact form).
  useEffect(() => {
    const isField = (el: EventTarget | null) =>
      el instanceof HTMLElement && el.matches("input, textarea, select, [contenteditable='true']") && !dialogRef.current?.contains(el);
    const onFocusIn = (e: FocusEvent) => isField(e.target) && setTypingElsewhere(true);
    const onFocusOut = (e: FocusEvent) => isField(e.target) && !isField(e.relatedTarget) && setTypingElsewhere(false);
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);
    return () => {
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
    };
  }, []);

  // Section tips: a one-time hint (per visit) when Projects, Skills or Contact scrolls into view.
  useEffect(() => {
    if (!ready) return;
    let seen: string[] = [];
    try {
      seen = JSON.parse(sessionStorage.getItem(TIPS_KEY) ?? "[]");
    } catch {}
    const timers: ReturnType<typeof setTimeout>[] = [];
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = entry.target.id;
          const tip = SECTION_TIPS.find(([s]) => s === id)?.[1];
          if (!entry.isIntersecting || !tip || seen.includes(id) || openRef.current) continue;
          seen.push(id);
          try {
            sessionStorage.setItem(TIPS_KEY, JSON.stringify(seen));
          } catch {}
          timers.push(
            setTimeout(() => {
              if (openRef.current) return;
              if (modeRef.current === "sleep") setMode("idle");
              lastAsk.current = Date.now(); // don't stack "ask me about ..." right after a tip
              say(tip, 5000);
            }, 600)
          );
        }
      },
      { threshold: 0.35 }
    );
    SECTION_TIPS.forEach(([id]) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => {
      observer.disconnect();
      timers.forEach(clearTimeout);
    };
  }, [ready, say, setMode]);

  // Contact form sent: hop, burst of glyphs, and a cheer.
  useEffect(() => {
    const onCelebrate = () => {
      say("message delivered!", 3500);
      if (reduced.current || openRef.current) return;
      burst.current = BURST_GLYPHS;
      const m = modeRef.current;
      if (m === "idle" || m === "walk" || m === "sleep") {
        clearTimeout(wanderTimer.current);
        onArrive.current = null;
        pos.current.vx = 0;
        pos.current.vy = 640;
        flight.current.impact = 0;
        setMode("air");
      }
    };
    window.addEventListener("byte:celebrate", onCelebrate);
    return () => window.removeEventListener("byte:celebrate", onCelebrate);
  }, [say, setMode]);

  // Remember the conversation for this visit.
  useEffect(() => saveChat(messages), [messages]);

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

  // Glyph particles are spawned by the animation loop while this is true.
  const glyphsOn = !open && form === "byte" && !typingElsewhere;
  useEffect(() => {
    glyphsOnRef.current = glyphsOn;
  }, [glyphsOn]);

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

  // ----- Secret words -----
  const playSecret = useCallback(
    (kind: Secret) => {
      if (openRef.current || decrypting.current || specialRef.current) return;
      const m = modeRef.current;
      if (m === "held" || m === "air" || m === "glide") return;
      const later = (ms: number, fn: () => void) => specialTimers.current.push(setTimeout(fn, ms));
      const finish = () => {
        specialRef.current = null;
        setSpecial(null);
        burstKind.current = "fan";
        if (modeRef.current === "pet") setMode("idle");
        settle(1500);
      };
      clearTimeout(wanderTimer.current);
      onArrive.current = null;
      specialRef.current = kind;
      setSpecial(kind);
      lastAsk.current = Date.now();

      if (kind === "love") {
        setMode("pet"); // heart eyes + floating hearts
        say(pick(SECRET_LINES.love), SECRET_MS);
        later(SECRET_MS, finish);
      } else if (kind === "boss") {
        setMode("idle");
        runDecrypt(withShades(byteFrame("happy", "stand", 0)));
        say(pick(SECRET_LINES.boss), SECRET_MS);
        later(SECRET_MS, finish);
      } else if (kind === "hacker") {
        setMode("idle");
        runDecrypt(hackerize(byteFrame("normal", "stand", 0)));
        say(pick(SECRET_LINES.hacker), SECRET_MS);
        burstKind.current = "rain";
        burst.current = 18;
        later(1300, () => (burst.current = 14));
        later(SECRET_MS, finish);
      } else {
        // Camera: turn into a camera, "say cheeze!", flash, a polaroid pops out, then back to Byte.
        setMode("idle");
        runDecrypt(CAMERA_FRAME);
        say("say cheeze!", 1500);
        later(1200, () => {
          if (!reduced.current) setFlash(Date.now());
          setPolaroid(Date.now());
          say("click! cheeze~", 2000);
        });
        later(3000, () => runDecrypt(byteFrame("happy", "stand", 0), finish));
        later(5600, () => setPolaroid(0));
      }
    },
    [runDecrypt, say, setMode, settle]
  );

  // Typing a secret word anywhere on the page (not inside a text field).
  useEffect(() => {
    let typed = "";
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t?.closest?.("input, textarea, select, [contenteditable='true']")) return;
      if (e.key.length !== 1 || e.ctrlKey || e.metaKey || e.altKey) return;
      typed = (typed + e.key.toLowerCase()).slice(-12);
      const hit = Object.entries(SECRET_WORDS).find(([word]) => typed.endsWith(word));
      if (hit) {
        typed = "";
        playSecret(hit[1]);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [playSecret]);

  useEffect(() => {
    const timers = specialTimers.current;
    return () => timers.forEach(clearTimeout);
  }, []);

  // "ask byte →" on project cards: open the chat already asking about that project.
  const [askNonce, setAskNonce] = useState(0);
  useEffect(() => {
    const onAsk = (e: Event) => {
      const q = (e as CustomEvent<unknown>).detail;
      if (typeof q !== "string") return;
      pendingQuestion.current = q;
      if (!openRef.current) openChat();
      setAskNonce((n) => n + 1);
    };
    window.addEventListener("byte:ask", onAsk);
    return () => window.removeEventListener("byte:ask", onAsk);
  }, [openChat]);

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
    if (chuteRef.current) {
      // Grabbed mid-air: the parachute folds away.
      chuteRef.current = false;
      setChute(false);
      if (elRef.current) elRef.current.style.transformOrigin = "";
    }
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
    const rawX = e.clientX - pr.offX;
    const rawY = window.innerHeight - BOTTOM - H - (e.clientY - pr.offY);
    p.x = Math.max(EDGE, Math.min(maxX(), rawX));
    p.y = Math.max(0, Math.min(maxY(), rawY));
    // Pushing him into a screen edge squishes him against it (the further, the flatter).
    const sq = squash.current;
    const overX = rawX < EDGE ? EDGE - rawX : rawX > maxX() ? rawX - maxX() : 0;
    const overY = rawY < 0 ? -rawY : rawY > maxY() ? rawY - maxY() : 0;
    sq.x.hold = Math.min(0.3, overX / 220);
    sq.y.hold = Math.min(0.3, overY / 220);
    if (overX) sq.ox = rawX < EDGE ? "left" : "right";
    if (overY) sq.oy = rawY < 0 ? "bottom" : "top";

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
    squash.current.x.hold = 0; // let go of the wall: spring back with a wobble
    squash.current.y.hold = 0;

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
      else if (p.y > CHUTE_MIN_HEIGHT && !cancelled) {
        // A gentle drop from up high: pop the parachute.
        chuteRef.current = true;
        setChute(true);
        p.vy = Math.min(p.vy, 0);
        if (elRef.current) elRef.current.style.transformOrigin = `${W / 2}px -44px`;
        say(pick(["wheee~", "parachute deployed!", "gently now~"]), 2200);
      }
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

    // A secret word on its own: a canned reply, then the chat closes so Byte can react.
    const secret = q.length <= 24 ? SECRET_WORDS[q.toLowerCase().replace(/[^a-z]/g, "")] : undefined;
    if (secret) {
      setMessages((m) => [...m, { role: "user", content: q }, { role: "assistant", content: SECRET_REPLIES[secret] }]);
      setInput("");
      setTimeout(() => {
        closeChat();
        setTimeout(() => playSecret(secret), 1100);
      }, 1200);
      return;
    }

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

  const goToSection = (id: string) => {
    closeChat();
    const el = document.getElementById(id);
    if (el) setTimeout(() => el.scrollIntoView({ behavior: reduced.current ? "auto" : "smooth" }), 250);
    else window.location.href = `/#${id}`; // on a project page: go back to the home page section
  };

  const renderAction = (a: ByteAction) => {
    if (a.kind === "link")
      return (
        <Link key={a.href} href={a.href} onClick={closeChat} className={actionClass}>
          {a.label} →
        </Link>
      );
    if (a.kind === "download")
      return (
        <a key={a.href} href={a.href} download className={actionClass}>
          {a.label} ↓
        </a>
      );
    return (
      <button key={a.id} type="button" onClick={() => goToSection(a.id)} className={actionClass}>
        {a.label} →
      </button>
    );
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    ask(input);
  };

  // Ask the project-card question once the chat is open.
  useEffect(() => {
    if (!open || !pendingQuestion.current || thinking) return;
    const q = pendingQuestion.current;
    pendingQuestion.current = null;
    ask(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- ask() is recreated every render; run only when opened/asked
  }, [open, askNonce]);

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
    face = shaken ? "dizzy" : chute ? "happy" : "surprised";
    legs = chute ? "dangle" : "tuck";
  }
  if (mode === "dizzy") face = "dizzy";
  if (mode === "pet") face = "love";
  let settled = form === "icon" ? ICON_FRAME : special === "camera" ? CAMERA_FRAME : byteFrame(face, legs, look);
  if (form === "byte" && special === "boss") settled = withShades(settled);
  if (form === "byte" && special === "hacker") settled = hackerize(settled);
  if (form === "byte" && night && special !== "camera") settled = withNightcap(settled);
  if (!scramble) shown.current = settled;
  const pixels = scramble ?? settled;
  const hideForForm = typingElsewhere && !open;
  const showBubble = !!bubble && form === "byte" && !open && mode !== "sleep" && !hideForForm;
  const showGlow = form === "byte" && !open && !hideForForm && !scramble;
  const lifted = hovered && (mode === "idle" || mode === "walk") && !reduced.current;

  return (
    <>
      {/* Chat window */}
      <AnimatePresence>
        {open && (
          <motion.div
            ref={dialogRef}
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
                <span className="text-secondary">byte</span>@pancheeze:<span className="text-accent">~</span>$
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
              {messages.map((m, i) => {
                const actions = m.role === "assistant" && i > 0 ? actionsFor(m.content) : [];
                return (
                <div key={i} className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}>
                  <p
                    className={`max-w-[85%] whitespace-pre-line rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                      m.role === "user"
                        ? "rounded-br-sm bg-primary/90 text-[#080A0D]"
                        : "rounded-bl-sm border border-white/10 bg-base/60 text-text"
                    }`}
                  >
                    {m.role === "assistant" ? <Linkified text={m.content} /> : m.content}
                  </p>
                  {actions.length > 0 && <div className="mt-2 flex flex-wrap gap-1.5">{actions.map(renderAction)}</div>}
                </div>
                );
              })}
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
            <p className="-mt-1 px-4 pb-2.5 text-center text-[11px] text-text-muted">
              Byte is an AI helper and can make mistakes. Check details with {firstName}.
              <span className="mt-0.5 block font-mono text-secondary/80">psst… I react to secret words. try sudo 👀</span>
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* "pancheeze": one soft camera flash (skipped for reduced motion). */}
      {flash > 0 && (
        <motion.div
          key={flash}
          aria-hidden
          className="pointer-events-none fixed inset-0 z-[85] bg-white"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.4, 0] }}
          transition={{ duration: 0.45, times: [0, 0.15, 1] }}
          onAnimationComplete={() => setFlash(0)}
        />
      )}

      {/* Glyph particles (screen-space, so they trail behind him). Filled by the animation loop. */}
      <div
        ref={glyphLayer}
        aria-hidden
        className={`pointer-events-none fixed inset-0 z-[79] overflow-hidden transition-opacity duration-200 ${hideForForm ? "opacity-0" : ""}`}
      />

      {/* Byte himself. Position is set every frame by the animation loop. */}
      <div
        ref={elRef}
        className="pointer-events-none fixed left-0 z-[80] will-change-transform"
        style={{ bottom: BOTTOM }}
      >
        <div
          className={`relative transition-opacity duration-200 ${hideForForm ? "invisible opacity-0" : "opacity-100"}`}
          aria-hidden={hideForForm || undefined}
        >
          <AnimatePresence>
            {showBubble && (
              <motion.div
                key="bubble"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.16 }}
                className={`absolute ${chute ? "bottom-[126px]" : "bottom-[82px]"} whitespace-nowrap rounded-md border border-white/10 bg-surface/90 px-2.5 py-1.5 font-mono text-xs text-primary shadow-glass backdrop-blur-sm ${
                  bubbleSide === "right" ? "right-2" : "left-2"
                }`}
              >
                <TypedPrompt key={bubble} text={bubble ?? ""} instant={reduced.current} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Parachute (gentle drops from up high). */}
          <AnimatePresence>
            {chute && form === "byte" && (
              <motion.div
                key="chute"
                aria-hidden
                className="pointer-events-none absolute -left-3"
                style={{ bottom: H - 12, transformOrigin: "50% 100%" }}
                initial={{ scaleX: 0.2, scaleY: 0.1, opacity: 0 }}
                animate={{ scaleX: [0.2, 1.12, 1], scaleY: [0.1, 1.08, 1], opacity: 1 }}
                exit={{ opacity: [1, 0.2, 0.8, 0], scaleY: 0.4, transition: { duration: 0.32 } }}
                transition={{ duration: 0.38, ease: "easeOut" }}
              >
                <PixelChute />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Soft glow, always on while he's Byte. */}
          {showGlow && (
            <span
              aria-hidden
              className={`byte-glow ${special === "love" ? "byte-glow-love" : special === "hacker" ? "byte-glow-hacker" : ""}`}
              style={{ animationDelay: `0s, ${glowDelay}ms` }}
            />
          )}

          {/* "pancheeze": the polaroid that pops out of the camera. */}
          <AnimatePresence>
            {polaroid > 0 && (
              <motion.div
                key={polaroid}
                aria-hidden
                className="pointer-events-none absolute bottom-[78px] left-1/2 -ml-[29px] w-[58px] rounded-[2px] bg-[#E9E6DF] p-1 pb-0 shadow-glass"
                initial={{ opacity: 0, y: 20, rotate: -10, scale: 0.6 }}
                animate={{ opacity: 1, y: -16, rotate: 7, scale: 1 }}
                exit={{ opacity: 0, y: -46, rotate: 12, transition: { duration: 0.6 } }}
                transition={{ type: "spring", stiffness: 220, damping: 14 }}
              >
                <div className="h-[46px] overflow-hidden bg-[#13211D]">
                  <div style={{ transform: "scale(0.62)", transformOrigin: "0 0", marginLeft: 3, marginTop: 1 }}>
                    <PixelSprite pixels={withShades(byteFrame("happy", "stand", 0))} />
                  </div>
                </div>
                <p className="py-0.5 text-center font-pixel text-[8px] leading-tight text-[#080A0D]">pancheeze ✌</p>
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
            {/* lean (scroll wobble) > squash (walls, floor) > hover lift + facing. Lean/squash are set by the animation loop. */}
            <span ref={leanEl} className="block" style={{ transformOrigin: "50% 100%" }}>
              <span ref={squashEl} className="block">
                <span
                  className="block transition-transform duration-150"
                  style={{ transform: `translateY(${lifted ? -8 : 0}px) scaleX(${form === "icon" || special === "camera" ? 1 : facing})` }}
                >
                  <PixelSprite pixels={pixels} typing={thinking} />
                </span>
              </span>
            </span>
          </button>
        </div>
      </div>
    </>
  );
}
