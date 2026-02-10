// src/hooks/useEnrichment.js

import { useCallback, useState } from "react";
import { enrichItem } from "../engines/enrichment.engine";
import { supabase } from "../config/supabase";

/**
 * useEnrichment
 *
 * Responsibilities:
 * - Enrich a single item on demand
 * - Track loading + error state
 * - Never mutate UI state directly
 */
export default function useEnrichment({
  apiKeys,
  isAdmin = false
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /* =========================================================
     ENRICH SINGLE ITEM
     ========================================================= */

  const enrich = useCallback(
    async item => {
      if (!item) return null;

      setLoading(true);
      setError(null);

      try {
        const enriched = await enrichItem(
          item,
          apiKeys,
          supabase,
          isAdmin
        );

        return enriched;
      } catch (err) {
        console.error("[useEnrichment] Failed", err);
        setError(err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [apiKeys, isAdmin]
  );

  /* =========================================================
     PUBLIC API
     ========================================================= */

  return {
    enrich,
    loading,
    error
  };
}
