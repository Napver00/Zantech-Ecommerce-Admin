import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button, Form, Modal, Row, Col } from "react-bootstrap";
import { FaPlus, FaPen, FaTrash, FaPhoneAlt, FaMoneyBillWave } from "react-icons/fa";
import { toast } from "react-hot-toast";
import axiosInstance from "../../config/axios";
import confirmDialog from "../../utils/confirmDialog";
import usePageTitle from "../../hooks/usePageTitle";
import CommonTable from "../../components/Common/CommonTable";
import { ListHeader, ListCard, ListToolbar, SearchBox, FilterTabs, ResultCount, Pager, Pill } from "../../components/List/List";
import { taka, shortDate } from "../../components/List/format";
import "../../components/Editor/Editor.css";
import "../../components/List/List.css";
import "../Customers/CustomerDetail.css";
import "./Suppliers.css";

const EMPTY = { name: "", phone: "", phone2: "", address: "" };
const num = (v) => Number(v) || 0;
const firstError = (err, fallback) => {
  const e = err.response?.data?.errors;
  return e && typeof e === "object" ? Object.values(e).flat()[0] : err.response?.data?.message || fallback;
};

const Suppliers = () => {
  usePageTitle("Suppliers");
  const [all, setAll] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  // Add / edit: null = closed, {} = new, a supplier = edit
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // Payments: "add" records a payment, "set" corrects the total paid
  const [paying, setPaying] = useState(null);
  const [payMode, setPayMode] = useState("add");
  const [payAmount, setPayAmount] = useState("");
  const [payError, setPayError] = useState("");

  useEffect(() => {
    const t = setTimeout(() => { setQuery(search.trim()); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/suppliers", { params: query ? { search: query } : {} });
      setAll(res.data?.data || []);
    } catch {
      toast.error("Couldn't load suppliers");
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => { load(); }, [load]);

  const owing = useMemo(() => all.filter((s) => num(s.due_amount) > 0.005), [all]);
  const rows = tab === "owed" ? owing : all;
  const lastPage = Math.max(1, Math.ceil(rows.length / limit));
  const current = Math.min(page, lastPage);
  const pageRows = rows.slice((current - 1) * limit, current * limit);
  const totals = useMemo(
    () => all.reduce((t, s) => ({ bought: t.bought + num(s.total_amount), paid: t.paid + num(s.paid_amount), due: t.due + Math.max(0, num(s.due_amount)) }), { bought: 0, paid: 0, due: 0 }),
    [all]
  );

  const openEdit = (s) => {
    setForm(s?.id ? { name: s.name || "", phone: s.phone || "", phone2: s.phone2 || "", address: s.address || "" } : EMPTY);
    setErrors({});
    setEditing(s || {});
  };

  const save = async (e) => {
    e.preventDefault();
    const found = {};
    if (!form.name.trim()) found.name = "Enter the supplier's name.";
    if (!form.phone.trim()) found.phone = "Enter a phone number.";
    if (!form.address.trim()) found.address = "Enter where they are.";
    setErrors(found);
    if (Object.keys(found).length) return;
    const body = { name: form.name.trim(), phone: form.phone.trim(), phone2: form.phone2.trim() || null, address: form.address.trim() };
    setSaving(true);
    try {
      if (editing.id) await axiosInstance.put(`/suppliers/${editing.id}`, body);
      else await axiosInstance.post("/suppliers", body);
      toast.success(editing.id ? `${body.name} updated` : `${body.name} added`);
      setEditing(null);
      load();
    } catch (err) {
      toast.error(firstError(err, "Couldn't save the supplier"));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (s) => {
    if (num(s.challans_count) > 0) {
      toast.error(`${s.name} has ${s.challans_count} ${num(s.challans_count) === 1 ? "challan" : "challans"}, so they can't be deleted.`);
      return;
    }
    const ok = await confirmDialog({ title: `Delete ${s.name}?`, message: "They have no challans. This can't be undone.", confirmLabel: "Delete supplier", tone: "danger" });
    if (!ok) return;
    try {
      await axiosInstance.delete(`/suppliers/${s.id}`);
      toast.success(`${s.name} deleted`);
      setEditing(null);
      load();
    } catch (err) {
      toast.error(firstError(err, "Couldn't delete the supplier"));
    }
  };

  const openPay = (s) => {
    setPaying(s);
    setPayMode("add");
    setPayAmount("");
    setPayError("");
  };

  const newPaid = paying ? (payMode === "add" ? num(paying.paid_amount) + num(payAmount) : num(payAmount)) : 0;
  const newDue = paying ? num(paying.total_amount) - newPaid : 0;

  const savePay = async (e) => {
    e.preventDefault();
    if (payAmount === "" || num(payAmount) < 0 || (payMode === "add" && !(num(payAmount) > 0))) {
      setPayError(payMode === "add" ? "Enter how much you paid." : "Enter the total paid so far.");
      return;
    }
    if (newDue < -0.005) {
      const ok = await confirmDialog({
        title: `That's ${taka(-newDue)} more than you owe ${paying.name}.`,
        message: "Save it anyway? It shows as money paid ahead to this supplier.",
        confirmLabel: "Save anyway",
        tone: "warning",
      });
      if (!ok) return;
    }
    setSaving(true);
    try {
      await axiosInstance.put(`/suppliers/update-paid-amount/${paying.id}`, { paid_amount: Math.round(newPaid * 100) / 100 });
      toast.success(payMode === "add" ? `${taka(payAmount)} paid to ${paying.name}` : `Total paid to ${paying.name} set to ${taka(newPaid)}`);
      setPaying(null);
      load();
    } catch (err) {
      toast.error(firstError(err, "Couldn't save the payment"));
    } finally {
      setSaving(false);
    }
  };

  const switchPayMode = () => {
    const next = payMode === "add" ? "set" : "add";
    setPayMode(next);
    setPayAmount(next === "set" ? String(num(paying.paid_amount)) : "");
    setPayError("");
  };

  const headers = [
    {
      key: "name",
      label: "Supplier",
      render: (s) => (
        <>
          <span className="ls-cell-main">{s.name}</span>
          <span className="ls-cell-sub">
            {s.phone && <a href={`tel:${s.phone}`} onClick={(e) => e.stopPropagation()} className="sp-phone"><FaPhoneAlt aria-hidden="true" />{s.phone}</a>}
            {s.phone2 && <>, <a href={`tel:${s.phone2}`} onClick={(e) => e.stopPropagation()}>{s.phone2}</a></>}
          </span>
        </>
      ),
    },
    {
      key: "challans",
      label: "Challans",
      render: (s) =>
        num(s.challans_count) > 0 ? (
          <>
            <Link to={`/challans?search=${encodeURIComponent(s.name)}`} onClick={(e) => e.stopPropagation()}>
              {s.challans_count} {num(s.challans_count) === 1 ? "challan" : "challans"}
            </Link>
            {s.last_challan_date && <span className="ls-cell-sub">Last on {shortDate(s.last_challan_date)}</span>}
          </>
        ) : (
          <span className="text-muted small">None yet</span>
        ),
    },
    { key: "total", label: "Bought", align: "end", nowrap: true, render: (s) => <span className="ls-money">{taka(s.total_amount)}</span> },
    { key: "paid", label: "Paid", align: "end", nowrap: true, render: (s) => <span className="ls-money">{taka(s.paid_amount)}</span> },
    {
      key: "due",
      label: "You owe",
      align: "end",
      nowrap: true,
      render: (s) => {
        const due = num(s.due_amount);
        if (due > 0.005) return <Pill tone="bad">{taka(due)}</Pill>;
        if (due < -0.005) return <Pill tone="info" title="Paid more than bought so far">{taka(-due)} ahead</Pill>;
        if (!num(s.total_amount) && !num(s.paid_amount)) return <span className="text-muted small">Nothing yet</span>;
        return <Pill tone="good">Settled</Pill>;
      },
    },
  ];

  const addButton = <Button onClick={() => openEdit(null)}><FaPlus className="me-2" aria-hidden="true" />Add supplier</Button>;

  return (
    <div className="sp-page">
      <ListHeader title="Suppliers" subtitle="Who you buy stock from, what you've bought on challans and what you still owe." actions={addButton} />

      {!loading && all.length > 0 && (
        <dl className="cd-stats sp-stats">
          <div>
            <dt>Bought on challans</dt>
            <dd>{taka(totals.bought)}</dd>
            <span className="cd-stat-note">from {all.length} {all.length === 1 ? "supplier" : "suppliers"}{query ? " in this search" : ""}</span>
          </div>
          <div><dt>Paid</dt><dd>{taka(totals.paid)}</dd></div>
          <div className={totals.due > 0.005 ? "sp-owe" : ""}>
            <dt>Still owed</dt>
            <dd>{taka(totals.due)}</dd>
            <span className="cd-stat-note">to {owing.length} {owing.length === 1 ? "supplier" : "suppliers"}</span>
          </div>
        </dl>
      )}

      <ListCard>
        <FilterTabs
          label="Show"
          value={tab}
          onChange={(v) => { setTab(v); setPage(1); }}
          tabs={[{ value: "", label: "All", count: loading ? null : all.length }, { value: "owed", label: "Money owed", count: loading ? null : owing.length }]}
        />
        <ListToolbar end={<ResultCount page={current} perPage={limit} total={rows.length} noun="suppliers" />}>
          <SearchBox value={search} onChange={setSearch} placeholder="Name or phone" busy={loading && !!query} />
        </ListToolbar>
        <CommonTable
          headers={headers}
          data={pageRows}
          tableLoading={loading}
          loading={loading}
          renderActions={(s) => (
            <div className="sp-actions">
              <Button size="sm" variant="outline-primary" onClick={(e) => { e.stopPropagation(); openPay(s); }} aria-label={`Pay ${s.name}`}>
                <FaMoneyBillWave className="me-1" aria-hidden="true" />Pay
              </Button>
              <button type="button" className="cd-icon-btn" onClick={(e) => { e.stopPropagation(); openEdit(s); }} aria-label={`Edit ${s.name}`}>
                <FaPen aria-hidden="true" />
              </button>
            </div>
          )}
          onRowClick={(s) => openEdit(s)}
          rowLabel={(s) => `Edit ${s.name}`}
          emptyTitle={query || tab ? "No suppliers match" : "No suppliers yet"}
          emptyText={query ? "Try another name or phone." : tab ? "You don't owe any supplier right now." : "Add the shops and people you buy stock from."}
          emptyAction={!query && !tab && addButton}
        />
        <Pager page={current} lastPage={lastPage} onPage={setPage} perPage={limit} onPerPage={(n) => { setLimit(n); setPage(1); }} />
      </ListCard>

      <Modal show={!!editing} onHide={() => !saving && setEditing(null)} centered>
        <Form onSubmit={save} noValidate>
          <Modal.Header closeButton>
            <Modal.Title as="h2" className="h5 mb-0">{editing?.id ? `Edit ${editing.name}` : "Add supplier"}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Group className="mb-3" controlId="sp-name">
              <Form.Label>Name</Form.Label>
              <Form.Control value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} isInvalid={!!errors.name} autoFocus placeholder="Shop or person" />
              <Form.Control.Feedback type="invalid">{errors.name}</Form.Control.Feedback>
            </Form.Group>
            <Row className="g-3 mb-3">
              <Col sm={6}>
                <Form.Group controlId="sp-phone">
                  <Form.Label>Phone</Form.Label>
                  <Form.Control type="tel" inputMode="tel" maxLength={20} value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} isInvalid={!!errors.phone} />
                  <Form.Control.Feedback type="invalid">{errors.phone}</Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col sm={6}>
                <Form.Group controlId="sp-phone2">
                  <Form.Label>Other phone <span className="text-muted fw-normal">(optional)</span></Form.Label>
                  <Form.Control type="tel" inputMode="tel" maxLength={20} value={form.phone2} onChange={(e) => setForm((f) => ({ ...f, phone2: e.target.value }))} />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group controlId="sp-address">
              <Form.Label>Address</Form.Label>
              <Form.Control as="textarea" rows={2} value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} isInvalid={!!errors.address} placeholder="Market, shop number, area" />
              <Form.Control.Feedback type="invalid">{errors.address}</Form.Control.Feedback>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            {editing?.id && (
              <Button variant="link" className="text-danger me-auto px-0" onClick={() => remove(editing)} disabled={saving}>
                <FaTrash className="me-1" aria-hidden="true" />Delete
              </Button>
            )}
            <Button variant="outline-secondary" onClick={() => setEditing(null)} disabled={saving}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? "Saving…" : editing?.id ? "Save changes" : "Add supplier"}</Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <Modal show={!!paying} onHide={() => !saving && setPaying(null)} centered>
        {paying && (
          <Form onSubmit={savePay} noValidate>
            <Modal.Header closeButton><Modal.Title as="h2" className="h5 mb-0">Pay {paying.name}</Modal.Title></Modal.Header>
            <Modal.Body>
              <dl className="sp-pay-sum">
                <div><dt>Bought</dt><dd>{taka(paying.total_amount)}</dd></div>
                <div><dt>Paid so far</dt><dd>{taka(paying.paid_amount)}</dd></div>
                <div><dt>You owe</dt><dd className={num(paying.due_amount) > 0.005 ? "text-danger" : ""}>{taka(Math.max(0, num(paying.due_amount)))}</dd></div>
              </dl>
              <Form.Group controlId="sp-pay">
                <Form.Label>{payMode === "add" ? "Amount paid now" : "Total paid so far"}</Form.Label>
                <div className="ed-money">
                  <span aria-hidden="true">৳</span>
                  <Form.Control type="number" inputMode="decimal" min={0} step="any" value={payAmount} onChange={(e) => { setPayAmount(e.target.value); setPayError(""); }} isInvalid={!!payError} autoFocus />
                </div>
                {payError && <div className="invalid-feedback d-block">{payError}</div>}
              </Form.Group>
              {payMode === "add" && num(paying.due_amount) > 0.005 && (
                <div className="sp-quick">
                  <button type="button" onClick={() => setPayAmount(String(num(paying.due_amount)))}>All owed</button>
                  <button type="button" onClick={() => setPayAmount(String(Math.round(num(paying.due_amount) / 2)))}>Half</button>
                </div>
              )}
              {payAmount !== "" && (
                <p className="sp-after" aria-live="polite">
                  After this: paid {taka(newPaid)},{" "}
                  {newDue > 0.005 ? <>still owe <strong>{taka(newDue)}</strong></> : newDue < -0.005 ? <><strong>{taka(-newDue)}</strong> paid ahead</> : <strong>settled</strong>}.
                </p>
              )}
              <button type="button" className="sp-mode" onClick={switchPayMode}>
                {payMode === "add" ? "Correct the total paid instead" : "Record a new payment instead"}
              </button>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="outline-secondary" onClick={() => setPaying(null)} disabled={saving}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving ? "Saving…" : payMode === "add" ? "Record payment" : "Save total"}</Button>
            </Modal.Footer>
          </Form>
        )}
      </Modal>
    </div>
  );
};

export default Suppliers;
