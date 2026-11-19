"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { Code2, Network } from "lucide-react";
import SectionHeading from "@/components/ui/SectionHeading";
import { useDecrypt } from "@/components/ui/ProjectFolder";
import { projects, skillCategories, skills } from "@/lib/data";
import type { Project } from "@/lib/types";
import { skillIcons } from "@/lib/skillIcons";
import { EASE, staggerContainer } from "@/lib/utils";

// Skills grouped into category cards. Each skill chip shows where it was used: skills backed by a
// project glow (●), coursework-only ones stay dim (○). Hover/tap a chip to see "used in: ..." with
// links to those projects. Evidence comes from the projects' tech lists in lib/data.ts.
// Laptop/tablet: a bento grid under a slow logo strip. Phones: a carousel of the same cards that
// advances gently on its own (pauses when touched).

type Category = (typeof skillCategories)[number];

const CARD: Record<Category, { folder: string; accent: string; span: string }> = {
  // Spans are chosen so the cards tile: 2 columns on tablets, 4 on large screens.
  Programming: { folder: "programming", accent: "#ECA35F", span: "col-span-2" },
  Frontend: { folder: "frontend", accent: "#7AA5C4", span: "col-span-2" },
  Backend: { folder: "backend", accent: "#7FA88B", span: "col-span-1" },
  Database: { folder: "database", accent: "#7AA5C4", span: "col-span-1" },
  Mobile: { folder: "mobile", accent: "#7FA88B", span: "col-span-1 lg:col-span-2" },
  AI: { folder: "ai_ml", accent: "#ECA35F", span: "col-span-1" },
  Tools: { folder: "tools", accent: "#7AA5C4", span: "col-span-2 lg:col-span-3" },
};

// Names in the projects' tech lists that count as a given skill.
const ALIASES: Record<string, string[]> = {
  "REST APIs": ["rest api", "rest apis", "paypal rest api"],
  "TensorFlow Lite": ["tensorflow lite"],
};
// Evidence that isn't a project tech list.
const OTHER_EVIDENCE: Record<string, string> = {
  Git: "every project (version control)",
  GitHub: "every project (code hosting)",
  Photoshop: "illustrations for The Searcher",
};

const normalize = (s: string) => s.toLowerCase().replace(/\s+\d+$/, "").trim(); // "Unity 6" -> "unity"

type Evidence = { note?: string; projects: Project[] };

function evidenceFor(skill: string): Evidence | null {
  if (OTHER_EVIDENCE[skill]) return { note: OTHER_EVIDENCE[skill], projects: [] };
  const names = ALIASES[skill] ?? [skill.toLowerCase()];
  const hits = projects.filter((p) => [...p.tech, ...p.detail.stack].some((t) => names.includes(normalize(t))));
  return hits.length ? { projects: hits } : null;
}

/** "used in: ChickDetect, SiliScan" with each project linking to its page. */
function ProjectLinks({ list, accent }: { list: Project[]; accent: string }) {
  return (
    <>
      {list.map((p, i) => (
        <span key={p.slug}>
          {i > 0 && ", "}
          <Link
            href={`/projects/${p.slug}`}
            className="underline decoration-white/20 underline-offset-2 transition-colors hover:text-white"
            style={{ textDecorationColor: `${accent}66` }}
          >
            {p.name}
          </Link>
        </span>
      ))}
    </>
  );
}

function SkillIcon({ name }: { name: string }) {
  const path = skillIcons[name];
  if (path) {
    return (
      <svg viewBox="0 0 24 24" width={15} height={15} fill="currentColor" aria-hidden>
        <path d={path} />
      </svg>
    );
  }
  return name === "REST APIs" ? <Network size={15} aria-hidden /> : <Code2 size={15} aria-hidden />;
}

// Cards "boot up" as they scroll in: the card fades up, its border traces itself, the title
// decrypts and the chips pop in one by one. Plays once.
const cardVariants = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: EASE, delayChildren: 0.25, staggerChildren: 0.045 },
  },
};
const chipVariants = {
  hidden: { opacity: 0, scale: 0.85 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.25, ease: EASE } },
};
const traceVariants = {
  hidden: { pathLength: 0, opacity: 0 },
  show: { pathLength: 1, opacity: [0, 0.9, 0], transition: { duration: 1.3, ease: "easeInOut" as const } },
};

