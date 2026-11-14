import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <span className="text-sm uppercase tracking-[0.3em] text-text-secondary">
        404
      </span>
      <h1 className="text-3xl font-bold sm:text-4xl">
        Page not <span className="gradient-text">found</span>
      </h1>
      <p className="max-w-md text-sm text-text-secondary sm:text-base">
        The page you are looking for may have moved or never existed.
      </p>
      <Link href="/" className="btn-primary">
        Back to Home
      </Link>
    </div>
  );
}
