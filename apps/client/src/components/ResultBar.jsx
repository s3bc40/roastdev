/**
 * One result row: label, percentage text, and animated fill bar.
 *
 * Props:
 *   label — answer text
 *   pct   — number 0–100 (computed by the parent from raw vote counts)
 *   color — CSS variable string for the fill, e.g. 'var(--rd-brand)'
 *
 * The `width` inline style is the only dynamic value that touches JSX style
 * in the whole app — it's a number, not a color, so it cannot live in CSS.
 * Every color stays in CSS variables.
 */
export default function ResultBar({ label, pct, color }) {
  return (
    <div className="result-row">
      <div className="result-meta">
        <span className="result-label">{label}</span>
        <span className="result-pct" style={{ color }}>
          {pct}%
        </span>
      </div>
      <div className="result-track">
        <div
          className="result-fill"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}
