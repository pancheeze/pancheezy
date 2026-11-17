import { memo } from "react";
import { GRID_H, GRID_W, Pixel } from "./sprites";

interface Props {
  pixels: Pixel[];
  /** Animate pixels to their new spots (used for the Byte <-> chat icon morph). */
  morphing: boolean;
  typing?: boolean;
}

/** Draws a pixel frame at 4x scale. Pixel i keeps its element between frames, so it can fly. */
function PixelSprite({ pixels, morphing, typing }: Props) {
  return (
    <svg
      viewBox={`0 0 ${GRID_W} ${GRID_H}`}
      width={GRID_W * 4}
      height={GRID_H * 4}
      shapeRendering="crispEdges"
      aria-hidden
      className={`byte-pixels block ${morphing ? "byte-morphing" : ""} ${typing ? "byte-typing" : ""}`}
      style={{ overflow: "visible" }}
    >
      {pixels.map((p, i) => (
        <rect
          key={i}
          width="1"
          height="1"
          className={p.k ? `byte-${p.k}` : undefined}
          style={{
            transform: `translate(${p.x}px, ${p.y}px)`,
            fill: p.c,
            opacity: p.hidden ? 0 : 1,
            // Stagger the pixels so the morph looks like a swarm, not a slide.
            transitionDelay: morphing ? `${(i * 37) % 180}ms` : undefined,
          }}
        />
      ))}
    </svg>
  );
}

export default memo(PixelSprite);
