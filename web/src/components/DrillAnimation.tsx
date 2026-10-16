import { useEffect, useRef, useState } from "react";
import { DRILL_BY_KIND, cycleMs, motionProps, poseAt, type Box, type DrillKind, type Limb } from "../lib/drills";

const f1 = (n: number) => Math.round(n * 10) / 10;
const path = (pts: [number, number][]) => "M" + pts.map((q) => `${f1(q[0])} ${f1(q[1])}`).join(" L");

const reducedMotion = () => {
  try {
    return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
  } catch {
    return false;
  }
};

/** Loop time in ms; runs only while the figure is on screen and motion is allowed. */
function useLoopClock(ref: React.RefObject<Element>, start: number) {
  const [t, setT] = useState(start);
  useEffect(() => {
    if (reducedMotion()) return;
    let raf = 0;
    let last = 0;
    let origin = -1;
    let visible = typeof IntersectionObserver === "undefined";
    const tick = (ts: number) => {
      if (origin < 0) origin = ts - start;
      if (ts - last > 33) {
        last = ts;
        setT(ts - origin);
      }
      raf = requestAnimationFrame(tick);
    };
    const run = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
      origin = -1;
    };
    const io =
      typeof IntersectionObserver === "undefined"
        ? null
        : new IntersectionObserver(([e]) => {
            visible = e.isIntersecting;
            if (visible) run();
            else stop();
          });
    if (io && ref.current) io.observe(ref.current);
    if (visible) run();
    return () => {
      stop();
      io?.disconnect();
    };
  }, [ref, start]);
  return t;
}

function Prop({ box, fill }: { box?: Box; fill?: string }) {
  if (!box) return null;
  return (
    <rect
      x={box.x}
      y={box.y}
      width={box.w}
      height={box.h}
      rx={box.w > 4 ? 2 : 1}
      fill={fill ?? "#1e242b"}
      stroke={fill ? "none" : "#3a434e"}
      strokeWidth={1}
    />
  );
}

/** A looping stick figure doing one drill; the working limbs are drawn in the accent colour. */
export default function DrillAnimation({ kind, accent = "var(--accent)" }: { kind: DrillKind; accent?: string }) {
  const ref = useRef<SVGSVGElement>(null);
  const t = useLoopClock(ref, cycleMs(kind) * 0.25);
  const P = poseAt(kind, t);
  const { p1, p2, hi } = motionProps(kind);
  const col = (part: Limb, base: string) => (hi.includes(part) ? accent : base);

  const lowest = Math.max(P.F1[1], P.F2[1], P.T1[1], P.T2[1]);
  const air = Math.max(0, 108 - lowest);
  const limb = { fill: "none", strokeLinecap: "round", strokeLinejoin: "round" } as const;

  return (
    <svg
      ref={ref}
      className="drill-anim"
      viewBox="0 -16 120 132"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label={`${DRILL_BY_KIND[kind].name} animation`}
    >
      <rect x={0} y={110} width={120} height={1.5} fill="#2e3540" />
      <ellipse cx={f1((P.F1[0] + P.F2[0]) / 2 + 2)} cy={111.5} rx={f1(Math.max(6, 18 - air * 0.6))} ry={2.6} fill="#1e242b" />
      <Prop box={p1} fill={kind === "lateral" ? accent : undefined} />
      <Prop box={p2} />
      <path d={path([P.P, P.K2, P.F2, P.T2])} stroke={col("legFar", "#5e6a78")} strokeWidth={4.6} {...limb} />
      <path d={path([P.N, P.E2, P.W2])} stroke="#5e6a78" strokeWidth={4} {...limb} />
      <path d={path([P.H, P.N, P.P])} stroke={col("torso", "#eef2f5")} strokeWidth={5.4} {...limb} />
      <path d={path([P.P, P.K1, P.F1, P.T1])} stroke={col("legNear", "#eef2f5")} strokeWidth={4.6} {...limb} />
      <path d={path([P.N, P.E1, P.W1])} stroke="#eef2f5" strokeWidth={4} {...limb} />
      <circle cx={f1(P.H[0])} cy={f1(P.H[1])} r={7} fill="#eef2f5" />
    </svg>
  );
}
