// Byte's pixel art. Every pose is a list of 1x1 pixels on an 18 x 19 grid,
// drawn at 4x. The chat icon lives on the same grid, so Byte can "decrypt"
// into it in place (see decryptFrame).

export const GRID_W = 18;
export const GRID_H = 19;

export type Pixel = { x: number; y: number; c: string; k?: string };
export type Face = "normal" | "blink" | "happy" | "think" | "sleep" | "surprised" | "dizzy" | "love";
export type Legs = "stand" | "stepA" | "stepB" | "dangle" | "tuck";

const COLORS: Record<string, string> = {
  A: "#ECA35F", // amber outline
  H: "#F2B77D", // outline highlight
  B: "#2A323A", // body
  S: "#13211D", // CRT screen (dark green, lighter than the page so he looks solid)
  X: "#24382F", // screen glare
  F: "#F2B77D", // glowing face
  K: "#E8707A", // cheeks / heart eyes
  G: "#7FA88B", // antenna light, LED
  L: "#98A2AB", // antenna stem, legs
};

// Colors the "decrypt" static flickers through: the site's palette.
const NOISE = ["#ECA35F", "#F2B77D", "#7FA88B", "#7AA5C4", "#98A2AB", "#2A323A", "#E9E6DF"];

const BODY = [
  "........GG........",
  "........GG........",
  "........LL........",
  "...AAAAAAAAAAAA...",
  "..AHBBBBBBBBBBBA..",
  ".ABBSSSSSSSSSSBBA.",
  ".ABSXXSSSSSSSSSBA.",
  ".ABSXSSSSSSSSSSBA.",
  ".ABSSSSSSSSSSSSBA.",
  ".ABSSSSSSSSSSSSBA.",
  ".ABSSSSSSSSSSSSBA.",
  ".ABSSSSSSSSSSSSBA.",
  ".ABBSSSSSSSSSSBBA.",
  ".ABBBBBBBBBBBGBBA.",
  "..ABBBBBBBBBBBBA..",
  "...AAAAAAAAAAAA...",
];

const ICON = [
  "..................",
  "..................",
  "...AAAAAAAAAAAA...",
  "..AHBBBBBBBBBBBA..",
  ".ABBSSSSSSSSSSBBA.",
  ".ABSXXSSSSSSSSSBA.",
  ".ABSXSSSSSSSSSSBA.",
  ".ABSSSSSSSSSSSSBA.",
  ".ABSFFSSFFSSFFSBA.",
  ".ABSFFSSFFSSFFSBA.",
  ".ABSSSSSSSSSSSSBA.",
  ".ABBSSSSSSSSSSBBA.",
  ".ABBBBBBBBBBBBBBA.",
  "..ABBBBBBBBBBBBA..",
  "...ABBAAAAAAAAA...",
  "...ABA............",
  "...AA.............",
];

type Pt = [number, number];
const cells = (cols: number[], rows: number[]): Pt[] => rows.flatMap((y) => cols.map((x) => [x, y] as Pt));

const CHEEKS: Pt[] = [[5, 10], [12, 10]];
const SMILE: Pt[] = [[7, 11], [10, 11], [8, 12], [9, 12]];

// Each face: glowing pixels (F) plus optional pink pixels (K).
const FACES: Record<Face, { f: Pt[]; k?: Pt[] }> = {
  normal: { f: [...cells([6, 7, 10, 11], [8, 9]), ...SMILE], k: CHEEKS },
  blink: { f: [...cells([6, 7, 10, 11], [9]), ...SMILE], k: CHEEKS },
  happy: { f: [[5, 9], [6, 8], [7, 9], [10, 9], [11, 8], [12, 9], ...cells([7, 8, 9, 10], [11]), [8, 12], [9, 12]], k: CHEEKS },
  think: { f: [...cells([7, 8, 11, 12], [7, 8]), [8, 11], [9, 11], [10, 11]] },
  sleep: { f: [...cells([6, 7, 10, 11], [9]), [8, 11], [9, 11]], k: CHEEKS },
  surprised: { f: [...cells([6, 7, 10, 11], [7, 8, 9]), ...cells([8, 9], [11, 12])] },
  dizzy: {
    f: [
      [5, 7], [7, 7], [6, 8], [5, 9], [7, 9],
      [10, 7], [12, 7], [11, 8], [10, 9], [12, 9],
      [6, 12], [7, 11], [8, 12], [9, 11], [10, 12], [11, 11],
    ],
  },
  love: { f: SMILE, k: [[5, 7], [7, 7], ...cells([5, 6, 7], [8]), [6, 9], [10, 7], [12, 7], ...cells([10, 11, 12], [8]), [11, 9]] },
};

