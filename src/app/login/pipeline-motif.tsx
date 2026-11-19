/**
 * Decorative: six pipeline lanes in turquoise hairlines. Lanes fade in one by one, then a single deal card
 * hops lane to lane toward «موفق» (the leftmost lane, since the pipeline reads right to left) and loops.
 * Login is seen rarely, so this is where the product spends its delight budget; static under reduced motion.
 */
export function PipelineMotif({ className }: { className?: string }) {
  const lanes = 6;
  const cards = [
    [0, 1, 2, 3],
    [1, 2],
    [0, 2, 3],
    [1, 3],
    [0, 2],
    [1],
  ];
  return (
    <svg viewBox="0 0 600 720" preserveAspectRatio="xMidYMin slice" aria-hidden className={className}>
      <defs>
        <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="oklch(0.21 0.02 220)" stopOpacity="0" />
          <stop offset="0.75" stopColor="oklch(0.21 0.02 220)" stopOpacity="0.85" />
          <stop offset="1" stopColor="oklch(0.21 0.02 220)" />
        </linearGradient>
      </defs>
      {Array.from({ length: lanes }, (_, i) => {
        const x = 40 + i * 92;
        return (
          <g key={i} className="animate-rise" style={{ animationDuration: "700ms", animationDelay: `${(lanes - 1 - i) * 90}ms` }}>
            <rect x={x} y={48} width={80} height={640} rx={10} fill="none" stroke="oklch(0.62 0.09 196 / 0.28)" />
            <rect x={x + 10} y={62} width={34} height={6} rx={3} fill="oklch(0.62 0.09 196 / 0.45)" />
            {cards[i].map((slot) => (
              <g key={slot}>
                <rect x={x + 8} y={86 + slot * 74} width={64} height={60} rx={7} fill="oklch(0.62 0.09 196 / 0.08)" stroke="oklch(0.62 0.09 196 / 0.35)" />
                <rect x={x + 16} y={98 + slot * 74} width={40} height={5} rx={2.5} fill="oklch(0.85 0.04 196 / 0.55)" />
                <rect x={x + 16} y={110 + slot * 74} width={26} height={4} rx={2} fill="oklch(0.85 0.04 196 / 0.3)" />
                <circle cx={x + 60} cy={132 + slot * 74} r={4} fill="oklch(0.62 0.09 196 / 0.6)" />
              </g>
            ))}
          </g>
        );
      })}
      {/* The travelling deal: starts in the first stage, slot 4 (free in every lane). */}
      <g className="motion-travel animate-travel">
        <rect x={40 + 5 * 92 + 8} y={86 + 4 * 74} width={64} height={60} rx={7} fill="oklch(0.62 0.09 196 / 0.22)" stroke="oklch(0.72 0.1 196 / 0.9)" />
        <rect x={40 + 5 * 92 + 16} y={98 + 4 * 74} width={40} height={5} rx={2.5} fill="oklch(0.92 0.04 196 / 0.85)" />
        <rect x={40 + 5 * 92 + 16} y={110 + 4 * 74} width={26} height={4} rx={2} fill="oklch(0.92 0.04 196 / 0.5)" />
        <circle cx={40 + 5 * 92 + 60} cy={132 + 4 * 74} r={4} fill="oklch(0.78 0.12 196)" />
      </g>
      <rect width="600" height="720" fill="url(#fade)" />
    </svg>
  );
}
