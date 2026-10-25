import React from "react";
import { Link } from "react-router-dom";
import { EmptyState, Panel } from "../Reports/ReportParts";
import { taka } from "../Reports/reportUtils";

/** The orders with the most money still to collect. */
const DueOrdersTable = ({ orders, count, total, loading }) => (
  <Panel
    title="Money to collect"
    subtitle={count ? `${count} order${count === 1 ? "" : "s"} · ${taka(total)} due in total` : "Orders not fully paid"}
    loading={loading}
    height={300}
    className="h-100"
  >
    {orders.length ? (
      <div className="rp-due">
        {orders.map((o) => (
          <Link key={o.order_id} to={`/orders/${o.order_id}`} className="rp-due-row">
            <div className="min-w-0">
              <div className="rp-due-code">{o.invoice_code}</div>
              <div className="small text-muted text-truncate">
                {o.user_name || "Guest"}{o.user_phone ? ` · ${o.user_phone}` : ""}
              </div>
            </div>
            <div className="rp-due-amt">
              <strong>{taka(o.due_amount)}</strong>
              <small>paid {taka(o.paid_amount)} of {taka(o.total_amount)}</small>
            </div>
          </Link>
        ))}
      </div>
    ) : (
      <EmptyState>Everything is paid.</EmptyState>
    )}
  </Panel>
);

export default DueOrdersTable;
