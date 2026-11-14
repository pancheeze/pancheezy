import { Certificate, Project, Skill, TimelineItem } from "./types";

// TODO: fill in every field marked TODO with your real details.
export const profile = {
  name: "Paul Pancho",
  title: "BS Information Technology Student",
  university: "Polytechnic University of the Philippines",
  universityShort: "PUP",
  degree: "BS Information Technology",
  start: "TODO: e.g. 2023 - Present",
  background: "TODO: Senior high school name",
  major: "TODO: Strand, e.g. ICT / STEM",
  email: "TODO@example.com",
  github: "https://github.com/TODO",
  githubHandle: "@TODO",
  linkedin: "https://www.linkedin.com/in/TODO",
  cvUrl: "/cv/Paul-Pancho-CV.pdf",
  heroDescription:
    "BS Information Technology student at the Polytechnic University of the Philippines, building things for the web.",
  aboutDescription:
    "TODO: 2 to 4 sentences about who you are, what you build, and what you're looking for.",
  interests: [
    "Web Development",
    "Frontend Development",
    "UI Design",
    "TODO: add or remove interests",
  ],
};

export const skills: Skill[] = [
  { name: "JavaScript", category: "Programming" },
  { name: "HTML", category: "Frontend" },
  { name: "CSS", category: "Frontend" },
  { name: "Bootstrap", category: "Frontend" },
  { name: "REST APIs", category: "Backend" },
  { name: "Git", category: "Tools" },
  { name: "GitHub", category: "Tools" },
  { name: "Photoshop", category: "Tools" },
];

// Each entry becomes a filter tab; also available: "Mobile", "Database", "AI".
export const skillCategories = [
  "Programming",
  "Frontend",
  "Backend",
  "Tools",
] as const;

export const projects: Project[] = [
  {
    slug: "mineventory",
    name: "MineVentory",
    description:
      "A searchable catalog of Minecraft blocks, tools, and items pulled straight from a Minecraft API, with category filters and a pixel-art interface.",
    category: "Web Application",
    tech: ["HTML", "CSS", "JavaScript", "REST API"],
    github: undefined, // TODO: repo link
    demo: undefined, // TODO: live link
    thumbnail: "/images/projects/mineventory.png",
    detail: {
      overview:
        "MineVentory lets players browse more than a thousand Minecraft items, search by name or ID, and filter by item family.",
      problem: "TODO: what problem or need did this project address?",
      solution: "TODO: how did you approach building it?",
      features: [
        "Search by item name or ID",
        "Filter chips for item families (blocks, tools, food, and more)",
        "Item cards with icon, ID, and description",
      ],
      stack: ["HTML", "CSS", "JavaScript", "REST API"],
      process: ["TODO: describe your build steps"],
      challenges: ["TODO: what was hard and how you solved it"],
      gallery: ["/images/projects/mineventory.png"],
      result: "TODO: what you achieved or learned",
    },
  },
  {
    slug: "knives-gallery",
    name: "Knives Gallery",
    description:
      "A responsive card gallery showcasing different types of knives, each with a short history and a link to learn more.",
    category: "Website",
    tech: ["HTML", "CSS", "Bootstrap"],
    github: undefined, // TODO
    demo: undefined, // TODO
    thumbnail: "/images/projects/knives-gallery.png",
    detail: {
      overview:
        "Knives Gallery presents knife types such as the karambit, balisong, kukri, and bowie knife in a clean, responsive card layout.",
      problem: "TODO",
      solution: "TODO",
      features: [
        "Responsive card grid",
        "Short description for each knife type",
        "Learn more links",
      ],
      stack: ["HTML", "CSS", "Bootstrap"],
      process: ["TODO"],
      challenges: ["TODO"],
      gallery: ["/images/projects/knives-gallery.png"],
      result: "TODO",
    },
  },
  {
    slug: "deadpool-wolverine",
    name: "Deadpool & Wolverine Controllers",
    description:
      "A themed product landing page for limited edition Deadpool & Wolverine Xbox controllers.",
    category: "Landing Page",
    tech: ["HTML", "CSS", "JavaScript"],
    github: undefined, // TODO
    demo: undefined, // TODO
    thumbnail: "/images/projects/deadpool-wolverine.png",
    detail: {
      overview:
        "A dark, bold landing page with a hero showcase and navigation for each controller edition.",
      problem: "TODO",
      solution: "TODO",
      features: ["Themed hero section", "Navigation for each edition", "TODO"],
      stack: ["HTML", "CSS", "JavaScript"],
      process: ["TODO"],
      challenges: ["TODO"],
      gallery: ["/images/projects/deadpool-wolverine.png"],
      result: "TODO",
    },
  },
];

export const timeline: TimelineItem[] = [
  {
    id: "senior-high",
    icon: "graduation",
    period: "TODO: years",
    title: "TODO: Strand",
    org: "TODO: Senior high school",
    description: "TODO: what you studied or did there.",
    skills: ["TODO"],
  },
  {
    id: "pup",
    icon: "university",
    period: "TODO: e.g. 2023 - Present",
    title: "BS Information Technology Student",
    org: "Polytechnic University of the Philippines",
    description: "TODO: your focus areas, organizations, or achievements.",
    skills: ["Web Development", "TODO"],
  },
];

// TODO: add your certificates. Put images in public/images/certificates/.
export const certificates: Certificate[] = [
  {
    id: "cert-1",
    name: "TODO: Certificate name",
    institution: "TODO: Issuer",
    year: "TODO",
    description: "TODO: what you learned.",
    skills: ["TODO"],
    image: "/images/certificates/placeholder.svg",
  },
];

export const navLinks = [
  { label: "Home", href: "#home" },
  { label: "About", href: "#about" },
  { label: "Skills", href: "#skills" },
  { label: "Projects", href: "#projects" },
  { label: "Experience", href: "#journey" },
  { label: "Certificates", href: "#certificates" },
  { label: "Contact", href: "#contact" },
];
