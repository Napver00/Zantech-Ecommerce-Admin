import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Offcanvas } from "react-bootstrap";
import { FaTimes } from "react-icons/fa";
import { toast } from "react-hot-toast";
import axiosInstance from "../../config/axios";
import usePageTitle from "../../hooks/usePageTitle";
import useRole from "../../hooks/useRole";
import CommonTable from "../../components/Common/CommonTable";
import { ListHeader, ListCard, ListToolbar, FilterTabs, ResultCount, Pager, Pill } from "../../components/List/List";
import { taka, fullDate, timeAgo } from "../../components/List/format";
import "../../components/List/List.css";
import "../Customers/CustomerDetail.css";
import "./Transitions.css";

// Order payment types as the backend stores them.
const ORDER_METHODS = { 1: "Cash on delivery", 2: "bKash", 3: "Online payment", 4: "Bank transfer" };
const PERIODS = [
  { value: "", label: "All time" },
  { value: "today", label: "Today" },
  { value: "this_week", label: "This week" },
  { value: "this_month", label: "This month" },
];
const cap = (t) => (t ? t.charAt(0).toUpperCase() + t.slice(1).replace(/_/g, " ") : "—");

const isCourse = (row) => row.source === "course_invoice";
const methodOf = (row) =>
  isCourse(row) ? cap(row.course_invoice_details?.payment_method) : ORDER_METHODS[Number(row.payment_details?.payment_type)] || "—";