const LEGS: Record<Legs, Pt[]> = {
  stand: [...cells([5, 6, 11, 12], [16]), ...cells([4, 5, 6, 7, 10, 11, 12, 13], [17])],
  stepA: [...cells([5, 6], [16]), ...cells([4, 5, 6, 7], [17]), ...cells([11, 12, 13, 14], [16])],
  stepB: [...cells([11, 12], [16]), ...cells([10, 11, 12, 13], [17]), ...cells([3, 4, 5, 6], [16])],
  dangle: cells([5, 6, 11, 12], [16, 17, 18]),
  tuck: cells([4, 5, 6, 7, 10, 11, 12, 13], [16]),
};

function rowsToMap(rows: string[]) {
  const map = new Map<string, Pixel>();
  rows.forEach((row, y) =>
    [...row].forEach((ch, x) => {
      if (ch !== ".") map.set(`${x},${y}`, { x, y, c: COLORS[ch] });
    })
  );
  return map;
}

function buildByte(face: Face, legs: Legs, look: number): Pixel[] {
  const map = rowsToMap(BODY);
  const f = FACES[face];
  // Faces with eyes can glance one pixel left/right, staying on the screen.
  const dx = face === "sleep" || face === "dizzy" ? 0 : look;
  const put = (pts: Pt[], c: string) => {
    for (const [x, y] of pts) {
      const nx = Math.max(3, Math.min(14, x + dx));
      map.set(`${nx},${y}`, { x: nx, y, c });
    }
  };
  put(f.k ?? [], COLORS.K);
  put(f.f, COLORS.F);
  for (const [x, y] of LEGS[legs]) map.set(`${x},${y}`, { x, y, c: COLORS.L });
  return [...map.values()];
}

const cache = new Map<string, Pixel[]>();
export function byteFrame(face: Face, legs: Legs, look: -1 | 0 | 1): Pixel[] {
  const key = `${face}|${legs}|${look}`;
  let frame = cache.get(key);
  if (!frame) cache.set(key, (frame = buildByte(face, legs, look)));
  return frame;
}

export const ICON_FRAME: Pixel[] = [...rowsToMap(ICON).values()].map((p) =>
  // Tag the three dots so CSS can animate them like a typing indicator.
  p.c === COLORS.F ? { ...p, k: p.x <= 5 ? "dot1" : p.x <= 9 ? "dot2" : "dot3" } : p
);

/**
 * One frame of the "decrypt" transition from one sprite to another, like the
 * site's loading screen: the sprite breaks into flickering static, then the
 * target resolves column by column, left to right. t goes from 0 to 1.
 */
export function decryptFrame(from: Pixel[], to: Pixel[], t: number): Pixel[] {
  const key = (p: { x: number; y: number }) => `${p.x},${p.y}`;
  const a = new Map(from.map((p) => [key(p), p]));
  const b = new Map(to.map((p) => [key(p), p]));
  const SCRAMBLE = 0.25; // first quarter: dissolve into static
  const frontier = t < SCRAMBLE ? -1 : ((t - SCRAMBLE) / (1 - SCRAMBLE)) * (GRID_W + 1);
  const noise = () => NOISE[Math.floor(Math.random() * NOISE.length)];
  const out: Pixel[] = [];

  for (let y = 0; y < GRID_H; y++) {
    for (let x = 0; x < GRID_W; x++) {
      const k = `${x},${y}`;
      const src = a.get(k);
      const dst = b.get(k);
      if (x < frontier) {
        if (dst) out.push(dst);
        continue;
      }
      if (src || dst) {
        // Early on some of the original still shows through the static.
        if (src && t < SCRAMBLE && Math.random() > t / SCRAMBLE) out.push(src);
        else if (Math.random() < 0.8) out.push({ x, y, c: noise() });
      } else if (Math.random() < 0.04) {
        out.push({ x, y, c: noise() }); // stray glitch pixels around him
      }
    }
  }
  return out;
}
