// Byte's pixel art. Every pose is a list of 1x1 pixels on an 18 x 20 grid.
// All poses (and the chat icon) are padded to the same number of pixels and
// sorted top-to-bottom, so pixel i of one pose can fly to pixel i of another:
// that's how Byte "morphs" into the chat icon.

export const GRID_W = 18;
export const GRID_H = 20;

export type Pixel = { x: number; y: number; c: string; k?: string; hidden?: boolean };
export type Face = "normal" | "blink" | "happy" | "think" | "sleep" | "surprised" | "dizzy" | "love";
export type Legs = "stand" | "stepA" | "stepB" | "dangle" | "tuck";

const COLORS: Record<string, string> = {
  A: "#ECA35F", // amber outline / face
  H: "#F2B77D", // highlight
  D: "#1A2026", // body
  S: "#080A0D", // screen
  G: "#7FA88B", // green (antenna, LED, chat dots)
  L: "#98A2AB", // grey (antenna stem, legs)
  P: "#E8707A", // pink (heart eyes)
};

const BODY = [
  "........GG........",
  "........GG........",
  "........LL........",
  "........LL........",
  "..AAAAAAAAAAAAAA..",
  ".AHDDDDDDDDDDDDDA.",
  ".ADSSSSSSSSSSSSDA.",
  ".ADSSSSSSSSSSSSDA.",
  ".ADSSSSSSSSSSSSDA.",
  ".ADSSSSSSSSSSSSDA.",
  ".ADSSSSSSSSSSSSDA.",
  ".ADSSSSSSSSSSSSDA.",
  ".ADSSSSSSSSSSSSDA.",
  ".ADSSSSSSSSSSSSDA.",
  ".ADSSSSSSSSSSSSDA.",
  ".ADDDDDDDDDDDDGDA.",
  "..AAAAAAAAAAAAAA..",
];

const ICON = [
  "..................",
  "..................",
  "..................",
  "...AAAAAAAAAAAA...",
  "..AHDDDDDDDDDDDA..",
  ".ADDDDDDDDDDDDDDA.",
  ".ADDDDDDDDDDDDDDA.",
  ".ADDDDDDDDDDDDDDA.",
  ".ADDGGDDGGDDGGDDA.",
  ".ADDGGDDGGDDGGDDA.",
  ".ADDDDDDDDDDDDDDA.",
  ".ADDDDDDDDDDDDDDA.",
  "..ADDDDDDDDDDDDA..",
  "...ADDAAAAAAAAA...",
  "...ADA............",
  "...AA.............",
];

type Pt = [number, number];
const cells = (cols: number[], rows: number[]): Pt[] => rows.flatMap((y) => cols.map((x) => [x, y] as Pt));
const span = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => a + i);

const SMILE: Pt[] = [[6, 12], [11, 12], ...cells(span(7, 10), [13])];
const WIDE_SMILE: Pt[] = [[6, 11], [11, 11], ...cells(span(7, 10), [12])];

const FACES: Record<Face, { px: Pt[]; color?: string }> = {
  normal: { px: [...cells([5, 6, 11, 12], [8, 9, 10]), ...SMILE] },
  blink: { px: [...cells([5, 6, 11, 12], [10]), ...SMILE] },
  happy: { px: [[6, 8], [5, 9], [7, 9], [12, 8], [11, 9], [13, 9], ...WIDE_SMILE] },
  think: { px: [...cells([5, 6, 11, 12], [9, 10]), ...cells(span(7, 10), [13])] },
  sleep: { px: [...cells([5, 6, 7, 11, 12, 13], [10]), [8, 13], [9, 13]] },
  surprised: { px: [...cells([5, 6, 11, 12], [7, 8, 9]), ...cells([8, 9], [11, 12])] },
  dizzy: {
    px: [
      [4, 8], [6, 8], [5, 9], [4, 10], [6, 10],
      [11, 8], [13, 8], [12, 9], [11, 10], [13, 10],
      [6, 13], [7, 12], [8, 13], [9, 12], [10, 13], [11, 12],
    ],
  },
  love: {
    px: [[4, 8], [6, 8], [4, 9], [5, 9], [6, 9], [5, 10], [11, 8], [13, 8], [11, 9], [12, 9], [13, 9], [12, 10]],
    color: COLORS.P,
  },
};

const LEGS: Record<Legs, Pt[]> = {
  stand: [...cells([4, 5, 12, 13], [17, 18]), ...cells([3, 4, 5, 6, 11, 12, 13, 14], [19])],
  stepA: [...cells([4, 5], [17, 18]), ...cells([3, 4, 5, 6], [19]), ...cells([12, 13], [17]), ...cells([12, 13, 14, 15], [18])],
  stepB: [...cells([12, 13], [17, 18]), ...cells([11, 12, 13, 14], [19]), ...cells([4, 5], [17]), ...cells([2, 3, 4, 5], [18])],
  dangle: cells([4, 5, 12, 13], [17, 18, 19]),
  tuck: [...cells([4, 5, 12, 13], [17]), ...cells([3, 4, 5, 6, 11, 12, 13, 14], [18])],
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

const sortPixels = (px: Pixel[]) => px.sort((a, b) => a.y - b.y || a.x - b.x);

function buildByte(face: Face, legs: Legs, look: number): Pixel[] {
  const map = rowsToMap(BODY);
  const f = FACES[face];
  // Faces with eyes can look left/right by one pixel, staying on the screen.
  const dx = face === "sleep" || face === "dizzy" ? 0 : look;
  for (const [x, y] of f.px) {
    const nx = Math.max(3, Math.min(14, x + dx));
    map.set(`${nx},${y}`, { x: nx, y, c: f.color ?? COLORS.A });
  }
  for (const [x, y] of LEGS[legs]) map.set(`${x},${y}`, { x, y, c: COLORS.L });
  return sortPixels([...map.values()]);
}

function buildIcon(): Pixel[] {
  const px = sortPixels([...rowsToMap(ICON).values()]);
  // Tag the three dots so CSS can animate them like a typing indicator.
  for (const p of px) if (p.c === COLORS.G) p.k = p.x <= 5 ? "dot1" : p.x <= 9 ? "dot2" : "dot3";
  return px;
}

// Every frame gets padded to the same length with invisible pixels in the middle.
const FACE_LIST = Object.keys(FACES) as Face[];
const LEG_LIST = Object.keys(LEGS) as Legs[];
const ICON_RAW = buildIcon();
export const PIXEL_COUNT =
  Math.max(
    ICON_RAW.length,
    ...FACE_LIST.flatMap((f) => LEG_LIST.map((l) => buildByte(f, l, 0).length))
  ) + 2;

function pad(px: Pixel[]): Pixel[] {
  const out = px.slice();
  while (out.length < PIXEL_COUNT) out.push({ x: 8.5, y: 10, c: COLORS.S, hidden: true });
  return out;
}

const cache = new Map<string, Pixel[]>();
export function byteFrame(face: Face, legs: Legs, look: -1 | 0 | 1): Pixel[] {
  const key = `${face}|${legs}|${look}`;
  let frame = cache.get(key);
  if (!frame) cache.set(key, (frame = pad(buildByte(face, legs, look))));
  return frame;
}

export const ICON_FRAME = pad(ICON_RAW);
