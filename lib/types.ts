export type SkillCategory =
  | "Programming"
  | "Frontend"
  | "Mobile"
  | "Backend"
  | "Database"
  | "Tools"
  | "AI";

export interface Skill {
  name: string;
  category: SkillCategory;
}

export interface Project {
  slug: string;
  name: string;
  description: string;
  category: string;
  /** One line on what I personally did, shown on the project card. */
  role?: string;
  /** Featured projects get large cards; the rest are listed under "More projects". */
  featured?: boolean;
  tech: string[];
  github?: string;
  demo?: string;
  /** Button text for the demo link; defaults to "Live Demo". */
  demoLabel?: string;
  thumbnail: string;
  detail: {
    overview: string;
    problem: string;
    solution: string;
    features: string[];
    stack: string[];
    process: string[];
    challenges: string[];
    gallery: string[];
    /** How gallery images fill their tiles: "contain" for phone screenshots, "top" for long page designs. Default: cover. */
    galleryFit?: "contain" | "top";
    result: string;
  };
}

export interface TimelineItem {
  id: string;
  icon: "graduation" | "briefcase" | "university";
  period: string;
  duration?: string;
  title: string;
  org?: string;
  description: string;
  skills: string[];
}

export interface Certificate {
  id: string;
  name: string;
  institution: string;
  year: string;
  description: string;
  skills: string[];
  image: string;
}