function CategoryCard({
  category,
  slide,
  isActive = false,
}: {
  category: Category;
  /** Phone carousel slide: fixed width, always shows the card's proof line, re-boots when centered. */
  slide?: { index: number; total: number };
  isActive?: boolean;
}) {
  const { folder, accent, span } = CARD[category];
  const items = skills.filter((s) => s.category === category).map((s) => ({ ...s, ev: evidenceFor(s.name) }));
  const [title, decrypt] = useDecrypt(`${folder}/`);
  const [active, setActive] = useState<string | null>(null);
  const activeItem = items.find((s) => s.name === active);
  const cardRef = useRef<HTMLDivElement>(null);
  const seen = useInView(cardRef, { once: true, amount: 0.4 });

  useEffect(() => {
    if (seen) decrypt();
  }, [seen, decrypt]);
  // In the carousel, the title decrypts again each time the card comes to the center.
  useEffect(() => {
    if (slide && isActive) decrypt();
  }, [slide, isActive, decrypt]);

  // Every project this category's skills were used in (the carousel shows it without tapping).
  const categoryProjects = [...new Map(items.flatMap((s) => s.ev?.projects ?? []).map((p) => [p.slug, p])).values()];
  const categoryNote = items.find((s) => s.ev?.note)?.ev?.note;

  // Laptop only: a glow follows the cursor inside the card and the card tilts slightly toward it.
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    if (!el || e.pointerType !== "mouse" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    el.style.setProperty("--mx", `${(x * 100).toFixed(1)}%`);
    el.style.setProperty("--my", `${(y * 100).toFixed(1)}%`);
    el.style.transform = `perspective(900px) rotateX(${((0.5 - y) * 5).toFixed(2)}deg) rotateY(${((x - 0.5) * 5).toFixed(2)}deg)`;
  };
  const onPointerLeave = () => {
    setActive(null);
    if (cardRef.current) cardRef.current.style.transform = "";
  };

  return (
    <motion.div
      variants={cardVariants}
      className={slide ? "skill-slide flex w-[78vw] max-w-[340px] shrink-0 snap-center" : span}
      data-active={slide ? isActive : undefined}
      aria-roledescription={slide ? "slide" : undefined}
      aria-label={slide ? `${slide.index + 1} of ${slide.total}: ${category}` : undefined}
    >
      <div
        ref={cardRef}
        onMouseEnter={decrypt}
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
        className="skill-card glass-card group relative flex h-full w-full flex-col overflow-hidden p-3.5 sm:p-5"
        style={{ "--folder-accent": accent } as React.CSSProperties}
      >
        {/* The border tracing itself once, on scroll-in. */}
        <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden>
          <motion.rect
            variants={traceVariants}
            x="0.75"
            y="0.75"
            style={{ width: "calc(100% - 1.5px)", height: "calc(100% - 1.5px)" }}
            rx="16"
            fill="none"
            stroke={accent}
            strokeWidth="1.5"
          />
        </svg>

        <div className="relative mb-3 flex items-baseline justify-between gap-2">
          <h3 className="truncate font-mono text-sm text-white">
            <span className="text-text-muted">&gt; </span>
            <span aria-hidden className="transition-colors group-hover:text-[color:var(--folder-accent)]">{title}</span>
            <span className="sr-only">{category}</span>
          </h3>
          <span className="shrink-0 font-mono text-[11px] text-text-muted">{items.length}</span>
        </div>

        <ul className="relative flex flex-wrap gap-2">
          {items.map((s, i) => (
            <motion.li key={s.name} variants={chipVariants} style={{ "--i": i } as React.CSSProperties}>
              <button
                type="button"
                onMouseEnter={() => setActive(s.name)}
                onFocus={() => setActive(s.name)}
                onClick={() => setActive((a) => (a === s.name ? null : s.name))}
                aria-describedby={active === s.name ? `used-${folder}` : undefined}
                className={`skill-chip ${s.ev ? "is-used" : "is-coursework"} ${active === s.name ? "is-active" : ""}`}
              >
                <SkillIcon name={s.name} />
                {s.name}
              </button>
            </motion.li>
          ))}
        </ul>

        {/* "used in" line: for the hovered/tapped chip. In the carousel, the whole card's projects
            show when no chip is picked (most phone visitors never tap). */}
        <p
          id={`used-${folder}`}
          className={`relative font-mono text-[11px] leading-snug text-text-secondary ${slide ? "mt-auto" : ""}`}
          aria-live="polite"
        >
          {activeItem ? (
            <span className="mt-3 block">
              <span style={{ color: accent }}>↳ </span>
              {activeItem.ev?.note ? (
                `used in: ${activeItem.ev.note}`
              ) : activeItem.ev ? (
                <>
                  used in: <ProjectLinks list={activeItem.ev.projects} accent={accent} />
                </>
              ) : (
                `${activeItem.name}: coursework (not in a project yet)`
              )}
            </span>
          ) : (
            slide && (
              <span className="mt-3 block">
                <span style={{ color: accent }}>↳ </span>
                {categoryProjects.length ? (
                  <>
                    used in: <ProjectLinks list={categoryProjects.slice(0, 3)} accent={accent} />
                    {categoryProjects.length > 3 && ` +${categoryProjects.length - 3}`}
                  </>
                ) : (
                  `used in: ${categoryNote ?? "coursework"}`
                )}
              </span>
            )
          )}
        </p>
      </div>
    </motion.div>
  );
}

