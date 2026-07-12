import TickBar from "./TickBar.jsx";

export default function GaugeCard({ title, score, footer, leftLabel, rightLabel }) {
  return (
    <div className="rounded-2xl border border-line bg-white shadow-sm">
      <div className="border-b border-line px-6 py-3">
        <span className="microtype text-muted">{title}</span>
      </div>
      <div className="p-6">
        <p className="font-display text-5xl font-black">{score}%</p>
        <div className="mt-5">
          <TickBar score={score} labels={[leftLabel, rightLabel]} />
        </div>
      </div>
      <div className="border-t border-line px-6 py-3 text-right">
        <span className="microtype text-muted">{footer}</span>
      </div>
    </div>
  );
}