import React, { useEffect, useState, useRef, useMemo } from "react";
import { Tabs, Tab } from "react-bootstrap";
import usePageTitle from "../../hooks/usePageTitle";
import axios from "../../config/axios";
import Loading from "../../components/Loading";
import JoditEditor from "jodit-react";

const OrderInfoEditor = ({ fetchEndpoint }) => {
  const [form, setForm] = useState({
    inside_dhaka: "",
    outside_dhaka: "",
    vat: "",
    bkash_changed: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(null);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchEndpoint]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await axios.get(fetchEndpoint);
      const data = res?.data?.data ?? {};
      setForm({
        inside_dhaka: data.insideDhaka ?? data.inside_dhaka ?? "",
        outside_dhaka: data.outsideDhaka ?? data.outside_dhaka ?? "",
        vat: data.vat ?? "",
        bkash_changed:
          data.bkashChangedParsentage ?? data.bkash_changed_parsentage ?? "",
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSave = async () => {
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(null);
    try {
      const payload = {
        inside_dhaka: Number(form.inside_dhaka) || 0,
        outside_dhaka: Number(form.outside_dhaka) || 0,
        vat: Number(form.vat) || 0,
        bkash_changed: Number(form.bkash_changed) || 0,
      };
      const res = await axios.put("/documents/order-info/1", payload);
      setSaveSuccess(res?.data?.message || "Updated successfully");
    } catch (err) {
      setSaveError(
        err?.response?.data?.message || err.message || "Failed to save"
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="tab-content-container">
      <div className="modern-card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="mb-0 text-primary fw-bold">
            Order Information Settings
          </h5>
          {saving && <span className="text-muted small">Saving...</span>}
        </div>
        <div className="card-body">
          <div className="row g-4">
            <div className="col-md-3">
              <label className="form-label text-muted small fw-bold">
                INSIDE DHAKA
              </label>
              <input
                type="number"
                className="form-control"
                name="inside_dhaka"
                value={form.inside_dhaka}
                onChange={onChange}
              />
            </div>
            <div className="col-md-3">
              <label className="form-label text-muted small fw-bold">
                OUTSIDE DHAKA
              </label>
              <input
                type="number"
                className="form-control"
                name="outside_dhaka"
                value={form.outside_dhaka}
                onChange={onChange}
              />
            </div>
            <div className="col-md-3">
              <label className="form-label text-muted small fw-bold">
                VAT (%)
              </label>
              <input
                type="number"
                step="0.01"
                className="form-control"
                name="vat"
                value={form.vat}
                onChange={onChange}
              />
            </div>
            <div className="col-md-3">
              <label className="form-label text-muted small fw-bold">
                BKASH CHARGE (%)
              </label>
              <input
                type="number"
                step="0.01"
                className="form-control"
                name="bkash_changed"
                value={form.bkash_changed}
                onChange={onChange}
              />
            </div>
          </div>

          <div className="mt-4 pt-3 border-top d-flex justify-content-between align-items-center">
            <div>
              {saveError && (
                <span className="text-danger small">{saveError}</span>
              )}
              {saveSuccess && (
                <span className="text-success small">{saveSuccess}</span>
              )}
            </div>
            <button
              className="btn btn-primary px-4 shadow-sm"
              onClick={onSave}
              disabled={saving}
            >
              {saving ? "Saving Changes..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const DocumentEditor = ({ title, fetchEndpoint, updateEndpoint }) => {
  const editorRef = useRef(null);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(null);

  const editorConfig = useMemo(
    () => ({
      readonly: false,
      placeholder: "Start typing...",
      height: 400,
    }),
    []
  );

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchEndpoint]);

  const fetchData = async () => {
    try {
      setLoading(true);
      let res;
      try {
        res = await axios.get(fetchEndpoint);
      } catch {
        // fallback: swap & and - in endpoint
        const alt = fetchEndpoint.includes("&")
          ? fetchEndpoint.replace(/&/g, "-")
          : fetchEndpoint.replace(/-/g, "&");
        res = await axios.get(alt);
      }

      const arr = res?.data?.data ?? [];
      let text = "";
      if (Array.isArray(arr)) {
        text = arr.map((item) => item.text).join("\n\n");
      } else if (arr && arr.text) {
        text = arr.text;
      }
      setContent(text);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const onSave = async () => {
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(null);
    try {
      const payload = { text: content };
      let res;
      try {
        res = await axios.put(updateEndpoint, payload);
      } catch {
        const alt = updateEndpoint.includes("&")
          ? updateEndpoint.replace(/&/g, "-")
          : updateEndpoint.replace(/-/g, "&");
        res = await axios.put(alt, payload);
      }
      setSaveSuccess(res?.data?.message || "Updated successfully");
    } catch (err) {
      setSaveError(
        err?.response?.data?.message || err.message || "Failed to save"
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="tab-content-container">
      <div className="modern-card border-0">
        <div className="card-header bg-white border-bottom pt-4 px-4 pb-0">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="text-primary fw-bold mb-0">{title}</h5>
            <button
              className="btn btn-primary px-4 shadow-sm"
              onClick={onSave}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Content"}
            </button>
          </div>
        </div>
        <div className="card-body p-4">
          <JoditEditor
            ref={editorRef}
            value={content}
            config={editorConfig}
            tabIndex={1}
            onBlur={(newContent) => setContent(newContent)}
          />

          <div className="mt-3">
            {saveError && <div className="alert alert-danger">{saveError}</div>}
            {saveSuccess && (
              <div className="alert alert-success">{saveSuccess}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const Documents = () => {
  usePageTitle("Documents");

  const tabs = [
    {
      key: "about",
      title: "About",
      endpoint: "/documents/about",
      updateEndpoint: "/documents/about",
    },
    {
      key: "term-condition",
      title: "Terms & Conditions",
      endpoint: "/documents/term-condition",
      updateEndpoint: "/documents/terms&conditions",
    },
    {
      key: "privacy-policy",
      title: "Privacy & Policy",
      endpoint: "/documents/privacy&policy",
      updateEndpoint: "/documents/privacy&policy",
    },
    {
      key: "return-policy",
      title: "Return & Policy",
      endpoint: "/documents/return&policy",
      updateEndpoint: "/documents/return&policy",
    },
    {
      key: "order-info",
      title: "Order Info",
      endpoint: "/documents/order-info",
      isOrderInfo: true,
    },
  ];

  const [activeKey, setActiveKey] = useState("about");

  return (
    <div className="landing-container">
      <div className="landing-header mb-4">
        <h2 className="mb-1 text-dark fw-bold">Legal Documents & Settings</h2>
        <p className="text-muted lead fs-6 mb-0">
          Manage your website's policies, terms, and order configuration.
        </p>
      </div>

      <Tabs
        activeKey={activeKey}
        onSelect={(k) => setActiveKey(k)}
        id="documents-tabs"
        className="modern-tabs mb-4 border-0"
        fill
      >
        {tabs.map((t) => (
          <Tab eventKey={t.key} title={t.title} key={t.key}>
            <div className="py-2">
              {t.isOrderInfo ? (
                <OrderInfoEditor fetchEndpoint={t.endpoint} />
              ) : (
                <DocumentEditor
                  title={t.title}
                  fetchEndpoint={t.endpoint}
                  updateEndpoint={t.updateEndpoint}
                />
              )}
            </div>
          </Tab>
        ))}
      </Tabs>
    </div>
  );
};

export default Documents;
