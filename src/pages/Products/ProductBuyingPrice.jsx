import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Offcanvas, Spinner } from "react-bootstrap";
import { FaArrowDown, FaArrowUp, FaTimes } from "react-icons/fa";
import { toast } from "react-hot-toast";
import axiosInstance from "../../config/axios";
import usePageTitle from "../../hooks/usePageTitle";
import CommonTable from "../../components/Common/CommonTable";
import { ListHeader, ListCard, ListToolbar, SearchBox, ResultCount, Pager, Pill } from "../../components/List/List";
import { taka, shortDate } from "../../components/List/format";
import "../../components/List/List.css";
import "./BuyingPrice.css";

// Margin = what the store sells it for now minus what it last cost.
const marginOf = (row) => {
  if (row.selling_price == null || row.buying_price == null) return null;
  const profit = Number(row.selling_price) - Number(row.buying_price);
  const pct = Number(row.selling_price) > 0 ? (profit / Number(row.selling_price)) * 100 : null;
  return { profit, pct };
};

const MarginPill = ({ row }) => {
  const m = marginOf(row);
  if (!m) return <span className="text-muted">—</span>;
  const tone = m.profit < 0 ? "bad" : m.pct != null && m.pct < 10 ? "warn" : "good";
  return (
    <Pill tone={tone} title={m.profit < 0 ? "Selling below the last buying price" : undefined}>
      {m.profit < 0 ? "−" : ""}{taka(Math.abs(m.profit))}{m.pct != null ? ` · ${Math.round(m.pct)}%` : ""}
    </Pill>
  );
};

