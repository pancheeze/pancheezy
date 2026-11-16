"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import type { ContributionCalendar, ContributionDay } from "@/lib/github";
import { fadeUp } from "@/lib/utils";

// GitHub contribution graph. Squares "decrypt" into place every time the graph
// scrolls into view (down or up): each one flickers as a glyph, then settles.

const GLYPHS = "!<>-_\\/[]{}=+*^?#%&$@01";
const MOBILE_WEEKS = 18; // phones show the last ~4 months (fits a 360px screen)
const STEP_MS = 60;
const COLUMN_DELAY_MS = 16;
const JITTER_MS = 360;

const LEVEL_CLASS = [
  "border border-white/10 bg-white/[0.02]",
  "bg-primary/30",
  "bg-primary/55",
  "bg-primary/80",
  "bg-primary shadow-[0_0_6px_rgba(236,163,95,0.6)]",
];

const formatDate = (date: string) =>
  new Date(`${date}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });

const describe = (d: ContributionDay) =>
  `${formatDate(d.date)} · ${d.count === 0 ? "No" : d.count} contribution${d.count === 1 ? "" : "s"}`;

// Deterministic 0-1 value per cell so the reveal order is stable.
const jitter = (i: number) => {
  const x = Math.sin(i * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};

export default function GitHubActivity({
  data,
  profileUrl,
}: {
  data: ContributionCalendar;
  profileUrl: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  // Start the reveal once the graph is well inside the screen; reset it only once it
  // is fully off screen, so it never blanks out while still partly visible.
  const inView = useInView(ref, { margin: "-15% 0px -15% 0px" });
  const onScreen = useInView(ref);
  const startedRef = useRef(false);
  const reduceMotion = useReducedMotion();
  const [hovered, setHovered] = useState<ContributionDay | null>(null);
  const [elapsed, setElapsed] = useState<number | null>(null); // null = not started

  // Group days into week columns (Sunday first), padding the first week.
  const { weeks, months, lastActive } = useMemo(() => {
    const first = new Date(`${data.days[0].date}T00:00:00Z`).getUTCDay();
    const slots: (ContributionDay | null)[] = [...Array(first).fill(null), ...data.days];
    const cols: (ContributionDay | null)[][] = [];
    for (let i = 0; i < slots.length; i += 7) {
      const week = slots.slice(i, i + 7);
      while (week.length < 7) week.push(null);
      cols.push(week);
    }
    const labels = cols.map((week, i) => {
      const day = week.find(Boolean);
      if (!day) return "";
      const prev = i > 0 ? cols[i - 1].find(Boolean) : null;
      const month = day.date.slice(0, 7);
      if (prev && prev.date.slice(0, 7) === month) return "";
      return new Date(`${day.date}T00:00:00Z`).toLocaleDateString("en-US", {
        month: "short",
        timeZone: "UTC",
      });
    });
    const active = [...data.days].reverse().find((d) => d.count > 0) ?? null;
    return { weeks: cols, months: labels, lastActive: active };
  }, [data]);

  const totalDuration = weeks.length * COLUMN_DELAY_MS + JITTER_MS;
  const done = reduceMotion || (elapsed !== null && elapsed >= totalDuration);

  const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  // Reset while fully off screen so the reveal replays on the next pass.
  useEffect(() => {
    if (!onScreen && !reduceMotion) {
      clearInterval(timerRef.current);
      startedRef.current = false;
      setElapsed(null);
    }
  }, [onScreen, reduceMotion]);

  // Once started, a reveal always runs to the end (no freezing half-way).
  useEffect(() => {
    if (!inView || reduceMotion || startedRef.current) return;
    startedRef.current = true;
    const start = performance.now();
    setElapsed(0);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      const t = performance.now() - start;
      setElapsed(t);
      if (t >= totalDuration) clearInterval(timerRef.current);
    }, STEP_MS);
  }, [inView, reduceMotion, totalDuration]);

  useEffect(() => () => clearInterval(timerRef.current), []);

  const firstMobileWeek = Math.max(0, weeks.length - MOBILE_WEEKS);

  return (
    <motion.div
      ref={ref}
      variants={fadeUp}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.2 }}
      className="glass-card mt-16 p-6 sm:p-8"
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="eyebrow">GitHub Activity</span>
          <p className="mt-2 text-lg font-semibold text-white">
            {data.total.toLocaleString("en-US")} contributions in the last year
          </p>
        </div>
        <a
          href={profileUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-sm text-text-secondary transition-colors hover:text-primary"
        >
          View on GitHub
          <ArrowUpRight size={15} />
        </a>
      </div>

      <div className="mt-6 overflow-hidden">
        <div className="mx-auto w-fit">
          {/* Month labels */}
          <div className="flex gap-[3px] pb-2 text-[10px] text-text-secondary">
            {months.map((label, i) => (
              <div
                key={i}
                className={`w-[11px] shrink-0 overflow-visible whitespace-nowrap sm:w-[14px] ${
                  i < firstMobileWeek ? "hidden sm:block" : ""
                }`}
              >
                {label}
              </div>
            ))}
          </div>

          {/* Weeks */}
          {/* Announced as one image with a summary; the squares are visual only. */}
          <div
            className="flex gap-[3px]"
            role="img"
            aria-label={`GitHub contributions in the last year: ${data.total} total${
              lastActive ? `, last active ${formatDate(lastActive.date)}` : ""
            }`}
            data-activity-graph
          >
            {weeks.map((week, w) => (
              <div
                key={w}
                className={`flex shrink-0 flex-col gap-[3px] ${w < firstMobileWeek ? "hidden sm:flex" : ""}`}
              >
                {week.map((day, d) => {
                  const box = "h-[11px] w-[11px] rounded-[3px] sm:h-[14px] sm:w-[14px]";
                  if (!day) return <div key={d} className={box} />;
                  const index = w * 7 + d;
                  const settleAt = w * COLUMN_DELAY_MS + jitter(index) * JITTER_MS;
                  const revealed = done || (elapsed !== null && elapsed >= settleAt);
                  const started = done || elapsed !== null;
                  return (
                    <div
                      key={d}
                      data-day
                      onMouseEnter={() => setHovered(day)}
                      onMouseLeave={() => setHovered(null)}
                      className={`${box} flex items-center justify-center transition-colors duration-200 ${
                        revealed ? LEVEL_CLASS[day.level] ?? LEVEL_CLASS[0] : ""
                      } ${started ? "" : "opacity-0"} ${
                        revealed ? "hover:ring-1 hover:ring-white/60" : ""
                      }`}
                    >
                      {!revealed && started && (
                        <span className="font-mono text-[9px] leading-none text-primary/70">
                          {GLYPHS[Math.floor(Math.random() * GLYPHS.length)]}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Footer: hover details and legend */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-text-secondary">
            <p className="min-h-[1rem] font-mono">
              {hovered
                ? describe(hovered)
                : lastActive
                  ? `Last active ${formatDate(lastActive.date)}`
                  : "No recent activity"}
            </p>
            <div className="flex items-center gap-[3px]" aria-hidden>
              <span className="mr-1">Less</span>
              {LEVEL_CLASS.map((cls, i) => (
                <span key={i} className={`h-[11px] w-[11px] rounded-[3px] ${cls}`} />
              ))}
              <span className="ml-1">More</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
