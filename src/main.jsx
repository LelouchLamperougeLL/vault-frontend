// src/main.jsx

/* =========================================================
   GLOBAL STYLES (CRITICAL)
   ========================================================= */
import "./index.css";

/* =========================================================
   REACT
   ========================================================= */
import React from "react";
import ReactDOM from "react-dom/client";

/* =========================================================
   CONFIG & HOOKS
   ========================================================= */
import { API_KEYS } from "./config/constants";
import useAdmin from "./hooks/useAdmin";
import useEnrichment from "./hooks/useEnrichment";

/* =========================================================
   ENGINES
   ========================================================= */
import { smartSearch } from "./engines/search.engine";

/* =========================================================
   UI COMPONENTS
   ========================================================= */
import VaultLogo from "./components/ui/VaultLogo";
import Button from "./components/ui/Button";
import MediaCard from "./components/media/MediaCard";
import DetailModal from "./components/media/DetailModal";
import AdminSuggestionsModal from "./components/admin/AdminSuggestionsModal";

/* =========================================================
   APP
   ========================================================= */
function App() {
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState([]);
  const [loading, setLoading] = React.useState(false);

  const [selectedItem, setSelectedItem] = React.useState(null);
  const [view, setView] = React.useState("grid");
  const [showAdminModal, setShowAdminModal] = React.useState(false);

  /* -----------------------------
     Admin + Enrichment
  ----------------------------- */
  const {
    isAdmin,
    suggestions,
    approveSuggestion,
    rejectSuggestion
  } = useAdmin();

  const { enrich, loading: enriching } = useEnrichment({
    apiKeys: API_KEYS,
    isAdmin
  });

  /* -----------------------------
     Search
  ----------------------------- */
  const runSearch = async e => {
    e?.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setResults([]);

    try {
      const found = await smartSearch(
        query,
        API_KEYS,
        "all"
      );
      setResults(found);
    } catch (err) {
      console.error("Search failed", err);
    } finally {
      setLoading(false);
    }
  };

  /* -----------------------------
     Detail (with enrichment)
  ----------------------------- */
  const openDetail = async item => {
    setSelectedItem(item);
    const enriched = await enrich(item);
    if (enriched) setSelectedItem(enriched);
  };

  /* -----------------------------
     Render
  ----------------------------- */
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-6">
          <VaultLogo size={28} className="text-indigo-500" />

          <form
            onSubmit={runSearch}
            className="flex-1 flex gap-3"
          >
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search movies, series, anime..."
              className="
                flex-1 bg-black/30 border border-white/10
                rounded-xl px-4 py-2 text-sm
                focus:outline-none focus:ring-2 focus:ring-indigo-500/50
              "
            />

            <Button type="submit" icon="search">
              Search
            </Button>
          </form>

          <div className="flex gap-2">
            <Button
              icon="grid"
              active={view === "grid"}
              onClick={() => setView("grid")}
            />
            <Button
              icon="list"
              active={view === "list"}
              onClick={() => setView("list")}
            />

            {isAdmin && (
              <Button
                icon="database"
                onClick={() => setShowAdminModal(true)}
              >
                Admin
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {loading && (
          <p className="text-slate-400 text-sm">
            Searching…
          </p>
        )}

        {!loading && results.length === 0 && (
          <p className="text-slate-500 text-sm">
            No results yet. Try searching 👀
          </p>
        )}

        <div
          className={
            view === "grid"
              ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6"
              : "flex flex-col gap-4"
          }
        >
          {results.map(item => (
            <MediaCard
              key={item.imdbID || item.Title}
              item={item}
              isAdmin={isAdmin}
              onClick={() => openDetail(item)}
            />
          ))}
        </div>
      </main>

      {/* Detail Modal */}
      <DetailModal
        item={selectedItem}
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        onToggleWatch={() => {}}
        onRate={() => {}}
        onPlayTrailer={() => {}}
        isAdmin={isAdmin}
        onAdminEdit={() => {}}
      />

      {/* Admin Modal */}
      {isAdmin && (
        <AdminSuggestionsModal
          isOpen={showAdminModal}
          onClose={() => setShowAdminModal(false)}
          suggestions={suggestions}
          onApprove={approveSuggestion}
          onReject={rejectSuggestion}
        />
      )}

      {/* Footer */}
      <footer className="text-center text-slate-500 text-xs py-6">
        The Vault • Personal Media Intelligence
      </footer>
    </div>
  );
}

/* =========================================================
   BOOTSTRAP
   ========================================================= */
ReactDOM.createRoot(
  document.getElementById("root")
).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
