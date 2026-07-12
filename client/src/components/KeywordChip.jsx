const styles = {
  matched: "bg-tint-blue text-ps-blue-dark",
  missing: "bg-ps-orange/10 text-ps-orange",
};

export default function KeywordChip({ label, variant }) {
  return (
    <span className={"rounded-lg px-3 py-1.5 text-sm font-medium " + styles[variant]}>
      {label}
    </span>
  );
}