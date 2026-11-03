import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Form } from "react-bootstrap";
import { toast } from "react-hot-toast";
import JoditEditor from "jodit-react";
import { FaInfoCircle, FaFileContract, FaUserShield, FaUndoAlt, FaTruck, FaExternalLinkAlt } from "react-icons/fa";
import axios from "../../config/axios";
import usePageTitle from "../../hooks/usePageTitle";
import { ListHeader } from "../../components/List/List";
import { EditorSection, Field, SaveBar, useUnsavedChanges, editorHtml } from "../../components/Editor/Editor";
import { taka } from "../../components/List/format";
import "../../components/Editor/Editor.css";
import "../../components/List/List.css";
import "./Documents.css";

const STORE = "https://store.zantechbd.com";

// Each page of the store's footer, where it is read and how the API names it.
const DOCS = [
  { key: "about", label: "About us", hint: "Who ZAN Tech is", icon: FaInfoCircle, get: "/documents/about", type: "about", url: `${STORE}/about` },
  { key: "terms", label: "Terms & conditions", hint: "Rules for buying from the store", icon: FaFileContract, get: "/documents/term-condition", type: "terms&conditions", url: `${STORE}/terms` },
  { key: "privacy", label: "Privacy policy", hint: "What customer data is kept and why", icon: FaUserShield, get: "/documents/privacy-policy", type: "privacy&policy", url: `${STORE}/privacy-policy` },
  { key: "returns", label: "Return policy", hint: "Returns, refunds and warranty", icon: FaUndoAlt, get: "/documents/return-policy", type: "return&policy", url: `${STORE}/return-policy` },
  { key: "checkout", label: "Checkout charges", hint: "Delivery charges and bKash fee", icon: FaTruck },
];

const plainText = (html) => (html || "").replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
const wordCount = (html) => (plainText(html).match(/\S+/g) || []).length;

const Loading = () => (
  <div className="ed-section doc-loading" aria-busy="true">
    <span className="skeleton-line" style={{ width: "40%" }} />
    <span className="skeleton-line" style={{ width: "90%" }} />
    <span className="skeleton-line" style={{ width: "75%" }} />
  </div>
);

