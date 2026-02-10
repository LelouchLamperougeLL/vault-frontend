// src/components/ui/VaultLogo.jsx

import React from "react";

/**
 * VaultLogo
 *
 * Usage:
 * <VaultLogo size={24} />
 * <VaultLogo size={40} className="text-indigo-500" />
 */
export default function VaultLogo({
  size = 24,
  className = ""
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <g transform="translate(6, 0)">
        {/* Hinge Mechanism */}
        <rect
          x="0"
          y="35"
          width="8"
          height="30"
          rx="1"
          fill="currentColor"
        />
        <rect
          x="8"
          y="40"
          width="6"
          height="6"
          fill="currentColor"
        />
        <rect
          x="8"
          y="54"
          width="6"
          height="6"
          fill="currentColor"
        />

        {/* Outer Ring */}
        <circle
          cx="55"
          cy="50"
          r="37"
          stroke="currentColor"
          strokeWidth="5"
        />

        {/* Bolts Ring (Dotted) */}
        <circle
          cx="55"
          cy="50"
          r="30"
          stroke="currentColor"
          strokeWidth="3"
          strokeDasharray="0.1 15.6"
          strokeLinecap="round"
          opacity="0.8"
        />

        {/* Inner Ring */}
        <circle
          cx="55"
          cy="50"
          r="22"
          stroke="currentColor"
          strokeWidth="3"
        />

        {/* Spokes */}
        <g transform="translate(55, 50)">
          {[0, 60, 120, 180, 240, 300].map(deg => (
            <line
              key={deg}
              x1="0"
              y1="-10"
              x2="0"
              y2="-22"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
              transform={`rotate(${deg})`}
            />
          ))}
        </g>

        {/* Hub */}
        <circle
          cx="55"
          cy="50"
          r="10"
          fill="currentColor"
        />

        {/* Keyhole / Bean Shape */}
        <ellipse
          cx="55"
          cy="50"
          rx="3.5"
          ry="6.5"
          className="fill-white dark:fill-vault-950"
        />
      </g>
    </svg>
  );
}
