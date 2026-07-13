import { useState, useEffect } from "react";
import { getResumeAnalysis } from "../services/api";
import { useNavigate } from "react-router-dom";
import StepIndicator from "../components/StepIndicator.jsx";
import GaugeCard from "../components/GaugeCard.jsx";
import KeywordChip from "../components/KeywordChip.jsx";

const MOCK_ANALYSIS = {
  ResumeTitle: "FrancisRutledge_Resume.pdf",
  ResumeUploadDate: "2026-07-11",
  MatchScore: 58,
  CareerChoice: "Frontend Engineer",
  Skills: ["React", "JavaScript", "HTML/CSS", "Git", "Figma"],
  MatchedKeywords: ["React", "JavaScript", "Git", "Responsive Design"],
  MissingKeywords: ["TypeScript", "Testing (Jest)", "Accessibility", "CI/CD"],
  SuggestedActions: [
    { Action: "Add a TypeScript project under Skills", Complete: false },
    { Action: "Quantify capstone impact — numbers beat adjectives", Complete: false },
    { Action: "Add a testing line — Jest unit tests count", Complete: false },
    { Action: "Note accessibility work (semantic HTML, ARIA)", Complete: false },
  ],
};

export default function ResumeOptimization() {
    const [analysis, setAnalysis] = useState(MOCK_ANALYSIS);

  useEffect(() => {
    const resumeId = sessionStorage.getItem("resumeId");
    const career = JSON.parse(sessionStorage.getItem("selectedCareer") || "null");
    if (!resumeId || !career) return;

    getResumeAnalysis(resumeId)
      .then((data) => {
        setAnalysis({
          ResumeTitle: data.resume.originalFileName,
          ResumeUploadDate: data.resume.uploadedAt?.slice(0, 10),
          MatchScore: career.matchScore,
          CareerChoice: career.Title,
          Skills: (data.skills ?? []).map((s) => s.name),
          MatchedKeywords: career.matchedSkills,
          MissingKeywords: career.missingSkills,
          SuggestedActions: career.missingSkills.map((skill) => ({
            Action: `Add evidence of ${skill} to your resume`,
            Complete: false,
          })),
        });
      })
      .catch((err) => console.warn("Analysis fetch failed:", err.message));
  }, []);
  const [checked, setChecked] = useState([]);
  const navigate = useNavigate();

  const toggle = (i) =>
    setChecked((c) => (c.includes(i) ? c.filter((x) => x !== i) : [...c, i]));

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <StepIndicator current={3} />
      <h1 className="mt-12 font-display text-4xl font-black tracking-tight">
        Resume Optimization
      </h1>

      <div className="mt-8 grid gap-6 lg:grid-cols-[35%_1fr]">
        {/* LEFT — resume summary */}
        <div className="rounded-2xl border border-line bg-white p-6 shadow-sm self-start">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-ps-gold/20 text-xl">📄</div>
          <p className="mt-4 font-semibold">{analysis.ResumeTitle}</p>
          <p className="microtype mt-1 text-muted">Uploaded {analysis.ResumeUploadDate}</p>

          <p className="microtype mt-6 text-muted">Skills detected</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {analysis.Skills.map((s) => (
              <span key={s} className="rounded-lg border border-line bg-bg-warm px-3 py-1.5 text-sm">{s}</span>
            ))}
          </div>

          <button
            onClick={() => navigate("/upload")}
            className="mt-6 w-full rounded-xl border border-line py-3 font-semibold hover:border-ps-blue/40"
          >
            ↻ Re-upload resume
          </button>
        </div>

        {/* RIGHT — analysis */}
        <div className="space-y-6">
          <GaugeCard
            title="Keyword Match Score"
            score={analysis.MatchScore}
            leftLabel="Weak match"
            rightLabel="Strong match"
            footer={`Based on: ${analysis.CareerChoice} requirements`}
          />

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <p className="microtype text-muted">✓ Keywords matched</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {analysis.MatchedKeywords.map((k) => (
                  <KeywordChip key={k} label={k} variant="matched" />
                ))}
              </div>
            </div>
            <div>
              <p className="microtype text-muted">⚠ Keywords to add</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {analysis.MissingKeywords.map((k) => (
                  <KeywordChip key={k} label={k} variant="missing" />
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-line bg-white p-6 shadow-sm">
            <p className="microtype text-muted">Suggested actions</p>
            <div className="mt-2">
              {analysis.SuggestedActions.map((a, i) => (
                <label key={i} className="flex items-start gap-3 border-b border-line py-3 last:border-0">
                  <input type="checkbox" checked={checked.includes(i)} onChange={() => toggle(i)} className="mt-1" />
                  <span className={checked.includes(i) ? "text-muted line-through" : ""}>{a.Action}</span>
                </label>
              ))}
            </div>
          </div>

          <button
            onClick={() => navigate("/report")}
            className="w-full rounded-xl bg-ps-blue py-3.5 font-semibold text-white hover:bg-ps-blue-dark"
          >
            ✓ Mark complete
          </button>
        </div>
      </div>
    </main>
  );
}