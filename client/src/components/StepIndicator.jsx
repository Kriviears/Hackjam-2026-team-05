import { useNavigate } from "react-router-dom";

const STEPS = [
  { label: "Sign in", path: "/" },
  { label: "Resume", path: "/upload" },
  { label: "Roles", path: "/careers" },
  { label: "Optimize", path: "/optimize" },
  { label: "Report", path: "/report" },
];

/**
 * Horizontal progress strip. `current` is the zero-based active step.
 * Completed steps are clickable (back-navigation); locked steps are not —
 * the complete | active | locked vocabulary gates movement.
 */
export default function StepIndicator({ current = 1 }) {
  const navigate = useNavigate();

  return (
    <nav aria-label="Progress" className="flex items-center justify-center gap-2">
      {STEPS.map((step, i) => {
        const status = i < current ? "complete" : i === current ? "active" : "locked";
        const isClickable = status === "complete";

        return (
          <div key={step.label} className="flex items-center gap-2">
            <button
              onClick={() => isClickable && navigate(step.path)}
              disabled={!isClickable}
              className={
                "flex items-center gap-1.5 " +
                (isClickable ? "cursor-pointer hover:opacity-70" : "cursor-default")
              }
            >
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
                {step.label}
              </span>
            </button>
            {i < STEPS.length - 1 && (
              <span className={"h-px w-6 " + (i < current ? "bg-ps-teal" : "bg-ink/15")} />
            )}
          </div>
        );
      })}
    </nav>
  );
}