import PathMotif from "../components/PathMotif.jsx";
import SignInCard from "../components/SignInCard.jsx";

export default function Landing() {
  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 py-16">
      <div className="grid items-center gap-14 lg:grid-cols-2">
        {/* Left — the pitch */}
        <div>
          <span className="microtype inline-flex items-center gap-2 rounded-full border border-ps-gold/50 bg-ps-gold/10 px-3.5 py-1.5 text-ink">
            <span className="h-1.5 w-1.5 rounded-full bg-ps-gold" />
            For verified graduates
          </span>

          <h1 className="mt-6 font-display text-5xl font-black leading-[1.05] tracking-tight lg:text-6xl">
            Your path from graduate to{" "}
            <span className="text-ps-blue">hired</span> — and beyond.
          </h1>

          <p className="mt-6 max-w-md text-lg leading-relaxed text-muted">
            Verify your completion, upload your resume, and get a personalized
            roadmap that unlocks one milestone at a time. You're not missing
            things — you're building toward the career you want.
          </p>

          <div className="mt-8 flex items-center gap-8">
            <div>
              <p className="font-display text-3xl font-black">35K+</p>
              <p className="microtype mt-1 text-muted">Alumni trained</p>
            </div>
            <div className="h-10 w-px bg-line" />
            <div>
              <p className="font-display text-3xl font-black">4</p>
              <p className="microtype mt-1 text-muted">Milestones to ready</p>
            </div>
          </div>

          <PathMotif className="mt-10 w-full max-w-sm" />
        </div>

        {/* Right — sign in */}
        <div className="flex justify-center lg:justify-end">
          <SignInCard />
        </div>
      </div>
    </main>
  );
}
