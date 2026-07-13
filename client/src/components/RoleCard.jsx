import * as icons from "lucide-react";

export default function RoleCard({ role, selected, onSelect }) {
  const Icon = icons[role.lucideIcon] ?? icons.Briefcase;

  return (
    <button
      onClick={onSelect}
      className={
  "rounded-2xl border bg-white p-6 text-left transition-all " +
  (selected
    ? "border-2 border-ps-gold shadow-md"
    : "border-line hover:border-ps-blue/40 hover:shadow-sm")

      }
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-tint-blue">
        <Icon className="h-5 w-5 text-ps-blue-dark" />
      </div>
      <h3 className="mt-4 font-display text-lg font-extrabold">{role.Title}</h3>
      <p className="mt-1 text-sm text-muted line-clamp-3">{role.Description}</p>
      <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
        <span className="text-sm font-bold">
  {role.salaryMin != null && role.salaryMax != null
    ? `$${(role.salaryMin / 1000).toFixed(0)}k – $${(role.salaryMax / 1000).toFixed(0)}k`
    : "—"}
</span>
      </div>
    </button>
  );
}