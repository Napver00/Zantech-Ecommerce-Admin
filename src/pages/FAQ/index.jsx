import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Form, Modal } from "react-bootstrap";
import { FaPlus, FaPen, FaTrash, FaChevronDown } from "react-icons/fa";
import { toast } from "react-hot-toast";
import axiosInstance from "../../config/axios";
import confirmDialog from "../../utils/confirmDialog";
import usePageTitle from "../../hooks/usePageTitle";
import { ChoiceGroup } from "../../components/Editor/Editor";
import { ListHeader, ListCard, ListToolbar, SearchBox, FilterTabs, ResultCount, Pager, Pill } from "../../components/List/List";
import "../../components/Editor/Editor.css";
import "../../components/List/List.css";
import "./FAQ.css";

const CATEGORIES = {
  store: { label: "Store", help: "Shown on the shop's help and product pages." },
  landingpage: { label: "Main site", help: "Shown on the ZAN Tech main website." },
};
const EMPTY = { question: "", answer: "", category: "store", status: true };
const firstError = (err, fallback) => {
  const e = err.response?.data?.errors;
  return e && typeof e === "object" ? Object.values(e).flat()[0] : err.response?.data?.message || fallback;
};

const FAQ = () => {
  usePageTitle("FAQs");
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [open, setOpen] = useState(() => new Set());
  const [busy, setBusy] = useState(null);

  const [editing, setEditing] = useState(null); // null = closed, {} = new, faq = edit
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await axiosInstance.get("/faqs");
      setFaqs(res.data?.data || []);
    } catch {
      toast.error("Couldn't load FAQs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const q = search.trim().toLowerCase();
  const matching = useMemo(
    () => (q ? faqs.filter((f) => `${f.question} ${f.answer}`.toLowerCase().includes(q)) : faqs),
    [faqs, q]
  );
  const rows = category ? matching.filter((f) => f.category === category) : matching;
  const lastPage = Math.max(1, Math.ceil(rows.length / limit));
  const current = Math.min(page, lastPage);
  const pageRows = rows.slice((current - 1) * limit, current * limit);
  const count = (c) => matching.filter((f) => f.category === c).length;
  const hiddenCount = faqs.filter((f) => Number(f.status) !== 1).length;

  const toggleOpen = (id) =>
    setOpen((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const toggleShown = async (f) => {
    setBusy(f.id);
    const shown = Number(f.status) === 1;
    setFaqs((list) => list.map((x) => (x.id === f.id ? { ...x, status: shown ? 0 : 1 } : x)));
    try {
      await axiosInstance.patch(`/faqs/status/${f.id}`);
      toast.success(shown ? "Hidden from the website" : "Shown on the website");
    } catch {
      setFaqs((list) => list.map((x) => (x.id === f.id ? { ...x, status: f.status } : x)));
      toast.error("Couldn't change it");
    } finally {
      setBusy(null);
    }
  };

  const openEdit = (f) => {
    setForm(f?.id ? { question: f.question || "", answer: f.answer || "", category: f.category || "store", status: Number(f.status) === 1 } : { ...EMPTY, category: category || "store" });
    setErrors({});
    setEditing(f || {});
  };

  const save = async (e) => {
    e.preventDefault();
    const found = {};
    if (!form.question.trim()) found.question = "Write the question.";
    if (!form.answer.trim()) found.answer = "Write the answer.";
    setErrors(found);
    if (Object.keys(found).length) return;
    const body = { question: form.question.trim(), answer: form.answer.trim(), category: form.category };
    setSaving(true);
    try {
      if (editing.id) {
        await axiosInstance.put(`/faqs/${editing.id}`, body);
        // Showing or hiding is a separate switch on the server
        if ((Number(editing.status) === 1) !== form.status) await axiosInstance.patch(`/faqs/status/${editing.id}`);
        toast.success("FAQ saved");
      } else {
        await axiosInstance.post("/faqs", { ...body, status: form.status ? 1 : 0 });
        toast.success(form.status ? "FAQ added and shown on the website" : "FAQ added (hidden)");
      }
      setEditing(null);
      load();
    } catch (err) {
      toast.error(firstError(err, "Couldn't save the FAQ"));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (f) => {
    const ok = await confirmDialog({ title: "Delete this FAQ?", message: `"${f.question}" is removed from the website. To keep it for later, hide it instead.`, confirmLabel: "Delete FAQ", tone: "danger" });
    if (!ok) return;
    try {
      await axiosInstance.delete(`/faqs/${f.id}`);
      setFaqs((list) => list.filter((x) => x.id !== f.id));
      setEditing(null);
      toast.success("FAQ deleted");
    } catch (err) {
      toast.error(firstError(err, "Couldn't delete the FAQ"));
    }
  };

  const addButton = <Button onClick={() => openEdit(null)}><FaPlus className="me-2" aria-hidden="true" />Add FAQ</Button>;

  return (
    <div className="fq-page">
      <ListHeader
        title="FAQs"
        subtitle={`Questions customers ask, answered once.${hiddenCount ? ` ${hiddenCount} hidden from the website.` : ""}`}
        actions={addButton}
      />
      <ListCard>
        <FilterTabs
          label="Where it shows"
          value={category}
          onChange={(v) => { setCategory(v); setPage(1); }}
          tabs={[
            { value: "", label: "All", count: loading ? null : matching.length },
            { value: "store", label: "Store", count: loading ? null : count("store") },
            { value: "landingpage", label: "Main site", count: loading ? null : count("landingpage") },
          ]}
        />
        <ListToolbar end={<ResultCount page={current} perPage={limit} total={rows.length} noun="FAQs" />}>
          <SearchBox value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search questions and answers" />
        </ListToolbar>

        {loading ? (
          <div className="fq-loading" aria-busy="true">
            {[0, 1, 2].map((i) => <div key={i} className="fq-skeleton" />)}
          </div>
        ) : pageRows.length === 0 ? (
          <div className="fq-empty">
            <h2 className="h6">{q || category ? "No FAQs match" : "No FAQs yet"}</h2>
            <p className="text-muted">{q ? "Try other words." : category ? "Add one for this part of the website." : "Add the questions customers ask most, like delivery time or payment."}</p>
            {!q && addButton}
          </div>
        ) : (
          <ul className="fq-list">
            {pageRows.map((f) => {
              const shown = Number(f.status) === 1;
              const isOpen = open.has(f.id);
              return (
                <li key={f.id} className={`fq-item ${shown ? "" : "is-hidden"}`}>
                  <div className="fq-row">
                    <button type="button" className="fq-q" aria-expanded={isOpen} aria-controls={`fq-a-${f.id}`} onClick={() => toggleOpen(f.id)}>
                      <FaChevronDown className="fq-chev" aria-hidden="true" />
                      <span>{f.question}</span>
                    </button>
                    <div className="fq-meta">
                      {!category && <Pill tone="muted">{CATEGORIES[f.category]?.label || f.category}</Pill>}
                      <Form.Check
                        type="switch"
                        id={`fq-show-${f.id}`}
                        className="fq-switch"
                        checked={shown}
                        disabled={busy === f.id}
                        onChange={() => toggleShown(f)}
                        label={shown ? "Shown" : "Hidden"}
                        aria-label={`${shown ? "Hide" : "Show"} "${f.question}" on the website`}
                      />
                      <button type="button" className="cd-icon-btn" onClick={() => openEdit(f)} aria-label={`Edit "${f.question}"`}><FaPen aria-hidden="true" /></button>
                    </div>
                  </div>
                  <div id={`fq-a-${f.id}`} className="fq-a" hidden={!isOpen}>{f.answer}</div>
                </li>
              );
            })}
          </ul>
        )}
        <Pager page={current} lastPage={lastPage} onPage={setPage} perPage={limit} onPerPage={(n) => { setLimit(n); setPage(1); }} />
      </ListCard>

      <Modal show={!!editing} onHide={() => !saving && setEditing(null)} centered size="lg">
        <Form onSubmit={save} noValidate>
          <Modal.Header closeButton>
            <Modal.Title as="h2" className="h5 mb-0">{editing?.id ? "Edit FAQ" : "Add FAQ"}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Group className="mb-3" controlId="fq-question">
              <Form.Label>Question</Form.Label>
              <Form.Control value={form.question} onChange={(e) => setForm((f) => ({ ...f, question: e.target.value }))} isInvalid={!!errors.question} autoFocus placeholder="e.g. How long does delivery take?" />
              <Form.Control.Feedback type="invalid">{errors.question}</Form.Control.Feedback>
            </Form.Group>
            <Form.Group className="mb-3" controlId="fq-answer">
              <Form.Label>Answer</Form.Label>
              <Form.Control as="textarea" rows={5} value={form.answer} onChange={(e) => setForm((f) => ({ ...f, answer: e.target.value }))} isInvalid={!!errors.answer} placeholder="Answer the way you'd reply to a customer." />
              <Form.Control.Feedback type="invalid">{errors.answer}</Form.Control.Feedback>
            </Form.Group>
            <fieldset className="mb-3">
              <legend className="form-label fs-6">Where it shows</legend>
              <ChoiceGroup
                name="fq-category"
                value={form.category}
                onChange={(v) => setForm((f) => ({ ...f, category: v }))}
                options={Object.entries(CATEGORIES).map(([value, c]) => ({ value, label: c.label, hint: c.help }))}
              />
            </fieldset>
            <Form.Check
              type="switch"
              id="fq-status"
              checked={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.checked }))}
              label="Show on the website"
            />
          </Modal.Body>
          <Modal.Footer>
            {editing?.id && (
              <Button variant="link" className="text-danger me-auto px-0" onClick={() => remove(editing)} disabled={saving}>
                <FaTrash className="me-1" aria-hidden="true" />Delete
              </Button>
            )}
            <Button variant="outline-secondary" onClick={() => setEditing(null)} disabled={saving}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? "Saving…" : editing?.id ? "Save changes" : "Add FAQ"}</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default FAQ;
