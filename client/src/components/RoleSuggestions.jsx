import { useState } from "react";
import TickBar from "./TickBar.jsx";

/**
 * AI-suggested roles after resume parsing. Mock data matches the
 * agreed contract: POST /resumes/parse → { suggestedRoles: [...] }.
 * The mini TickBar is the signature gauge at its smallest size.
 */
const MOCK_ROLES = [
  { role: "Frontend Engineer", match: 72, blurb: "Strong React + JavaScript signal in your projects." },
  { role: "Full-Stack Engineer", match: 61, blurb: "Express experience shows; deepen the data layer." },
  { role: "UI Engineer", match: 58, blurb: "Your design-tool skills stand out here." },
];

export default function RoleSuggestions({ onSelect }) {
  const [selected, setSelected] = useState(null);

  return (
    <div>
      <p className="microtype text-muted">Based on your resume</p>
      <h3 className="mt-1 font-display text-xl font-extrabold tracking-tight">
        Your strongest matches
      </h3>
      <div className="mt-4 grid gap-3">
        {MOCK_ROLES.map((r) => {
          const isSelected = selected === r.role;
          return (
            <button
              key={r.role}
              onClick={() => setSelected(r.role)}
              className={
                "rounded-2xl border bg-white p-5 text-left transition-all " +
                (isSelected
                  ? "border-2 border-ps-gold shadow-md"
                  : "border-line hover:border-ps-blue/40 hover:shadow-sm")
              }
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold">{r.role}</span>
                <span className="microtype rounded-md bg-tint-blue px-2 py-1 text-ps-blue-dark">
                  {r.match}% match
                </span>
              </div>
              <p className="mt-1 text-sm text-muted">{r.blurb}</p>
              <div className="mt-3">
                <TickBar score={r.match} ticks={40} height="h-2.5" />
              </div>
            </button>
          );
        })}
      </div>
      <button
        disabled={!selected}
        onClick={() => onSelect?.(selected)}
        className="mt-5 w-full rounded-xl bg-ps-navy py-3.5 font-semibold text-white transition-colors hover:bg-ps-blue-dark disabled:cursor-not-allowed disabled:opacity-40"
      >
        Generate my roadmap <span className="text-ps-gold">→</span>
      </button>
    </div>
  );
}
