import React, { useEffect, useState, useRef, useMemo } from "react";
import { Tabs, Tab, Card, Button, Form, Row, Col, InputGroup, Spinner } from "react-bootstrap";
import { toast } from "react-hot-toast";
import {
  FaInfoCircle,
  FaFileContract,
  FaUserShield,
  FaUndoAlt,
  FaFileInvoiceDollar,
  FaTruck,
  FaPercentage,
  FaSave,
} from "react-icons/fa";
import usePageTitle from "../../hooks/usePageTitle";
import axios from "../../config/axios";
import JoditEditor from "jodit-react";
import "./Documents.css";

const TabInlineLoader = ({ label }) => (
  <div className="doc-inline-loader">
    <Spinner animation="border" variant="primary" size="sm" className="mb-2" />
    <p className="text-muted small mb-0">Loading {label}...</p>
  </div>
);

const OrderInfoEditor = ({ fetchEndpoint }) => {
  const [form, setForm] = useState({
    inside_dhaka: "",
    outside_dhaka: "",
    vat: "",
    bkash_changed: "",
  });
  const [savedForm, setSavedForm] = useState(form);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchEndpoint]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await axios.get(fetchEndpoint);
      const data = res?.data?.data ?? {};
      const next = {
        inside_dhaka: data.insideDhaka ?? data.inside_dhaka ?? "",
        outside_dhaka: data.outsideDhaka ?? data.outside_dhaka ?? "",
        vat: data.vat ?? "",
        bkash_changed:
          data.bkashChangedParsentage ?? data.bkash_changed_parsentage ?? "",
      };
      setForm(next);
      setSavedForm(next);
    } catch (err) {
      toast.error("Failed to load order info settings.");
    } finally {
      setLoading(false);
    }
  };

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const isDirty = JSON.stringify(form) !== JSON.stringify(savedForm);

  const onSave = async () => {
    setSaving(true);
    try {
      const payload = {
        inside_dhaka: Number(form.inside_dhaka) || 0,
        outside_dhaka: Number(form.outside_dhaka) || 0,
        vat: Number(form.vat) || 0,
        bkash_changed: Number(form.bkash_changed) || 0,
      };
      const res = await axios.put("/documents/order-info/1", payload);
      toast.success(res?.data?.message || "Order info updated successfully");
      setSavedForm(form);
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <TabInlineLoader label="order info settings" />;

  return (
    <Card className="modern-card border-0">
      <Card.Header className="bg-white d-flex flex-wrap justify-content-between align-items-center gap-2 border-bottom pt-4 px-4 pb-3">
        <div>
          <h5 className="mb-1 text-primary fw-bold">Order Information Settings</h5>
          <p className="text-muted small mb-0">Shipping charges, VAT, and payment surcharges applied at checkout</p>
        </div>
        <Button variant="primary" className="px-4 shadow-sm" onClick={onSave} disabled={saving || !isDirty}>
          {saving ? (
            <>
              <Spinner as="span" animation="border" size="sm" className="me-2" />
              Saving...
            </>
          ) : (
            <>
              <FaSave className="me-2" /> Save Changes
            </>
          )}
        </Button>
      </Card.Header>
      <Card.Body className="p-4">
        <Row className="g-4">
          <Col lg={6}>
            <div className="p-3 bg-light rounded-3 h-100">
              <div className="section-title">
                <FaTruck /> Shipping Charges
              </div>
              <Row className="g-3">
                <Col sm={6}>
                  <Form.Label className="small text-muted fw-bold">INSIDE DHAKA</Form.Label>
                  <InputGroup>
                    <InputGroup.Text>৳</InputGroup.Text>
                    <Form.Control
                      type="number"
                      name="inside_dhaka"
                      value={form.inside_dhaka}
                      onChange={onChange}
                    />
                  </InputGroup>
                </Col>
                <Col sm={6}>
                  <Form.Label className="small text-muted fw-bold">OUTSIDE DHAKA</Form.Label>
                  <InputGroup>
                    <InputGroup.Text>৳</InputGroup.Text>
                    <Form.Control
                      type="number"
                      name="outside_dhaka"
                      value={form.outside_dhaka}
                      onChange={onChange}
                    />
                  </InputGroup>
                </Col>
              </Row>
            </div>
          </Col>

          <Col lg={6}>
            <div className="p-3 bg-light rounded-3 h-100">
              <div className="section-title">
                <FaPercentage /> Tax & Payment Surcharge
              </div>
              <Row className="g-3">
                <Col sm={6}>
                  <Form.Label className="small text-muted fw-bold">VAT</Form.Label>
                  <InputGroup>
                    <Form.Control
                      type="number"
                      step="0.01"
                      name="vat"
                      value={form.vat}
                      onChange={onChange}
                    />
                    <InputGroup.Text>%</InputGroup.Text>
                  </InputGroup>
                </Col>
                <Col sm={6}>
                  <Form.Label className="small text-muted fw-bold">BKASH CHARGE</Form.Label>
                  <InputGroup>
                    <Form.Control
                      type="number"
                      step="0.01"
                      name="bkash_changed"
                      value={form.bkash_changed}
                      onChange={onChange}
                    />
                    <InputGroup.Text>%</InputGroup.Text>
                  </InputGroup>
                </Col>
              </Row>
            </div>
          </Col>
        </Row>

        {isDirty && (
          <div className="doc-unsaved-hint mt-3">
            <span className="doc-unsaved-dot" /> You have unsaved changes
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

const DocumentEditor = ({ title, fetchEndpoint, updateEndpoint }) => {
  const editorRef = useRef(null);
  const [content, setContent] = useState("");
  const [savedContent, setSavedContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const editorConfig = useMemo(
    () => ({
      readonly: false,
      placeholder: "Start typing...",
      height: 480,
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
      setSavedContent(text);
    } catch (err) {
      toast.error(`Failed to load ${title}.`);
    } finally {
      setLoading(false);
    }
  };

  const isDirty = content !== savedContent;

  const onSave = async () => {
    setSaving(true);
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
      toast.success(res?.data?.message || "Updated successfully");
      setSavedContent(content);
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <TabInlineLoader label={title.toLowerCase()} />;

  return (
    <Card className="modern-card border-0">
      <Card.Header className="bg-white border-bottom pt-4 px-4 pb-3">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
          <div>
            <h5 className="text-primary fw-bold mb-1">{title}</h5>
            <p className="text-muted small mb-0">
              Content shown to customers on the public website's {title.toLowerCase()} page
            </p>
          </div>
          <Button variant="primary" className="px-4 shadow-sm" onClick={onSave} disabled={saving || !isDirty}>
            {saving ? (
              <>
                <Spinner as="span" animation="border" size="sm" className="me-2" />
                Saving...
              </>
            ) : (
              <>
                <FaSave className="me-2" /> Save Content
              </>
            )}
          </Button>
        </div>
      </Card.Header>
      <Card.Body className="p-4">
        <JoditEditor
          ref={editorRef}
          value={content}
          config={editorConfig}
          tabIndex={1}
          onBlur={(newContent) => setContent(newContent)}
        />
        {isDirty && (
          <div className="doc-unsaved-hint mt-3">
            <span className="doc-unsaved-dot" /> You have unsaved changes
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

const Documents = () => {
  usePageTitle("Documents");

  const tabs = [
    {
      key: "about",
      title: "About",
      icon: FaInfoCircle,
      endpoint: "/documents/about",
      updateEndpoint: "/documents/about",
    },
    {
      key: "term-condition",
      title: "Terms & Conditions",
      icon: FaFileContract,
      endpoint: "/documents/term-condition",
      updateEndpoint: "/documents/terms&conditions",
    },
    {
      key: "privacy-policy",
      title: "Privacy & Policy",
      icon: FaUserShield,
      endpoint: "/documents/privacy&policy",
      updateEndpoint: "/documents/privacy&policy",
    },
    {
      key: "return-policy",
      title: "Return & Policy",
      icon: FaUndoAlt,
      endpoint: "/documents/return&policy",
      updateEndpoint: "/documents/return&policy",
    },
    {
      key: "order-info",
      title: "Order Info",
      icon: FaFileInvoiceDollar,
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
          <Tab
            eventKey={t.key}
            title={
              <span className="d-inline-flex align-items-center gap-2">
                <t.icon /> {t.title}
              </span>
            }
            key={t.key}
            mountOnEnter
          >
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
