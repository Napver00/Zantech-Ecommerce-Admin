import React, { useCallback, useEffect, useState } from "react";
import { Navigate, useParams, useSearchParams } from "react-router-dom";
import { Button, Form, Modal, Row, Col } from "react-bootstrap";
import { FaPlus, FaChevronRight, FaTimes, FaPaperclip } from "react-icons/fa";
import { toast } from "react-hot-toast";
import axiosInstance from "../../config/axios";
import usePageTitle from "../../hooks/usePageTitle";
import CommonTable from "../../components/Common/CommonTable";
import { ListHeader, ListCard, ListToolbar, SearchBox, FilterTabs, ResultCount, Pager, Pill } from "../../components/List/List";
import { taka, shortDate } from "../../components/List/format";
import "../../components/List/List.css";
import "../Customers/CustomerDetail.css";
import ExpensePanel, { ReceiptPicker } from "./ExpensePanel";
import "../Transitions/Transitions.css";
import "./Expenses.css";

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
// Common things money goes on; staff can type anything.
const SUGGESTED_TITLES = ["Office rent", "Electricity bill", "Internet bill", "Delivery charge", "Facebook ads", "Printing", "Transport", "Food and refreshments", "Salary", "Tools"];
const EMPTY = { date: today(), title: "", amount: "", description: "" };

