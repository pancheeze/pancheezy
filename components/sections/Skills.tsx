"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { Code2, Network } from "lucide-react";
import SectionHeading from "@/components/ui/SectionHeading";
import { useDecrypt } from "@/components/ui/ProjectFolder";
import { projects, skillCategories, skills } from "@/lib/data";
import { skillIcons } from "@/lib/skillIcons";
import { EASE, staggerContainer } from "@/lib/utils";

// Skills as a bento grid of category cards. Each skill chip shows where it was used: skills
// backed by a project glow (●), coursework-only ones stay dim (○). Hover/tap a chip to see
// "used in: ..." under its card. Evidence comes from the projects' tech lists in lib/data.ts.

type Category = (typeof skillCategories)[number];

const CARD: Record<Category, { folder: string; accent: string; span: string }> = {
  // Spans are chosen so the cards tile: 2 columns on phones, 4 on large screens.
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

function usedIn(skill: string): string | null {
  if (OTHER_EVIDENCE[skill]) return OTHER_EVIDENCE[skill];
  const names = ALIASES[skill] ?? [skill.toLowerCase()];
  const hits = projects.filter((p) => [...p.tech, ...p.detail.stack].some((t) => names.includes(normalize(t))));
  return hits.length ? hits.map((p) => p.name).join(", ") : null;
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

function CategoryCard({ category }: { category: Category }) {
  const { folder, accent, span } = CARD[category];
  const items = skills.filter((s) => s.category === category).map((s) => ({ ...s, used: usedIn(s.name) }));
  const [title, decrypt] = useDecrypt(`${folder}/`);
  const [active, setActive] = useState<string | null>(null);
  const activeItem = items.find((s) => s.name === active);
  const cardRef = useRef<HTMLDivElement>(null);
  const seen = useInView(cardRef, { once: true, amount: 0.4 });

  useEffect(() => {
    if (seen) decrypt();
  }, [seen, decrypt]);

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
    <motion.div variants={cardVariants} className={span}>
      <div
        ref={cardRef}
        onMouseEnter={decrypt}
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
        className="skill-card glass-card group relative flex h-full flex-col overflow-hidden p-3.5 sm:p-5"
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
              className={`skill-chip ${s.used ? "is-used" : "is-coursework"} ${active === s.name ? "is-active" : ""}`}
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
            {activeItem.used ? `used in: ${activeItem.used}` : "coursework (not in a project yet)"}
          </span>
        )}
      </p>
      </div>
    </motion.div>
  );
}

/**
 * Decorative logo strip: rows of skill logos gliding slowly in opposite directions (CSS only),
 * paused off-screen and on hover. Every few seconds one logo glitches briefly. One row on phones.
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
    <div ref={ref} className="skill-strip mb-8 space-y-3" data-paused={!visible} aria-hidden>
      {rows.map((row, r) => (
        <div key={r} className={`strip-row ${r === 1 ? "hidden md:block" : ""}`}>
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
          className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4"
        >
          {skillCategories.map((c) => (
            <CategoryCard key={c} category={c} />
          ))}
        </motion.div>

        <p className="mt-5 text-center font-mono text-[11px] text-text-secondary">
          <span className="text-primary">●</span> used in a project · <span className="text-text-muted">○</span> coursework ·{" "}
          {skills.length} skills · hover or tap a skill to see where it&apos;s used
        </p>
      </div>
    </section>
  );
}
