import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Form } from "react-bootstrap";
import { FaTimes } from "react-icons/fa";
import { toast } from "react-hot-toast";
import axiosInstance from "../../config/axios";
import usePageTitle from "../../hooks/usePageTitle";
import { ListHeader, ListCard, ListToolbar, SearchBox, ResultCount, Pager } from "../../components/List/List";
import { fullDate } from "../../components/List/format";
import "../../components/List/List.css";
import "./Activity.css";

// What each activity type is called and where its record lives (types are stored in mixed case).
const TYPES = {
  order: { label: "Order", to: (id) => `/orders/${id}` },
  product: { label: "Product", to: (id) => `/products/${id}` },
  challan: { label: "Challan", to: (id) => `/challans/${id}` },
  expense: { label: "Expense", to: (id) => `/expenses/${id}` },
  coupon: { label: "Coupon", to: () => "/coupons" },
  category: { label: "Category", to: () => "/categories" },
  student: { label: "Student", to: (id) => `/students/${id}` },
  certificate: { label: "Certificate", to: (id) => `/certificates/${id}` },
  course_invoice: { label: "Course invoice", to: (id) => `/course-invoices/${id}` },
  course_registration: { label: "Registration", to: (id) => `/course-registrations?id=${id}` },
  course_payment_method: { label: "Payment method", to: () => "/payment-methods" },
  career: { label: "Career" },
  orderinfo: { label: "Checkout charges", to: () => "/settings/documents?doc=checkout" },
  user: { label: "Account" },
};
const typeInfo = (t) => TYPES[String(t || "").toLowerCase()] || { label: t ? t.charAt(0).toUpperCase() + t.slice(1).replace(/_/g, " ") : "Other" };

const dayLabel = (value) => {
  const d = new Date(value);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
};
const timeOf = (value) => new Date(value).toLocaleTimeString("en-GB", { hour: "numeric", minute: "2-digit", hour12: true });

const Entry = ({ a }) => {
  const [expanded, setExpanded] = useState(false);
  const info = typeInfo(a.type);
  const long = (a.description || "").length > 180;
  const link = info.to && a.relatable_id ? info.to(a.relatable_id) : null;
  const who = a.user?.name || "System";

  return (
    <li className="al-entry">
      <span className="al-avatar" aria-hidden="true">{who.charAt(0).toUpperCase()}</span>
      <div className="al-body">
        <div className="al-head">
          <strong>{who}</strong>
          <span className={`al-type al-type-${String(a.type || "").toLowerCase()}`}>{info.label}</span>
          <time dateTime={a.created_at} title={fullDate(a.created_at)}>{timeOf(a.created_at)}</time>
        </div>
        <p className={`al-text ${long && !expanded ? "is-clamped" : ""}`}>{a.description}</p>
        <div className="al-actions">
          {long && (
            <button type="button" onClick={() => setExpanded((x) => !x)} aria-expanded={expanded}>
              {expanded ? "Show less" : "Show more"}
            </button>
          )}
          {link && <Link to={link}>Open {info.label.toLowerCase()}</Link>}
        </div>
      </div>
    </li>
  );
};

const Activity = () => {
  usePageTitle("Activity log");
  const [rows, setRows] = useState([]);
  const [facets, setFacets] = useState({ types: [], users: [] });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [type, setType] = useState("");
  const [userId, setUserId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [pagination, setPagination] = useState({ total_rows: 0, total_pages: 1 });

  useEffect(() => {
    const t = setTimeout(() => {
      setQuery(search.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/activitys", {
        params: {
          page,
          limit,
          ...(query && { search: query }),
          ...(type && { type }),
          ...(userId && { user_id: userId }),
          ...(from && { start_date: from }),
          ...(to && { end_date: to }),
        },
      });
      setRows(res.data?.data || []);
      if (res.data?.facets) setFacets(res.data.facets);
      setPagination(res.data?.pagination || { total_rows: 0, total_pages: 1 });
    } catch (err) {
      toast.error(err.response?.data?.message || "Couldn't load the activity log");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [page, limit, query, type, userId, from, to]);

  useEffect(() => {
    load();
  }, [load]);

  // Group the page by day, newest first.
  const days = useMemo(() => {
    const groups = [];
    rows.forEach((a) => {
      const label = dayLabel(a.created_at);
      const last = groups[groups.length - 1];
      if (last && last.label === label) last.items.push(a);
      else groups.push({ label, items: [a] });
    });
    return groups;
  }, [rows]);

  const filtered = !!(query || type || userId || from || to);
  const reset = () => { setSearch(""); setType(""); setUserId(""); setFrom(""); setTo(""); setPage(1); };

  return (
    <div className="al-page">
      <ListHeader title="Activity log" subtitle="Who changed what in the admin, newest first." />

      <ListCard>
        <ListToolbar end={<ResultCount page={page} perPage={limit} total={pagination.total_rows || 0} noun="entries" />}>
          <SearchBox value={search} onChange={setSearch} placeholder="Search what was done" busy={loading && !!query} />
          <Form.Select value={type} onChange={(e) => { setType(e.target.value); setPage(1); }} aria-label="Kind of change" className="al-select">
            <option value="">Everything</option>
            {facets.types.map((t) => (
              <option key={t.type} value={t.type}>{typeInfo(t.type).label} ({t.count})</option>
            ))}
          </Form.Select>
          <Form.Select value={userId} onChange={(e) => { setUserId(e.target.value); setPage(1); }} aria-label="Done by" className="al-select">
            <option value="">Anyone</option>
            {facets.users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </Form.Select>
          <div className="ls-dates" role="group" aria-label="Dates">
            <span>From</span>
            <input type="date" value={from} max={to || undefined} onChange={(e) => { setFrom(e.target.value); setPage(1); }} aria-label="From date" />
            <span>to</span>
            <input type="date" value={to} min={from || undefined} onChange={(e) => { setTo(e.target.value); setPage(1); }} aria-label="To date" />
            {(from || to) && (
              <button type="button" onClick={() => { setFrom(""); setTo(""); setPage(1); }} aria-label="Clear dates"><FaTimes /></button>
            )}
          </div>
        </ListToolbar>

        <div className={`al-feed ${loading && rows.length ? "is-updating" : ""}`} aria-busy={loading}>
          {loading && !rows.length ? (
            <ul className="al-day-list">
              {[0, 1, 2, 3].map((i) => (
                <li key={i} className="al-entry al-skeleton"><span className="al-avatar" /><div className="al-body"><span /><span /></div></li>
              ))}
            </ul>
          ) : days.length ? (
            days.map((d) => (
              <section key={d.label} className="al-day" aria-label={d.label}>
                <h2 className="al-day-title">{d.label}</h2>
                <ul className="al-day-list">
                  {d.items.map((a) => <Entry key={a.id} a={a} />)}
                </ul>
              </section>
            ))
          ) : (
            <div className="empty-state">
              <p className="empty-state-title">{filtered ? "Nothing matches" : "No activity yet"}</p>
              <p className="empty-state-text">{filtered ? "Try fewer filters." : "Changes made in the admin show up here."}</p>
              {filtered && <button type="button" className="btn btn-outline-secondary btn-sm" onClick={reset}>Clear filters</button>}
            </div>
          )}
        </div>

        <Pager page={page} lastPage={pagination.total_pages || 1} onPage={setPage} perPage={limit} perPageOptions={[25, 50, 100]} onPerPage={(n) => { setLimit(n); setPage(1); }} />
      </ListCard>
    </div>
  );
};

export default Activity;
