// Reads a user's public GitHub contribution calendar (no token needed).
// GitHub serves it as HTML, so this parses the day cells and their tooltips.
// Returns null on any failure so the UI can hide itself instead of breaking.

export type ContributionDay = {
  date: string; // YYYY-MM-DD
  level: number; // 0-4, GitHub's intensity bucket
  count: number;
};

export type ContributionCalendar = {
  total: number;
  days: ContributionDay[]; // sorted oldest to newest
};

const REVALIDATE_SECONDS = 60 * 60 * 24; // refresh once a day

export async function getContributions(username: string): Promise<ContributionCalendar | null> {
  try {
    const res = await fetch(`https://github.com/users/${username}/contributions`, {
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (!res.ok) return null;
    const html = await res.text();

    // Tooltip text per cell id, e.g. "22 contributions on January 12th."
    const counts = new Map<string, number>();
    for (const m of html.matchAll(/<tool-tip[^>]*\bfor="([^"]+)"[^>]*>([^<]*)<\/tool-tip>/g)) {
      const n = m[2].match(/^(\d+) contribution/);
      counts.set(m[1], n ? Number(n[1]) : 0);
    }

    const days: ContributionDay[] = [];
    for (const m of html.matchAll(/<td\b[^>]*\bdata-date="[^"]+"[^>]*>/g)) {
      const tag = m[0];
      const date = tag.match(/data-date="([^"]+)"/)?.[1];
      const level = Number(tag.match(/data-level="(\d)"/)?.[1] ?? NaN);
      const id = tag.match(/\bid="([^"]+)"/)?.[1];
      if (!date || Number.isNaN(level)) continue;
      days.push({ date, level, count: (id && counts.get(id)) || 0 });
    }
    if (days.length < 7) return null;

    days.sort((a, b) => a.date.localeCompare(b.date));
    const total =
      Number(html.match(/([\d,]+)\s+contributions?\s+in the last year/)?.[1].replace(/,/g, "")) ||
      days.reduce((sum, d) => sum + d.count, 0);
    return { total, days };
  } catch {
    return null;
  }
}
