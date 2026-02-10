// src/components/admin/AdminSuggestionsModal.jsx

import React, { useEffect, useState } from "react";
import Icon from "../ui/Icon";
import Badge from "../ui/Badge";
import Button from "../ui/Button";

/* =========================================================
   COMPONENT
   ========================================================= */

export default function AdminSuggestionsModal({
  isOpen,
  onClose,
  suggestions = [],
  onApprove,
  onReject,
  onEdit
}) {
  const [selected, setSelected] = useState(null);

  // Reset selection when modal closes
  useEffect(() => {
    if (!isOpen) setSelected(null);
  }, [isOpen]);

  // ESC to close
  useEffect(() => {
    if (!isOpen) return;
    const onKey = e => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-3xl bg-slate-950 shadow-2xl animate-reveal flex">
        {/* Left: Suggestions List */}
        <div className="w-1/3 border-r border-white/5 overflow-y-auto">
          <div className="p-4 border-b border-white/5 flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">
              Suggestions
            </h2>
            <Badge color="slate">
              {suggestions.length}
            </Badge>
          </div>

          <div className="divide-y divide-white/5">
            {suggestions.map(s => (
              <button
                key={s.id}
                onClick={() => setSelected(s)}
                className={`
                  w-full text-left p-4 transition-colors
                  ${
                    selected?.id === s.id
                      ? "bg-indigo-500/10"
                      : "hover:bg-white/5"
                  }
                `}
              >
                <p className="text-sm font-semibold text-slate-200 line-clamp-1">
                  {s.title}
                </p>
                <p className="text-[10px] text-slate-500 mt-1">
                  {s.type} • {s.year || "?"}
                </p>
              </button>
            ))}

            {suggestions.length === 0 && (
              <div className="p-6 text-center text-slate-500 text-sm">
                No pending suggestions 🎉
              </div>
            )}
          </div>
        </div>

        {/* Right: Detail Panel */}
        <div className="flex-1 overflow-y-auto">
          {selected ? (
            <div className="p-6 space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold text-white">
                    {selected.title}
                  </h3>
                  <p className="text-slate-400 text-sm mt-1">
                    {selected.year || "?"} • {selected.type}
                  </p>
                </div>

                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-white/10 text-slate-300"
                >
                  <Icon name="close" />
                </button>
              </div>

              {/* Metadata */}
              <div className="flex gap-2 flex-wrap">
                {selected.source && (
                  <Badge color="indigo">
                    {selected.source}
                  </Badge>
                )}
                {selected.language && (
                  <Badge color="slate">
                    {selected.language}
                  </Badge>
                )}
                {selected.country && (
                  <Badge color="slate">
                    {selected.country}
                  </Badge>
                )}
              </div>

              {/* Description */}
              {selected.plot && (
                <p className="text-slate-300 leading-relaxed">
                  {selected.plot}
                </p>
              )}

              {/* Raw Payload (optional but useful for admin) */}
              {selected.raw && (
                <details className="bg-black/30 rounded-xl p-4 border border-white/5">
                  <summary className="cursor-pointer text-slate-400 text-sm">
                    Raw Payload
                  </summary>
                  <pre className="text-[10px] text-slate-400 overflow-x-auto mt-3">
                    {JSON.stringify(selected.raw, null, 2)}
                  </pre>
                </details>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-white/5">
                <Button
                  active
                  icon="check"
                  onClick={() => onApprove(selected)}
                >
                  Approve
                </Button>

                <Button
                  icon="trash"
                  className="text-rose-400"
                  onClick={() => onReject(selected)}
                >
                  Reject
                </Button>

                {onEdit && (
                  <Button
                    icon="settings"
                    onClick={() => onEdit(selected)}
                  >
                    Edit
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-500 text-sm">
              Select a suggestion to review
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
