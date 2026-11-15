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
  university: "Polytechnic University of the Philippines – Sto. Tomas Campus",
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
    "Most of my work is in PHP, MySQL and JavaScript, with C and C++ for the problem-solving side. Right now I'm lead programmer on our capstone, ChickDetect, a machine-learning app that screens chicken droppings for early signs of disease, and going deep on C++. I'm open to internships and to collaborating on projects that ship something useful.",
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
    slug: "chickdetect",
    name: "ChickDetect",
    description:
      "A mobile app that screens chicken droppings for early signs of disease. It runs a machine-learning model fully offline on the phone and tells farmers what to do next.",
    category: "Capstone · Mobile + ML",
    tech: ["Flutter", "Dart", "TensorFlow Lite", "Python"],
    github: "https://github.com/pancheeze/ChickDetect",
    demo: "https://pancheeze.github.io/ChickDetect/",
    demoLabel: "Visit Website",
    thumbnail: "/images/projects/chickdetect-scan.jpg",
    detail: {
      overview:
        "Our capstone project, where I'm lead programmer. Farmers photograph a dropping, and the app classifies it on the device as healthy, coccidiosis, salmonella or Newcastle disease, then gives plain-language advice and vet contacts.",
      problem:
        "Small poultry farmers often notice disease too late, after it has spread through the flock. Lab tests and vet visits are slow and costly, and farms often have weak internet.",
      solution:
        "An offline-first Flutter app with an on-device TensorFlow Lite model. Droppings are one of the earliest visible signs of illness, so a quick photo becomes an early warning, with clear next steps instead of raw percentages.",
      features: [
        "Detects healthy, coccidiosis, salmonella and Newcastle disease from a photo",
        "Rejects photos that aren't droppings, plus photo-quality checks and a photo guide",
        "Runs fully offline with an on-device TensorFlow Lite model",
        "Scan history with a flock health summary and rescan reminders",
        "Step-by-step care advice and vet contacts for each result",
        "Download website with a per-device install guide",
      ],
      stack: ["Flutter", "Dart", "TensorFlow Lite", "Python", "Camera", "Shared Preferences"],
      process: [
        "Built the original Flutter app: camera capture, scan flow and history",
        "Integrated the disease-classification model on-device with TensorFlow Lite",
        "Added Filipino and English language support",
        "Team v2: UI/UX redesign, retrained model and release build",
        "Published a download website for farmers",
      ],
      challenges: [
        "Keeping the model accurate on real farm photos with uneven lighting and cluttered ground",
        "Avoiding false 'healthy' results on sick droppings, the costliest mistake",
        "Running inference fast and fully offline on low-end Android phones",
      ],
      gallery: [
        "/images/projects/chickdetect-welcome.jpg",
        "/images/projects/chickdetect-result.jpg",
        "/images/projects/chickdetect-advice.jpg",
      ],
      result:
        "The v2 model reaches 96.56% test accuracy across 5 classes. A team capstone: I led programming and built the original app, and the v2 redesign and website were done with my groupmate.",
    },
  },
  {
    slug: "swish-streak",
    name: "Swish Streak",
    description:
      "A 3D low-poly basketball game on a floating island court: time your shot with the meter, chain makes, and watch your streak multiply your score.",
    category: "3D Game · Unity",
    tech: ["Unity 6", "C#", "TextMesh Pro"],
    github: undefined,
    demo: "https://pancheeze.itch.io/swish-streak",
    demoLabel: "Download on itch.io",
    thumbnail: "/images/projects/swish-streak-1.png",
    detail: {
      overview:
        "My solo final project from last semester. A low-poly basketball court floating in space, where every shot is a timing challenge.",
      problem:
        "Most simple shooting games feel random. I wanted shots that reward skill and timing, so players can feel themselves improving.",
      solution:
        "A shot meter that cycles while you aim. Release quality decides a clean make, a rim-rattling make or an airball, and changes the ball's arc and landing spot. Consecutive makes build a streak that multiplies your score.",
      features: [
        "Timing-based shot meter: clean make, rattle-in or airball",
        "Shot quality changes the ball's arc and accuracy; misses clank off the rim with real physics",
        "Streak scoring: the nth make in a row is worth n points, and an airball resets it",
        "Balls spawn every few seconds (up to 10 on court), and you pick them up by walking into them",
        "Grounded balls despawn after 3 seconds unless you grab them",
        "Low-poly floating island scene with a space skybox and a pixel-style UI font",
      ],
      stack: ["Unity 6", "C#", "Unity Physics", "TextMesh Pro", "Unity Asset Store models"],
      process: [
        "Designed the core loop: dribble, aim, time, shoot, rebound",
        "Built character movement with Unity's CharacterController",
        "Scripted the shot meter, arc trajectory and physics handoff",
        "Added streak scoring and the score UI",
        "Built the ball spawner and despawn system",
        "Designed the floating-island scene and visuals",
        "Playtested and tuned the meter speed and shot difficulty",
      ],
      challenges: [
        "Making misses look believable: blending a scripted arc into real physics so the ball bounces off the rim naturally",
        "Keeping the meter learnable by restarting it from the same point every time you aim",
        "Stopping a ball from despawning while it's in the player's hands",
      ],
      gallery: [
        "/images/projects/swish-streak-2.png",
        "/images/projects/swish-streak-3.png",
        "/images/projects/swish-streak-4.png",
      ],
      result:
        "A complete, playable game published on itch.io. Designed and built solo, with the gameplay code written with AI assistance.",
    },
  },
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
    org: "Polytechnic University of the Philippines – Sto. Tomas Campus",
    description:
      "Full-stack developer focused on machine learning. Lead programmer of our capstone project, ChickDetect, which trains models on AI-assisted datasets to screen chicken droppings for early signs of disease. Consistent President's Lister since first year.",
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

// Add new certificates here; put their images in public/images/certificates/.
export const certificates: Certificate[] = [
  {
    id: "ai-ml-seminar-2025",
    name: "From Algorithms to Intelligence: The Journey to AI and Machine Learning",
    institution: "PUP Sto. Tomas Campus · Computer Society",
    year: "2025",
    description:
      "Certificate of Participation for a full-day Computer Society seminar on artificial intelligence and machine learning, held December 5, 2025.",
    skills: ["Artificial Intelligence", "Machine Learning"],
    image: "/images/certificates/ai-ml-seminar-2025.jpg",
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
