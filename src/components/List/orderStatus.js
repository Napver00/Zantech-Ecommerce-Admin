// Order status codes as the backend stores them, in the order staff work through them.
export const ORDER_STATUSES = [
  { value: "0", key: "processing", label: "Processing", tone: "warn" },
  { value: "2", key: "on_hold", label: "On hold", tone: "muted" },
  { value: "1", key: "completed", label: "Completed", tone: "good" },
  { value: "3", key: "cancelled", label: "Cancelled", tone: "bad" },
  { value: "4", key: "refunded", label: "Refunded", tone: "info" },
];

export const orderStatusOf = (code) => ORDER_STATUSES.find((s) => s.value === String(code)) || ORDER_STATUSES[0];
