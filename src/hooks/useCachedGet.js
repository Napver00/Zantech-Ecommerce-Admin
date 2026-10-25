import { useCallback, useEffect, useRef, useState } from "react";
import axiosInstance from "../config/axios";

// Responses kept for the browser session, keyed by URL. Pages show the saved
// copy straight away and refresh it in the background when it is getting old,
// so moving between Dashboard, Analytics and Reports is instant and the
// server isn't asked for the same numbers over and over.
const cache = new Map(); // url -> { data, at }
const inflight = new Map(); // url -> Promise

const fetchUrl = (url, fresh) => {
  const key = fresh ? `${url}${url.includes("?") ? "&" : "?"}fresh=1` : url;
  if (inflight.has(key)) return inflight.get(key);
  const p = axiosInstance
    .get(key)
    .then((res) => {
      if (!res.data?.success) throw new Error(res.data?.message || "Request failed");
      cache.set(url, { data: res.data.data, at: Date.now() });
      return res.data.data;
    })
    .finally(() => inflight.delete(key));
  inflight.set(key, p);
  return p;
};

/** Drop saved responses (all, or those whose URL starts with a prefix). */
export const clearCachedGet = (prefix = "") => {
  for (const url of cache.keys()) if (url.startsWith(prefix)) cache.delete(url);
};

/**
 * GET with a session cache.
 * Returns { data, error, loading (nothing to show yet), refreshing, refresh() }.
 */
export default function useCachedGet(url, { staleMs = 30000 } = {}) {
  const saved = url ? cache.get(url) : null;
  const [state, setState] = useState({ data: saved?.data ?? null, error: null, refreshing: false });
  const current = useRef(url);

  const load = useCallback(
    async (fresh = false) => {
      if (!url) return;
      setState((s) => ({ ...s, refreshing: true, error: null }));
      try {
        const data = await fetchUrl(url, fresh);
        if (current.current === url) setState({ data, error: null, refreshing: false });
      } catch (err) {
        if (current.current === url) {
          setState((s) => ({ ...s, refreshing: false, error: err.response?.data?.message || err.message || "Could not load data" }));
        }
      }
    },
    [url]
  );

  useEffect(() => {
    current.current = url;
    const hit = url ? cache.get(url) : null;
    setState({ data: hit?.data ?? null, error: null, refreshing: false });
    if (url && (!hit || Date.now() - hit.at > staleMs)) load(false);
  }, [url, staleMs, load]);

  return {
    data: state.data,
    error: state.error,
    loading: !state.data && !state.error,
    refreshing: state.refreshing,
    refresh: () => load(true),
  };
}
