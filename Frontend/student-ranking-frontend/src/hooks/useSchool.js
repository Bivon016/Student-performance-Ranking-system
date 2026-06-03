// hooks/useSchool.js
// Fetches the current user's school from GET /school/current
// and caches it in localStorage to avoid re-fetching on every page load.

import { useState, useEffect } from "react";
import { getCurrentSchool } from "../services/api";

const CACHE_KEY = "schoolInfo";
const CACHE_TTL = 1000 * 60 * 30; // 30 minutes

export function useSchool() {
  const [school,  setSchool]  = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    // Try cache first
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data, ts } = JSON.parse(cached);
        if (Date.now() - ts < CACHE_TTL) {
          setSchool(data);
          setLoading(false);
          return;
        }
      }
    } catch (_) {}

    // Fetch fresh
    getCurrentSchool()
      .then((data) => {
        setSchool(data);
        localStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() }));
      })
      .catch((err) => setError(err.message ?? "Failed to load school info"))
      .finally(() => setLoading(false));
  }, []);

  return { school, loading, error };
}