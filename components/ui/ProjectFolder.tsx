"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ChevronDown, Folder as FolderIcon, FolderOpen } from "lucide-react";
import { Project } from "@/lib/types";
import { fadeUp, staggerContainer } from "@/lib/utils";

// "More projects" as folders by type of work (game_dev/, websites/, ui_ux_design/).
// Each folder is transparent glass with the projects' screenshots inside as "documents":
// hover/focus makes them peek up a little and the folder name decrypts from glyphs;
// clicking opens the folder and shows its projects underneath as compact "file" cards.

const GLYPHS = "!<>-_\\/[]{}=+*^?#%&$@01";
const STEP_MS = 32;

export const FOLDERS = [
  { key: "game_dev", accent: "#ECA35F" },
  { key: "websites", accent: "#7AA5C4" },
  { key: "ui_ux_design", accent: "#7FA88B" },
] as const;

/** Text that scrambles into place, left to right, each time `run` is called. */
export function useDecrypt(text: string) {
  const [shown, setShown] = useState(text);
  const timer = useRef<ReturnType<typeof setInterval>>();
  const run = useCallback(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    clearInterval(timer.current);
    let resolved = 0;
    timer.current = setInterval(() => {
      resolved += 1;
      if (resolved >= text.length) {
        clearInterval(timer.current);
        setShown(text);
        return;
      }
      setShown(
        [...text]
          .map((c, i) => (i < resolved || c === "/" || c === " " ? c : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]))
          .join("")
      );
    }, STEP_MS);
  }, [text]);
  useEffect(() => () => clearInterval(timer.current), []);
  return [shown, run] as const;
}

function Folder({
  name,
  accent,
  items,
  open,
  panelId,
  onToggle,
}: {
  name: string;
  accent: string;
  items: Project[];
  open: boolean;
  panelId: string;
  onToggle: () => void;
}) {
  const [shown, decrypt] = useDecrypt(`${name}/`);
  const papers = items.slice(0, 3).map((p) => p.thumbnail);

  return (
    <motion.li variants={fadeUp}>
      <button
        type="button"
        onClick={() => {
          onToggle();
          decrypt();
        }}
        onMouseEnter={decrypt}
        onFocus={decrypt}
        aria-expanded={open}
        aria-controls={panelId}
        className={`project-folder group block w-full rounded-2xl text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
          open ? "is-open" : ""
        }`}
        style={{ "--folder-accent": accent } as React.CSSProperties}
      >
        <div className="folder-art" aria-hidden>
          <div className="folder-back" />
          {papers.map((src, i) => (
            <div key={src + i} className={`folder-paper folder-paper-${i + 1} folder-papers-${papers.length}`}>
              <Image
                src={src}
                alt=""
                fill
                sizes="(max-width: 640px) 45vw, 240px"
                unoptimized={src.endsWith(".svg")}
                className="object-cover object-top"
              />
            </div>
          ))}
          <div className="folder-front" />
        </div>

        <p className="mt-3 truncate font-mono text-sm text-white transition-colors group-hover:text-[color:var(--folder-accent)]">
          <span className="text-text-muted">&gt; </span>
          <span aria-hidden>{shown}</span>
          <span className="sr-only">{name.replace(/_/g, " ")} folder</span>
        </p>
        <p className="mt-0.5 text-xs text-text-secondary">
          {items.length} {items.length === 1 ? "project" : "projects"} · {open ? "close folder" : "open folder"}
        </p>
      </button>
    </motion.li>
  );
}

/** First sentence of a description, for the one-line summary on a file card. */
const firstSentence = (text: string) => text.match(/^.*?[.!?](?=\s|$)/)?.[0] ?? text;

/** A project inside an opened folder: small, but clearly a link (arrow, hover lift, accent border). */
function FileCard({ project, accent }: { project: Project; accent: string }) {
  const [shown, decrypt] = useDecrypt(project.name);
  return (
    <motion.li variants={fadeUp}>
      <Link
        href={`/projects/${project.slug}`}
        onMouseEnter={decrypt}
        onFocus={decrypt}
        className="file-card glass-card group flex items-center gap-4 p-3 pr-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        style={{ "--folder-accent": accent } as React.CSSProperties}
      >
        <span className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border border-white/10">
          <Image src={project.thumbnail} alt="" fill sizes="96px" className="object-cover object-top" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold text-white transition-colors group-hover:text-[color:var(--folder-accent)]">
            <span aria-hidden>{shown}</span>
            <span className="sr-only">{project.name}</span>
          </span>
          <span className="mt-0.5 line-clamp-2 text-xs text-text-secondary sm:line-clamp-1">{firstSentence(project.description)}</span>
          <span className="mt-2 flex gap-1.5 overflow-hidden">
            {project.tech.slice(0, 3).map((t) => (
              <span
                key={t}
                className="shrink-0 rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[11px] text-text-secondary"
              >
                {t}
              </span>
            ))}
          </span>
        </span>
        <span className="file-card-arrow hidden shrink-0 items-center gap-1 font-mono text-xs text-text-secondary sm:flex" aria-hidden>
          view <ArrowRight size={14} />
        </span>
        <ArrowRight size={16} className="file-card-arrow shrink-0 text-text-secondary sm:hidden" aria-hidden />
      </Link>
    </motion.li>
  );
}

