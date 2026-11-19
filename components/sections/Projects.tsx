"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import SectionHeading from "@/components/ui/SectionHeading";
import ProjectCard from "@/components/ui/ProjectCard";
import GitHubActivity from "@/components/ui/GitHubActivity";
import { profile, projects } from "@/lib/data";
import type { ContributionCalendar } from "@/lib/github";
import { fadeUp, staggerContainer } from "@/lib/utils";

// Featured projects get large cards; everything else is a compact list underneath,
// so the strongest work sets the first impression.
const featured = projects.filter((p) => p.featured);
const more = projects.filter((p) => !p.featured);

export default function Projects({ activity }: { activity?: ContributionCalendar | null }) {
  return (
    <section id="projects" className="section-padding relative">
      <div className="section-container">
        <SectionHeading
          eyebrow="Selected work"
          title="Projects"
          description="Projects I led or built end to end: what I did, the hard parts, and the results."
        />

        <motion.div
          variants={staggerContainer(0.15)}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.1 }}
          className="grid grid-cols-1 gap-6 md:grid-cols-2"
        >
          {featured.map((project, i) => (
            <ProjectCard key={project.slug} project={project} index={i} />
          ))}
        </motion.div>

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
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {more.map((project) => (
                <motion.li key={project.slug} variants={fadeUp}>
                  <Link
                    href={`/projects/${project.slug}`}
                    className="glass-card group flex h-full items-start justify-between gap-4 p-4 transition-colors hover:border-primary/40"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-white transition-colors group-hover:text-primary">{project.name}</p>
                      <p className="mt-0.5 text-xs text-text-secondary">{project.category}</p>
                      <p className="mt-2 line-clamp-2 text-sm text-text-secondary">{project.description}</p>
                    </div>
                    <ArrowUpRight
                      size={18}
                      className="mt-0.5 shrink-0 text-text-muted transition-colors group-hover:text-primary"
                      aria-hidden
                    />
                  </Link>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        )}

        {activity && <GitHubActivity data={activity} profileUrl={profile.github} />}
      </div>
    </section>
  );
}
