export default function DateField({
  label,
  name,
  defaultValue = "",
  maxWidth = "max-w-xs",
}) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-medium text-lavender">{label}</span>
      <div className={`relative ${maxWidth}`}>
        <input
          type="date"
          name={name}
          defaultValue={defaultValue}
          className="w-full cursor-pointer rounded-2xl border border-sage/35 bg-pakistan-green/90 px-4 py-3 pr-11 text-lavender outline-none transition focus:border-royal-purple focus:ring-2 focus:ring-royal-purple/30"
        />
        <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-sage">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="h-5 w-5"
            aria-hidden="true"
          >
            <rect x="3" y="5" width="18" height="16" rx="3" />
            <path d="M8 3v4M16 3v4M3 11h18" />
          </svg>
        </span>
      </div>
    </label>
  );
}
