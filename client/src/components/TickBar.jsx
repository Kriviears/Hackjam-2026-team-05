/**
 * Segmented tick gauge — the app's signature metric component.
 * A flex row of N divs; each tick's color is interpolated between
 * four stops (red → orange → gold → green) by position. The marker
 * is absolutely positioned at `score`% — no chart library.
 */
const STOPS = [
  [229, 72, 77], // red
  [245, 136, 50], // ps-orange
  [254, 193, 79], // ps-gold
  [47, 158, 95], // green
];

function tickColor(t) {
  const seg = t * (STOPS.length - 1);
  const i = Math.min(Math.floor(seg), STOPS.length - 2);
  const f = seg - i;
  const c = STOPS[i].map((v, k) => Math.round(v + (STOPS[i + 1][k] - v) * f));
  return `rgb(${c.join(",")})`;
}

export default function TickBar({
  score = 0,
  ticks = 48,
  height = "h-4",
  labels = null, // e.g. ["Getting started", "Job-ready"]
}) {
  return (
    <div>
      <div className="relative pt-3">
        <div
          className="absolute top-0 -translate-x-1/2 transition-[left] duration-700 ease-out"
          style={{ left: `${score}%` }}
          aria-hidden="true"
        >
          <div className="h-0 w-0 border-l-[5px] border-r-[5px] border-t-[7px] border-l-transparent border-r-transparent border-t-ink" />
        </div>
        <div
          className="flex items-end justify-between gap-[3px]"
          role="meter"
          aria-valuenow={score}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          {Array.from({ length: ticks }).map((_, i) => (
            <div
              key={i}
              className={`w-[3px] rounded-full ${height}`}
              style={{ backgroundColor: tickColor(i / (ticks - 1)) }}
            />
          ))}
        </div>
      </div>
      {labels && (
        <div className="mt-1.5 flex justify-between">
          <span className="microtype text-muted">{labels[0]}</span>
          <span className="microtype text-muted">{labels[1]}</span>
        </div>
      )}
    </div>
  );
}
