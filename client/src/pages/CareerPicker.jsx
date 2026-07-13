// client/src/pages/CareerPicker.jsx
import RoleCard from "../components/RoleCard.jsx";
import StepIndicator from "../components/StepIndicator.jsx";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { getCareerRecommendations } from "../services/api"

const DUMMY_ROLES = [
  { lucideIcon: "Palette", Title: "Creative Technologist", Description: "Blend design and code to ship interactive experiences.", averageSalary: 112000 },
  { lucideIcon: "Code", Title: "Frontend Engineer", Description: "Build the interfaces users touch every day.", averageSalary: 100000 },
  { lucideIcon: "Sparkles", Title: "AI Product Designer", Description: "Design and prototype workflows powered by generative AI.", averageSalary: 120000 },
  { lucideIcon: "Layout", Title: "UX Engineer", Description: "Bridge design systems and production code.", averageSalary: 107000 },
  { lucideIcon: "Megaphone", Title: "Brand Designer", Description: "Own visual identity across product and campaign.", averageSalary: 85000 },
  { lucideIcon: "Film", Title: "Motion Designer", Description: "Bring interfaces and stories to life with animation.", averageSalary: 90000 },
  { lucideIcon: "PenTool", Title: "Art Director", Description: "Lead creative vision from concept to delivery.", averageSalary: 102000 },
  { lucideIcon: "Rocket", Title: "Product Manager", Description: "Drive what gets built and why.", averageSalary: 117000 },
  { lucideIcon: "GraduationCap", Title: "Technical Instructor", Description: "Teach the next cohort what you just learned.", averageSalary: 77000 },];

export default function CareerPicker() {
  const [roles, setRoles] = useState([]);

  useEffect(() => {
    const resumeId = sessionStorage.getItem("resumeId");
    if (!resumeId) return;
    getCareerRecommendations(resumeId)
      .then(setRoles)
      .catch((err) => console.warn("Recommendations failed:", err.message));
  }, []);
  const [selected, setSelected] = useState(null);
  const navigate = useNavigate();

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <StepIndicator current={2} />

      <header className="mt-12 text-center">
        <p className="microtype text-muted">Step 03 — Choose your target</p>
        <h1 className="mt-2 font-display text-4xl font-black tracking-tight">
          Pick your Dream Career Position
        </h1>
        <p className="mx-auto mt-3 max-w-md text-muted">
          Based on your resume — your roadmap adapts to the role you're aiming for.
        </p>
      </header>

       <div className="mt-8 grid gap-4 md:grid-cols-3">
      {roles.map((role) => (
        <RoleCard
          key={role.Title}
          role={role}
          selected={selected === role.Title}
          onSelect={() => setSelected(role.Title)}
        />
      ))}
    </div>

      <button
        disabled={!selected}
       onClick={() => {
          const chosen = roles.find((r) => r.Title === selected);
          sessionStorage.setItem("selectedCareer", JSON.stringify(chosen));
          navigate("/optimize");
        }}
        className="mt-8 w-full rounded-xl bg-ps-navy py-3.5 font-semibold text-white transition-colors hover:bg-ps-blue-dark disabled:cursor-not-allowed disabled:opacity-40"
      >
        Continue to resume optimization <span className="text-ps-gold">→</span>
      </button>
    </main>
  );
}
