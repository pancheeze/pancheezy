"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { Code2, Network } from "lucide-react";
import SectionHeading from "@/components/ui/SectionHeading";
import { useDecrypt } from "@/components/ui/ProjectFolder";
import { projects, skillCategories, skills } from "@/lib/data";
import type { Project } from "@/lib/types";
import { skillIcons } from "@/lib/skillIcons";
import { EASE, staggerContainer } from "@/lib/utils";

// Skills grouped by area. Each skill chip shows where it was used: skills backed by a project glow
// (●), coursework-only ones stay dim (○). Hover/tap a chip to see "used in: ..." with links to those
// projects. Evidence comes from the projects' tech lists in lib/data.ts.
// Laptop/tablet: a bento grid of cards under a slow logo strip.
// Phones: the skills as code in a terminal window, drifting past a blinking cursor.

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

/** A category's skills with their evidence, plus every project the category was used in. */
function categoryData(category: Category) {
  const items = skills.filter((s) => s.category === category).map((s) => ({ ...s, ev: evidenceFor(s.name) }));
  const allProjects = [...new Map(items.flatMap((s) => s.ev?.projects ?? []).map((p) => [p.slug, p])).values()];
  const note = items.find((s) => s.ev?.note)?.ev?.note;
  return { items, allProjects, note };
}
type Item = ReturnType<typeof categoryData>["items"][number];

/** "ChickDetect, SiliScan" with each project linking to its page. */
function ProjectLinks({ list, accent, tabbable = true }: { list: Project[]; accent: string; tabbable?: boolean }) {
  return (
    <>
      {list.map((p, i) => (
        <span key={p.slug}>
          {i > 0 && ", "}
          <Link
            href={`/projects/${p.slug}`}
            tabIndex={tabbable ? undefined : -1}
            className="underline underline-offset-2 transition-colors hover:text-white"
            style={{ textDecorationColor: `${accent}66` }}
          >
            {p.name}
          </Link>
        </span>
      ))}
    </>
  );
}

/** "used in: ..." for one skill. */
function UsedIn({ item, accent, tabbable }: { item: Item; accent: string; tabbable?: boolean }) {
  if (item.ev?.note) return <>used in: {item.ev.note}</>;
  if (item.ev) {
    return (
      <>
        used in: <ProjectLinks list={item.ev.projects} accent={accent} tabbable={tabbable} />
      </>
    );
  }
  return <>{item.name}: coursework (not in a project yet)</>;
}

