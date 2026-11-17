import { memo } from "react";
import { GRID_H, GRID_W, Pixel } from "./sprites";

interface Props {
  pixels: Pixel[];
  /** Bounce the chat icon's dots like a typing indicator. */
  typing?: boolean;
}

/** Draws a pixel frame at 4x scale. */
function PixelSprite({ pixels, typing }: Props) {
  return (
    <svg
      viewBox={`0 0 ${GRID_W} ${GRID_H}`}
      width={GRID_W * 4}
      height={GRID_H * 4}
      shapeRendering="crispEdges"
      aria-hidden
      className={`block ${typing ? "byte-typing" : ""}`}
    >
      {pixels.map((p, i) => (
        <rect key={i} x={p.x} y={p.y} width="1" height="1" fill={p.c} className={p.k ? `byte-${p.k}` : undefined} />
      ))}
    </svg>
  );
}

export default memo(PixelSprite);
