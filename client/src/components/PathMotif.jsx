/**
 * Representative brand image for the landing hero: an upward
 * path-of-steps motif in Per Scholas blues with one gold milestone.
 * Pure SVG — no image assets, no licensing, loads instantly.
 */
export default function PathMotif({ className = "" }) {
  return (
    <svg
      viewBox="0 0 420 340"
      className={className}
      role="img"
      aria-label="An ascending path of steps leading to a highlighted milestone"
    >
      {/* soft backdrop */}
      <circle cx="300" cy="110" r="95" fill="#DEEDF2" />
      <circle cx="90" cy="270" r="60" fill="#C8E3EC" opacity="0.7" />

      {/* ascending steps */}
      <rect x="30" y="270" width="90" height="40" rx="8" fill="#09507C" />
      <rect x="130" y="220" width="90" height="90" rx="8" fill="#0079C0" />
      <rect x="230" y="160" width="90" height="150" rx="8" fill="#009CDB" />

      {/* the milestone step — gold, the one you're climbing toward */}
      <rect x="330" y="90" width="70" height="220" rx="8" fill="#FEC14F" />
      <circle cx="365" cy="66" r="16" fill="#02273e" />
      <path
        d="M358 66 l5 5 l9 -10"
        stroke="#FEC14F"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* dotted climb line */}
      <path
        d="M60 258 C 120 240, 150 210, 172 205 C 220 190, 240 160, 272 148 C 300 136, 330 110, 358 92"
        stroke="#02273e"
        strokeWidth="2.5"
        strokeDasharray="1 8"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