/** Phones: a compact folder row; its projects expand right underneath it (like a file explorer). */
function FolderRow({
  name,
  accent,
  items,
  open,
  panelId,
  onToggle,
}: {
  name: string;
  accent: string;
  items: Project[];
  open: boolean;
  panelId: string;
  onToggle: () => void;
}) {
  const [shown, decrypt] = useDecrypt(`${name}/`);
  const Icon = open ? FolderOpen : FolderIcon;
  return (
    <motion.li variants={fadeUp}>
      <button
        type="button"
        onClick={() => {
          onToggle();
          decrypt();
        }}
        aria-expanded={open}
        aria-controls={panelId}
        className="glass-card flex w-full items-center gap-3 p-3 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        style={open ? { borderColor: accent } : undefined}
      >
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${accent}1f`, color: accent }}
          aria-hidden
        >
          <Icon size={20} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-mono text-sm text-white">
            <span className="text-text-muted">&gt; </span>
            <span aria-hidden>{shown}</span>
            <span className="sr-only">{name.replace(/_/g, " ")} folder</span>
          </span>
          <span className="block text-xs text-text-secondary">
            {items.length} {items.length === 1 ? "project" : "projects"}
          </span>
        </span>
        <ChevronDown
          size={18}
          className={`shrink-0 text-text-secondary transition-transform duration-300 ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={panelId}
            role="region"
            aria-label={`${name.replace(/_/g, " ")} projects`}
            data-folder-panel
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            {/* A thin "tree" line in the folder's color connects the files to their folder. */}
            <motion.ul
              variants={staggerContainer(0.08)}
              initial="hidden"
              animate="show"
              className="ml-5 mt-3 space-y-3 border-l pb-1 pl-4"
              style={{ borderColor: `${accent}59` }}
            >
              {items.map((p) => (
                <FileCard key={p.slug} project={p} accent={accent} />
              ))}
            </motion.ul>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.li>
  );
}

export default function ProjectFolders({ projects }: { projects: Project[] }) {
  const [openKey, setOpenKey] = useState<string | null>(null);
  const baseId = useId();
  const folders = FOLDERS.map((f) => ({ ...f, items: projects.filter((p) => p.folder === f.key) })).filter(
    (f) => f.items.length > 0
  );
  const openFolder = folders.find((f) => f.key === openKey);
  const sectionRef = useRef<HTMLDivElement>(null);
  const toggle = (key: string) => setOpenKey((k) => (k === key ? null : key));

  // If the opened folder's first project card lands below the fold, scroll just enough to show it.
  useEffect(() => {
    if (!openKey) return;
    const t = setTimeout(() => {
      const first = [...(sectionRef.current?.querySelectorAll<HTMLElement>("[data-folder-panel] .file-card") ?? [])].find(
        (el) => el.offsetParent !== null // the visible layout (phone rows or desktop grid)
      );
      if (!first) return;
      const overflow = first.getBoundingClientRect().bottom - (window.innerHeight - 24);
      if (overflow > 0) {
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        window.scrollBy({ top: overflow, behavior: reduce ? "auto" : "smooth" });
      }
    }, 380); // after the open animation
    return () => clearTimeout(t);
  }, [openKey]);

  // Scrolling back up past the folders closes the open one, so the page doesn't stay crowded.
  // Only when the folders are BELOW the screen: closing them above the reader would make the page jump.
  useEffect(() => {
    const el = sectionRef.current;
    if (!el || !openKey) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting && entry.boundingClientRect.top > 0) setOpenKey(null);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [openKey]);

  return (
    <div ref={sectionRef}>
      {/* Phones: compact rows that expand in place. */}
      <ul className="space-y-3 sm:hidden">
        {folders.map((f) => (
          <FolderRow
            key={f.key}
            name={f.key}
            accent={f.accent}
            items={f.items}
            open={openKey === f.key}
            panelId={`${baseId}-m-${f.key}`}
            onToggle={() => toggle(f.key)}
          />
        ))}
      </ul>

      {/* Tablets and desktop: glass folders in a row, contents underneath. */}
      <div className="hidden sm:block">
      <ul className="mx-auto grid max-w-3xl grid-cols-3 gap-x-6 gap-y-8">
        {folders.map((f) => (
          <Folder
            key={f.key}
            name={f.key}
            accent={f.accent}
            items={f.items}
            open={openKey === f.key}
            panelId={`${baseId}-d-${f.key}`}
            onToggle={() => toggle(f.key)}
          />
        ))}
      </ul>

      <AnimatePresence initial={false} mode="wait">
        {openFolder && (
          <motion.div
            key={openFolder.key}
            data-folder-panel
            id={`${baseId}-d-${openFolder.key}`}
            role="region"
            aria-label={`${openFolder.key.replace(/_/g, " ")} projects`}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <p className="mb-4 mt-8 font-mono text-xs text-text-secondary">
              <span style={{ color: openFolder.accent }}>~/projects/{openFolder.key}/</span>
            </p>
            {/* Compact "file" cards: small on purpose (featured projects are the big ones). */}
            <motion.ul
              variants={staggerContainer(0.08)}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 gap-3 pb-2 md:grid-cols-2"
            >
              {openFolder.items.map((p) => (
                <FileCard key={p.slug} project={p} accent={openFolder.accent} />
              ))}
            </motion.ul>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
}
