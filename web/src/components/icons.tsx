import type { SessionType } from "../lib/plan";

type IconProps = { size?: number; stroke?: number };

function Svg({ size = 24, stroke = 1.8, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export const ArrowRight = (p: IconProps) => (
  <Svg size={16} stroke={2.2} {...p}>
    <path d="M5 12h14" />
    <path d="M13 6l6 6-6 6" />
  </Svg>
);

export const ArrowLeft = (p: IconProps) => (
  <Svg size={16} stroke={2} {...p}>
    <path d="M19 12H5" />
    <path d="M11 18l-6-6 6-6" />
  </Svg>
);

export const Code = (p: IconProps) => (
  <Svg size={16} stroke={2} {...p}>
    <path d="M16 18l6-6-6-6" />
    <path d="M8 6l-6 6 6 6" />
  </Svg>
);

export const Info = (p: IconProps) => (
  <Svg size={20} stroke={2} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 8v5" />
    <path d="M12 16h.01" />
  </Svg>
);

const Swim = (p: IconProps) => (
  <Svg {...p}>
    <path d="M2 16c1.5 1.2 3 1.2 4.5 0s3-1.2 4.5 0 3 1.2 4.5 0 3-1.2 4.5 0" />
    <path d="M2 20c1.5 1.2 3 1.2 4.5 0s3-1.2 4.5 0 3 1.2 4.5 0 3-1.2 4.5 0" />
    <circle cx="15.5" cy="6" r="2" />
    <path d="M5 12l5-4 3 2 3-1" />
  </Svg>
);

const Run = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="14" cy="4.5" r="2" />
    <path d="M7 21l3-6 3 2v4" />
    <path d="M6 12l3-4 4 1 3 3 3 1" />
    <path d="M10 15l3-6" />
  </Svg>
);

const Rest = (p: IconProps) => (
  <Svg {...p}>
    <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />
  </Svg>
);

const Flag = (p: IconProps) => (
  <Svg {...p}>
    <path d="M5 21V4" />
    <path d="M5 4h11l-2 4 2 4H5" />
  </Svg>
);

export function SessionIcon({ type, ...p }: IconProps & { type: SessionType }) {
  if (type === "swim") return <Swim {...p} />;
  if (type === "rest") return <Rest {...p} />;
  if (type === "race") return <Flag {...p} />;
  return <Run {...p} />;
}
