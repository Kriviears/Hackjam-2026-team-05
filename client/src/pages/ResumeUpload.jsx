import { useState } from "react";
import { useNavigate } from "react-router-dom";
import StepIndicator from "../components/StepIndicator.jsx";
import DropZone from "../components/DropZone.jsx";
import RoleSuggestions from "../components/RoleSuggestions.jsx";

const inputClass =
  "w-full rounded-xl border border-line bg-white px-4 py-3 text-[15px] " +
  "placeholder:text-muted/60 focus:border-ps-blue focus:outline-none";

export default function ResumeUpload() {
  const [parsed, setParsed] = useState(false);
  const [github, setGithub] = useState("");
  const navigate = useNavigate();

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-6 py-12">
      <StepIndicator current={1} />

      <header className="mt-12 text-center">
        <p className="microtype text-muted">Step 02 — Resume</p>
        <h1 className="mt-2 font-display text-4xl font-black tracking-tight">
          Let's see what you're working with
        </h1>
        <p className="mx-auto mt-3 max-w-md text-muted">
          Upload your resume and we'll suggest the roles you're closest to —
          no pigeonholing, the AI reads you first.
        </p>
      </header>

      <div className="mt-10 space-y-4">
        {!parsed ? (
          <>
            <DropZone onParsed={() => setParsed(true)} />

            <div>
              <label htmlFor="github" className="microtype mb-1.5 block text-muted">
                Add your GitHub — optional, improves your assessment
              </label>
              <input
                id="github"
                className={inputClass}
                placeholder="github.com/yourusername"
                value={github}
                onChange={(e) => setGithub(e.target.value)}
              />
            </div>
          </>
        ) : (
          <div className="rounded-2xl border border-line bg-white p-6 shadow-sm">
            <RoleSuggestions
              onSelect={(role) => {
                // hand off to roadmap generation — next screen in the flow
                console.log("Selected role:", role, "GitHub:", github);
                navigate("/"); // TODO: replace with /roadmap when built
              }}
            />
          </div>
        )}
      </div>
    </main>
  );
}
