import React, { useCallback, useEffect, useState } from "react";
import { FaPlus, FaChevronRight, FaFileInvoice, FaTimes } from "react-icons/fa";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import { Button } from "react-bootstrap";
import axiosInstance from "../../config/axios";
import usePageTitle from "../../hooks/usePageTitle";
import CommonTable from "../../components/Common/CommonTable";
import { ListHeader, ListCard, ListToolbar, SearchBox, FilterTabs, ResultCount, Pager, Pill } from "../../components/List/List";
import { taka, timeAgo, fullDate } from "../../components/List/format";
import "./Orders.css";

// Status codes from the API, in the order they're shown as tabs.
const STATUSES = [
  { value: "0", key: "processing", label: "Processing", tone: "warn" },
  { value: "2", key: "on_hold", label: "On hold", tone: "muted" },
  { value: "1", key: "completed", label: "Completed", tone: "good" },
  { value: "3", key: "cancelled", label: "Cancelled", tone: "bad" },
  { value: "4", key: "refunded", label: "Refunded", tone: "info" },
];
const statusOf = (code) => STATUSES.find((s) => s.value === String(code)) || STATUSES[0];

const Orders = () => {
  usePageTitle("Orders");
  const navigate = useNavigate();
  const [url, setUrl] = useSearchParams();

  const [search, setSearch] = useState(url.get("search") || "");
  const [query, setQuery] = useState(url.get("search") || ""); // search, after the typing pause
  const [status, setStatus] = useState(url.get("status") || "");
  const [from, setFrom] = useState((url.get("startDate") || "").slice(0, 10));
  const [to, setTo] = useState((url.get("endDate") || "").slice(0, 10));
  const [page, setPage] = useState(parseInt(url.get("page")) || 1);
  const [limit, setLimit] = useState(parseInt(url.get("limit")) || 20);

  const [orders, setOrders] = useState([]);
  const [summary, setSummary] = useState(null);
  const [pagination, setPagination] = useState({ total: 0, last_page: 1 });
  const [loading, setLoading] = useState(true);

  // Wait for a pause in typing before searching; a new search starts at page 1.
  useEffect(() => {
    const t = setTimeout(() => {
      const next = search.trim();
      setQuery((prev) => {
        if (prev !== next) setPage(1);
        return next;
      });
    }, 400);
    return () => clearTimeout(t);
  }, [search]);

  // Changing a filter goes back to page 1.
  const withFirstPage = (setter) => (value) => { setter(value); setPage(1); };
  const changeStatus = withFirstPage(setStatus);
  const changeFrom = withFirstPage(setFrom);
  const changeTo = withFirstPage(setTo);
  const changeLimit = withFirstPage(setLimit);

  const load = useCallback(async () => {
    setLoading(true);
    const params = { page, limit };
    if (query) params.search = query;
    if (status) params.status = status;
    if (from) params.start_date = from;
    if (to) params.end_date = to;

    const next = {};
    if (query) next.search = query;
    if (status) next.status = status;
    if (from) next.startDate = from;
    if (to) next.endDate = to;
    if (page > 1) next.page = page;
    if (limit !== 20) next.limit = limit;
    setUrl(next, { replace: true });

    try {
      const { data } = await axiosInstance.get("/orders", { params });
      if (!data.success) throw new Error(data.message);
      setOrders(data.data || []);
      setPagination(data.pagination || { total: (data.data || []).length, last_page: 1 });
      if (data.status_summary) setSummary(data.status_summary);
    } catch (error) {
      toast.error(error.response?.data?.message || "Couldn't load orders");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [page, limit, query, status, from, to, setUrl]);

  useEffect(() => { load(); }, [load]);

  const allCount = summary ? STATUSES.reduce((n, s) => n + (Number(summary[s.key]) || 0), 0) : null;
  const tabs = [
    { value: "", label: "All", count: allCount },
    ...STATUSES.map((s) => ({ value: s.value, label: s.label, count: summary ? summary[s.key] ?? 0 : null })),
  ];
  const filtered = Boolean(query || from || to);

  const headers = [
    {
      key: "invoice_code",
      label: "Order",
      render: (row) => (
        <>
          <span className="ls-cell-main">{row.invoice_code || `#${row.order_id}`}</span>
          <span className="ls-cell-sub" title={fullDate(row.order_placed_date_time)}>
            #{row.order_id} · {timeAgo(row.order_placed_date_time)}
          </span>
        </>
      ),
    },
    {
      key: "customer",
      label: "Customer",
      render: (row) => (
        <>
          <span className="ls-cell-main">{row.user_name || "Guest"}</span>
          {row.user_phone && <span className="ls-cell-sub">{row.user_phone}</span>}
        </>
      ),
    },
    {
      key: "total_amount",
      label: "Total",
      align: "end",
      nowrap: true,
      render: (row) => <span className="ls-money">{taka(row.total_amount)}</span>,
    },
    {
      key: "payment",
      label: "Payment",
      render: (row) => {
        const due = parseFloat(row.due_amount || 0);
        const paid = parseFloat(row.paid_amount || 0);
        if (due <= 0) return <Pill tone="good">Paid</Pill>;
        return paid > 0
          ? <Pill tone="warn" title={`Paid ${taka(paid)}`}>{taka(due)} due</Pill>
          : <Pill tone="bad">Unpaid</Pill>;
      },
    },
    {
      key: "status",
      label: "Status",
      render: (row) => {
        const s = statusOf(row.status);
        return <Pill tone={s.tone}>{s.label}</Pill>;
      },
    },
    {
      key: "open",
      label: "",
      align: "end",
      width: 40,
      render: () => <FaChevronRight className="text-muted" aria-hidden="true" />,
    },
  ];

  return (
    <div className="orders-page">
      <ListHeader
        title="Orders"
        subtitle="Store orders, newest first. Open one to change its status, items or payment."
        actions={
          <>
            <Button variant="outline-secondary" onClick={() => navigate("/orders/custom-invoice")}>
              <FaFileInvoice className="me-2" aria-hidden="true" />Custom invoice
            </Button>
            <Button onClick={() => navigate("/orders/create")}>
              <FaPlus className="me-2" aria-hidden="true" />New order
            </Button>
          </>
        }
      />

      <ListCard>
        <FilterTabs tabs={tabs} value={status} onChange={changeStatus} label="Order status" />
        <ListToolbar end={<ResultCount page={page} perPage={limit} total={pagination.total || 0} noun="orders" />}>
          <SearchBox value={search} onChange={setSearch} placeholder="Search invoice, name or phone" busy={loading && Boolean(query)} />
          <div className="ls-dates" role="group" aria-label="Order date">
            <span>From</span>
            <input type="date" value={from} max={to || undefined} onChange={(e) => changeFrom(e.target.value)} aria-label="From date" />
            <span>to</span>
            <input type="date" value={to} min={from || undefined} onChange={(e) => changeTo(e.target.value)} aria-label="To date" />
            {(from || to) && (
              <button type="button" onClick={() => { changeFrom(""); changeTo(""); }} aria-label="Clear dates"><FaTimes /></button>
            )}
          </div>
        </ListToolbar>

        <CommonTable
          headers={headers}
          data={orders}
          loading={loading}
          onRowClick={(row) => navigate(`/orders/${row.order_id}`)}
          rowLabel={(row) => `Open order ${row.invoice_code || row.order_id} from ${row.user_name || "a guest"}`}
          emptyTitle={filtered || status ? "No orders match" : "No orders yet"}
          emptyText={
            filtered || status
              ? "Try another search, a different status tab, or clear the dates."
              : "Orders placed in the store show up here. You can also add one by hand."
          }
          emptyAction={
            filtered ? (
              <Button variant="outline-secondary" size="sm" onClick={() => { setSearch(""); changeFrom(""); changeTo(""); }}>
                Clear search and dates
              </Button>
            ) : !status ? (
              <Button size="sm" onClick={() => navigate("/orders/create")}><FaPlus className="me-1" /> New order</Button>
            ) : null
          }
        />

        <Pager
          page={page}
          lastPage={pagination.last_page || 1}
          onPage={(p) => { setPage(p); window.scrollTo({ top: 0, behavior: "smooth" }); }}
          perPage={limit}
          onPerPage={changeLimit}
        />
      </ListCard>
    </div>
  );
};

export default Orders;
