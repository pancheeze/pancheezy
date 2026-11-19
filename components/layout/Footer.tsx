"use client";

import { motion } from "framer-motion";
import { Facebook, Github, Linkedin, Mail, ArrowUp } from "lucide-react";
import { profile } from "@/lib/data";

export default function Footer() {
  const year = new Date().getFullYear();

  const scrollTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const socials = [
    { icon: Github, href: profile.github, label: "GitHub" },
    { icon: Linkedin, href: profile.linkedin, label: "LinkedIn" },
    { icon: Facebook, href: profile.facebook, label: "Facebook" },
    { icon: Mail, href: `mailto:${profile.email}`, label: "Email" },
  ];

  return (
    <footer className="relative border-t border-white/[0.06]">
      <div className="section-container flex flex-col items-center gap-6 py-10 sm:flex-row sm:justify-between">
        <p className="text-sm text-text-secondary">
          © {year} {profile.name}. All rights reserved.
        </p>

        <div className="flex items-center gap-3">
          {socials.map(({ icon: Icon, href, label }) => (
            <motion.a
              key={label}
              href={href}
              target={href.startsWith("http") ? "_blank" : undefined}
              rel={href.startsWith("http") ? "noreferrer" : undefined}
              aria-label={label}
              whileHover={{ y: -3, scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="glass flex h-10 w-10 items-center justify-center rounded-full text-text-secondary transition-colors hover:text-white"
            >
              <Icon size={16} />
            </motion.a>
          ))}
        </div>

        <motion.button
          type="button"
          onClick={scrollTop}
          whileHover={{ y: -3 }}
          whileTap={{ scale: 0.92 }}
          aria-label="Back to top"
          className="glass flex h-10 w-10 items-center justify-center rounded-full text-text-secondary transition-colors hover:text-white"
        >
          <ArrowUp size={16} />
        </motion.button>
      </div>
    </footer>
  );
}
