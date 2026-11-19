import type { Metadata } from "next";
import LoadingScreen from "@/components/layout/LoadingScreen";
import Hero from "@/components/sections/Hero";
import About from "@/components/sections/About";
import Skills from "@/components/sections/Skills";
import Projects from "@/components/sections/Projects";
import Timeline from "@/components/sections/Timeline";
import Certificates from "@/components/sections/Certificates";
import Contact from "@/components/sections/Contact";
import { profile, skills } from "@/lib/data";
import { getContributions } from "@/lib/github";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Paul Anthony Pancho — Full-Stack Developer & BSIT Student",
  alternates: { canonical: "/" }, // the official address is pancheeze.dev, not the vercel.app one
};

// Structured data (schema.org) for search engines: who this site is about, his alias and his profiles.
// Invisible to visitors. Check it at https://search.google.com/test/rich-results
const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      "@id": `${SITE_URL}/#person`,
      name: profile.name,
      alternateName: ["pancheeze", "Paul Pancho"],
      url: SITE_URL,
      image: `${SITE_URL}/images/ako.jpg`,
      jobTitle: [profile.title, "Chief Illustrator"],
      description: `${profile.heroDescription} Also Chief Illustrator of The Searcher, PUP's student publication, working in both digital and traditional art.`,
      affiliation: { "@type": "CollegeOrUniversity", name: profile.university },
      memberOf: {
        "@type": "OrganizationRole",
        roleName: "Chief Illustrator",
        startDate: "2025",
        memberOf: { "@type": "Organization", name: "The Searcher", description: "PUP student publication" },
      },
      address: { "@type": "PostalAddress", addressCountry: "PH" },
      knowsAbout: [...skills.map((s) => s.name), "Digital Illustration", "Traditional Illustration"],
      sameAs: [profile.github, profile.linkedin, profile.facebook, "https://pancheeze.itch.io"],
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: "pancheeze",
      alternateName: `${profile.name} — Portfolio`,
      about: { "@id": `${SITE_URL}/#person` },
    },
  ],
};

export default async function HomePage() {
  const activity = await getContributions(profile.githubHandle.replace(/^@/, ""));
  return (
    <>
      <script
        type="application/ld+json"
        // "<" is escaped so the JSON can never close the script tag early.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }}
      />
      <LoadingScreen />
      <Hero />
      {/* Projects come first: they're the proof, so recruiters see them right after the intro. */}
      <Projects activity={activity} />
      <About />
      <Skills />
      <Timeline />
      <Certificates />
      <Contact />
    </>
  );
}
