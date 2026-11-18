import type { Metadata } from "next";
import LoadingScreen from "@/components/layout/LoadingScreen";
import Hero from "@/components/sections/Hero";
import About from "@/components/sections/About";
import Skills from "@/components/sections/Skills";
import Projects from "@/components/sections/Projects";
import Timeline from "@/components/sections/Timeline";
import Certificates from "@/components/sections/Certificates";
import Contact from "@/components/sections/Contact";
import { profile } from "@/lib/data";
import { getContributions } from "@/lib/github";

export const metadata: Metadata = {
  title: "Paul Anthony Pancho — Full-Stack Developer & BSIT Student",
  alternates: { canonical: "/" }, // the official address is pancheeze.dev, not the vercel.app one
};

export default async function HomePage() {
  const activity = await getContributions(profile.githubHandle.replace(/^@/, ""));
  return (
    <>
      <LoadingScreen />
      <Hero />
      <About />
      <Skills />
      <Projects activity={activity} />
      <Timeline />
      <Certificates />
      <Contact />
    </>
  );
}
