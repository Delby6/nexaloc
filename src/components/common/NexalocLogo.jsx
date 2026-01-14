import React from "react";

/**
 * NexalocLogo — Precise Network Node Mark
 *
 * - Exact centered geometry
 * - Correct inner spacing
 * - Clean, non-animated
 *
 * Props:
 *  - size: number (px)
 *  - withWordmark: boolean
 *  - className: string
 */
export default function NexalocLogo({
  size = 48,
  withWordmark = true,
  className = "",
}) {
  return (
    <div className={`flex items-center ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 200 200"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Outer Ring */}
        <circle
          cx="100"
          cy="100"
          r="78"
          fill="none"
          stroke="#2563eb"
          strokeWidth="14"
        />

        {/* Center Hub */}
        <circle cx="100" cy="100" r="18" fill="#2563eb" />

        {/* Top-left arm */}
        <line
          x1="100"
          y1="100"
          x2="65"
          y2="75"
          stroke="#2563eb"
          strokeWidth="10"
          strokeLinecap="round"
        />
        <circle cx="65" cy="75" r="10" fill="#2563eb" />

        {/* Top-right arm */}
        <line
          x1="100"
          y1="100"
          x2="135"
          y2="75"
          stroke="#2563eb"
          strokeWidth="10"
          strokeLinecap="round"
        />
        <circle cx="135" cy="75" r="10" fill="#2563eb" />

        {/* Bottom arm */}
        <line
          x1="100"
          y1="100"
          x2="100"
          y2="140"
          stroke="#2563eb"
          strokeWidth="10"
          strokeLinecap="round"
        />
        <circle cx="100" cy="140" r="10" fill="#2563eb" />
      </svg>

      {withWordmark && (
        <span
          className="ml-2 font-semibold tracking-tight"
          style={{
            color: "#2563eb",
            fontSize: Math.floor(size / 2.2),
            fontFamily: "Inter, system-ui, sans-serif",
          }}
        >
          Nexaloc
        </span>
      )}
    </div>
  );
}