const Transitions = () => {
  usePageTitle("Transactions");
  const role = useRole();
  const isAdmin = role === "admin";
  const [rows, setRows] = useState([]);
  const [totals, setTotals] = useState(null);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState("");
  const [period, setPeriod] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [pagination, setPagination] = useState({ total: 0, last_page: 1 });
  const [open, setOpen] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/transiions", {
        params: {
          page,
          limit,
          ...(source && { source }),
          ...(period && { duration: period }),
          ...(from && { start_date: from }),
          ...(to && { end_date: to }),
        },
      });
      setRows(res.data?.data || []);
      setTotals(res.data?.totals || null);
      setPagination(res.data?.pagination || { total: 0, last_page: 1 });
    } catch (err) {
      toast.error(err.response?.data?.message || "Couldn't load transactions");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [page, limit, source, period, from, to]);

  useEffect(() => {
    load();
  }, [load]);

  const pickPeriod = (p) => {
    setPeriod(p);
    setFrom("");
    setTo("");
    setPage(1);
  };
  const setDate = (which, value) => {
    which === "from" ? setFrom(value) : setTo(value);
    setPeriod("");
    setPage(1);
  };

  const filtered = !!(period || from || to || source);
  const scopeLabel = role === "course_manager" ? "course fees" : ["stuff", "member"].includes(role) ? "store orders" : "store orders and course fees";

  const headers = [
    {
      key: "created_at",
      label: "When",
      nowrap: true,
      render: (row) => (
        <>
          <span className="d-block">{timeAgo(row.created_at)}</span>
          <span className="ls-cell-sub" title={fullDate(row.created_at)}>#{row.transition_id}</span>
        </>
      ),
    },
    {
      key: "from",
      label: "For",
      render: (row) => {
        if (isCourse(row)) {
          const c = row.course_invoice_details;
          return c ? (
            <>
              <span className="ls-cell-main">{c.student_name || "Student"}</span>
              <span className="ls-cell-sub">{c.course_title || "Course"} · {c.invoice_no}</span>
            </>
          ) : <span className="text-muted">Course invoice (removed)</span>;
        }
        const p = row.payment_details;
        return p ? (
          <>
            <span className="ls-cell-main">{p.customer_name || "Store customer"}</span>
            <span className="ls-cell-sub">Order {p.invoice_code || `#${p.order_id}`}</span>
          </>
        ) : <span className="text-muted">Order (removed)</span>;
      },
    },
    {
      key: "type",
      label: "Type",
      render: (row) => (isCourse(row) ? <Pill tone="info">Course</Pill> : <Pill tone="muted">Store</Pill>),
    },
    { key: "method", label: "Paid by", render: (row) => methodOf(row) },
    {
      key: "amount",
      label: "Amount",
      align: "end",
      nowrap: true,
      render: (row) => <span className="ls-money">{taka(row.amount)}</span>,
    },
  ];

  const detail = open && (isCourse(open) ? open.course_invoice_details : open.payment_details);

  return (
    <div className="tx-page">
      <ListHeader title="Transactions" subtitle={`Money received from ${scopeLabel}. Newest first.`} />

      {totals && (
        <dl className="cd-stats tx-stats">
          <div>
            <dt>Received</dt>
            <dd>{taka(totals.amount)}</dd>
            <span className="cd-stat-note">{totals.count.toLocaleString()} {totals.count === 1 ? "payment" : "payments"}{period || from || to ? " in this period" : ""}</span>
          </div>
          {isAdmin && (
            <>
              <div>
                <dt>From the store</dt>
                <dd>{taka(totals.store)}</dd>
              </div>
              <div>
                <dt>From courses</dt>
                <dd>{taka(totals.course)}</dd>
              </div>
            </>
          )}
        </dl>
      )}

      <ListCard>
        {isAdmin && (
          <FilterTabs
            label="Money from"
            value={source}
            onChange={(v) => { setSource(v); setPage(1); }}
            tabs={[
              { value: "", label: "Everything" },
              { value: "order", label: "Store orders" },
              { value: "course", label: "Course fees" },
            ]}
          />
        )}
        <ListToolbar end={<ResultCount page={page} perPage={limit} total={pagination.total || 0} noun="payments" />}>
          <div className="tx-periods" role="group" aria-label="Period">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                type="button"
                className={`tx-period ${period === p.value && !(from || to) ? "is-active" : ""}`}
                aria-pressed={period === p.value && !(from || to)}
                onClick={() => pickPeriod(p.value)}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="ls-dates" role="group" aria-label="Custom dates">
            <span>From</span>
            <input type="date" value={from} max={to || undefined} onChange={(e) => setDate("from", e.target.value)} aria-label="From date" />
            <span>to</span>
            <input type="date" value={to} min={from || undefined} onChange={(e) => setDate("to", e.target.value)} aria-label="To date" />
            {(from || to) && (
              <button type="button" onClick={() => { setFrom(""); setTo(""); setPage(1); }} aria-label="Clear dates"><FaTimes /></button>
            )}
          </div>
        </ListToolbar>

        <CommonTable
          headers={headers}
          data={rows.map((r) => ({ ...r, id: r.transition_id }))}
          tableLoading={loading}
          loading={loading}
          onRowClick={setOpen}
          rowLabel={(row) => `Payment #${row.transition_id}, ${taka(row.amount)}`}
          emptyTitle={filtered ? "No payments in this view" : "No payments yet"}
          emptyText={filtered ? "Try a longer period or another tab." : "Payments appear when orders are paid or course fees are recorded."}
        />

        <Pager page={page} lastPage={pagination.last_page || 1} onPage={setPage} perPage={limit} onPerPage={(n) => { setLimit(n); setPage(1); }} />
      </ListCard>

      <Offcanvas show={!!open} onHide={() => setOpen(null)} placement="end" className="tx-panel">
        {open && (
          <>
            <Offcanvas.Header closeButton>
              <Offcanvas.Title as="h2" className="h5 mb-0">{taka(open.amount)} received</Offcanvas.Title>
            </Offcanvas.Header>
            <Offcanvas.Body>
              <p className="text-muted small mb-3">{fullDate(open.created_at)} · payment #{open.transition_id}</p>
              {!detail ? (
                <p className="text-muted">The {isCourse(open) ? "course invoice" : "order"} behind this payment has been removed.</p>
              ) : isCourse(open) ? (
                <>
                  <dl className="tx-details">
                    <div><dt>Student</dt><dd>{detail.student_name || "—"}</dd></div>
                    <div><dt>Course</dt><dd>{detail.course_title || "—"}</dd></div>
                    <div><dt>For</dt><dd>{cap(detail.payment_for)}{detail.month_number ? ` (month ${detail.month_number})` : ""}</dd></div>
                    <div><dt>Paid by</dt><dd>{cap(detail.payment_method)}{detail.trx_id ? ` · ${detail.trx_id}` : ""}</dd></div>
                    <div><dt>Invoice</dt><dd>{taka(Number(detail.amount) - Number(detail.discount || 0))}</dd></div>
                    <div><dt>Paid so far</dt><dd>{taka(detail.paid_amount)}</dd></div>
                    <div><dt>Still due</dt><dd className={Number(detail.due_amount) > 0 ? "text-danger" : ""}>{Number(detail.due_amount) > 0 ? taka(detail.due_amount) : "Nothing"}</dd></div>
                  </dl>
                  <Link className="btn btn-outline-primary btn-sm" to={`/course-invoices/${detail.invoice_id}`}>Open invoice {detail.invoice_no}</Link>
                </>
              ) : (
                <>
                  <dl className="tx-details">
                    <div><dt>Customer</dt><dd>{detail.customer_name || "—"}</dd></div>
                    <div><dt>Order</dt><dd>{detail.invoice_code || `#${detail.order_id}`}</dd></div>
                    <div><dt>Paid by</dt><dd>{ORDER_METHODS[Number(detail.payment_type)] || "—"}{detail.trxed ? ` · ${detail.trxed}` : ""}</dd></div>
                    {detail.phone && <div><dt>Payment phone</dt><dd>{detail.phone}</dd></div>}
                    <div><dt>Order total</dt><dd>{taka(detail.total_amount)}</dd></div>
                    <div><dt>Paid so far</dt><dd>{taka(detail.padi_amount)}</dd></div>
                    <div><dt>Still due</dt><dd className={Number(detail.due_amount) > 0 ? "text-danger" : ""}>{Number(detail.due_amount) > 0 ? taka(detail.due_amount) : "Nothing"}</dd></div>
                  </dl>
                  <Link className="btn btn-outline-primary btn-sm" to={`/orders/${detail.order_id}`}>Open order {detail.invoice_code || ""}</Link>
                </>
              )}
            </Offcanvas.Body>
          </>
        )}
      </Offcanvas>
    </div>
  );
};

export default Transitions;
