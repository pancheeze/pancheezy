"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import ProjectCard from "@/components/ui/ProjectCard";
import { Project } from "@/lib/types";
import { fadeUp, staggerContainer } from "@/lib/utils";

// "More projects" as folders by type of work (game_dev/, websites/, group_projects/).
// Each folder is transparent glass with the projects' screenshots inside as "documents":
// hover/focus makes them peek up a little and the folder name decrypts from glyphs;
// clicking opens the folder and shows its projects underneath as full project cards.

const GLYPHS = "!<>-_\\/[]{}=+*^?#%&$@01";
const STEP_MS = 32;

export const FOLDERS = [
  { key: "game_dev", accent: "#ECA35F" },
  { key: "websites", accent: "#7AA5C4" },
  { key: "group_projects", accent: "#7FA88B" },
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

export default function ProjectFolders({ projects }: { projects: Project[] }) {
  const [openKey, setOpenKey] = useState<string | null>(null);
  const baseId = useId();
  const folders = FOLDERS.map((f) => ({ ...f, items: projects.filter((p) => p.folder === f.key) })).filter(
    (f) => f.items.length > 0
  );
  const openFolder = folders.find((f) => f.key === openKey);

  return (
    <>
      <ul className="mx-auto grid max-w-3xl grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3">
        {folders.map((f) => (
          <Folder
            key={f.key}
            name={f.key}
            accent={f.accent}
            items={f.items}
            open={openKey === f.key}
            panelId={`${baseId}-${f.key}`}
            onToggle={() => setOpenKey((k) => (k === f.key ? null : f.key))}
          />
        ))}
      </ul>

      <AnimatePresence initial={false} mode="wait">
        {openFolder && (
          <motion.div
            key={openFolder.key}
            id={`${baseId}-${openFolder.key}`}
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
            {/* The same full cards as the featured projects: screenshot, description, tech, links. */}
            <motion.div
              variants={staggerContainer(0.12)}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 gap-6 pb-2 md:grid-cols-2"
            >
              {openFolder.items.map((p, i) => (
                <ProjectCard key={p.slug} project={p} index={i} />
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
