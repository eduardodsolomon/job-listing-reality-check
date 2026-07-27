interface PointBadgeProps {
  points: number | null;
  neutralLabel?: string;
}

function badgeClasses(
  points: number | null,
): string {
  if (points === null || points === 0) {
    return "border-blue-700 bg-blue-100 text-blue-950";
  }

  if (points > 0) {
    return "border-emerald-700 bg-emerald-100 text-emerald-950";
  }

  return "border-red-700 bg-red-100 text-red-950";
}

function pointLabel(
  points: number | null,
  neutralLabel: string,
): string {
  if (points === null) {
    return neutralLabel;
  }

  const rounded = Math.ceil(points);

  if (rounded > 0) {
    return `+${rounded}`;
  }

  return String(rounded);
}

export default function PointBadge({
  points,
  neutralLabel = "Check",
}: PointBadgeProps) {
  return (
    <span
      aria-label={
        points === null
          ? neutralLabel
          : `${pointLabel(points, neutralLabel)} points`
      }
      className={`inline-flex h-11 min-w-11 shrink-0 items-center justify-center rounded-full border-2 px-2 text-sm font-black ${badgeClasses(
        points,
      )}`}
    >
      {pointLabel(
        points,
        neutralLabel,
      )}
    </span>
  );
}