const Expenses = () => {
  usePageTitle("Expenses");
  // The open expense lives in the address (?open=12), so links and the back button work.
  const [params, setParams] = useSearchParams();
  const openId = params.get("open");
  const openExpense = (id) => setParams((p) => { const n = new URLSearchParams(p); n.set("open", id); return n; });
  const closeExpense = () => setParams((p) => { const n = new URLSearchParams(p); n.delete("open"); return n; }, { replace: true });
  const [rows, setRows] = useState([]);
  const [totals, setTotals] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [pagination, setPagination] = useState({ total: 0, last_page: 1 });
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [files, setFiles] = useState([]);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => { setQuery(search.trim()); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/expenses", {
        params: { page, limit, ...(query && { search: query }), ...(kind && { kind }), ...(from && { start_date: from }), ...(to && { end_date: to }) },
      });
      setRows(res.data?.data || []);
      setTotals(res.data?.totals || null);
      setPagination(res.data?.pagination || { total: 0, last_page: 1 });
    } catch {
      toast.error("Couldn't load expenses");
    } finally {
      setLoading(false);
    }
  }, [page, limit, query, kind, from, to]);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => {
    setForm(EMPTY);
    setFiles([]);
    setErrors({});
    setAdding(true);
  };

  const save = async (e) => {
    e.preventDefault();
    const found = {};
    if (!form.title.trim()) found.title = "What was it for?";
    if (!(Number(form.amount) > 0)) found.amount = "Enter the amount spent.";
    if (!form.date) found.date = "Enter the date.";
    setErrors(found);
    if (Object.keys(found).length) return;

    const fd = new FormData();
    fd.append("date", form.date);
    fd.append("title", form.title.trim());
    fd.append("amount", form.amount);
    if (form.description.trim()) fd.append("description", form.description.trim());
    files.forEach((f) => fd.append("prove[]", f));
    setSaving(true);
    try {
      await axiosInstance.post("/expenses", fd, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success(`${taka(form.amount)} for ${form.title.trim()} recorded`);
      setAdding(false);
      setPage(1);
      load();
    } catch (err) {
      const apiErrors = err.response?.data?.errors;
      toast.error(apiErrors && typeof apiErrors === "object" ? Object.values(apiErrors).flat()[0] : err.response?.data?.message || "Couldn't save the expense");
    } finally {
      setSaving(false);
    }
  };

  const filtered = !!(query || kind || from || to);

  const headers = [
    { key: "date", label: "Date", nowrap: true, render: (row) => shortDate(row.date) },
    {
      key: "title",
      label: "Spent on",
      render: (row) => (
        <>
          <span className="ls-cell-main">{row.title}</span>
          <span className="ls-cell-sub text-truncate d-block" style={{ maxWidth: 380 }} title={row.description || ""}>
            {row.challan_id ? `Challan #${row.challan_id}${row.supplier_name ? ` · ${row.supplier_name}` : ""}` : row.description || ""}
          </span>
        </>
      ),
    },
    {
      key: "kind",
      label: "Type",
      render: (row) => (row.challan_id ? <Pill tone="info">Stock bought</Pill> : <Pill tone="muted">Expense</Pill>),
    },
    {
      key: "proves",
      label: "Receipts",
      render: (row) => (row.proves?.length ? <span className="ex-attach"><FaPaperclip aria-hidden="true" /> {row.proves.length}</span> : <span className="text-muted small">None</span>),
    },
    { key: "user_name", label: "Added by", render: (row) => row.user_name || "—" },
    { key: "amount", label: "Amount", align: "end", nowrap: true, render: (row) => <span className="ls-money">{taka(row.amount)}</span> },
  ];

  return (
    <div className="ex-page">
      <ListHeader
        title="Expenses"
        subtitle="Money spent. Stock bought on challans shows here by itself; everything is also sent to the account site."
        actions={<Button onClick={openAdd}><FaPlus className="me-2" aria-hidden="true" />Add expense</Button>}
      />

      {totals && (
        <dl className="cd-stats ex-stats">
          <div>
            <dt>Spent{from || to ? " in this period" : ""}</dt>
            <dd>{taka(totals.amount)}</dd>
            <span className="cd-stat-note">{totals.count} {totals.count === 1 ? "expense" : "expenses"}{kind === "challan" ? " · stock only" : kind === "other" ? " · without stock" : ""}</span>
          </div>
        </dl>
      )}

      <ListCard>
        <FilterTabs label="Type" value={kind} onChange={(v) => { setKind(v); setPage(1); }}
          tabs={[{ value: "", label: "Everything" }, { value: "other", label: "Expenses" }, { value: "challan", label: "Stock bought (challans)" }]} />
        <ListToolbar end={<ResultCount page={page} perPage={limit} total={pagination.total || 0} noun="expenses" />}>
          <SearchBox value={search} onChange={setSearch} placeholder="Search what it was for" busy={loading && !!query} />
          <div className="ls-dates" role="group" aria-label="Dates">
            <span>From</span>
            <input type="date" value={from} max={to || undefined} onChange={(e) => { setFrom(e.target.value); setPage(1); }} aria-label="From date" />
            <span>to</span>
            <input type="date" value={to} min={from || undefined} onChange={(e) => { setTo(e.target.value); setPage(1); }} aria-label="To date" />
            {(from || to) && <button type="button" onClick={() => { setFrom(""); setTo(""); setPage(1); }} aria-label="Clear dates"><FaTimes /></button>}
          </div>
        </ListToolbar>
        <CommonTable
          headers={headers}
          data={rows}
          tableLoading={loading}
          loading={loading}
          renderActions={() => <FaChevronRight className="text-muted" aria-hidden="true" />}
          onRowClick={(row) => openExpense(row.id)}
          rowLabel={(row) => `Open ${row.title}, ${taka(row.amount)}`}
          emptyTitle={filtered ? "Nothing matches" : "No expenses yet"}
          emptyText={filtered ? "Try another search, tab or dates." : "Record rent, bills, ads and other spending here."}
          emptyAction={!filtered && <Button size="sm" onClick={openAdd}><FaPlus className="me-1" aria-hidden="true" /> Add expense</Button>}
        />
        <Pager page={page} lastPage={pagination.last_page || 1} onPage={setPage} perPage={limit} onPerPage={(n) => { setLimit(n); setPage(1); }} />
      </ListCard>

      <ExpensePanel id={openId} onClose={closeExpense} onChanged={load} />

      <Modal show={adding} onHide={() => !saving && setAdding(false)} centered>
        <Form onSubmit={save} noValidate>
          <Modal.Header closeButton><Modal.Title as="h2" className="h5 mb-0">Add expense</Modal.Title></Modal.Header>
          <Modal.Body>
            <Form.Group className="mb-3" controlId="ex-title">
              <Form.Label>What was it for?</Form.Label>
              <Form.Control list="ex-titles" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} isInvalid={!!errors.title} autoFocus placeholder="e.g. Internet bill" />
              <datalist id="ex-titles">{SUGGESTED_TITLES.map((t) => <option key={t} value={t} />)}</datalist>
              <Form.Control.Feedback type="invalid">{errors.title}</Form.Control.Feedback>
            </Form.Group>
            <Row className="g-3 mb-3">
              <Col sm={6}>
                <Form.Group controlId="ex-amount">
                  <Form.Label>Amount</Form.Label>
                  <div className="ed-money">
                    <span aria-hidden="true">৳</span>
                    <Form.Control type="number" inputMode="decimal" min={0} step="any" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} isInvalid={!!errors.amount} />
                  </div>
                  {errors.amount && <div className="invalid-feedback d-block">{errors.amount}</div>}
                </Form.Group>
              </Col>
              <Col sm={6}>
                <Form.Group controlId="ex-date">
                  <Form.Label>Date</Form.Label>
                  <Form.Control type="date" max={today()} value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} isInvalid={!!errors.date} />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3" controlId="ex-desc">
              <Form.Label>Details <span className="text-muted fw-normal">(optional)</span></Form.Label>
              <Form.Control as="textarea" rows={2} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Who was paid, for which month…" />
            </Form.Group>
            <Form.Label>Receipts <span className="text-muted fw-normal">(optional)</span></Form.Label>
            <ReceiptPicker files={files} onChange={setFiles} />
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" onClick={() => setAdding(false)} disabled={saving}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Add expense"}</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

/** Old /expenses/:id links open the list with that expense in the side panel. */
export const ExpenseRedirect = () => {
  const { id } = useParams();
  return <Navigate to={`/expenses?open=${id}`} replace />;
};

export default Expenses;
