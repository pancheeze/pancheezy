import type { Metadata, Viewport } from "next";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ScrollProgress from "@/components/layout/ScrollProgress";
import CustomCursor from "@/components/layout/CustomCursor";
import PageTransition from "@/components/layout/PageTransition";
import GlyphField from "@/components/layout/GlyphField";
import { profile } from "@/lib/data";

const siteUrl = "https://pancheezy.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${profile.name} — Full-Stack Developer & BSIT Student`,
    template: `%s | ${profile.name}`,
  },
  description: profile.heroDescription,
  keywords: [
    "Paul Anthony Pancho",
    "Full-Stack Developer",
    "BS Information Technology Student",
    "Polytechnic University of the Philippines",
    "PHP",
    "MySQL",
    "Web Developer",
    "Portfolio",
  ],
  authors: [{ name: profile.name, url: siteUrl }],
  creator: profile.name,
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    title: `${profile.name} — Full-Stack Developer & BSIT Student`,
    description: profile.heroDescription,
    siteName: profile.name,
    images: [
      {
        url: "/images/og-image.png",
        width: 1200,
        height: 630,
        alt: `${profile.name}, Full-Stack Developer`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${profile.name} — Full-Stack Developer & BSIT Student`,
    description: profile.heroDescription,
    images: ["/images/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/favicon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#080A0D",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Source+Code+Pro:wght@400;500;600;700&family=Pixelify+Sans:wght@700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased selection:bg-primary/70">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-white"
        >
          Skip to main content
        </a>
        <GlyphField />
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 -z-10 bg-radial-glow"
        />
        <div aria-hidden className="film-grain pointer-events-none fixed inset-0 -z-10" />
        <CustomCursor />
        <ScrollProgress />
        <Navbar />
        <PageTransition>
          <main id="main-content">{children}</main>
        </PageTransition>
        <Footer />
      </body>
    </html>
  );
}
