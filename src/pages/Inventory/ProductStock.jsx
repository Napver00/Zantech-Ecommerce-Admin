import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button, Form, Overlay, Popover } from "react-bootstrap";
import { toast } from "react-hot-toast";
import axiosInstance from "../../config/axios";
import CommonTable from "../../components/Common/CommonTable";
import { ListCard, ListToolbar, SearchBox, FilterTabs, ResultCount, Pager, Pill } from "../../components/List/List";
import { taka } from "../../components/List/format";
import { QtyStepper, AdjustDialog, HistoryPanel } from "./parts";

const LOW = 5;

/** "Real count" or a number, with a small editor. */
const ShownCell = ({ product, onSaved }) => {
  const [target, setTarget] = useState(null);
  const [custom, setCustom] = useState(product.display_quantity != null);
  const [value, setValue] = useState(product.display_quantity ?? "");
  const [saving, setSaving] = useState(false);
  const open = !!target;

  const toggle = (e) => {
    setCustom(product.display_quantity != null);
    setValue(product.display_quantity ?? "");
    setTarget(open ? null : e.currentTarget);
  };

  const save = async (e) => {
    e.preventDefault();
    const display = custom ? parseInt(value, 10) : null;
    if (custom && !(display >= 0)) return;
    setSaving(true);
    try {
      await axiosInstance.put(`/inventory/products/${product.id}/display`, { display_quantity: display });
      onSaved(display);
      setTarget(null);
      toast.success(display == null ? "Customers see the real count" : `Customers see ${display} in stock`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Couldn't save");
    } finally {
      setSaving(false);
    }
  };

  const differs = product.display_quantity != null;
  return (
    <>
      <button type="button" className={`iv-shown ${differs ? "is-custom" : ""}`} onClick={toggle} aria-expanded={open}
        aria-label={`What customers see for ${product.name}. Change it`}>
        {differs ? <>{product.display_quantity}<small>set by hand</small></> : <span className="text-muted">Real count</span>}
      </button>
      <Overlay target={target} show={open} placement="bottom" rootClose onHide={() => setTarget(null)}>
        <Popover className="iv-popover">
          <Popover.Body>
            <Form onSubmit={save}>
              <p className="iv-pop-title">What customers see in the store</p>
              <Form.Check type="radio" id={`sh-real-${product.id}`} name={`sh-${product.id}`} checked={!custom} onChange={() => setCustom(false)}
                label={`The real count (${product.quantity})`} />
              <Form.Check type="radio" id={`sh-set-${product.id}`} name={`sh-${product.id}`} checked={custom} onChange={() => setCustom(true)}
                label="A number I choose" />
              {custom && (
                <Form.Control className="mt-2" type="number" inputMode="numeric" min={0} value={value} onChange={(e) => setValue(e.target.value)}
                  autoFocus aria-label="Number customers see" placeholder="e.g. 10" />
              )}
              <p className="iv-pop-hint">Orders still come off the real count. Staff always see the real count.</p>
              <div className="d-flex justify-content-end gap-2">
                <Button size="sm" variant="outline-secondary" onClick={() => setTarget(null)} disabled={saving}>Cancel</Button>
                <Button size="sm" type="submit" disabled={saving || (custom && value === "")}>Save</Button>
              </div>
            </Form>
          </Popover.Body>
        </Popover>
      </Overlay>
    </>
  );
};

const ProductStock = ({ summary, onChanged }) => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [pagination, setPagination] = useState({ total: 0, last_page: 1 });
  const [adjusting, setAdjusting] = useState(null);
  const [history, setHistory] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => { setQuery(search.trim()); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/inventory/products", { params: { page, limit, ...(query && { search: query }), ...(filter && { filter }) } });
      setRows(res.data?.data || []);
      setPagination(res.data?.pagination || { total: 0, last_page: 1 });
    } catch {
      toast.error("Couldn't load stock");
    } finally {
      setLoading(false);
    }
  }, [page, limit, query, filter]);

  useEffect(() => { load(); }, [load]);

  const patch = (id, change) => {
    setRows((list) => list.map((r) => (r.id === id ? { ...r, ...change } : r)));
    onChanged?.();
  };

  const headers = [
    {
      key: "name",
      label: "Product",
      render: (row) => (
        <div className="ls-with-thumb">
          {row.image ? <img src={row.image} alt="" className="ls-thumb" loading="lazy" /> : <span className="ls-thumb is-empty">No photo</span>}
          <span className="min-w-0">
            <span className="ls-cell-main text-truncate d-block" style={{ maxWidth: 280 }} title={row.name}>{row.name}</span>
            <span className="ls-cell-sub">
              {taka(row.price)}{!row.in_store && " · hidden from store"}{row.is_bundle && " · bundle"}
            </span>
          </span>
        </div>
      ),
    },
    {
      key: "quantity",
      label: "Real stock",
      render: (row) => (
        <div className="iv-stock-cell">
          <QtyStepper value={row.quantity} label={row.name} url={`/inventory/products/${row.id}/adjust`} onSaved={(q) => patch(row.id, { quantity: q })} />
          {row.quantity <= 0 ? <Pill tone="bad">Out</Pill> : row.quantity <= LOW ? <Pill tone="warn">Low</Pill> : null}
        </div>
      ),
    },
    { key: "display", label: "Customers see", render: (row) => <ShownCell product={row} onSaved={(d) => patch(row.id, { display_quantity: d })} /> },
  ];

  const renderActions = (row) => (
    <Button size="sm" variant="outline-secondary" onClick={() => setAdjusting(row)}>Count</Button>
  );

  const s = summary?.products;
  const tabs = [
    { value: "", label: "All", count: s?.total },
    { value: "out", label: "Out of stock", count: s?.out },
    { value: "low", label: `Low (${LOW} or less)`, count: s?.low },
    { value: "shown", label: "Shown differently", count: s?.shown_differently },
    { value: "hidden", label: "Hidden from store" },
  ];

  return (
    <ListCard>
      <FilterTabs label="Show" value={filter} onChange={(v) => { setFilter(v); setPage(1); }} tabs={tabs} />
      <ListToolbar end={<ResultCount page={page} perPage={limit} total={pagination.total || 0} noun="products" />}>
        <SearchBox value={search} onChange={setSearch} placeholder="Search products" busy={loading && !!query} />
      </ListToolbar>
      <CommonTable
        headers={headers}
        data={rows}
        tableLoading={loading}
        loading={loading}
        renderActions={renderActions}
        onRowClick={setHistory}
        rowLabel={(row) => `History of ${row.name}`}
        emptyTitle={query || filter ? "Nothing here" : "No products yet"}
        emptyText={filter === "out" ? "Nothing is out of stock." : filter === "low" ? "Nothing is running low." : "Try another search."}
      />
      <Pager page={page} lastPage={pagination.last_page || 1} onPage={setPage} perPage={limit} onPerPage={(n) => { setLimit(n); setPage(1); }} />

      <AdjustDialog
        target={adjusting}
        url={adjusting ? `/inventory/products/${adjusting.id}/adjust` : ""}
        onClose={() => setAdjusting(null)}
        onSaved={(q) => adjusting && patch(adjusting.id, { quantity: q })}
      />
      <HistoryPanel target={history} type="product" onClose={() => setHistory(null)}>
        {history && (
          <dl className="iv-facts">
            <div><dt>Real stock</dt><dd>{rows.find((r) => r.id === history.id)?.quantity ?? history.quantity}</dd></div>
            <div><dt>Customers see</dt><dd>{history.display_quantity ?? "Real count"}</dd></div>
            <div className="iv-facts-wide"><dd><Link to={`/products/${history.id}`}>Open the product</Link></dd></div>
          </dl>
        )}
      </HistoryPanel>
    </ListCard>
  );
};

export default ProductStock;
