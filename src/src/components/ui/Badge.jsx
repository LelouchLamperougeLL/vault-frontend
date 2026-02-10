// src/components/ui/Badge.jsx

import React from "react";

/**
 * Badge
 *
 * Usage:
 * <Badge color="green">MDL 8.9</Badge>
 * <Badge color="gold">Top Rated</Badge>
 */
export default function Badge({
  children,
  color = "indigo",
  className = ""
}) {
  const colors = {
    indigo:
      "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    green:
      "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    gold:
      "bg-amber-500/10 text-amber-400 border-amber-500/20",
    red:
      "bg-rose-500/10 text-rose-400 border-rose-500/20",
    slate:
      "bg-slate-500/10 text-slate-400 border-slate-500/20"
  };

  return (
    <span
      className={`
        inline-flex items-center
        px-2.5 py-0.5 rounded-full
        text-[10px] font-bold uppercase tracking-wider
        border
        ${colors[color] || colors.indigo}
        ${className}
      `}
    >
      {children}
    </span>
  );
}
