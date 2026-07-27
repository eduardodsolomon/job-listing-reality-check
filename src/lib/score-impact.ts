import type {
  Signal,
} from "./analysis-types";

export function signalScoreImpact(
  signal: Signal,
): number {
  const rawImpact =
    signal.target === "confidence"
      ? signal.points
      : -signal.points;

  return Math.ceil(rawImpact);
}

export function clampScore(
  value: number,
): number {
  return Math.min(
    100,
    Math.max(
      0,
      Math.ceil(value),
    ),
  );
}
