// src/components/media/MediaCard.jsx

import React from "react";
import Icon from "../ui/Icon";
import Badge from "../ui/Badge";

/* =========================================================
   HELPERS
   ========================================================= */

function getHighResPoster(url, width = 400) {
  if (!url || url === "N/A") {
    return "https://via.placeholder.com/300x450?text=No+Poster";
  }

  if (url.includes("media-amazon.com")) {
    return url.replace(/_V1_.*\.jpg$/, `_V1_SX${width}.jpg`);
  }

  if (url.includes("tmdb.org")) {
    return url.replace(
      /\/w\d+\//,
      width > 700 ? "/original/" : `/w${width}/`
    );
  }

  return url;
}

/* =========================================================
   COMPONENT
   ========================================================= */

export default function MediaCard({
  item,
  onClick,
  isAdmin = false,
  onAction,
  onPlayTrailer,
  onAdminEdit
}) {
  const rating =
    item.userMeta?.ratings?.overall || item.imdbRating;

  const isSeries = item.Type === "series";

  return (
    <div
      onClick={onClick}
      className="group relative flex flex-col gap-3 animate-reveal cursor-pointer"
    >
      {/* Poster */}
      <div
        className="
          relative aspect-[2/3] overflow-hidden rounded-2xl
          bg-slate-900 shadow-2xl
          transition-all duration-500
          group-hover:-translate-y-2
          group-hover:shadow-indigo-500/20
          group-hover:ring-2
          group-hover:ring-indigo-500/50
        "
      >
        <img
          src={getHighResPoster(item.Poster, 400)}
          alt={item.Title}
          loading="lazy"
          className="
            h-full w-full object-cover opacity-80
            transition-all duration-700
            group-hover:scale-110
            group-hover:opacity-100
          "
        />

        {/* Watched Status */}
        {item.userMeta?.status === "watched" && (
          <div className="absolute top-3 left-3 bg-emerald-500 text-white p-1.5 rounded-lg shadow-lg">
            <Icon name="check" size={14} />
          </div>
        )}

        {/* Rating */}
        <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md text-white px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 border border-white/10">
          <Icon
            name="star"
            size={12}
            className="text-amber-400 fill-amber-400"
          />
          {rating || "N/A"}
        </div>

        {/* Hover Overlay */}
        <div
          className="
            absolute inset-0 bg-gradient-to-t
            from-black via-transparent to-transparent
            opacity-0 group-hover:opacity-100
            transition-opacity duration-300
            flex flex-col justify-end p-4
          "
        >
          {/* Play Trailer */}
          {onPlayTrailer && (
            <div
              className="
                absolute top-1/2 left-1/2
                -translate-x-1/2 -translate-y-1/2
                scale-50 opacity-0
                group-hover:scale-100 group-hover:opacity-100
                transition-all duration-300
              "
            >
              <button
                onClick={e => {
                  e.stopPropagation();
                  onPlayTrailer(item);
                }}
                className="
                  bg-indigo-600/90 backdrop-blur-md
                  p-4 rounded-full text-white
                  shadow-xl hover:bg-indigo-500 hover:scale-110
                  transition-all
                "
                title="Watch Trailer"
              >
                <Icon
                  name="play"
                  size={28}
                  className="ml-1"
                />
              </button>
            </div>
          )}

          {/* Admin Actions */}
          {isAdmin && (
            <div className="absolute bottom-3 right-3 flex gap-2">
              <button
                onClick={e => {
                  e.stopPropagation();
                  onAdminEdit?.(item);
                }}
                className="p-2 bg-indigo-500/20 rounded-lg hover:bg-indigo-500 text-white transition-all"
              >
                <Icon name="settings" size={14} />
              </button>
            </div>
          )}

          <p className="text-white text-xs font-medium line-clamp-2 mb-1">
            {item.Genre}
          </p>

          <p className="text-slate-400 text-[10px] uppercase tracking-widest">
            {item.Year} • {isSeries ? "Series" : "Movie"}
          </p>
        </div>
      </div>

      {/* Title + Badges */}
      <div className="px-1">
        <h3
          className="
            font-bold text-sm text-slate-100 line-clamp-1
            group-hover:text-indigo-400 transition-colors
          "
        >
          {item.Title}
        </h3>

        <div className="flex items-center gap-2 mt-1">
          {item.meta?.asian?.mdl && (
            <Badge color="green">
              MDL {item.meta.asian.mdl.rating}
            </Badge>
          )}

          {isSeries && (
            <Badge color="slate">
              {item.meta?.series?.seasons?.length ||
                item.totalSeasons ||
                "?"}{" "}
              Seasons
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}
