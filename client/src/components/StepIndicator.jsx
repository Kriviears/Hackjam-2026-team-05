const STEPS = ["Sign in", "Resume", "Roles", "Roadmap", "Report"];

/**
 * Horizontal progress strip. `current` is the zero-based active step.
 * Status vocabulary (complete | active | locked) matches MilestoneCard,
 * so the backend contract stays one shape across the app.
 */
export default function StepIndicator({ current = 1 }) {
  return (
    <nav aria-label="Progress" className="flex items-center justify-center gap-2">
      {STEPS.map((label, i) => {
        const status = i < current ? "complete" : i === current ? "active" : "locked";
        return (
          <div key={label} className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span
                className={
                  "flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold " +
                  (status === "complete"
                    ? "bg-ps-teal text-ps-navy"
                    : status === "active"
                    ? "bg-ps-gold text-ink ring-2 ring-ps-gold/40"
                    : "border border-dashed border-ink/20 text-muted")
                }
              >
                {status === "complete" ? "✓" : i + 1}
              </span>
              <span
                className={
                  "microtype " +
                  (status === "active"
                    ? "text-ink font-bold"
                    : status === "complete"
                    ? "text-muted"
                    : "text-ink/30")
                }
              >
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <span
                className={
                  "h-px w-6 " + (i < current ? "bg-ps-teal" : "bg-ink/15")
                }
              />
            )}
          </div>
        );
      })}
    </nav>
  );
}
