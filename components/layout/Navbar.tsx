"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { navLinks } from "@/lib/data";
import { scrollToSection, cn } from "@/lib/utils";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("#home");
  const pathname = usePathname();
  // Section to scroll to once the mobile menu has finished closing.
  const pendingScroll = useRef<string | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (pathname !== "/") return;

    let observer: IntersectionObserver;
    let timeoutId: NodeJS.Timeout;

    const initObserver = () => {
      const sections = navLinks
        .map((l) => document.querySelector<HTMLElement>(l.href))
        .filter(Boolean) as HTMLElement[];

      if (sections.length === 0) {
        timeoutId = setTimeout(initObserver, 100);
        return;
      }

      if (window.location.hash) {
        // Follow a link like "/#projects". On a reload, keep the position the browser restored.
        const nav = performance.getEntriesByType("navigation")[0] as
          | PerformanceNavigationTiming
          | undefined;
        if (nav?.type !== "reload") {
          document.querySelector(window.location.hash)?.scrollIntoView({ behavior: "smooth" });
        }
        // Drop the hash so a later reload doesn't jump back to that section.
        history.replaceState(null, "", window.location.pathname + window.location.search);
      }

      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setActive(`#${entry.target.id}`);
            }
          });
        },
        { rootMargin: "-50% 0px -50% 0px", threshold: 0 }
      );

      sections.forEach((s) => observer.observe(s));
    };

    timeoutId = setTimeout(initObserver, 600);

    return () => {
      clearTimeout(timeoutId);
      if (observer) observer.disconnect();
    };
  }, [pathname]);

  const handleNavClick = useCallback((href: string) => {
    if (pathname !== "/") {
      window.location.href = `/${href}`;
      return;
    }
    if (open) {
      // Closing the menu cancels a smooth scroll on phones, so scroll after it closes.
      pendingScroll.current = href;
      setOpen(false);
      return;
    }
    scrollToSection(href);
  }, [pathname, open]);

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-500 pointer-events-none",
        scrolled ? "py-3" : "py-5"
      )}
    >
      <div className="section-container pointer-events-auto">
        <nav
          className={cn(
            "relative z-[60] flex items-center justify-between rounded-2xl px-4 sm:px-6 py-3 transition-all duration-500",
            scrolled ? "glass shadow-glass" : "bg-transparent border border-transparent"
          )}
          aria-label="Primary"
        >
          <a
            href="#home"
            onClick={(e) => {
              e.preventDefault();
              handleNavClick("#home");
            }}
            className="text-lg font-bold tracking-tight text-white"
          >
            Paul<span className="text-primary">.</span>
          </a>

          <ul className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = active === link.href;
              return (
                <li key={link.href} className="relative">
                  <a
                    href={link.href}
                    onClick={(e) => {
                      e.preventDefault();
                      handleNavClick(link.href);
                    }}
                    className={cn(
                      "relative block px-4 py-2 text-sm font-medium transition-colors duration-300",
                      isActive ? "text-white" : "text-text-secondary hover:text-white"
                    )}
                  >
                    {link.label}
                    {isActive && (
                      <motion.span
                        layoutId="nav-active-indicator"
                        className="absolute inset-0 -z-10 rounded-full bg-white/[0.06] border border-white/10"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                  </a>
                </li>
              );
            })}
          </ul>

          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="md:hidden inline-flex items-center justify-center rounded-full p-2 text-white glass"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            <AnimatePresence mode="wait" initial={false}>
              {open ? (
                <motion.span
                  key="close"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <X size={20} />
                </motion.span>
              ) : (
                <motion.span
                  key="menu"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Menu size={20} />
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </nav>

        <AnimatePresence
          onExitComplete={() => {
            if (pendingScroll.current) {
              scrollToSection(pendingScroll.current);
              pendingScroll.current = null;
            }
          }}
        >
          {open && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="md:hidden overflow-hidden"
            >
              <ul className="mt-2 glass rounded-2xl p-2">
                {navLinks.map((link, i) => (
                  <motion.li
                    key={link.href}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <a
                      href={link.href}
                      onClick={(e) => {
                        e.preventDefault();
                        handleNavClick(link.href);
                      }}
                      className={cn(
                        "block rounded-xl px-4 py-3 text-sm font-medium transition-colors",
                        active === link.href
                          ? "bg-white/[0.06] text-white"
                          : "text-text-secondary hover:text-white hover:bg-white/[0.04]"
                      )}
                    >
                      {link.label}
                    </a>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  );
}
