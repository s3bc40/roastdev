/**
 * Bar fill colors indexed by answer position.
 * Leading answer gets brand orange, second gets gold, rest fall to grey tones.
 */
export const BAR_COLORS = [
  'var(--rd-brand)',
  'var(--rd-accent)',
  'var(--rd-muted)',
  '#444',
];

/**
 * Compute the vote percentage for one answer from raw server results.
 *
 * The server emits { answerId, count }[] — no percentages.
 * The client derives them so the display layer stays decoupled from
 * whatever aggregation the server chooses to send.
 */
export function calcPct(results, answerId) {
  const total = results.reduce((sum, r) => sum + r.count, 0);
  if (total === 0) return 0;
  const found = results.find((r) => r.answerId === answerId);
  return Math.round(((found?.count ?? 0) / total) * 100);
}
