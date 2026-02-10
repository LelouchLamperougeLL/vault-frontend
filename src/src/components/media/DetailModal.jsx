// src/components/media/DetailModal.jsx

import React, { useEffect } from "react";
import Icon from "../ui/Icon";
import Badge from "../ui/Badge";
import Button from "../ui/Button";

/* =========================================================
   HELPERS
   ========================================================= */

function backdropUrl(item) {
  return (
    item.tmdb?.credits?.images?.backdrops?.[0]?.file_path
      ? `https://image.tmdb.org/t/p/original${item.tmdb.credits.images.backdrops[0].file_path}`
      : null
  );
}

/* =========================================================
   COMPONENT
   ========================================================= */

export default function DetailModal({
  item,
  isOpen,
  onClose,
  onToggleWatch,
  onRate,
  onPlayTrailer,
  isAdmin = false,
  onAdminEdit
}) {
  if (!isOpen || !item) return null;

  // ESC to close
  useEffect(() => {
    const onKey = e => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const rating =
    item.userMeta?.ratings?.overall ||
    item.imdbRating ||
    "N/A";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl bg-slate-950 shadow-2xl animate-reveal">
        {/* Header */}
        <div className="relative">
          {backdropUrl(item) && (
            <img
              src={backdropUrl(item)}
              alt=""
              className="absolute inset-0 w-full h-full object-cover opacity-30"
            />
          )}

          <div className="relative p-6 flex gap-6">
            <img
              src={item.Poster}
              alt={item.Title}
              className="w-36 rounded-xl shadow-xl"
            />

            <div className="flex-1">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-extrabold text-white">
                    {item.Title}
                  </h2>
                  <p className="text-slate-400 text-sm mt-1">
                    {item.Year} • {item.Type}
                  </p>
                </div>

                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-white/10 text-slate-300"
                >
                  <Icon name="close" />
                </button>
              </div>

              {/* Badges */}
              <div className="flex gap-2 mt-3 flex-wrap">
                <Badge color="gold">
                  <Icon
                    name="star"
                    size={12}
                    className="mr-1 text-amber-400 fill-amber-400"
                  />
                  {rating}
                </Badge>

                {item.meta?.asian?.mdl && (
                  <Badge color="green">
                    MDL {item.meta.asian.mdl.rating}
                  </Badge>
                )}

                {item.Type === "series" && (
                  <Badge color="slate">
                    {item.meta?.series?.seasons?.length ||
                      item.totalSeasons ||
                      "?"}{" "}
                    Seasons
                  </Badge>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-4 flex-wrap">
                <Button
                  active={item.userMeta?.status === "watched"}
                  icon="check"
                  onClick={() => onToggleWatch(item)}
                >
                  {item.userMeta?.status === "watched"
                    ? "Watched"
                    : "Mark Watched"}
                </Button>

                {onPlayTrailer && (
                  <Button
                    icon="play"
                    onClick={() => onPlayTrailer(item)}
                  >
                    Trailer
                  </Button>
                )}

                {isAdmin && (
                  <Button
                    icon="settings"
                    onClick={() => onAdminEdit?.(item)}
                  >
                    Admin
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Plot */}
          {item.Plot && (
            <p className="text-slate-300 leading-relaxed">
              {item.Plot}
            </p>
          )}

          {/* Cast */}
          {item.meta?.cast?.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-slate-400 uppercase mb-3">
                Cast
              </h3>

              <div className="flex gap-4 overflow-x-auto pb-2">
                {item.meta.cast.slice(0, 15).map(actor => (
                  <div
                    key={actor.name}
                    className="min-w-[96px] text-center"
                  >
                    <img
                      src={
                        actor.photo ||
                        "https://via.placeholder.com/185x278?text=No+Photo"
                      }
                      alt={actor.name}
                      className="w-24 h-32 object-cover rounded-xl mx-auto"
                    />
                    <p className="text-xs text-slate-200 mt-1">
                      {actor.name}
                    </p>
                    {actor.character && (
                      <p className="text-[10px] text-slate-500">
                        {actor.character}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rating control (placeholder hook) */}
          {onRate && (
            <div>
              <h3 className="text-sm font-bold text-slate-400 uppercase mb-2">
                Your Rating
              </h3>

              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(v => (
                  <button
                    key={v}
                    onClick={() => onRate(item, v * 2)}
                    className={`
                      p-2 rounded-lg
                      ${
                        item.userMeta?.ratings?.overall >=
                        v * 2
                          ? "text-amber-400"
                          : "text-slate-500"
                      }
                    `}
                  >
                    <Icon
                      name="star"
                      size={18}
                      className="fill-current"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
