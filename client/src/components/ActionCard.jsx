import * as icons from "lucide-react";

export default function ActionCard({ lucideIcon, type, title, description }) {
  const Icon = icons[lucideIcon] ?? icons.Briefcase;
  return (
    <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-tint-blue">
          <Icon className="h-5 w-5 text-ps-blue-dark" />
        </div>
        <span className="microtype rounded-md bg-bg-warm border border-line px-2 py-1 text-muted">{type}</span>
      </div>
      <h3 className="mt-3 font-display text-lg font-extrabold">{title}</h3>
      <p className="mt-1 text-sm text-muted">{description}</p>
    </div>
  );
}