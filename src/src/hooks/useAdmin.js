// src/hooks/useAdmin.js

import { useEffect, useState, useCallback } from "react";
import { supabase, getCurrentUser } from "../config/supabase";
import { ADMIN_IDS } from "../config/constants";

/**
 * useAdmin
 *
 * Responsibilities:
 * - Detect current user
 * - Determine admin status
 * - Fetch pending admin suggestions
 * - Expose admin actions (approve / reject)
 */
export default function useAdmin() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [suggestions, setSuggestions] = useState([]);

  /* =========================================================
     AUTH + ADMIN CHECK
     ========================================================= */

  const refreshUser = useCallback(async () => {
    setLoading(true);

    const currentUser = await getCurrentUser();
    setUser(currentUser);

    const admin =
      currentUser && ADMIN_IDS.includes(currentUser.id);
    setIsAdmin(Boolean(admin));

    setLoading(false);
  }, []);

  useEffect(() => {
    refreshUser();

    const { data: sub } =
      supabase.auth.onAuthStateChange(() => {
        refreshUser();
      });

    return () => sub?.subscription?.unsubscribe();
  }, [refreshUser]);

  /* =========================================================
     SUGGESTIONS (ADMIN ONLY)
     ========================================================= */

  const fetchSuggestions = useCallback(async () => {
    if (!isAdmin) return;

    const { data, error } = await supabase
      .from("content_suggestions")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: true });

    if (!error && data) {
      setSuggestions(data);
    }
  }, [isAdmin]);

  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  /* =========================================================
     ADMIN ACTIONS
     ========================================================= */

  const approveSuggestion = async suggestion => {
    if (!isAdmin) return;

    await supabase
      .from("content_suggestions")
      .update({
        status: "approved",
        reviewed_at: new Date(),
        reviewed_by: user?.id
      })
      .eq("id", suggestion.id);

    fetchSuggestions();
  };

  const rejectSuggestion = async suggestion => {
    if (!isAdmin) return;

    await supabase
      .from("content_suggestions")
      .update({
        status: "rejected",
        reviewed_at: new Date(),
        reviewed_by: user?.id
      })
      .eq("id", suggestion.id);

    fetchSuggestions();
  };

  /* =========================================================
     PUBLIC API
     ========================================================= */

  return {
    user,
    isAdmin,
    loading,

    // admin data
    suggestions,

    // admin actions
    refreshUser,
    fetchSuggestions,
    approveSuggestion,
    rejectSuggestion
  };
}
