// src/components/ui/Button.jsx

import React from "react";
import Icon from "./Icon";

/**
 * GlassButton
 *
 * Usage:
 * <Button onClick={...} active icon="search">Search</Button>
 */
export default function Button({
  children,
  onClick,
  active = false,
  icon = null,
  className = "",
  type = "button",
  disabled = false
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        flex items-center gap-2 px-4 py-2 rounded-xl
        font-medium text-sm transition-all duration-300
        ${active
          ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
          : "bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/5"}
        ${disabled ? "opacity-50 cursor-not-allowed" : ""}
        ${className}
      `}
    >
      {icon && <Icon name={icon} size={16} />}
      {children}
    </button>
  );
}
