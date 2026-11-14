"use client";

import { motion } from "framer-motion";
import {
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

export default function About() {
  const education = [profile.degree, profile.start].filter(Boolean).join(" · ");

  return (
    <section id="about" className="section-padding relative">
      <div className="section-container">
        <SectionHeading
          eyebrow="Get to know me"
          title="About Me"
          description="Full-stack developer in the making: from database to interface."
        />

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-5 lg:gap-16">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.3 }}
            variants={staggerContainer(0.12)}
            className="lg:col-span-3"
          >
            {profile.aboutDescription.map((paragraph) => (
              <motion.p
                key={paragraph}
                variants={fadeUp}
                className="mb-4 text-base leading-relaxed text-text-secondary last:mb-0 sm:text-lg"
              >
                {paragraph}
              </motion.p>
            ))}

            <motion.div variants={fadeUp} className="mt-8 space-y-4">
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
                  <p className="text-sm font-semibold text-white">Based in the {profile.location}</p>
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
              className="glass-card mb-8 p-5 font-mono text-[12px] leading-loose tracking-wide sm:text-[13px]"
            >
              {profile.quickFacts.map(([key, value]) => (
                <div key={key} className="flex flex-wrap gap-x-2">
                  <span className="text-primary">&gt;</span>
                  <span className="text-white">{key}</span>
                  <span className="text-text-muted">&rarr;</span>
                  <span className="text-secondary">{value}</span>
                </div>
              ))}
            </motion.div>

            <motion.div variants={fadeUp} className="mb-4 flex items-center gap-2">
              <Sparkles size={16} className="text-accent" />
              <h3 className="text-sm font-semibold uppercase tracking-wider text-white">Interests</h3>
            </motion.div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {profile.interests.map((interest) => {
                const Icon = interestIcons[interest] ?? Code;
                return (
                  <motion.div
                    key={interest}
                    variants={fadeUp}
                    whileHover={{ y: -4, borderColor: "rgba(236,163,95,0.5)" }}
                    className="glass-card flex items-center gap-3 p-4"
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
