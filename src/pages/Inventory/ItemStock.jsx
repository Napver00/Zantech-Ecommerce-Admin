import React, { useCallback, useEffect, useState } from "react";
import { Button, Form, Modal, Row, Col } from "react-bootstrap";
import { FaPlus, FaTrash } from "react-icons/fa";
import { toast } from "react-hot-toast";
import axiosInstance from "../../config/axios";
import confirmDialog from "../../utils/confirmDialog";
import CommonTable from "../../components/Common/CommonTable";
import { ListCard, ListToolbar, SearchBox, FilterTabs, ResultCount, Pager, Pill } from "../../components/List/List";
import { QtyStepper, AdjustDialog, HistoryPanel } from "./parts";

const EMPTY = { name: "", category: "", unit: "pcs", quantity: "", low_stock_at: "", location: "", note: "" };
const UNITS = ["pcs", "box", "pack", "set", "m", "kg", "litre", "roll"];
const isLow = (i) => i.quantity <= 0 || (i.low_stock_at != null && i.quantity <= i.low_stock_at);

/** Add or edit one equipment / supply item. */
const ItemDialog = ({ item, categories, onClose, onSaved }) => {
  const isEdit = !!item?.id;
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (item) setForm({ ...EMPTY, ...Object.fromEntries(Object.entries(item).map(([k, v]) => [k, v ?? ""])) });
  }, [item]);

  if (!item) return null;
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Give it a name.");
      return;
    }
    const body = {
      name: form.name.trim(),
      category: form.category.trim() || null,
      unit: form.unit.trim() || "pcs",
      low_stock_at: form.low_stock_at === "" ? null : Number(form.low_stock_at),
      location: form.location.trim() || null,
      note: form.note.trim() || null,
      ...(!isEdit && { quantity: form.quantity === "" ? 0 : Number(form.quantity) }),
    };
    setSaving(true);
    try {
      if (isEdit) await axiosInstance.put(`/inventory/items/${item.id}`, body);
      else await axiosInstance.post("/inventory/items", body);
      toast.success(isEdit ? "Saved" : `${body.name} added`);
      onSaved();
      onClose();
    } catch (err) {
      const errors = err.response?.data?.errors;
      toast.error(errors ? Object.values(errors).flat()[0] : err.response?.data?.message || "Couldn't save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal show onHide={() => !saving && onClose()} centered>
      <Form onSubmit={save}>
        <Modal.Header closeButton>
          <Modal.Title as="h2" className="h5 mb-0">{isEdit ? `Edit ${item.name}` : "Add equipment or supplies"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3" controlId="it-name">
            <Form.Label>Name</Form.Label>
            <Form.Control value={form.name} onChange={set("name")} placeholder="e.g. Soldering iron, Jumper wires" autoFocus required />
          </Form.Group>
          <Row className="g-3 mb-3">
            <Col sm={6}>
              <Form.Group controlId="it-category">
                <Form.Label>Group <span className="text-muted fw-normal">(optional)</span></Form.Label>
                <Form.Control value={form.category} onChange={set("category")} list="it-categories" placeholder="e.g. Tools, Office, Workshop kit" />
                <datalist id="it-categories">{categories.map((c) => <option key={c} value={c} />)}</datalist>
              </Form.Group>
            </Col>
            <Col sm={6}>
              <Form.Group controlId="it-location">
                <Form.Label>Where it's kept <span className="text-muted fw-normal">(optional)</span></Form.Label>
                <Form.Control value={form.location} onChange={set("location")} placeholder="e.g. Shelf B, Lab cupboard" />
              </Form.Group>
            </Col>
            {!isEdit && (
              <Col sm={4}>
                <Form.Group controlId="it-qty">
                  <Form.Label>How many now</Form.Label>
                  <Form.Control type="number" inputMode="numeric" min={0} value={form.quantity} onChange={set("quantity")} placeholder="0" />
                </Form.Group>
              </Col>
            )}
            <Col sm={isEdit ? 6 : 4}>
              <Form.Group controlId="it-unit">
                <Form.Label>Counted in</Form.Label>
                <Form.Control value={form.unit} onChange={set("unit")} list="it-units" />
                <datalist id="it-units">{UNITS.map((u) => <option key={u} value={u} />)}</datalist>
              </Form.Group>
            </Col>
            <Col sm={isEdit ? 6 : 4}>
              <Form.Group controlId="it-low">
                <Form.Label>Warn at</Form.Label>
                <Form.Control type="number" inputMode="numeric" min={0} value={form.low_stock_at} onChange={set("low_stock_at")} placeholder="Never" />
              </Form.Group>
            </Col>
          </Row>
          <Form.Group controlId="it-note">
            <Form.Label>Note <span className="text-muted fw-normal">(optional)</span></Form.Label>
            <Form.Control as="textarea" rows={2} value={form.note} onChange={set("note")} placeholder="Model, size, who uses it…" />
          </Form.Group>
          {isEdit && <Form.Text>To change how many there are, use Count on the list so the change is recorded.</Form.Text>}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? "Saving…" : isEdit ? "Save" : "Add"}</Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

const ItemStock = ({ summary, onChanged }) => {
  const [rows, setRows] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [filter, setFilter] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [pagination, setPagination] = useState({ total: 0, last_page: 1 });
  const [editing, setEditing] = useState(null);
  const [adjusting, setAdjusting] = useState(null);
  const [history, setHistory] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => { setQuery(search.trim()); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/inventory/items", {
        params: { page, limit, ...(query && { search: query }), ...(category && { category }), ...(filter && { filter }) },
      });
      setRows(res.data?.data || []);
      setCategories(res.data?.categories || []);
      setPagination(res.data?.pagination || { total: 0, last_page: 1 });
    } catch {
      toast.error("Couldn't load equipment and supplies");
    } finally {
      setLoading(false);
    }
  }, [page, limit, query, category, filter]);

  useEffect(() => { load(); }, [load]);

  const reload = () => { load(); onChanged?.(); };
  const patch = (id, change) => {
    setRows((list) => list.map((r) => (r.id === id ? { ...r, ...change } : r)));
    onChanged?.();
  };

  const remove = async (item) => {
    if (!(await confirmDialog(`Remove ${item.name} from the inventory? Its change history goes too.`))) return;
    try {
      await axiosInstance.delete(`/inventory/items/${item.id}`);
      setHistory(null);
      toast.success(`${item.name} removed`);
      reload();
    } catch (err) {
      toast.error(err.response?.data?.message || "Couldn't remove it");
    }
  };

  const headers = [
    {
      key: "name",
      label: "Item",
      render: (row) => (
        <>
          <span className="ls-cell-main">{row.name}</span>
          <span className="ls-cell-sub">{[row.category, row.location].filter(Boolean).join(" · ") || "No group"}</span>
        </>
      ),
    },
    {
      key: "quantity",
      label: "Stock",
      render: (row) => (
        <div className="iv-stock-cell">
          <QtyStepper value={row.quantity} unit={row.unit} label={row.name} url={`/inventory/items/${row.id}/adjust`} onSaved={(q) => patch(row.id, { quantity: q })} />
          {row.quantity <= 0 ? <Pill tone="bad">Out</Pill> : isLow(row) ? <Pill tone="warn">Low</Pill> : null}
        </div>
      ),
    },
  ];

  const renderActions = (row) => (
    <Button size="sm" variant="outline-secondary" onClick={() => setAdjusting(row)}>Count</Button>
  );

  const addButton = (
    <Button size="sm" onClick={() => setEditing({})}><FaPlus className="me-1" aria-hidden="true" />Add item</Button>
  );

  return (
    <ListCard>
      <FilterTabs label="Show" value={filter} onChange={(v) => { setFilter(v); setPage(1); }}
        tabs={[{ value: "", label: "All", count: summary?.items?.total }, { value: "low", label: "Low or out", count: summary ? summary.items.low + summary.items.out : null }]} />
      <ListToolbar end={<>{<ResultCount page={page} perPage={limit} total={pagination.total || 0} noun="items" />}{addButton}</>}>
        <SearchBox value={search} onChange={setSearch} placeholder="Search name, group or place" busy={loading && !!query} />
        {categories.length > 0 && (
          <Form.Select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }} aria-label="Group" className="iv-select">
            <option value="">All groups</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </Form.Select>
        )}
      </ListToolbar>
      <CommonTable
        headers={headers}
        data={rows}
        tableLoading={loading}
        loading={loading}
        renderActions={renderActions}
        onRowClick={setHistory}
        rowLabel={(row) => `Details of ${row.name}`}
        emptyTitle={query || category || filter ? "Nothing here" : "Nothing added yet"}
        emptyText={query || category || filter ? "Try another search or group." : "Add tools, equipment and supplies you keep but don't sell, like soldering irons, multimeters or packing boxes."}
        emptyAction={!query && !category && !filter && addButton}
      />
      <Pager page={page} lastPage={pagination.last_page || 1} onPage={setPage} perPage={limit} perPageOptions={[25, 50, 100]} onPerPage={(n) => { setLimit(n); setPage(1); }} />

      <ItemDialog item={editing} categories={categories} onClose={() => setEditing(null)} onSaved={reload} />
      <AdjustDialog
        target={adjusting}
        url={adjusting ? `/inventory/items/${adjusting.id}/adjust` : ""}
        onClose={() => setAdjusting(null)}
        onSaved={(q) => adjusting && patch(adjusting.id, { quantity: q })}
      />
      <HistoryPanel target={history} type="item" onClose={() => setHistory(null)}>
        {history && (
          <>
            <dl className="iv-facts">
              <div><dt>Stock</dt><dd>{rows.find((r) => r.id === history.id)?.quantity ?? history.quantity} {history.unit}</dd></div>
              <div><dt>Warn at</dt><dd>{history.low_stock_at ?? "Never"}</dd></div>
              {history.category && <div><dt>Group</dt><dd>{history.category}</dd></div>}
              {history.location && <div><dt>Kept at</dt><dd>{history.location}</dd></div>}
            </dl>
            {history.note && <p className="iv-note">{history.note}</p>}
            <div className="d-flex gap-2 mb-4">
              <Button size="sm" variant="outline-primary" onClick={() => { setEditing(history); setHistory(null); }}>Edit details</Button>
              <Button size="sm" variant="outline-danger" onClick={() => remove(history)}><FaTrash className="me-1" aria-hidden="true" />Remove</Button>
            </div>
          </>
        )}
      </HistoryPanel>
    </ListCard>
  );
};

export default ItemStock;
