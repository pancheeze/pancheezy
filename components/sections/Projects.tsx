"use client";

import { motion } from "framer-motion";
import SectionHeading from "@/components/ui/SectionHeading";
import ProjectCard from "@/components/ui/ProjectCard";
import GitHubActivity from "@/components/ui/GitHubActivity";
import { profile, projects } from "@/lib/data";
import type { ContributionCalendar } from "@/lib/github";
import { staggerContainer } from "@/lib/utils";

export default function Projects({ activity }: { activity?: ContributionCalendar | null }) {
  return (
    <section id="projects" className="section-padding relative">
      <div className="section-container">
        <SectionHeading
          eyebrow="Selected work"
          title="Projects"
          description="A few things I've built, from web apps to games."
        />

        <motion.div
          variants={staggerContainer(0.15)}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.1 }}
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {projects.map((project, i) => (
            <ProjectCard key={project.slug} project={project} index={i} />
          ))}
        </motion.div>

        {activity && <GitHubActivity data={activity} profileUrl={profile.github} />}
      </div>
    </section>
  );
}
