"use client";

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

export default function Projects({ activity }: { activity?: ContributionCalendar | null }) {
  return (
    <section id="projects" className="section-padding relative">
      <div className="section-container">
        <SectionHeading
          eyebrow="Selected work"
          title="Projects"
          description="Projects I led or built end to end: what I did, the hard parts, and the results."
        />

        <h3 className="mb-5 font-mono text-sm uppercase tracking-[0.2em] text-text-secondary">Featured projects</h3>
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
            {/* Smaller projects in folders by type of work; hover peeks, click opens. */}
            <ProjectFolders projects={more} />
          </motion.div>
        )}

        {activity && <GitHubActivity data={activity} profileUrl={profile.github} />}
      </div>
    </section>
  );
}
