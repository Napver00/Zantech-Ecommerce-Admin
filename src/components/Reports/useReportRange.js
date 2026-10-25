import { useSearchParams } from "react-router-dom";

/**
 * The chosen date range lives in the address bar (?preset=30d or
 * ?from=…&to=…), so a report can be bookmarked or shared and Back works.
 */
export default function useReportRange(defaultPreset = "30d") {
  const [params, setParams] = useSearchParams();
  const value = {
    preset: params.get("preset") || defaultPreset,
    from: params.get("from") || "",
    to: params.get("to") || "",
  };

  const setValue = (next) => {
    const p = new URLSearchParams(params);
    ["preset", "from", "to"].forEach((k) => p.delete(k));
    if (next.from && next.to) {
      p.set("from", next.from);
      p.set("to", next.to);
    } else {
      p.set("preset", next.preset || defaultPreset);
    }
    setParams(p, { replace: true });
  };

  return [value, setValue];
}
