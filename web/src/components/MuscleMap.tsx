import Model, { type IExerciseData } from "react-body-highlighter";
import type { Drill } from "../lib/drills";

// Accent, getting lighter as more drills hit the same muscle.
const SHADES = ["#23be4c", "#5fe082", "#b4f5c6"];

/**
 * Front and back body maps with every muscle the given drills work lit up,
 * brighter where several drills overlap. Drawn by react-body-highlighter.
 */
export default function MuscleMap({ drills, size = 120, label }: { drills: Drill[]; size?: number; label: string }) {
  const data: IExerciseData[] = drills.map((d) => ({ name: d.name, muscles: d.muscles }));
  const svgStyle = { width: size, height: "auto" };
  return (
    <figure className="muscle-map" role="img" aria-label={label}>
      <Model type="anterior" data={data} bodyColor="#2b323b" highlightedColors={SHADES} svgStyle={svgStyle} />
      <Model type="posterior" data={data} bodyColor="#2b323b" highlightedColors={SHADES} svgStyle={svgStyle} />
    </figure>
  );
}
