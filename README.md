# Paul Pancho — Portfolio

Personal portfolio built with Next.js 14 (App Router), React, TypeScript, Tailwind CSS, Framer Motion, and React Three Fiber.

Design based on [Davin's portfolio](https://github.com/DapinKecapManis/Portofolio), used with permission.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Editing content

| What | Where |
|---|---|
| Name, bio, links, skills, projects, timeline, certificates | `lib/data.ts` (search for `TODO`) |
| Profile photo on the 3D lanyard card | `public/images/profile.jpg` |
| Project screenshots | `public/images/projects/` |
| Certificate images | `public/images/certificates/` |
| CV download | `public/cv/Paul-Pancho-CV.pdf` |
| Site domain (SEO, sitemap, robots) | `app/layout.tsx`, `app/sitemap.ts`, `app/robots.ts` |
| Contact form (currently simulated) | `components/sections/Contact.tsx` |
| Colors | `tailwind.config.ts`, `app/globals.css` |

## Deploy

Push to GitHub, then import the repo in [Vercel](https://vercel.com).
