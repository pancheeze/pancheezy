import { Certificate, Project, Skill, TimelineItem } from "./types";

export const profile = {
  name: "Paul Anthony Pancho",
  title: "Full-Stack Developer",
  // Hero line: "> Aspiring <role>" where the role slowly decrypts into the next one.
  // Keep this short: only the roles he's applying for, each backed by a project.
  taglinePrefix: "Aspiring",
  heroRoles: ["Full-Stack Developer", "Mobile App Developer", "Machine Learning Developer"],
  // Everything he does (Byte, the chatbot, uses this list).
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
  location: "Batangas, Philippines",
  // Empty fields are hidden on the site until they are filled in.
  start: "2023 – Present",
  background: "Tanauan Institute",
  major: "STEM · Consistent honor student",
  email: "paulanthonybucadpancho1122@gmail.com",
  github: "https://github.com/pancheeze",
  githubHandle: "@pancheeze",
  linkedin: "https://www.linkedin.com/in/paul-pancho-76b8103a5/",
  facebook: "https://www.facebook.com/paulpancho.21",
  // General availability (Byte uses this sentence too).
  availability: "Open to internships & collaborations",
  // Status pill above the hero heading (falls back to `availability`); set both to "" to hide it.
  heroBadge: "Looking for a 500-hour OJT · Jan 2027",
  // Contact section intro: what he's looking for. Update it when the OJT details change.
  contactIntro:
    "I'm looking for a 500-hour onsite OJT in Batangas, Laguna or Metro Manila, starting around January 2027. If your company can sign a MOA with my university, I'd love to hear from you. I'm also happy to talk about projects and collaborations.",
  // Put the PDF in public/cv/ and set the path here; the Download CV button only shows when set.
  cvUrl: "/cv/Paul-Anthony-Pancho-CV.pdf",
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
  // Extra facts for Byte (the chatbot). Fill in an answer to teach him; empty answers are skipped,
  // so he says he doesn't know instead of guessing.
  faq: [
    ["When does he graduate?", "He expects to finish his BS Information Technology in 2027."],
    [
      "What OJT / internship does he need?",
      "A 500-hour OJT/internship for his BS Information Technology degree, with a company that can sign a MOA (Memorandum of Agreement) with his university. It will likely start around January 2027 (to be confirmed).",
    ],
    [
      "Does he prefer onsite, remote or hybrid work? Where can he work onsite?",
      "He is aiming for an onsite OJT/internship in Batangas, Laguna or Metro Manila. He hasn't said he's looking for remote work, so for remote or hybrid offers, contact him directly.",
    ],
    [
      "What roles is he looking for?",
      "Full-stack web development (frontend and backend) and mobile app development. He can also help with UI design.",
    ],
    ["What languages does he speak?", "Filipino (native) and English (conversational)."],
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
  { name: "TypeScript", category: "Programming" },
  { name: "Python", category: "Programming" },
  { name: "C", category: "Programming" },
  { name: "C++", category: "Programming" },
  { name: "C#", category: "Programming" },
  { name: "HTML", category: "Frontend" },
  { name: "CSS", category: "Frontend" },
  { name: "Bootstrap", category: "Frontend" },
  { name: "React", category: "Frontend" },
  { name: "Next.js", category: "Frontend" },
  { name: "PHP", category: "Backend" },
  { name: "REST APIs", category: "Backend" },
  { name: "MySQL", category: "Database" },
  { name: "Flutter", category: "Mobile" },
  { name: "Dart", category: "Mobile" },
  { name: "TensorFlow Lite", category: "AI" },
  { name: "Git", category: "Tools" },
  { name: "GitHub", category: "Tools" },
  { name: "Unity", category: "Tools" },
  { name: "Photoshop", category: "Tools" },
];

// Each entry becomes a filter tab.
export const skillCategories = [
  "Programming",
  "Frontend",
  "Backend",
  "Database",
  "Mobile",
  "AI",
  "Tools",
] as const;

export const projects: Project[] = [
  {
    slug: "chickdetect",
    name: "ChickDetect",
    description:
      "A mobile app that screens chicken droppings for early signs of disease. It runs a machine-learning model fully offline on the phone and tells farmers what to do next.",
    category: "Capstone · Mobile + ML",
    role: "Lead programmer · trained the model · coded the app",
    featured: true,
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
        "Designed the original UI myself in Canva and coded the Flutter app: camera capture, scan flow and history",
        "Trained the disease-classification model in Python and integrated it on-device with TensorFlow Lite",
        "Added Filipino and English language support",
        "Team v2: I retrained the model (96.56% test accuracy); my groupmate replaced my Canva design with an AI-generated UI (the one the app uses now); release build",
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
        "The v2 model, which I retrained, reaches 96.56% test accuracy across 5 classes. A team capstone: I led programming, trained and retrained the machine-learning model and integrated it into the app, and designed (in Canva) and coded the original app. The current v2 interface is an AI-generated redesign made by my groupmate, replacing my original Canva design, and the website was done with my groupmate.",
    },
  },
  {
    slug: "motoshapi",
    name: "Motoshapi",
    description:
      "A full-stack online shop for motorcycle parts and accessories, with PayPal checkout, automatic SMS and email notifications, an AI shopping assistant and a complete admin panel.",
    category: "Team Project · Full-Stack Web App",
    role: "Lead programmer · integrations & UI · 22 of 30 commits",
    featured: true,
    tech: ["PHP", "MySQL", "JavaScript", "PayPal API", "REST API"],
    github: "https://github.com/pancheeze/motoshapi-final-project-",
    demo: undefined,
    thumbnail: "/images/projects/motoshapi-hero.jpg",
    detail: {
      overview:
        "Our web development final project, built by a team of four with me as lead programmer. Customers browse motor oil, tires and mags, check out with PayPal or cash on delivery, and get order updates by SMS and email, while admins manage the whole store from a dashboard.",
      problem:
        "Small motorcycle parts shops often sell through chat and phone calls, which makes stock, orders and customer updates hard to keep track of.",
      solution:
        "A PHP and MySQL e-commerce system that handles the full flow, from product catalog to checkout, payment and delivery updates, with an admin panel for products, orders and customers, and automatic SMS and email so customers always know their order status.",
      features: [
        "Product catalog with search, category filters, product variations and featured products",
        "Cart and checkout with PayPal (sandbox) or cash on delivery",
        "Automatic SMS order notifications and two-way SMS replies through an SMS gateway",
        "Automatic emails: welcome, order status updates and password reset",
        "AI shopping assistant chatbot powered by a local Ollama model",
        "Admin dashboard: sales overview, low-stock alerts, products, orders, users and admins",
        "REST API and two-way customer account sync with a partner system",
      ],
      stack: ["PHP", "MySQL", "JavaScript", "HTML", "CSS", "PayPal REST API", "SMSGate", "SMTP (Gmail)", "Ollama", "XAMPP"],
      process: [
        "Built the first version of the site",
        "Redesigned the full UI with a consistent design system",
        "Integrated SMS notifications with two-way replies",
        "Integrated automatic email notifications for every order flow",
        "Finished the PayPal integration and fixed issues after merging",
        "Switched the chatbot from hard-coded answers to a local Ollama AI model",
        "Reviewed and merged the team's pull requests as lead programmer",
      ],
      challenges: [
        "Keeping SMS, email and payment updates in sync across every order status",
        "Resolving merge conflicts as four people worked on the same codebase, including restoring a payment method lost in a merge",
        "Connecting to an SMS gateway running on a phone over the local network",
      ],
      gallery: [
        "/images/projects/motoshapi-shop.jpg",
        "/images/projects/motoshapi-chatbot.jpg",
        "/images/projects/motoshapi-paypal.jpg",
        "/images/projects/motoshapi-admin.jpg",
        "/images/projects/motoshapi-sms.jpg",
        "/images/projects/motoshapi-database.jpg",
      ],
      result:
        "A complete, working e-commerce system delivered as our final project. As lead programmer I handled the integrations and UI, and kept four people's work merging cleanly.",
    },
  },
  {
    slug: "siliscan",
    name: "SiliScan",
    description:
      "An Android app that spots chili leaf diseases (anthracnose, cercospora leaf spot and leaf curl) from a single photo, fully offline, using a CNN trained with transfer learning on MobileNetV2.",
    category: "Group Project · Mobile + ML",
    role: "Built the Android app and trained the model",
    featured: true,
    tech: ["Kotlin", "Android", "TensorFlow Lite", "Python"],
    github: "https://github.com/pancheeze/SiliScan",
    thumbnail: "/images/projects/siliscan-thumb.jpg",
    detail: {
      overview:
        "A PUP group activity that I built solo: I trained the disease-classification model in Python and coded the native Android app in Kotlin. A grower photographs one chili leaf and gets the likely disease, a confidence score, a severity level and a recommendation, all on the phone.",
      problem:
        "Chili diseases like anthracnose, cercospora leaf spot and leaf curl are often noticed only after the damage has spread, which cuts the harvest. Many growers also have weak or no internet in the field.",
      solution:
        "A convolutional neural network built with transfer learning on MobileNetV2, fine-tuned on chili leaf images and converted to TensorFlow Lite, so every scan runs offline on an Android phone.",
      features: [
        "Detects anthracnose, cercospora leaf spot, leaf curl and healthy leaves from one photo",
        "Runs fully offline with an on-device TensorFlow Lite model",
        "Camera with a leaf guide overlay, or pick a photo from the gallery",
        "Review step before analysis to avoid blurry or badly framed photos",
        "Result with confidence score, severity level and a recommendation",
        "Scan history and a disease library",
      ],
      stack: ["Kotlin", "Android", "TensorFlow Lite", "Python", "TensorFlow / Keras", "MobileNetV2"],
      process: [
        "Organized 1,482 chili leaf images into 4 classes (80% training, 20% validation)",
        "Trained a MobileNetV2 transfer-learning model in Python, then fine-tuned selected layers",
        "Converted the best model to TensorFlow Lite for on-device use",
        "Built the Kotlin Android app: camera, review, analysis, results, history and library",
        "Prepared the technical report and user manual with the group",
      ],
      challenges: [
        "Telling anthracnose apart from cercospora leaf spot, which look alike (anthracnose recall was 0.81, the lowest of the four classes)",
        "Keeping the model small and fast enough to run offline on Android phones",
        "Getting clear, well-framed leaf photos in real field conditions",
      ],
      gallery: [
        "/images/projects/siliscan-welcome.jpg",
        "/images/projects/siliscan-scan.jpg",
        "/images/projects/siliscan-result.jpg",
      ],
      galleryFit: "contain",
      result:
        "95.61% validation accuracy and a 96% weighted F1-score across 4 classes (1,482 images), with every scan running offline on the phone. A group activity that I built solo: I trained the model and coded the Android app.",
    },
  },
  {
    slug: "pancheeze-dev",
    name: "pancheeze.dev",
    description:
      "This portfolio: a Next.js site with Byte, an AI chatbot mascot that answers questions about me, a working contact form, and SEO for my own domain.",
    category: "Solo · Full-Stack Web",
    role: "Solo · built with AI-assisted development",
    featured: true,
    tech: ["Next.js", "TypeScript", "React", "Tailwind CSS", "Groq AI"],
    github: "https://github.com/pancheeze/pancheezy",
    demo: "https://pancheeze.dev",
    demoLabel: "You're here",
    thumbnail: "/images/projects/pancheeze-thumb.jpg",
    detail: {
      overview:
        "My personal portfolio, built and deployed on my own domain. Besides showing my projects, it's where I practice full-stack work end to end: server API routes, an AI integration, email delivery, SEO and performance.",
      problem:
        "A plain portfolio page doesn't show how I build things. I wanted the site itself to be a project: fast, accessible, easy to update, and with features a recruiter can actually try.",
      solution:
        "A Next.js App Router site with all content in one typed data file, server API routes for the contact form and the chatbot, and a terminal-inspired design. Byte, the pixel mascot, answers questions about me with an AI model and falls back to scripted answers when needed.",
      features: [
        "Byte: AI chatbot (Groq) that answers in English or Filipino, with a scripted fallback, per-visitor rate limiting and action buttons",
        "Working contact form: a server route sends email through Gmail with validation, a spam honeypot and rate limiting",
        "SEO for a custom domain: canonical links, sitemap, link preview card and schema.org structured data",
        "Lighthouse scores of 100 for accessibility, best practices and SEO; respects reduced-motion settings",
        "Canvas animations: the ASCII portrait, the glyph background and Byte's physics",
        "Live GitHub contribution graph",
      ],
      stack: ["Next.js 16", "React", "TypeScript", "Tailwind CSS", "Framer Motion", "Groq API", "Nodemailer", "Vercel"],
      process: [
        "Kept all content in one data file, so updates don't touch the components",
        "Added server API routes for the contact form and the chatbot",
        "Upgraded to Next.js 16 and cleared the security warnings from npm audit",
        "Connected the pancheeze.dev domain and set up Google Search Console",
        "Audited it with Lighthouse and fixed contrast, layout and loading issues",
      ],
      challenges: [
        "Keeping the canvas animations smooth on phones (mobile performance is still the weakest score)",
        "Making the AI chatbot useful but safe: it only talks about me, declines off-topic requests and doesn't invent facts",
        "Staying within a free AI model's limits, with a fallback when the limit is reached",
      ],
      gallery: [
        "/images/projects/pancheeze-hero.jpg",
        "/images/projects/pancheeze-byte.jpg",
        "/images/projects/pancheeze-phone.jpg",
      ],
      galleryFit: "contain",
      result:
        "Live at pancheeze.dev with Lighthouse scores of 100 for accessibility, best practices and SEO. Built with AI-assisted development: I decided the features, reviewed the changes and tested everything, and I keep improving it.",
    },
  },
  {
    slug: "swish-streak",
    name: "Swish Streak",
    description:
      "A 3D low-poly basketball game on a floating island court: time your shot with the meter, chain makes, and watch your streak multiply your score.",
    category: "3D Game · Unity",
    role: "Solo · gameplay code written with AI assistance",
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
    tech: ["HTML", "CSS", "JavaScript", "Bootstrap", "REST API"],
    github: "https://github.com/pancheeze/mineventory_api",
    demo: "https://pancheeze.github.io/mineventory_api/",
    thumbnail: "/images/projects/mineventory.png",
    detail: {
      overview:
        "MineVentory lets players browse more than a thousand Minecraft items, search by name or ID, and filter by item family.",
      problem:
        "Looking up Minecraft items usually means digging through wikis page by page. I wanted one fast, searchable place to browse everything in the game.",
      solution:
        "A single-page app that fetches the full item list from a public Minecraft API, then filters it instantly in the browser by name, ID or item family.",
      features: [
        "Loads 1,179 items live from a Minecraft REST API",
        "Instant search by item name or ID",
        "Filter chips for item families (blocks, tools, food, and more)",
        "Item cards with icon and ID, with a detail pop-up for each item",
        "Loading states while the data arrives",
        "Falls back to a saved copy of the item list when the API is down, so the catalog always works",
      ],
      stack: ["HTML", "CSS", "JavaScript", "Bootstrap 5", "Fetch API", "REST API"],
      process: [
        "Explored the Minecraft API and its item data",
        "Fetched the items with JavaScript and rendered them as cards",
        "Added search and family filters on the client side",
        "Built the item detail pop-up with a Bootstrap modal",
        "Styled the pixel-art theme and made it responsive",
      ],
      challenges: [
        "Items stopped showing when the API went down, so I added a timeout and a fallback to a saved copy of the data",
        "Broken item images appeared when an icon failed to load, so missing icons now fall back to a placeholder",
        "Keeping search and filtering fast across more than a thousand items",
      ],
      gallery: ["/images/projects/mineventory.png"],
      result:
        "A working item catalog built on a live API, and my first real lesson in depending on outside services: when the API went down, I made the app fall back to saved data so it keeps working.",
    },
  },
  {
    slug: "art-2-cart",
    name: "Art 2 Cart",
    description:
      "A UI/UX prototype for an online marketplace where creators sell digital art, photography, illustrations, templates and 3D models, designed in Figma.",
    category: "Group Project · UI/UX Design",
    role: "Co-designed the whole prototype with my group",
    tech: ["Figma", "UI/UX", "Prototyping"],
    demo: "https://www.figma.com/design/BlOaDUTQhP7m8uzTudpUuR/prototypeA2C",
    demoLabel: "View in Figma",
    thumbnail: "/images/projects/art2cart-thumb.jpg",
    detail: {
      overview:
        "A school project: a full website prototype for Art 2 Cart, a marketplace for digital art and creative assets. I helped my groupmates design the whole thing in Figma, and some of the artwork in the mockups is my own.",
      problem:
        "Digital artists need one place to show and sell many kinds of work (art, photos, templates, 3D models), and buyers need to browse it all easily.",
      solution:
        "A clean yellow-and-navy marketplace design with a style guide, category browsing, product pages and a creators section, connected into a clickable Figma prototype.",
      features: [
        "Style guide: logo, color palette, typography and buttons",
        "Home page with featured products, top creators and product categories",
        "Products page grouped by category: digital art, photography, illustrations, templates, 3D models and assets",
        "Catalogue with search, category filters and pagination",
        "Product detail and purchase screens",
        "About page with the mission and vision",
      ],
      stack: ["Figma", "Prototyping", "Design system"],
      process: [
        "Defined the style guide: colors, typography and components",
        "Designed the main desktop pages",
        "Connected the screens into a clickable prototype",
        "Featured some of my own artwork in the product mockups",
      ],
      challenges: [
        "Keeping one consistent look across very different product types",
        "Designing product cards that work for art, photos, templates and 3D models alike",
      ],
      gallery: [
        "/images/projects/art2cart-home.jpg",
        "/images/projects/art2cart-catalogue.jpg",
        "/images/projects/art2cart-products.jpg",
      ],
      galleryFit: "top",
      result:
        "A complete, clickable prototype of a digital art marketplace, made as a school group project. It's the design side of my work: I like turning an idea into a clear interface before building it.",
    },
  },
  {
    slug: "ireland-showcase",
    name: "Discover Ireland",
    description:
      "A responsive travel showcase for Ireland, with a full-screen hero, featured places, a photo carousel and a gallery, styled with glassmorphism.",
    category: "Website",
    tech: ["HTML", "CSS", "Bootstrap", "Bootstrap Icons"],
    github: "https://github.com/pancheeze/irelandSC",
    demo: "https://pancheeze.github.io/irelandSC/",
    thumbnail: "/images/projects/ireland-showcase-1.jpg",
    detail: {
      overview:
        "A one-page tourism site that introduces Ireland's culture, landmarks and scenery, from Dublin to the Cliffs of Moher.",
      problem:
        "Travel pages often feel cluttered. I wanted a clean, image-first page that makes a place feel inviting on any screen size.",
      solution:
        "A Bootstrap-based layout with a full-screen hero, a frosted-glass navigation bar and cards, and sections that rearrange from four columns on desktop to one on phones.",
      features: [
        "Full-screen hero with a call-to-action button",
        "Glassmorphism (frosted-glass) navigation bar",
        "Places to Discover cards: Dublin, Cliffs of Moher, Ring of Kerry, Galway",
        "Photo carousel and image gallery",
        "Collapsible mobile menu",
      ],
      stack: ["HTML", "CSS", "Bootstrap 5", "Bootstrap Icons"],
      process: [
        "Planned the sections: hero, about, places and gallery",
        "Built the layout with the Bootstrap grid",
        "Added the glassmorphism effects with CSS",
        "Tested and adjusted the layout on phone, tablet and desktop sizes",
      ],
      challenges: [
        "Making the whole site responsive, so the hero, cards and gallery look right on phones as well as desktops",
        "Getting the glassmorphism effect right: frosted-glass blur that stays readable on top of busy photos",
        "Keeping large background photos looking sharp without slowing the page down",
      ],
      gallery: [
        "/images/projects/ireland-showcase-2.jpg",
        "/images/projects/ireland-showcase-3.jpg",
        "/images/projects/ireland-showcase-4.jpg",
      ],
      result:
        "A polished, fully responsive showcase site, and solid practice with Bootstrap layouts and modern CSS effects.",
    },
  },
  {
    slug: "knives-gallery",
    name: "Knives Gallery",
    description:
      "A responsive card gallery showcasing different types of knives, each with a short history and a link to learn more.",
    category: "Website",
    tech: ["HTML", "CSS", "JavaScript", "Bootstrap"],
    github: "https://github.com/pancheeze/knife-showcase",
    demo: "https://pancheeze.github.io/knife-showcase/",
    thumbnail: "/images/projects/knives-gallery.png",
    detail: {
      overview:
        "Knives Gallery presents knife types such as the karambit, balisong, kukri, and bowie knife in a clean, responsive card layout.",
      problem:
        "Writing a card by hand for every knife repeats the same HTML over and over and is hard to update.",
      solution:
        "The knife data lives in a JavaScript array, and a loop generates every card, so adding a knife means adding one entry.",
      features: [
        "Cards generated from data with a JavaScript loop",
        "Responsive card grid",
        "Short description for each knife type",
        "Learn more links",
        "Dark theme with glassmorphism styling",
      ],
      stack: ["HTML", "CSS", "JavaScript", "Bootstrap 5"],
      process: [
        "Collected the knife types and their descriptions",
        "Stored them as a JavaScript array of objects",
        "Rendered the cards with a loop",
        "Styled the dark glass theme and the responsive grid",
      ],
      challenges: [
        "Building the card markup with JavaScript instead of writing it in HTML",
        "Making the grid responsive while keeping every card the same height",
        "Applying the glassmorphism style on a dark background",
      ],
      gallery: ["/images/projects/knives-gallery.png"],
      result:
        "A data-driven gallery that's easy to extend, and a solid grasp of rendering content with JavaScript loops.",
    },
  },
  // Deadpool & Wolverine (github.com/pancheeze/DPxWV) was removed from the showcase;
  // its thumbnail is still in public/images/projects/ if it is ever added back.
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
  { label: "Projects", href: "#projects" },
  { label: "Skills", href: "#skills" },
  { label: "Experience", href: "#journey" },
  { label: "Certificates", href: "#certificates" },
  { label: "Contact", href: "#contact" },
];
