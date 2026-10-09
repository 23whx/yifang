export default function PlayIcon({ className = "h-3 w-3" }: { className?: string }) {
  return (
    <svg viewBox="0 0 12 12" className={className} fill="currentColor" aria-hidden>
      <path d="M2 1.5v9l8-4.5z" />
    </svg>
  );
}
