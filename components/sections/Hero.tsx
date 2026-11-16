"use client";

import { motion } from "framer-motion";
import { Download, Facebook, Github, Linkedin, Mail, ArrowDown } from "lucide-react";
import LanyardCard from "@/components/ui/LanyardCard";
import DecryptText from "@/components/ui/DecryptText";
import { profile } from "@/lib/data";
import { scrollToSection, EASE } from "@/lib/utils";

const heroContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};
const heroItem = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE } },
};

export default function Hero() {
  return (
    <section
      id="home"
      className="relative min-h-screen overflow-hidden lg:overflow-visible w-full"
      style={{ clipPath: 'none' }}
    >
      {/* On very short desktop screens the centred content would slide under the fixed
          navbar, so the whole hero (text and portrait together) shifts down below it. */}
      <div className="relative flex flex-col lg:grid lg:grid-cols-2 min-h-screen items-center gap-4 lg:gap-8 overflow-hidden lg:overflow-visible lg:[@media(max-height:700px)]:pt-24">
        <div className="flex flex-col justify-center items-center text-center lg:items-start lg:text-left pt-16 sm:pt-24 lg:pt-0 px-4 sm:px-6 lg:pl-16 lg:pr-0 order-2 lg:order-1 relative z-10 w-full lg:translate-x-16">
          <motion.div
            variants={heroContainer}
            initial="hidden"
            animate="show"
            className="w-full max-w-xl"
          >
            {profile.availability && (
              <motion.div variants={heroItem} className="mb-5">
                <span className="inline-flex items-center gap-2 rounded-full border border-secondary/30 bg-secondary/10 px-3 py-1 text-xs font-medium text-secondary">
                  <span className="relative flex h-2 w-2" aria-hidden>
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-secondary opacity-60 motion-reduce:animate-none" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-secondary" />
                  </span>
                  {profile.availability}
                </span>
              </motion.div>
            )}

            <motion.span variants={heroItem} className="eyebrow mb-5">
              Welcome to my portfolio
            </motion.span>

            <motion.h1
              variants={heroItem}
              className="text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl"
            >
              Hi, I&apos;m{" "}
              <span className="gradient-text font-pixel font-bold">{profile.name}</span>
            </motion.h1>

            <motion.p
              variants={heroItem}
              className="mt-5 min-h-[3.5em] font-mono text-base font-medium sm:min-h-[1.75em] sm:text-lg lg:text-xl"
            >
              <span className="text-primary">&gt;</span>{" "}
              <span className="text-white">{profile.taglinePrefix}</span>{" "}
              <span className="block sm:inline">
                <DecryptText words={profile.taglines} className="font-bold text-primary" />
                <span className="typewriter-cursor">▋</span>
              </span>
            </motion.p>

            <motion.p
              variants={heroItem}
              className="mt-5 text-sm leading-relaxed text-white sm:text-base"
              style={{ color: '#E9E6DF' }}
            >
              {profile.heroDescription}
            </motion.p>

            <motion.div
              variants={heroItem}
              className="mt-9 flex flex-wrap items-center justify-center gap-3 lg:justify-start"
            >
            {/* Only shown once a CV file is set in lib/data.ts. */}
            {profile.cvUrl && (
              <motion.a
                href={profile.cvUrl}
                download
                whileHover={{ scale: 1.04, y: -2 }}
                whileTap={{ scale: 0.96 }}
                className="btn-primary"
              >
                <Download size={16} />
                Download CV
              </motion.a>
            )}

            <motion.a
              href={profile.github}
              target="_blank"
              rel="noreferrer"
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.96 }}
              className="btn-ghost"
            >
              <Github size={16} />
              GitHub
            </motion.a>

            <motion.a
              href={profile.linkedin}
              target="_blank"
              rel="noreferrer"
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.96 }}
              className="btn-ghost"
            >
              <Linkedin size={16} />
              LinkedIn
            </motion.a>

            <motion.a
              href={profile.facebook}
              target="_blank"
              rel="noreferrer"
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.96 }}
              className="btn-ghost"
            >
              <Facebook size={16} />
              Facebook
            </motion.a>

            <motion.button
              type="button"
              onClick={() => scrollToSection("#contact")}
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.96 }}
              className="btn-ghost"
            >
              <Mail size={16} />
              Contact Me
            </motion.button>
          </motion.div>
        </motion.div>
        </div>

        <div className="flex justify-center items-start lg:items-center w-full lg:min-h-screen order-1 lg:order-2 overflow-visible">
          <LanyardCard />
        </div>
      </div>

      <motion.button
        type="button"
        onClick={() => scrollToSection("#about")}
        aria-label="Scroll to About section"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-24 left-1/2 z-10 hidden -translate-x-1/2 items-center justify-center rounded-full border border-white/10 bg-base/40 p-2 text-text-secondary backdrop-blur-sm hover:text-white lg:flex sm:bottom-28"
      >
        <ArrowDown size={18} />
      </motion.button>
    </section>
  );
}
