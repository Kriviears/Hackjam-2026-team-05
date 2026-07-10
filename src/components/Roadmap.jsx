/**
 * Roadmap — the hero screen. Renders the milestone path for the
 * user's target role.
 *
 * Key decision: this page owns the PATH (nodes, connector lines,
 * layout); MilestoneCard only owns the CARD. Keeping the path out
 * of the card means the same card can live in other layouts later
 * (e.g. the dashboard summary list) without dragging line logic along.
 *
 * Data: mocked for now in the same shape Keoki's GET /roadmap/:id
 * will return — swap the const for a service call, nothing else changes.
 */
import MilestoneCard from "../components/MilestoneCard.jsx";

export default function Roadmap() {
  return (
    <div>
      <MilestoneCard />
    </div>
  );
}