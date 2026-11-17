export type ByteMood = "normal" | "happy" | "think" | "sleep";

interface Props {
  mood: ByteMood;
  walking: boolean;
  /** Where the eyes look, each from -1 to 1. */
  look: { x: number; y: number };
}

const AMBER = "#ECA35F";
const GREEN = "#7FA88B";
const GREY = "#98A2AB";

/** Byte's drawing: a tiny terminal with legs. Pure SVG, animated with CSS in globals.css. */
export default function ByteBody({ mood, walking, look }: Props) {
  const dx = look.x * 2.5;
  const dy = look.y * 2;

  return (
    <svg
      viewBox="0 0 72 84"
      width="72"
      height="84"
      aria-hidden
      className={`byte-svg ${walking ? "byte-walking" : ""}`}
      style={{ overflow: "visible" }}
    >
      {/* Antenna */}
      <line x1="36" y1="16" x2="36" y2="7" stroke={GREEN} strokeWidth="2.5" strokeLinecap="round" />
      <circle className={mood === "think" ? "byte-antenna-blink" : ""} cx="36" cy="5" r="3.5" fill={GREEN} />

      {/* Legs (behind the body) */}
      <g className="byte-leg byte-leg-left">
        <line x1="21" y1="62" x2="21" y2="75" stroke={GREY} strokeWidth="3.5" strokeLinecap="round" />
        <rect x="14" y="74" width="13" height="5" rx="2.5" fill={GREY} />
      </g>
      <g className="byte-leg byte-leg-right">
        <line x1="51" y1="62" x2="51" y2="75" stroke={GREY} strokeWidth="3.5" strokeLinecap="round" />
        <rect x="45" y="74" width="13" height="5" rx="2.5" fill={GREY} />
      </g>

      <g className="byte-torso">
        {/* Body and screen */}
        <rect x="6" y="16" width="60" height="48" rx="9" fill="#1A2026" stroke={AMBER} strokeWidth="2.5" />
        <rect x="13" y="23" width="46" height="31" rx="3" fill="#080A0D" />
        <circle cx="59" cy="58.5" r="2" fill={GREEN} />

        {/* Face */}
        <g transform={`translate(${dx} ${dy})`}>
          {mood === "sleep" && (
            <>
              <line x1="21" y1="36" x2="29" y2="36" stroke={AMBER} strokeWidth="2.5" strokeLinecap="round" />
              <line x1="43" y1="36" x2="51" y2="36" stroke={AMBER} strokeWidth="2.5" strokeLinecap="round" />
              <circle cx="36" cy="46" r="2" fill="none" stroke={AMBER} strokeWidth="2" />
            </>
          )}
          {mood === "happy" && (
            <>
              <path d="M21 38 L25 33 L29 38" fill="none" stroke={AMBER} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M43 38 L47 33 L51 38" fill="none" stroke={AMBER} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M28 43 Q36 50 44 43" fill="none" stroke={AMBER} strokeWidth="2.5" strokeLinecap="round" />
            </>
          )}
          {mood === "think" && (
            <>
              <rect x="23" y="33" width="5" height="5" fill={AMBER} />
              <rect x="44" y="33" width="5" height="5" fill={AMBER} />
              <line x1="30" y1="46" x2="42" y2="46" stroke={AMBER} strokeWidth="2.5" strokeLinecap="round" />
            </>
          )}
          {mood === "normal" && (
            <>
              <g className="byte-eyes">
                <rect x="22" y="31" width="6" height="9" fill={AMBER} />
                <rect x="44" y="31" width="6" height="9" fill={AMBER} />
              </g>
              <path d="M28 45 Q36 50 44 45" fill="none" stroke={AMBER} strokeWidth="2.5" strokeLinecap="round" />
            </>
          )}
        </g>
      </g>
    </svg>
  );
}
