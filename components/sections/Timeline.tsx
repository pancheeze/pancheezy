"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion, useScroll, useSpring, useTransform, type MotionValue } from "framer-motion";
import { Briefcase, GraduationCap, Building2 } from "lucide-react";
import SectionHeading from "@/components/ui/SectionHeading";
import { timeline } from "@/lib/data";
import { fadeUp } from "@/lib/utils";

const icons = {
  graduation: GraduationCap,
  briefcase: Briefcase,
  university: Building2,
};

// The tip of the growing line is a short column of scrambling glyphs (same set as DecryptText);
// above it the "decrypted" part is the solid gradient line.
const HEAD = 72; // px
const HEAD_GLYPHS = 8;
const GLYPHS = "!<>-_\\/[]{}=+*^?#%&$@01";
const randomGlyph = () => GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
// Head length at progress v: full while drawing, shrinking to 0 over the last 10% so the solid
// line finishes all the way down.
const headLength = (v: number) => HEAD * Math.min(1, Math.max(0, (1 - v) / 0.1));

function DecryptingHead({ progress }: { progress: MotionValue<number> }) {
  // Fixed first render so server and client markup match; scrambling starts on the client.
  const [glyphs, setGlyphs] = useState(() => Array.from({ length: HEAD_GLYPHS }, () => "0"));

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;
    let idle: ReturnType<typeof setTimeout> | undefined;
    const tick = () => setGlyphs(Array.from({ length: HEAD_GLYPHS }, randomGlyph));
    // Scramble only while the line is moving; it pauses shortly after scrolling stops.
    const unsubscribe = progress.on("change", () => {
      if (!timer) timer = setInterval(tick, 70);
      clearTimeout(idle);
      idle = setTimeout(() => {
        clearInterval(timer);
        timer = undefined;
      }, 350);
    });
    return () => {
      unsubscribe();
      clearInterval(timer);
      clearTimeout(idle);
    };
  }, [progress]);

  // Sits just below the solid line; shrinks near the start so it never pokes above the timeline.
  const top = useTransform(progress, (v) => `max(0px, calc(${v * 100}% - ${headLength(v)}px))`);
  const height = useTransform(progress, (v) => `min(${headLength(v)}px, ${v * 100}%)`);
  const opacity = useTransform(progress, [0, 0.02], [0, 1]);

  return (
    <motion.div
      aria-hidden
      style={{ top, height, opacity }}
      className="pointer-events-none absolute left-5 flex w-3 -translate-x-1/2 flex-col items-center justify-end overflow-hidden font-mono text-[11px] font-bold leading-[9px] sm:left-1/2"
    >
      {glyphs.map((g, i) => (
        <span
          key={i}
          // Dim where the glyphs settle into the line, brightest at the leading tip.
          style={{ opacity: 0.3 + (0.7 * (i + 1)) / HEAD_GLYPHS }}
          className={i === HEAD_GLYPHS - 1 ? "text-primary" : "text-secondary"}
        >
          {g}
        </span>
      ))}
    </motion.div>
  );
}

export default function Timeline() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 80%", "end 60%"],
  });
  const lineProgress = useSpring(scrollYProgress, {
    stiffness: 90,
    damping: 24,
  });
  const reduceMotion = useReducedMotion();
  // The solid line stops where the decrypting head begins (reduced motion: plain line, no head).
  const solidHeight = useTransform(lineProgress, (v) =>
    reduceMotion ? `${v * 100}%` : `max(0px, calc(${v * 100}% - ${headLength(v)}px))`,
  );

  return (
    <section id="journey" className="section-padding relative">
      <div className="section-container">
        <SectionHeading
          eyebrow="My path so far"
          title="Journey Timeline"
          description="My education and experience so far."
        />

        <div ref={containerRef} className="relative mx-auto max-w-3xl">
          <div className="absolute left-5 top-0 h-full w-px bg-white/10 sm:left-1/2 sm:-translate-x-1/2" />
          <motion.div
            style={{ height: solidHeight }}
            className="absolute left-5 top-0 w-px bg-[linear-gradient(180deg,#ECA35F,#7FA88B,#7AA5C4)] sm:left-1/2 sm:-translate-x-1/2"
          />
          {!reduceMotion && <DecryptingHead progress={lineProgress} />}

          <div className="flex flex-col gap-14">
            {timeline.map((item, index) => {
              const Icon = icons[item.icon];
              const isEven = index % 2 === 0;
              return (
                <motion.div
                  key={item.id}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true, amount: 0.4 }}
                  variants={fadeUp}
                  className="relative flex flex-col gap-4 pl-14 sm:grid sm:grid-cols-2 sm:gap-10 sm:pl-0"
                >
                  <span
                    className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-surface text-primary shadow-glow sm:left-1/2 sm:-translate-x-1/2"
                  >
                    <Icon size={18} />
                  </span>

                  <div
                    className={`glass-card p-6 sm:mt-0 ${
                      isEven ? "sm:mr-8 sm:text-right" : "sm:order-2 sm:ml-8"
                    }`}
                  >
                    <span className="eyebrow !text-[10px]">
                      {item.period}
                      {item.duration ? ` · ${item.duration}` : ""}
                    </span>
                    <h3 className="mt-2 text-lg font-bold text-white">{item.title}</h3>
                    {item.org && (
                      <p className="mt-1 text-sm font-medium text-secondary">
                        {item.org}
                      </p>
                    )}
                    <p className="mt-3 text-sm leading-relaxed text-text-secondary">
                      {item.description}
                    </p>
                    <div
                      className={`mt-4 flex flex-wrap gap-2 ${
                        isEven ? "sm:justify-end" : ""
                      }`}
                    >
                      {item.skills.map((skill) => (
                        <span
                          key={skill}
                          className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[11px] text-text-secondary"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="hidden sm:block" aria-hidden />
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
