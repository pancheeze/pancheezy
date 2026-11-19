"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  ChevronDown,
  GraduationCap,
  MapPin,
  Sparkles,
  Code,
  Layers,
  Smartphone,
  BrainCircuit,
  Palette,
  Terminal,
} from "lucide-react";
import SectionHeading from "@/components/ui/SectionHeading";
import { profile } from "@/lib/data";
import { fadeUp, staggerContainer } from "@/lib/utils";

const interestIcons: Record<string, React.ElementType> = {
  "Full-Stack Web Development": Layers,
  "Mobile Apps": Smartphone,
  "Machine Learning": BrainCircuit,
  "UI Design": Palette,
};

// On phones the section is compact (first paragraph, one info line, interest chips) with a
// "Read more" toggle; from the lg breakpoint up everything is always shown.
export default function About() {
  const education = [profile.degree, profile.start].filter(Boolean).join(" · ");
  const [expanded, setExpanded] = useState(false);
  const mobileExtra = expanded ? "" : "hidden lg:block"; // shown on phones only after "Read more"

  return (
    <section id="about" className="section-padding relative">
      <div className="section-container">
        <SectionHeading
          eyebrow="Get to know me"
          title="About Me"
          description="Full-stack developer in the making: from database to interface."
        />

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-5 lg:gap-16">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            variants={staggerContainer(0.12)}
            className="lg:col-span-3"
          >
            {profile.aboutDescription.map((paragraph, i) => (
              <motion.p
                key={paragraph}
                variants={fadeUp}
                className={`mb-4 text-base leading-relaxed text-text-secondary last:mb-0 sm:text-lg ${i > 0 ? mobileExtra : ""}`}
              >
                {paragraph}
              </motion.p>
            ))}

            {/* Phones: one compact line instead of the three cards below. */}
            {!expanded && (
              <motion.p variants={fadeUp} className="mt-5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-text-secondary lg:hidden">
                <span className="inline-flex items-center gap-1.5">
                  <GraduationCap size={15} className="text-primary" />
                  {profile.degree} · {profile.universityShort}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <MapPin size={15} className="text-secondary" />
                  {profile.location}
                </span>
              </motion.p>
            )}

            <motion.button
              variants={fadeUp}
              type="button"
              onClick={() => setExpanded((v) => !v)}
              aria-expanded={expanded}
              className="mt-4 inline-flex items-center gap-1 font-mono text-sm text-primary transition-colors hover:text-primary-glow lg:hidden"
            >
              {expanded ? "Show less" : "Read more"}
              <ChevronDown size={16} className={`transition-transform ${expanded ? "rotate-180" : ""}`} />
            </motion.button>

            <motion.div variants={fadeUp} className={`mt-8 space-y-4 ${mobileExtra}`}>
              <div className="glass-card flex items-start gap-4 p-5">
                <div className="rounded-xl bg-primary/15 p-2.5 text-primary">
                  <GraduationCap size={20} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{profile.university}</p>
                  <p className="text-xs text-text-secondary">{education}</p>
                </div>
              </div>

              {/* Senior high school card only shows once its details are filled in. */}
              {profile.background ? (
                <div className="glass-card flex items-start gap-4 p-5">
                  <div className="rounded-xl bg-secondary/15 p-2.5 text-secondary">
                    <GraduationCap size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{profile.background}</p>
                    {profile.major && <p className="text-xs text-text-secondary">{profile.major}</p>}
                  </div>
                </div>
              ) : null}

              <div className="glass-card flex items-start gap-4 p-5">
                <div className="rounded-xl bg-secondary/15 p-2.5 text-secondary">
                  <MapPin size={20} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Based in {profile.location}</p>
                  <p className="text-xs text-text-secondary">Open to collaborating on code projects</p>
                </div>
              </div>
            </motion.div>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.3 }}
            variants={staggerContainer(0.08)}
            className="lg:col-span-2"
          >
            {/* Quick facts, styled like the terminal log in the hero. */}
            <motion.div variants={fadeUp} className="mb-4 flex items-center gap-2">
              <Terminal size={16} className="text-primary" />
              <h3 className="text-sm font-semibold uppercase tracking-wider text-white">Quick Facts</h3>
            </motion.div>
            <motion.div
              variants={fadeUp}
              className="glass-card mb-6 p-4 font-mono text-[12px] leading-loose tracking-wide sm:mb-8 sm:p-5 sm:text-[13px]"
            >
              {profile.quickFacts.map(([key, value]) => (
                // No wrapping between parts: a long value wraps inside its own column
                // instead of dropping under the key.
                <div key={key} className="flex gap-x-2">
                  <span className="shrink-0 text-primary">&gt;</span>
                  <span className="shrink-0 text-white">{key}</span>
                  <span className="shrink-0 text-text-muted">&rarr;</span>
                  <span className="min-w-0 text-secondary">{value}</span>
                </div>
              ))}
            </motion.div>

            <motion.div variants={fadeUp} className="mb-4 flex items-center gap-2">
              <Sparkles size={16} className="text-accent" />
              <h3 className="text-sm font-semibold uppercase tracking-wider text-white">Interests</h3>
            </motion.div>

            {/* Phones: small chips in a wrapped row; larger screens: a 2-column card grid. */}
            <div className="flex flex-wrap gap-2 sm:grid sm:grid-cols-2 sm:gap-3">
              {profile.interests.map((interest) => {
                const Icon = interestIcons[interest] ?? Code;
                return (
                  <motion.div
                    key={interest}
                    variants={fadeUp}
                    whileHover={{ y: -4, borderColor: "rgba(236,163,95,0.5)" }}
                    className="glass-card flex items-center gap-2 px-3 py-2 sm:gap-3 sm:p-4"
                  >
                    <Icon size={18} className="shrink-0 text-primary" />
                    <span className="text-sm text-text-secondary">{interest}</span>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
