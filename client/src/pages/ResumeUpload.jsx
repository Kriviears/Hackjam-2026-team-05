import { useState } from "react";
import { useNavigate } from "react-router-dom";
import StepIndicator from "../components/StepIndicator.jsx";
import DropZone from "../components/DropZone.jsx";

const inputClass =
  "w-full rounded-xl border border-line bg-white px-4 py-3 text-[15px] " +
  "placeholder:text-muted/60 focus:border-ps-blue focus:outline-none";

export default function ResumeUpload() {
  const [github, setGithub] = useState("");
  const navigate = useNavigate();
const handleFileSelected = async (file) => {
    const result = await uploadResume(file, github);
    const id = result.resume.id;
    sessionStorage.setItem("resumeId", id);
    await analyzeResume(id);
    if (result.resume.processingStatus !== "COMPLETED") {
      // poll getResumeStatus(id) every 2s until COMPLETED 
    }
  };
  return (
    <main className="mx-auto min-h-screen max-w-2xl px-6 py-12">
      <StepIndicator current={1} />

      <header className="mt-12 text-center">
        <p className="microtype text-muted">Step 02 — Resume</p>
        <h1 className="mt-2 font-display text-4xl font-black tracking-tight">
          Let's see what you're working with
        </h1>
        <p className="mx-auto mt-3 max-w-md text-muted">
          Add your GitHub and upload your resume — we'll suggest the roles
          you're closest to. No pigeonholing, the AI reads you first.
        </p>
      </header>

      <div className="mt-10 space-y-4">
        <div>
          <label htmlFor="github" className="microtype mb-1.5 block text-muted">
            Add your GitHub — required for your assessment
          </label>
          <input
            id="github"
            className={inputClass}
            placeholder="github.com/yourusername"
            value={github}
            onChange={(e) => setGithub(e.target.value)}
          />
        </div>

        {github.trim() ? (
          <DropZone onParsed={() => navigate("/careers")} />
        ) : (
          <div className="rounded-2xl border-2 border-dashed border-line bg-white/50 p-10 text-center opacity-60">
            <p className="text-lg font-semibold text-muted">
              Enter your GitHub to unlock resume upload
            </p>
            <p className="microtype mt-2 text-muted">
              We scan public repos as part of your assessment
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