/** One legal page in a rich-text editor. */
const DocumentEditor = ({ doc }) => {
  const formId = `doc-${doc.key}`;
  const editorRef = useRef(null);
  const [content, setContent] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const { dirty, markSaved } = useUnsavedChanges(content, loaded);
  // The latest editor text may land in state during the save; mark saved once that render is done.
  const [saveCount, setSaveCount] = useState(0);
  useEffect(() => {
    if (saveCount) markSaved();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saveCount]);

  const config = useMemo(
    () => ({ readonly: false, placeholder: `Write the ${doc.label.toLowerCase()}…`, height: 560, showXPathInStatusbar: false }),
    [doc.label]
  );

  useEffect(() => {
    axios
      .get(doc.get)
      .then((res) => {
        const data = res.data?.data;
        setContent(Array.isArray(data) ? data.map((d) => d.text).join("\n") : data?.text || "");
      })
      .catch(() => toast.error(`Couldn't load the ${doc.label.toLowerCase()}`))
      .finally(() => setLoaded(true));
  }, [doc]);

  const save = async (e) => {
    e.preventDefault();
    // The editor saves its text on blur; read the latest before sending.
    const latest = editorHtml(editorRef);
    const text = typeof latest === "string" ? latest : content;
    if (text !== content) setContent(text);
    if (!plainText(text)) {
      toast.error("The page would be empty. Write something before saving.");
      return;
    }
    setSaving(true);
    try {
      await axios.put(`/documents/${encodeURIComponent(doc.type)}`, { text });
      setSaveCount((n) => n + 1);
      toast.success(`${doc.label} saved. It's live on the store.`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Couldn't save. Try again.");
    } finally {
      setSaving(false);
    }
  };

  if (!loaded) return <Loading />;
  const words = wordCount(content);

  return (
    <form id={formId} onSubmit={save}>
      <EditorSection
        id={`${formId}-section`}
        title={doc.label}
        count={words ? `${words.toLocaleString()} words` : null}
        help="Shown in the store's footer. Use headings for each topic so customers can find their answer quickly."
        actions={
          <a className="btn btn-outline-secondary btn-sm" href={doc.url} target="_blank" rel="noreferrer">
            <FaExternalLinkAlt className="me-2" aria-hidden="true" />View on store
          </a>
        }
      >
        <JoditEditor ref={editorRef} value={content} config={config} onBlur={setContent} />
      </EditorSection>
      <SaveBar
        formId={formId}
        dirty={dirty}
        saving={saving}
        saveLabel="Save and publish"
        savingLabel="Publishing…"
        cleanText="This page matches the store"
        dirtyText="Not published yet"
      />
    </form>
  );
};

const CHARGE_FIELDS = ["inside_dhaka", "outside_dhaka", "bkash_changed", "vat"];

/** Delivery charges and the bKash fee used at checkout. */
const CheckoutCharges = () => {
  const [form, setForm] = useState({ inside_dhaka: "", outside_dhaka: "", bkash_changed: "", vat: "" });
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [example, setExample] = useState("1000");
  const { dirty, markSaved } = useUnsavedChanges(form, loaded);

  useEffect(() => {
    axios
      .get("/documents/order-info")
      .then((res) => {
        const d = res.data?.data || {};
        setForm({
          inside_dhaka: String(d.insideDhaka ?? ""),
          outside_dhaka: String(d.outsideDhaka ?? ""),
          bkash_changed: String(d.bkashChangedParsentage ?? ""),
          vat: String(d.vat ?? ""),
        });
      })
      .catch(() => toast.error("Couldn't load the checkout charges"))
      .finally(() => setLoaded(true));
  }, []);

  const set = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((x) => ({ ...x, [name]: null }));
  };

  const save = async (e) => {
    e.preventDefault();
    const found = {};
    CHARGE_FIELDS.forEach((k) => {
      if (form[k] === "" || Number.isNaN(Number(form[k])) || Number(form[k]) < 0) found[k] = "Enter 0 or more.";
    });
    if (!found.bkash_changed && Number(form.bkash_changed) > 10) found.bkash_changed = "That's over 10%. Check the number.";
    setErrors(found);
    if (Object.values(found).some(Boolean)) return;

    setSaving(true);
    try {
      await axios.put("/documents/order-info/1", Object.fromEntries(CHARGE_FIELDS.map((k) => [k, Number(form[k])])));
      markSaved();
      toast.success("Checkout charges saved. New orders use them now.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Couldn't save. Try again.");
    } finally {
      setSaving(false);
    }
  };

  if (!loaded) return <Loading />;

  const subtotal = Math.max(0, Number(example) || 0);
  const fee = (subtotal * (Number(form.bkash_changed) || 0)) / 100;
  const rows = [
    { label: "Inside Dhaka", delivery: Number(form.inside_dhaka) || 0 },
    { label: "Outside Dhaka", delivery: Number(form.outside_dhaka) || 0 },
    { label: "Pickup", delivery: 0 },
  ];

  const money = (name, label, help, unit = "৳") => (
    <Field name={name} label={label} help={help} error={errors[name]} labelFor={`co-${name}`}>
      <div className={`ed-money ${unit === "%" ? "is-suffix" : ""}`}>
        <span aria-hidden="true">{unit}</span>
        <Form.Control id={`co-${name}`} name={name} type="number" inputMode="decimal" min={0} step={unit === "%" ? "0.01" : "1"} value={form[name]} onChange={set} />
      </div>
    </Field>
  );

  return (
    <form id="checkout-charges" onSubmit={save} noValidate>
      <EditorSection
        id="delivery"
        title="Delivery charges"
        help="Customers pick one of these at checkout. Pickup is always free. Anyone with checkout already open is asked to refresh after a change."
      >
        <div className="ed-grid">
          {money("inside_dhaka", "Inside Dhaka")}
          {money("outside_dhaka", "Outside Dhaka")}
        </div>
      </EditorSection>

      <EditorSection id="fees" title="Payment fee and VAT">
        <div className="ed-grid">
          {money("bkash_changed", "bKash fee", "Added on top when the customer pays by bKash, as a share of the order after any discount.", "%")}
          {money("vat", "VAT", "Saved for your records. Checkout doesn't add VAT at the moment.", "%")}
        </div>
      </EditorSection>

      <EditorSection id="example" title="What a customer pays" help="A worked example with the numbers above, before saving.">
        <Field name="example" label="Products in the cart" labelFor="co-example">
          <div className="ed-money" style={{ maxWidth: 200 }}>
            <span aria-hidden="true">৳</span>
            <Form.Control id="co-example" type="number" inputMode="decimal" min={0} value={example} onChange={(e) => setExample(e.target.value)} />
          </div>
        </Field>
        <table className="doc-example">
          <thead>
            <tr>
              <th scope="col">Delivery</th>
              <th scope="col" className="text-end">Cash on delivery</th>
              <th scope="col" className="text-end">Paid by bKash</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label}>
                <th scope="row">{r.label} <span className="text-muted fw-normal">+{taka(r.delivery)}</span></th>
                <td className="text-end">{taka(subtotal + r.delivery)}</td>
                <td className="text-end">{taka(subtotal + r.delivery + fee)}{fee > 0 && <span className="doc-example-fee">incl. {taka(fee)} fee</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </EditorSection>

      <SaveBar
        formId="checkout-charges"
        dirty={dirty}
        saving={saving}
        errorCount={Object.values(errors).filter(Boolean).length}
        saveLabel="Save charges"
        cleanText="Checkout is using these charges"
        dirtyText="Not saved yet"
      />
    </form>
  );
};

const Documents = () => {
  const [params, setParams] = useSearchParams();
  const active = DOCS.find((d) => d.key === params.get("doc")) || DOCS[0];
  usePageTitle(`${active.label} · Legal & settings`);

  return (
    <div className="doc-page">
      <ListHeader
        title="Legal documents & settings"
        subtitle="The store's policy pages and the charges used at checkout. Saving publishes straight away."
      />

      <div className="doc-layout">
        <nav className="doc-list" aria-label="Documents">
          {DOCS.map(({ key, label, hint, icon: Icon }) => (
            <button
              key={key}
              type="button"
              className={`doc-item ${active.key === key ? "is-active" : ""}`}
              aria-current={active.key === key ? "page" : undefined}
              // Unsaved edits get the same "Leave?" check as leaving the page.
              data-leaves-page={active.key === key ? undefined : ""}
              onClick={() => setParams({ doc: key })}
            >
              <Icon aria-hidden="true" />
              <span>
                <strong>{label}</strong>
                <small>{hint}</small>
              </span>
            </button>
          ))}
        </nav>

        <div className="doc-panel">
          {active.key === "checkout" ? <CheckoutCharges /> : <DocumentEditor key={active.key} doc={active} />}
        </div>
      </div>
    </div>
  );
};

export default Documents;
