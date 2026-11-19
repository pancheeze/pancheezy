"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import SectionHeading from "@/components/ui/SectionHeading";
import ProjectCard from "@/components/ui/ProjectCard";
import ProjectFolders from "@/components/ui/ProjectFolder";
import GitHubActivity from "@/components/ui/GitHubActivity";
import { profile, projects } from "@/lib/data";
import type { ContributionCalendar } from "@/lib/github";
import { fadeUp, staggerContainer } from "@/lib/utils";

// Featured projects get large cards; everything else is a compact list underneath,
// so the strongest work sets the first impression.
const featured = projects.filter((p) => p.featured);
const more = projects.filter((p) => !p.featured);

/**
 * Featured projects. Laptops/tablets: a 2-column grid (all four visible at once).
 * Phones: a swipe carousel (one card at a time, the next one peeking in, dots + counter) so the
 * four big cards don't take four screens of scrolling. Nothing moves on its own.
 */
function FeaturedProjects() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  // Which card is centered: from the scroll position (phones only; on the grid it stays 0).
  const onScroll = useCallback(() => {
    const track = trackRef.current;
    const first = track?.firstElementChild as HTMLElement | null;
    if (!track || !first) return;
    const step = first.offsetWidth + parseFloat(getComputedStyle(track).columnGap || "0");
    setActive(Math.max(0, Math.min(featured.length - 1, Math.round(track.scrollLeft / step))));
  }, []);

  // Coverflow feel on phones: each card's size, tilt and opacity follow its distance from the
  // center while swiping, so the centered card is big and the others fall behind. Written straight
  // to the DOM every frame (no React re-renders). Off on the desktop grid and for reduced motion.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;
    const update = () => {
      frame = 0;
      const slides = [...track.children] as HTMLElement[];
      const isCarousel = getComputedStyle(track).display === "flex";
      for (const slide of slides) {
        if (!isCarousel || reduce) {
          slide.style.transform = "";
          slide.style.opacity = "";
          continue;
        }
        const center = slide.offsetLeft - track.scrollLeft + slide.offsetWidth / 2;
        const d = (center - track.clientWidth / 2) / slide.offsetWidth; // 0 = centered, ±1 = one card away
        const c = Math.max(-1, Math.min(1, d)); // cards further than one away look the same as one away
        const a = Math.abs(c);
        slide.style.transform = `perspective(900px) rotateY(${(-c * 16).toFixed(2)}deg) scale(${(1 - 0.12 * a).toFixed(3)})`;
        slide.style.opacity = (1 - 0.5 * a).toFixed(3);
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

  const goTo = (i: number) => {
    const track = trackRef.current;
    const card = track?.children[i] as HTMLElement | undefined;
    if (!track || !card) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    track.scrollTo({ left: card.offsetLeft - track.offsetLeft - (track.clientWidth - card.offsetWidth) / 2, behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <>
      <div className="mb-5 flex items-center justify-between">
        <h3 className="font-mono text-sm uppercase tracking-[0.2em] text-text-secondary">Featured projects</h3>
        <span className="font-mono text-xs text-text-secondary md:hidden" aria-hidden>
          {active + 1} / {featured.length}
        </span>
      </div>

      <motion.div
        ref={trackRef}
        onScroll={onScroll}
        variants={staggerContainer(0.15)}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.1 }}
        role="region"
        aria-roledescription="carousel"
        aria-label="Featured projects"
        // -my-10/py-10: a scrolling row clips vertically too, so this gives the cards' glow and hover
        // lift room above and below without changing the layout.
        className="featured-track -mx-6 -my-10 flex snap-x snap-mandatory scroll-px-6 gap-4 overflow-x-auto px-6 py-10 sm:-mx-8 sm:scroll-px-8 sm:px-8 md:m-0 md:grid md:grid-cols-2 md:gap-6 md:overflow-visible md:p-0"
      >
        {featured.map((project, i) => (
          <div
            key={project.slug}
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${featured.length}: ${project.name}`}
            data-active={i === active}
            className="featured-slide w-[86%] shrink-0 snap-center md:w-auto"
          >
            <ProjectCard project={project} index={i} />
          </div>
        ))}
      </motion.div>

      {/* Dots (phones only): show where you are; tap to jump. */}
      <div className="mt-4 flex justify-center gap-2 md:hidden">
        {featured.map((project, i) => (
          <button
            key={project.slug}
            type="button"
            onClick={() => goTo(i)}
            aria-label={`Show ${project.name} (${i + 1} of ${featured.length})`}
            aria-current={i === active}
            className="flex h-6 items-center px-1"
          >
            <span
              className={`block h-1.5 rounded-full transition-all duration-300 ${
                i === active ? "w-6 bg-primary" : "w-1.5 bg-white/25"
              }`}
            />
          </button>
        ))}
      </div>
    </>
  );
}

export default function Projects({ activity }: { activity?: ContributionCalendar | null }) {
  return (
    <section id="projects" className="section-padding relative">
      <div className="section-container">
        <SectionHeading
          eyebrow="Selected work"
          title="Projects"
          description="Projects I led or built end to end: what I did, the hard parts, and the results."
        />

        <FeaturedProjects />


        {more.length > 0 && (
          <motion.div
            variants={staggerContainer(0.06)}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.1 }}
            className="mt-14"
          >
            <motion.h3 variants={fadeUp} className="mb-5 font-mono text-sm uppercase tracking-[0.2em] text-text-secondary">
              More projects
            </motion.h3>
            {/* Smaller projects in folders by type of work; hover peeks, click opens. */}
            <ProjectFolders projects={more} />
          </motion.div>
        )}

        {activity && <GitHubActivity data={activity} profileUrl={profile.github} />}
      </div>
    </section>
  );
}