const ProductBuyingPrice = () => {
  usePageTitle("Buying prices");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [pagination, setPagination] = useState({ total_rows: 0, total_pages: 1 });
  const [open, setOpen] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

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
      // The API only applies a date range when both ends are set.
      const range = from || to ? { start_date: from || "2000-01-01", end_date: `${to || new Date().toISOString().slice(0, 10)} 23:59:59` } : {};
      const res = await axiosInstance.get("/buying-price-items", { params: { page, limit, ...(query && { search: query }), ...range } });
      setRows(res.data?.data || []);
      setPagination(res.data?.pagination || { total_rows: 0, total_pages: 1 });
    } catch (err) {
      toast.error(err.response?.data?.message || "Couldn't load buying prices");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [page, limit, query, from, to]);

  useEffect(() => {
    load();
  }, [load]);

  const openHistory = async (row) => {
    setOpen(row);
    setHistory([]);
    setHistoryLoading(true);
    try {
      const res = await axiosInstance.get(`/item-buying-history/${row.item_id}`);
      setHistory(res.data?.data || []);
    } catch {
      toast.error("Couldn't load the purchase history");
    } finally {
      setHistoryLoading(false);
    }
  };

  const filtered = !!(query || from || to);

  const headers = [
    {
      key: "item_name",
      label: "Product",
      render: (row) => (
        <>
          <span className="ls-cell-main">{row.item_name}</span>
          <span className="ls-cell-sub">{row.stock != null ? `${row.stock} in stock` : `#${row.item_id}`}</span>
        </>
      ),
    },
    {
      key: "buying_price",
      label: "Last bought at",
      align: "end",
      nowrap: true,
      render: (row) => (
        <>
          <span className="ls-money d-block">{taka(row.buying_price)}</span>
          <span className="ls-cell-sub">{shortDate(row.created_at)}</span>
        </>
      ),
    },
    {
      key: "supplier_name",
      label: "From",
      render: (row) => row.supplier_name || <span className="text-muted">Unknown</span>,
    },
    {
      key: "selling_price",
      label: "Sells for",
      align: "end",
      nowrap: true,
      render: (row) => (row.selling_price != null ? taka(row.selling_price) : <span className="text-muted">—</span>),
    },
    { key: "margin", label: "Margin", nowrap: true, render: (row) => <MarginPill row={row} /> },
  ];

  // Oldest first, so each purchase can be compared with the one before it.
  const ordered = [...history].reverse();

  return (
    <div className="bp-page">
      <ListHeader
        title="Buying prices"
        subtitle="The last price paid for each product, from challans, next to what the store sells it for now."
      />

      <ListCard>
        <ListToolbar end={<ResultCount page={page} perPage={limit} total={pagination.total_rows || 0} noun="products" />}>
          <SearchBox value={search} onChange={setSearch} placeholder="Search products" busy={loading && !!query} />
          <div className="ls-dates" role="group" aria-label="Bought between">
            <span>Bought</span>
            <input type="date" value={from} max={to || undefined} onChange={(e) => { setFrom(e.target.value); setPage(1); }} aria-label="From date" />
            <span>to</span>
            <input type="date" value={to} min={from || undefined} onChange={(e) => { setTo(e.target.value); setPage(1); }} aria-label="To date" />
            {(from || to) && (
              <button type="button" onClick={() => { setFrom(""); setTo(""); setPage(1); }} aria-label="Clear dates"><FaTimes /></button>
            )}
          </div>
        </ListToolbar>

        <CommonTable
          headers={headers}
          data={rows.map((r) => ({ ...r, id: r.item_id }))}
          tableLoading={loading}
          loading={loading}
          onRowClick={openHistory}
          rowLabel={(row) => `See every purchase of ${row.item_name}`}
          emptyTitle={filtered ? "Nothing matches" : "No buying prices yet"}
          emptyText={filtered ? "Try another product name or clear the dates." : "Prices appear here once you record a challan."}
        />

        <Pager page={page} lastPage={pagination.total_pages || 1} onPage={setPage} perPage={limit} onPerPage={(n) => { setLimit(n); setPage(1); }} />
      </ListCard>

      <Offcanvas show={!!open} onHide={() => setOpen(null)} placement="end" className="bp-panel">
        {open && (
          <>
            <Offcanvas.Header closeButton>
              <Offcanvas.Title as="h2" className="h5 mb-0">{open.item_name}</Offcanvas.Title>
            </Offcanvas.Header>
            <Offcanvas.Body>
              <dl className="bp-facts">
                <div><dt>Last bought at</dt><dd>{taka(open.buying_price)}</dd></div>
                <div><dt>Sells for</dt><dd>{open.selling_price != null ? taka(open.selling_price) : "—"}</dd></div>
                <div><dt>Margin</dt><dd><MarginPill row={open} /></dd></div>
                <div><dt>In stock</dt><dd>{open.stock ?? "—"}</dd></div>
              </dl>

              <h3 className="bp-subtitle">Every purchase</h3>
              {historyLoading ? (
                <div className="text-center py-4"><Spinner animation="border" size="sm" /></div>
              ) : history.length ? (
                <ol className="bp-history">
                  {ordered.map((h, i) => {
                    const prev = ordered[i - 1];
                    const change = prev ? Number(h.buying_price) - Number(prev.buying_price) : 0;
                    return { h, change };
                  }).reverse().map(({ h, change }) => (
                    <li key={`${h.challan_id}-${h.created_at}`}>
                      <div className="bp-history-main">
                        <span className="ls-money">{taka(h.buying_price)}</span>
                        {change !== 0 && (
                          <span className={`bp-change ${change > 0 ? "is-up" : "is-down"}`}>
                            {change > 0 ? <FaArrowUp aria-hidden="true" /> : <FaArrowDown aria-hidden="true" />}
                            {taka(Math.abs(change))}
                            <span className="visually-hidden">{change > 0 ? " more than before" : " less than before"}</span>
                          </span>
                        )}
                      </div>
                      <div className="bp-history-sub">
                        {h.quantity} {Number(h.quantity) === 1 ? "unit" : "units"}
                        {h.supplier_name ? ` from ${h.supplier_name}` : ""} · {shortDate(h.challan_date || h.created_at)}
                        {h.challan_id && <> · <Link to={`/challans/${h.challan_id}`}>Challan #{h.challan_id}</Link></>}
                      </div>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-muted small">No purchases found.</p>
              )}
            </Offcanvas.Body>
          </>
        )}
      </Offcanvas>
    </div>
  );
};

export default ProductBuyingPrice;
