import { useState } from "react";
import { useNavigate } from "react-router-dom";

const inputClass =
  "w-full rounded-xl border border-line bg-white px-4 py-3 text-[15px] " +
  "placeholder:text-muted/60 focus:border-ps-blue focus:outline-none";

/**
 * Two-step card: (1) sign in, (2) confirm completion.
 * Verification lives inside the card so the flow stays one screen.
 * Swap the fake submit for services/api.js calls when the backend lands.
 */
export default function SignInCard() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    name: "",
    email: "",
    date: "",
    discipline: "Software Engineering",
  });
  const navigate = useNavigate();

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  return (
    <div className="w-full max-w-md rounded-2xl border border-line bg-white p-8 shadow-sm">
      <p className="microtype text-muted">
        Step 01 — {step === 0 ? "Sign in" : "Verify"}
      </p>
      <h2 className="mt-2 font-display text-2xl font-extrabold tracking-tight">
        {step === 0 ? "Welcome back, graduate" : "Confirm your completion"}
      </h2>

      {step === 0 ? (
        <div className="mt-6 space-y-4">
          <div>
            <label htmlFor="name" className="microtype mb-1.5 block text-muted">
              Full name
            </label>
            <input id="name" className={inputClass} placeholder="Jordan Rivera" value={form.name} onChange={set("name")} />
          </div>
          <div>
            <label htmlFor="email" className="microtype mb-1.5 block text-muted">
              Email
            </label>
            <input id="email" type="email" className={inputClass} placeholder="you@example.com" value={form.email} onChange={set("email")} />
          </div>
          <button
            onClick={() => setStep(1)}
            className="mt-2 w-full rounded-xl bg-ps-navy py-3.5 font-semibold text-white transition-colors hover:bg-ps-blue-dark"
          >
            Sign in <span className="text-ps-gold">→</span>
          </button>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          <div>
            <label htmlFor="date" className="microtype mb-1.5 block text-muted">
              Completion date
            </label>
            <input id="date" type="date" className={inputClass} value={form.date} onChange={set("date")} />
          </div>
          <div>
            <label className="microtype mb-1.5 block text-muted">Discipline</label>
            <div className="flex items-center justify-between rounded-xl border border-line bg-bg-warm px-4 py-3">
              <span className="text-[15px] font-medium">{form.discipline}</span>
              <span className="microtype rounded-md bg-tint-blue px-2 py-1 text-ps-blue-dark">
                ✓ Pre-selected
              </span>
            </div>
          </div>
          <button
            onClick={() => navigate("/upload")}
            className="mt-2 w-full rounded-xl bg-ps-navy py-3.5 font-semibold text-white transition-colors hover:bg-ps-blue-dark"
          >
            Verify &amp; continue <span className="text-ps-gold">→</span>
          </button>
          <button
            onClick={() => setStep(0)}
            className="w-full text-center text-sm text-muted hover:text-ink"
          >
            ← Back
          </button>
        </div>
      )}
    </div>
  );
}
