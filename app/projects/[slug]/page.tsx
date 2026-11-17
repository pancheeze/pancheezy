import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { projects } from "@/lib/data";
import ProjectDetailView from "@/components/sections/ProjectDetailView";

// Next.js 16 passes route params as a Promise.
interface ProjectPageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return projects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({ params }: ProjectPageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = projects.find((p) => p.slug === slug);
  if (!project) return {};

  return {
    title: `${project.name} — Project Detail`,
    description: project.description,
    openGraph: {
      title: project.name,
      description: project.description,
      images: [{ url: project.thumbnail }],
    },
  };
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { slug } = await params;
  const project = projects.find((p) => p.slug === slug);
  if (!project) notFound();

  return <ProjectDetailView project={project} />;
}
