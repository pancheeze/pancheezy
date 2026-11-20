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
// Phones: a terminal window: area names drift past a blinking cursor, the current area shows as code.

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

/** A skill as a code string, e.g. "Python". Scrambles into place each time its block boots. */
function SkillString({
  item,
  boot,
  selected,
  onPick,
  last,
}: {
  item: Item;
  boot: number;
  selected: boolean;
  onPick: () => void;
  last: boolean;
}) {
  const [shown, decrypt] = useDecrypt(`"${item.name}"`);
  useEffect(() => {
    if (boot) decrypt();
  }, [boot, decrypt]);
  return (
    <span className="whitespace-nowrap">
      <button
        type="button"
        onClick={onPick}
        aria-pressed={selected}
        aria-label={`${item.name}: where it's used`}
        className={`code-str ${item.ev ? "" : "is-coursework"} ${selected ? "is-selected" : ""}`}
      >
        {shown}
      </button>
      {!item.ev && <span className="code-comment">{" /* coursework */"}</span>}
      {!last && <span className="code-punc">,</span>}{" "}
    </span>
  );
}

/**
 * One area as formatted code. All seven are stacked in the same spot (so the terminal keeps the
 * height of the tallest and nothing below it jumps); only the current one is visible. Each time it
 * becomes current, its name and strings decrypt from glyphs.
 */
function CodeBlock({
  category,
  current,
  selectedSkill,
  onPick,
}: {
  category: Category;
  current: boolean;
  selectedSkill: string | null;
  onPick: (skill: string) => void;
}) {
  const { folder, accent } = CARD[category];
  const { items, allProjects, note } = categoryData(category);
  const [name, decrypt] = useDecrypt(folder);
  const [boot, setBoot] = useState(0);

  useEffect(() => {
    if (!current) return;
    decrypt();
    setBoot((b) => b + 1); // eslint-disable-line react-hooks/set-state-in-effect -- re-run the strings' decrypt
  }, [current, decrypt]);

  return (
    <div className={`code-block ${current ? "is-current" : ""}`} aria-hidden={!current || undefined}>
      <p>
        <span className="code-kw">const </span>
        <span className="code-name">{name}</span>
        <span className="code-punc"> = [</span>
      </p>
      <p className="pl-4">
        {items.map((s, i) => (
          <SkillString
            key={s.name}
            item={s}
            boot={boot}
            selected={selectedSkill === s.name}
            onPick={() => onPick(s.name)}
            last={i === items.length - 1}
          />
        ))}
      </p>
      <p>
        <span className="code-punc">];</span>
      </p>
      <p className="mt-1 truncate text-[11px] text-text-secondary">
        <span className="code-comment">{"// "}</span>
        {allProjects.length ? (
          <>
            used in: <ProjectLinks list={allProjects.slice(0, 2)} accent={accent} />
            {allProjects.length > 2 && <span className="text-text-muted"> +{allProjects.length - 2}</span>}
          </>
        ) : (
          <>used in: {note ?? "coursework"}</>
        )}
      </p>
    </div>
  );
}

const DRIFT_PX_PER_S = 36; // drift speed of the names row
const DWELL_MS = 1500; // a name rests under the cursor this long before drifting on
const IDLE_MS = 4000; // after a touch/swipe, wait this long before drifting again

/**
 * Phones: the skills as code in a terminal window. A row of area names drifts slowly past a
 * blinking cursor; the name under it lights up, rests for a moment, and the full code for that area
 * decrypts in below (formatted over a few lines, so it's all readable and holds still for tapping).
 * Tap a skill to see where it was used; tap a name to jump to it. Touch stops the drift (swipe by
 * hand, with native momentum); it drifts again after a quiet moment. Three copies of the names make
 * the loop seamless. Boots once on scroll-in ("$ cat stack.ts" types itself), only runs on screen,
 * and is still with reduced motion.
 */