function SkillIcon({ name, size = 15 }: { name: string; size?: number }) {
  const path = skillIcons[name];
  if (path) {
    return (
      <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden>
        <path d={path} />
      </svg>
    );
  }
  return name === "REST APIs" ? <Network size={size} aria-hidden /> : <Code2 size={size} aria-hidden />;
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

/** Laptop/tablet bento card. */
function CategoryCard({ category }: { category: Category }) {
  const { folder, accent, span } = CARD[category];
  const { items } = categoryData(category);
  const [title, decrypt] = useDecrypt(`${folder}/`);
  const [active, setActive] = useState<string | null>(null);
  const activeItem = items.find((s) => s.name === active);
  const cardRef = useRef<HTMLDivElement>(null);
  const seen = useInView(cardRef, { once: true, amount: 0.4 });

  useEffect(() => {
    if (seen) decrypt();
  }, [seen, decrypt]);

  // A glow follows the cursor inside the card and the card tilts slightly toward it (mouse only).
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
    <motion.div variants={cardVariants} className={span}>
      <div
        ref={cardRef}
        onMouseEnter={decrypt}
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
        className="skill-card glass-card group relative flex h-full flex-col overflow-hidden p-5"
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
          {items.map((s) => (
            <motion.li key={s.name} variants={chipVariants}>
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

        {/* "used in" line, only while a chip is hovered/tapped (keeps the cards compact). */}
        <p id={`used-${folder}`} className="relative font-mono text-[11px] leading-snug text-text-secondary" aria-live="polite">
          {activeItem && (
            <span className="mt-3 block">
              <span style={{ color: accent }}>↳ </span>
              <UsedIn item={activeItem} accent={accent} />
            </span>
          )}
        </p>
      </div>
    </motion.div>
  );
}

/** A skill as a code string, e.g. "Python". Scrambles into place when its line boots. */
function SkillString({
  item,
  boot,
  clone,
  selected,
  onPick,
}: {
  item: Item;
  boot: number;
  clone: boolean;
  selected: boolean;
  onPick: () => void;
}) {
  const [shown, decrypt] = useDecrypt(`"${item.name}"`);
  useEffect(() => {
    if (boot) decrypt();
  }, [boot, decrypt]);
  return (
    <>
      <button
        type="button"
        tabIndex={clone ? -1 : undefined}
        onClick={onPick}
        aria-pressed={clone ? undefined : selected}
        aria-label={clone ? undefined : `${item.name}: where it's used`}
        className={`code-str ${item.ev ? "" : "is-coursework"} ${selected ? "is-selected" : ""}`}
      >
        {shown}
      </button>
      {!item.ev && <span className="code-comment">{" /* coursework */"}</span>}
    </>
  );
}

/**
 * One area as a line of code: const frontend = ["HTML", "CSS", ...];
 * SkillTerminal marks the line under the cursor with data-lit and fires "skill:lit" on it,
 * which decrypts the line from glyphs.
 */
function CodeLine({
  category,
  clone,
  selectedSkill,
  onPick,
}: {
  category: Category;
  clone: boolean;
  selectedSkill: string | null;
  onPick: (category: Category, skill: string) => void;
}) {
  const { folder } = CARD[category];
  const { items } = categoryData(category);
  const [name, decrypt] = useDecrypt(folder);
  const [boot, setBoot] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onLit = () => {
      decrypt();
      setBoot((b) => b + 1);
    };
    el.addEventListener("skill:lit", onLit);
    return () => el.removeEventListener("skill:lit", onLit);
  }, [decrypt]);

  return (
    <span ref={ref} data-code-line data-category={category} className="code-line" aria-hidden={clone || undefined}>
      <span className="code-kw">const </span>
      <span className="code-name">{name}</span>
      <span className="code-punc"> = [</span>
      {items.map((s, i) => (
        <span key={s.name}>
          {i > 0 && <span className="code-punc">, </span>}
          <SkillString
            item={s}
            boot={boot}
            clone={clone}
            selected={selectedSkill === s.name}
            onPick={() => onPick(category, s.name)}
          />
        </span>
      ))}
      <span className="code-punc">];</span>
    </span>
  );
}

const DRIFT_PX_PER_S = 36; // drift speed
const IDLE_MS = 4000; // after a touch/swipe, wait this long before drifting again

/**
 * Phones: the skills as code in a terminal window. One long line of code drifts slowly past a
 * blinking cursor in the middle; the line under the cursor decrypts from glyphs and lights up in
 * syntax colors, and the comment below types out where those skills were used. Tap a skill for
 * just that one. Touch stops the drift (swipe by hand, with native momentum); it drifts again after
 * a quiet moment. Three copies of the code make the loop seamless. Only runs while on screen; with
 * reduced motion it's a still, swipeable line.
 */
function SkillTerminal() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [lit, setLit] = useState<Category | null>(null);
  const [picked, setPicked] = useState<{ category: Category; skill: string } | null>(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const sets = track.querySelectorAll<HTMLElement>("[data-set]");
    const lines = [...track.querySelectorAll<HTMLElement>("[data-code-line]")];
    const setWidth = () => sets[1].offsetLeft - sets[0].offsetLeft;

    let pos = setWidth(); // start on the middle copy
    track.scrollLeft = pos;
    let frame = 0;
    let last = 0;
    let touching = false;
    let idleUntil = 0;
    let current: HTMLElement | null = null;

    // Keep the view on the middle copy; the copies are identical, so the jump can't be seen.
    const wrap = () => {
      const w = setWidth();
      if (track.scrollLeft >= 2 * w) track.scrollLeft -= w;
      else if (track.scrollLeft < w - track.clientWidth / 2) track.scrollLeft += w;
    };

    // Light the line under the cursor (the middle of the track).
    const scan = () => {
      const mid = track.scrollLeft + track.clientWidth / 2;
      const hit = lines.find((l) => mid >= l.offsetLeft - 12 && mid < l.offsetLeft + l.offsetWidth + 12) ?? current;
      if (hit === current) return;
      current?.removeAttribute("data-lit");
      hit?.setAttribute("data-lit", "");
      hit?.dispatchEvent(new Event("skill:lit"));
      current = hit;
      setLit((hit?.dataset.category as Category) ?? null);
    };

    const tick = (now: number) => {
      const dt = last ? Math.min(64, now - last) : 16;
      last = now;
      if (!reduce && !touching && now > idleUntil) {
        pos += (DRIFT_PX_PER_S * dt) / 1000;
        const w = setWidth();
        if (pos >= 2 * w) pos -= w;
        track.scrollLeft = pos;
      } else {
        pos = track.scrollLeft;
      }
      scan();
      frame = requestAnimationFrame(tick);
    };
    const start = () => {
      if (!frame) {
        last = 0;
        frame = requestAnimationFrame(tick);
      }
    };
    const stop = () => {
      cancelAnimationFrame(frame);
      frame = 0;
    };

    // Only animate while the terminal is on screen.
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop()), { threshold: 0.1 });
    io.observe(track);

    const hold = () => {
      touching = true;
    };
    const release = () => {
      if (!touching) return;
      touching = false;
      idleUntil = performance.now() + IDLE_MS;
    };
    const onScroll = () => {
      if (touching || performance.now() < idleUntil) {
        idleUntil = Math.max(idleUntil, performance.now() + IDLE_MS); // momentum keeps it paused
        wrap();
      }
      if (!frame) scan();
    };
    const onWheel = () => {
      idleUntil = performance.now() + IDLE_MS;
    };
    const onFocus = (e: FocusEvent) => {
      // Keyboard users: hold still while they read (a tap also focuses the button; that's not this).
      if ((e.target as HTMLElement).matches(":focus-visible")) idleUntil = performance.now() + 10_000;
    };

    track.addEventListener("pointerdown", hold);
    track.addEventListener("touchstart", hold, { passive: true });
    window.addEventListener("pointerup", release);
    window.addEventListener("touchend", release);
    window.addEventListener("pointercancel", release);
    track.addEventListener("wheel", onWheel, { passive: true });
    track.addEventListener("scroll", onScroll, { passive: true });
    track.addEventListener("focusin", onFocus);
    scan();

    return () => {
      stop();
      io.disconnect();
      track.removeEventListener("pointerdown", hold);
      track.removeEventListener("touchstart", hold);
      window.removeEventListener("pointerup", release);
      window.removeEventListener("touchend", release);
      window.removeEventListener("pointercancel", release);
      track.removeEventListener("wheel", onWheel);
      track.removeEventListener("scroll", onScroll);
      track.removeEventListener("focusin", onFocus);
    };
  }, []);

  // A picked skill only stays picked while its line is the one under the cursor.
  const pick = picked && picked.category === lit ? picked : null;
  const onPick = (category: Category, skill: string) =>
    setPicked((p) => (p && p.category === category && p.skill === skill ? null : { category, skill }));

  // The comment line under the code: the picked skill, or the whole line under the cursor.
  let comment: React.ReactNode = null;
  let commentKey = "none";
  if (lit) {
    const { accent } = CARD[lit];
    const { items, allProjects, note } = categoryData(lit);
    const item = pick ? items.find((s) => s.name === pick.skill) : undefined;
    if (item) {
      commentKey = `${lit}-${item.name}`;
      comment = (
        <>
          {item.name} → <UsedIn item={item} accent={accent} />
        </>
      );
    } else {
      commentKey = lit;
      comment = allProjects.length ? (
        <>
          used in: <ProjectLinks list={allProjects.slice(0, 3)} accent={accent} />
          {allProjects.length > 3 && ` +${allProjects.length - 3}`}
        </>
      ) : (
        <>used in: {note ?? "coursework"}</>
      );
    }
  }

  return (
    <div className="skill-term glass-card overflow-hidden sm:hidden">
      <div className="flex items-center gap-1.5 border-b border-white/[0.06] px-3.5 py-2.5" aria-hidden>
        <span className="h-2.5 w-2.5 rounded-full bg-[#E58A8A]/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#ECA35F]/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#7FA88B]/70" />
        <span className="ml-2 font-mono text-[11px] text-text-muted">~/skills — zsh</span>
      </div>

      <div className="py-3 font-mono text-[12px]">
        <p className="px-3.5 text-text-secondary">
          <span className="text-primary">$</span> cat stack.ts
        </p>

        <div className="relative mt-2.5">
          <span className="code-cursor" aria-hidden />
          <div ref={trackRef} role="region" aria-label="Skills by area, as code" className="code-track featured-track overflow-x-auto">
            <div className="flex w-max items-center whitespace-nowrap py-1.5">
              {[0, 1, 2].map((copy) => (
                <span key={copy} data-set className="flex shrink-0 items-center">
                  {skillCategories.map((c) => (
                    <CodeLine
                      key={c}
                      category={c}
                      clone={copy !== 1}
                      selectedSkill={pick && pick.category === c ? pick.skill : null}
                      onPick={onPick}
                    />
                  ))}
                </span>
              ))}
            </div>
          </div>
        </div>

        <p className="mt-2.5 truncate px-3.5 text-[11px] leading-snug text-text-secondary" aria-live="polite">
          <span key={commentKey} className="code-typed">
            <span className="text-text-muted">{"// "}</span>
            {comment}
          </span>
        </p>
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

        <SkillTerminal />

        <p className="mt-5 text-center font-mono text-[11px] text-text-secondary">
          <span className="text-primary">●</span> used in a project · <span className="text-text-muted">○</span> coursework ·{" "}
          {skills.length} skills · <span className="sm:hidden">touch to pause, tap a skill</span>
          <span className="hidden sm:inline">hover or tap a skill to see where it&apos;s used</span>
        </p>
      </div>
    </section>
  );
}