const AUTO_MS = 4500; // time on each card before the carousel moves on
const RESUME_MS = 8000; // after a touch, wait this long before moving again

/**
 * Phones: the category cards as a swipeable coverflow row (softer than the Featured one) that
 * advances by itself every few seconds. The active dot fills up before each move. Touching it
 * pauses it; it only runs while on screen, and never with reduced motion.
 */
function SkillCarousel() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [round, setRound] = useState(0); // restarts the progress bar after a pause
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const visible = useInView(trackRef, { amount: 0.5 });
  const total = skillCategories.length;
  const running = visible && !paused; // reduced motion: see the auto-advance effect and the CSS

  useEffect(() => () => {
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
  }, []);

  const onScroll = useCallback(() => {
    const track = trackRef.current;
    const first = track?.firstElementChild as HTMLElement | null;
    if (!track || !first) return;
    const step = first.offsetWidth + parseFloat(getComputedStyle(track).columnGap || "0");
    setActive(Math.max(0, Math.min(total - 1, Math.round(track.scrollLeft / step))));
  }, [total]);

  const goTo = useCallback((i: number) => {
    const track = trackRef.current;
    const card = track?.children[i] as HTMLElement | undefined;
    if (!track || !card) return;
    const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    track.scrollTo({ left: card.offsetLeft - (track.clientWidth - card.offsetWidth) / 2, behavior: smooth ? "smooth" : "auto" });
  }, []);

  // A touch, swipe or tap pauses the auto-advance; it picks up again after a quiet moment.
  const pause = useCallback(() => {
    setPaused(true);
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
    resumeTimer.current = setTimeout(() => {
      setPaused(false);
      setRound((r) => r + 1);
    }, RESUME_MS);
  }, []);

  // Auto-advance, looping back to the first card.
  useEffect(() => {
    if (!running || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setTimeout(() => goTo((active + 1) % total), AUTO_MS);
    return () => clearTimeout(t);
  }, [running, active, round, total, goTo]);

  // Softer coverflow than Featured: tilt, size and fade follow each card's distance from center.
  useEffect(() => {
    const track = trackRef.current;
    if (!track || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      for (const slide of [...track.children] as HTMLElement[]) {
        const center = slide.offsetLeft - track.scrollLeft + slide.offsetWidth / 2;
        const c = Math.max(-1, Math.min(1, (center - track.clientWidth / 2) / slide.offsetWidth));
        const a = Math.abs(c);
        slide.style.transform = `perspective(900px) rotateY(${(-c * 10).toFixed(2)}deg) scale(${(1 - 0.08 * a).toFixed(3)})`;
        slide.style.opacity = (1 - 0.45 * a).toFixed(3);
      }
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    track.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      track.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, []);

  return (
    <div className="sm:hidden">
      <motion.div
        ref={trackRef}
        onScroll={onScroll}
        onPointerDown={pause}
        onTouchStart={pause}
        onFocusCapture={pause}
        variants={staggerContainer(0.08)}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        role="region"
        aria-roledescription="carousel"
        aria-label="Skills by area"
        // Side padding centers the first and last cards; -my/py gives the glow room (rows clip vertically).
        className="featured-track -mx-6 -my-6 flex snap-x snap-mandatory gap-3 overflow-x-auto px-[11vw] py-6"
      >
        {skillCategories.map((c, i) => (
          <CategoryCard key={c} category={c} slide={{ index: i, total }} isActive={i === active} />
        ))}
      </motion.div>

      {/* Dots: the active one fills up until the next move; tap any to jump. */}
      <div className="mt-3 flex items-center justify-center gap-1.5">
        {skillCategories.map((c, i) => (
          <button
            key={c}
            type="button"
            onClick={() => {
              pause();
              goTo(i);
            }}
            aria-label={`Show ${c} (${i + 1} of ${total})`}
            aria-current={i === active}
            className="flex h-6 items-center px-0.5"
          >
            <span
              className={`relative block h-1.5 overflow-hidden rounded-full bg-white/20 transition-all duration-300 ${
                i === active ? "w-7" : "w-1.5"
              }`}
            >
              {i === active && (
                <span
                  key={`${active}-${round}-${running}`}
                  className={`absolute inset-y-0 left-0 rounded-full bg-primary ${running ? "skill-progress" : "w-full"}`}
                  style={running ? { animationDuration: `${AUTO_MS}ms` } : undefined}
                />
              )}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * Decorative logo strip (laptop/tablet): rows of skill logos gliding slowly in opposite directions
 * (CSS only), paused off-screen and on hover. Every few seconds one logo glitches briefly.
 */
function SkillStrip() {
  const ref = useRef<HTMLDivElement>(null);
  const visible = useInView(ref, { amount: 0.1 });
  const half = Math.ceil(skills.length / 2);
  const rows = [skills.slice(0, half), skills.slice(half)];

  // Occasional glitch on a random visible logo (only while the strip is on screen).
  useEffect(() => {
    const el = ref.current;
    if (!el || !visible || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => {
      const items = [...el.querySelectorAll<HTMLElement>(".strip-item")].filter((i) => {
        const r = i.getBoundingClientRect();
        return r.right > 0 && r.left < window.innerWidth && i.offsetParent !== null;
      });
      const pick = items[Math.floor(Math.random() * items.length)];
      if (!pick) return;
      pick.classList.add("is-glitch");
      setTimeout(() => pick.classList.remove("is-glitch"), 450);
    }, 2600);
    return () => clearInterval(id);
  }, [visible]);

  return (
    <div ref={ref} className="skill-strip mb-8 hidden space-y-3 sm:block" data-paused={!visible} aria-hidden>
      {rows.map((row, r) => (
        <div key={r} className="strip-row">
          <div className={`strip-track ${r === 1 ? "is-reverse" : ""}`}>
            {/* The list twice, so the loop is seamless. */}
            {[...row, ...row].map((s, i) => (
              <span key={`${s.name}-${i}`} className="strip-item" title={s.name}>
                <SkillIcon name={s.name} />
                <span className="strip-name">{s.name}</span>
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Skills() {
  return (
    <section id="skills" className="section-padding relative">
      <div className="section-container">
        <SectionHeading
          eyebrow="What I work with"
          title="Skills & Technologies"
          description="Grouped by area, with where I've actually used each one."
        />

        <SkillStrip />

        <motion.div
          variants={staggerContainer(0.06)}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.1 }}
          className="hidden grid-cols-2 gap-4 sm:grid lg:grid-cols-4"
        >
          {skillCategories.map((c) => (
            <CategoryCard key={c} category={c} />
          ))}
        </motion.div>

        <SkillCarousel />

        <p className="mt-5 text-center font-mono text-[11px] text-text-secondary">
          <span className="text-primary">●</span> used in a project · <span className="text-text-muted">○</span> coursework ·{" "}
          {skills.length} skills · <span className="sm:hidden">swipe or tap a skill</span>
          <span className="hidden sm:inline">hover or tap a skill to see where it&apos;s used</span>
        </p>
      </div>
    </section>
  );
}
