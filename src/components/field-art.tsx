export function FieldArt() {
  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className="absolute inset-0 h-full w-full"
      aria-hidden="true"
    >
      <rect width="100" height="100" fill="var(--color-grass)" />
      <g fill="var(--color-grass-deep)" opacity="0.5">
        <rect y="0" width="100" height="5.5" />
        <rect y="11" width="100" height="5.5" />
        <rect y="22" width="100" height="5" />
      </g>
      <path
        d="M5 32 Q50 7 95 32"
        fill="none"
        stroke="var(--color-chalk)"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <line x1="50" y1="94" x2="8" y2="30" stroke="var(--color-chalk)" strokeWidth="0.8" />
      <line x1="50" y1="94" x2="92" y2="30" stroke="var(--color-chalk)" strokeWidth="0.8" />
      <polygon points="50,94 78,70 50,48 22,70" fill="var(--color-dirt)" />
      <polygon points="50,86 68,70 50,56 32,70" fill="var(--color-grass)" />
      <polygon points="50,86 68,70 50,56 32,70" fill="none" stroke="var(--color-chalk)" strokeWidth="0.7" />
      <ellipse cx="50" cy="66" rx="5.4" ry="3.6" fill="var(--color-dirt-deep)" />
      <rect x="48.4" y="65.2" width="3.2" height="1.2" fill="var(--color-chalk)" />
      <polygon points="50,45.6 52.3,47.4 50,49.2 47.7,47.4" fill="var(--color-chalk)" />
      <polygon points="78,68.2 80.3,70 78,71.8 75.7,70" fill="var(--color-chalk)" />
      <polygon points="22,68.2 24.3,70 22,71.8 19.7,70" fill="var(--color-chalk)" />
      <polygon points="50,91.4 47.4,91.4 47.4,93.6 50,96 52.6,93.6 52.6,91.4" fill="var(--color-chalk)" />
    </svg>
  );
}
