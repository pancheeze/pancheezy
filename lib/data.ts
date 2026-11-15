import { Certificate, Project, Skill, TimelineItem } from "./types";

// TODO: fill in the remaining fields marked TODO with your real details.
export const profile = {
  name: "Paul Anthony Pancho",
  title: "Full-Stack Developer",
  // Hero line: "> Working as a <role>" where the role decrypts into the next one.
  taglinePrefix: "Working as a",
  taglines: [
    "Full-Stack Developer",
    "Frontend Developer",
    "Backend Developer",
    "Web Developer",
    "Mobile App Developer",
    "PHP & MySQL Developer",
    "UI/UX Designer",
    "C++ Problem Solver",
    "Traditional & Digital Artist",
    "Photoshop Editor",
    "BSIT Student at PUP",
  ],
  university: "Polytechnic University of the Philippines",
  universityShort: "PUP",
  degree: "BS Information Technology",
  location: "Philippines",
  // Empty fields are hidden on the site until they are filled in.
  start: "2023 – Present",
  background: "Tanauan Institute",
  major: "STEM · Consistent honor student",
  email: "paulanthonybucadpancho1122@gmail.com",
  github: "https://github.com/pancheeze",
  githubHandle: "@pancheeze",
  linkedin: "https://www.linkedin.com/in/paul-pancho-76b8103a5/",
  facebook: "https://www.facebook.com/share/1DwHRaC69i/",
  // Put the PDF in public/cv/ and set the path here; the Download CV button only shows when set.
  cvUrl: "",
  heroDescription:
    "BSIT student at the Polytechnic University of the Philippines building full-stack web and mobile apps that solve real problems — from the database to the interface people use.",
  aboutDescription: [
    "I'm Paul, an IT student at PUP and a full-stack developer who likes owning an idea end to end: designing the database, writing the backend logic and APIs, and shipping a clean, responsive interface on top.",
    "Most of my work is in PHP, MySQL and JavaScript, with C and C++ for the problem-solving side. Right now I'm lead programmer on our capstone, ChickDetect, a machine-learning app that scans chickens for signs of illness, and going deep on C++. I'm open to internships and to collaborating on projects that ship something useful.",
  ],
  // Short key/value lines shown in the About section.
  quickFacts: [
    ["currently", "building ChickDetect"],
    ["learning", "C++ (deep dive)"],
    ["stack", "PHP · MySQL · JavaScript"],
    ["open_to", "internships & collaborations"],
    ["honors", "President's Lister (since 1st year)"],
  ] as [string, string][],
  interests: [
    "Full-Stack Web Development",
    "Mobile Apps",
    "Machine Learning",
    "UI Design",
  ],
};

export const skills: Skill[] = [
  { name: "JavaScript", category: "Programming" },
  { name: "C", category: "Programming" },
  { name: "C++", category: "Programming" },
  { name: "HTML", category: "Frontend" },
  { name: "CSS", category: "Frontend" },
  { name: "Bootstrap", category: "Frontend" },
  { name: "PHP", category: "Backend" },
  { name: "REST APIs", category: "Backend" },
  { name: "MySQL", category: "Database" },
  { name: "Git", category: "Tools" },
  { name: "GitHub", category: "Tools" },
  { name: "Photoshop", category: "Tools" },
];

// Each entry becomes a filter tab; also available: "Mobile", "AI".
export const skillCategories = [
  "Programming",
  "Frontend",
  "Backend",
  "Database",
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
    period: "2021 – 2023",
    title: "STEM Strand",
    org: "Tanauan Institute",
    description:
      "Built my foundation in mathematics, science and research, and was a consistent honor student from Grade 11 onward.",
    skills: ["Mathematics", "Research", "Problem Solving"],
  },
  {
    id: "pup",
    icon: "university",
    period: "2023 – Present",
    duration: "4th Year",
    title: "BS Information Technology Student",
    org: "Polytechnic University of the Philippines",
    description:
      "Full-stack developer focused on machine learning. Lead programmer of our capstone project, ChickDetect, which trains models on AI-assisted datasets to scan chickens for signs of illness. Consistent President's Lister since first year.",
    skills: ["Machine Learning", "Full-Stack", "PHP", "MySQL"],
  },
  {
    id: "the-searcher",
    icon: "briefcase",
    period: "2025 – Present",
    title: "Chief Illustrator",
    org: "The Searcher · PUP student publication",
    description:
      "Lead the publication's illustration work, creating the artwork that accompanies its stories and issues.",
    skills: ["Illustration", "Visual Design", "Visual Storytelling"],
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