function SkillTerminal() {
  const termRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const booted = useInView(termRef, { once: true, amount: 0.4 });
  const [lit, setLit] = useState<Category>(skillCategories[0]);
  const [picked, setPicked] = useState<{ category: Category; skill: string } | null>(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const sets = track.querySelectorAll<HTMLElement>("[data-set]");
    const names = [...track.querySelectorAll<HTMLElement>("[data-name]")];
    const setWidth = () => sets[1].offsetLeft - sets[0].offsetLeft;
    const centerOf = (el: HTMLElement) => el.offsetLeft + el.offsetWidth / 2;

    // Start on the middle copy, with the first name under the cursor.
    let pos = centerOf(names[skillCategories.length]) - track.clientWidth / 2;
    track.scrollLeft = pos;
    let frame = 0;
    let last = 0;
    let touching = false;
    let idleUntil = 0;
    let dwellUntil = 0;
    let current: HTMLElement | null = null;

    // Keep the view on the middle copy; the copies are identical, so the jump can't be seen.
    const wrap = () => {
      const w = setWidth();
      if (track.scrollLeft >= 2 * w) track.scrollLeft -= w;
      else if (track.scrollLeft < w - track.clientWidth / 2) track.scrollLeft += w;
    };

    // Light the name nearest the cursor (the middle of the track). Returns true if it changed.
    const scan = () => {
      const mid = track.scrollLeft + track.clientWidth / 2;
      let hit = names[0];
      for (const n of names) if (Math.abs(centerOf(n) - mid) < Math.abs(centerOf(hit) - mid)) hit = n;
      if (hit === current) return false;
      current?.removeAttribute("data-lit");
      hit.setAttribute("data-lit", "");
      current = hit;
      setLit(hit.dataset.name as Category);
      return true;
    };

    const tick = (now: number) => {
      const dt = last ? Math.min(64, now - last) : 16;
      last = now;
      const auto = !reduce && !touching && now > idleUntil;
      if (auto && now > dwellUntil) {
        pos += (DRIFT_PX_PER_S * dt) / 1000;
        const w = setWidth();
        if (pos >= 2 * w) pos -= w;
        track.scrollLeft = pos;
      } else if (!auto) {
        pos = track.scrollLeft;
      }
      // A new name reached the cursor: let it rest there for a moment.
      if (scan() && auto) dwellUntil = now + DWELL_MS;
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
    // Tapping a name brings it to the cursor.
    const onClick = (e: MouseEvent) => {
      const name = (e.target as HTMLElement).closest<HTMLElement>("[data-name]");
      if (!name) return;
      idleUntil = performance.now() + IDLE_MS;
      track.scrollTo({ left: centerOf(name) - track.clientWidth / 2, behavior: reduce ? "auto" : "smooth" });
    };

    track.addEventListener("pointerdown", hold);
    track.addEventListener("touchstart", hold, { passive: true });
    window.addEventListener("pointerup", release);
    window.addEventListener("touchend", release);
    window.addEventListener("pointercancel", release);
    track.addEventListener("wheel", onWheel, { passive: true });
    track.addEventListener("scroll", onScroll, { passive: true });
    track.addEventListener("focusin", onFocus);
    track.addEventListener("click", onClick);
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
      track.removeEventListener("click", onClick);
    };
  }, []);

  // The tapped skill (only while its area is the current one).
  const pick = picked && picked.category === lit ? picked : null;
  const pickedItem = pick ? categoryData(lit).items.find((s) => s.name === pick.skill) : undefined;

  return (
    <div ref={termRef} className="skill-term glass-card overflow-hidden sm:hidden" data-booted={booted || undefined}>
      <div className="flex items-center gap-1.5 border-b border-white/[0.06] px-3.5 py-2.5" aria-hidden>
        <span className="h-2.5 w-2.5 rounded-full bg-[#E58A8A]/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#ECA35F]/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#7FA88B]/70" />
        <span className="ml-2 font-mono text-[11px] text-text-muted">~/skills — zsh</span>
      </div>

      <div className="py-3 font-mono text-[12px] leading-relaxed">
        <p className="px-3.5 text-text-secondary">
          <span className="term-cmd">
            <span className="text-primary">$</span> cat stack.ts
          </span>
        </p>

        <div className="term-body">
          {/* Names row: drifts past the cursor. */}
          <div className="relative mt-2">
            <span className="code-cursor" aria-hidden />
            <div
              ref={trackRef}
              role="group"
              aria-label="Skill areas (tap one to show it)"
              className="code-track featured-track overflow-x-auto"
            >
              <div className="flex w-max items-center whitespace-nowrap py-1">
                {[0, 1, 2].map((copy) => (
                  <span key={copy} data-set className="flex shrink-0 items-center">
                    {skillCategories.map((c) => (
                      <button
                        key={c}
                        type="button"
                        data-name={c}
                        tabIndex={copy === 1 ? undefined : -1}
                        aria-hidden={copy !== 1 || undefined}
                        className="code-tab"
                        style={{ "--folder-accent": CARD[c].accent } as React.CSSProperties}
                      >
                        {CARD[c].folder}
                      </button>
                    ))}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* The current area's code: all stacked in one spot, only the current one shown. */}
          <div className="mx-3.5 mt-2 border-t border-white/[0.06] pt-2.5" aria-live="polite">
            <div className="grid">
              {skillCategories.map((c) => (
                <CodeBlock
                  key={c}
                  category={c}
                  current={c === lit}
                  selectedSkill={pick && pick.category === c ? pick.skill : null}
                  onPick={(skill) =>
                    setPicked((p) => (p && p.category === c && p.skill === skill ? null : { category: c, skill }))
                  }
                />
              ))}
            </div>
            <p className="truncate text-[11px] text-text-secondary">
              <span key={pickedItem ? `${lit}-${pickedItem.name}` : "tip"} className="code-typed">
                <span className="code-comment">{"// "}</span>
                {pickedItem ? (
                  <>
                    {pickedItem.name} → <UsedIn item={pickedItem} accent={CARD[lit].accent} />
                  </>
                ) : (
                  <span className="code-comment">tip: tap a skill to see where it&apos;s used</span>
                )}
              </span>
            </p>
          </div>
        </div>
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

        <p className="mt-5 hidden text-center font-mono text-[11px] text-text-secondary sm:block">
          <span className="text-primary">●</span> used in a project · <span className="text-text-muted">○</span> coursework ·{" "}
          {skills.length} skills · hover or tap a skill to see where it&apos;s used
        </p>
      </div>
    </section>
  );
}
