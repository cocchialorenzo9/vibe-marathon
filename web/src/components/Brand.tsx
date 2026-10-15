export default function Brand() {
  return (
    <span className="brand">
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
        <path
          d="M3 20 L10 8 L15 16 L19 10 L25 20"
          stroke="var(--accent)"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="25" cy="20" r="2.4" fill="var(--accent)" />
      </svg>
      <span className="brand-word">
        VIBE<span>/</span>MARATHON
      </span>
    </span>
  );
}
