import StepIndicator from "../components/StepIndicator.jsx";
import GaugeCard from "../components/GaugeCard.jsx";
import ActionCard from "../components/ActionCard.jsx";

const MOCK_REPORT = {
  ReadinessScore: 67,
  PersonalizedActionList: [
    { lucideIcon: "FolderGit2", type: "PORTFOLIO", title: "Ship one more portfolio project", description: "A TypeScript build rounds out your profile." },
    { lucideIcon: "Users", type: "COMMUNITY", title: "Per Scholas Alumni Hackathon", description: "Team build weekend — great portfolio fuel." },
    { lucideIcon: "Mic", type: "INTERVIEW", title: "Complete 3 mock interviews", description: "Practice behavioral + technical with alumni." },
    { lucideIcon: "Linkedin", type: "PROFILE", title: "Request 2 LinkedIn recommendations", description: "Ask instructors or capstone teammates." },
  ],
  MileStones: [
    { Title: "Resume Analysis", Status: "complete" },
    { Title: "Career Match", Status: "complete" },
    { Title: "Resume Optimization", Status: "active" },
    { Title: "Job-Ready Review", Status: "locked" },
  ],
};

const statusStyles = {
  complete: "text-ps-teal",
  active: "text-ps-gold font-bold",
  locked: "text-muted",
};

export default function ReadinessReport() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <StepIndicator current={4} />

      <header className="mt-12">
        <p className="microtype text-muted">Readiness Report</p>
        <h1 className="mt-2 font-display text-4xl font-black tracking-tight">
          You're building real momentum.
        </h1>
      </header>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_40%]">
        <GaugeCard
          title="Readiness Score"
          score={MOCK_REPORT.ReadinessScore}
          leftLabel="Getting started"
          rightLabel="Job-ready"
          footer="Based on: resume + career match analysis"
        />

        <div className="rounded-2xl border border-line bg-white p-6 shadow-sm">
          <p className="microtype text-muted">Milestones</p>
          <div className="mt-2">
            {MOCK_REPORT.MileStones.map((m) => (
              <div key={m.Title} className="flex items-center justify-between border-b border-line py-3 last:border-0">
                <span className="font-medium">{m.Title}</span>
                <span className={"microtype " + statusStyles[m.Status]}>{m.Status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <p className="microtype mt-10 text-muted">Your personalized action list</p>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        {MOCK_REPORT.PersonalizedActionList.map((item) => (
          <ActionCard key={item.title} {...item} />
        ))}
      </div>
    </main>
  );
}