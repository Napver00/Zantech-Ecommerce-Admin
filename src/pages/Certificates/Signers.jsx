import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import { Badge, Button, Card, Col, Form, Modal, Row, Spinner } from "react-bootstrap";
import { FaArrowLeft, FaEdit, FaPlus, FaSignature, FaTrash, FaUpload } from "react-icons/fa";
import axiosInstance from "../../config/axios";
import Loading from "../../components/Loading";
import usePageTitle from "../../hooks/usePageTitle";
import { signatureFromFile, sigLayout, splitRole, joinRole } from "../../utils/certificate";
import CertificatePreview from "../../components/Certificates/CertificatePreview";
import SignatureControls from "../../components/Certificates/SignatureControls";
import "./Certificates.css";

import confirmDialog from "../../utils/confirmDialog";
const EMPTY = { name: "", designation: "", signature: null, is_default: false, ...sigLayout() };

/** Organizers, instructors and others who sign certificates. */
const Signers = () => {
  usePageTitle("Certificate signers");
  const [signers, setSigners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // null | signer | EMPTY
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);

  const load = async () => {
    try {
      const { data } = await axiosInstance.get("/certificate-signers");
      setSigners(data.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load signers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const open = (signer) => {
    setEditing(signer || EMPTY);
    setForm(signer ? { name: signer.name, designation: signer.designation, signature: signer.signature, is_default: signer.is_default, ...sigLayout(signer) } : EMPTY);
  };

  const pickSignature = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      setForm((f) => ({ ...f, signature: null }));
      const dataUrl = await signatureFromFile(file);
      setForm((f) => ({ ...f, signature: dataUrl }));
    } catch (err) {
      toast.error(err.message);
    }
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing.id) await axiosInstance.put(`/certificate-signers/${editing.id}`, form);
      else await axiosInstance.post("/certificate-signers", form);
      toast.success(editing.id ? "Signer updated" : "Signer added");
      setEditing(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not save the signer");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (s) => {
    if (!await confirmDialog(`Remove ${s.name}? Certificates already issued keep their signatures.`)) return;
    try {
      await axiosInstance.delete(`/certificate-signers/${s.id}`);
      toast.success("Signer removed");
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not remove the signer");
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="certificates-page">
      <Card className="modern-card border-0">
        <Card.Body className="p-4">
          <Button variant="link" className="p-0 text-decoration-none mb-1" as={Link} to="/certificates"><FaArrowLeft className="me-1" /> Certificates</Button>
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4">
            <div>
              <h4 className="mb-1 fw-bold text-primary"><FaSignature className="me-2" />Signers</h4>
              <p className="text-muted small mb-0">Default signers are filled in automatically on new certificates. You can still change them per certificate.</p>
            </div>
            <Button onClick={() => open(null)}><FaPlus className="me-2" />Add signer</Button>
          </div>

          <Row className="g-3">
            {signers.map((s) => (
              <Col md={6} xl={4} key={s.id}>
                <div className="cert-signer-card">
                  <div className="cert-sig-thumb lg">{s.signature ? <img src={s.signature} alt="" /> : <span>No signature</span>}</div>
                  <div className="fw-bold mt-2">{s.name}</div>
                  <div className="text-muted small" style={{ whiteSpace: "pre-line" }}>{s.designation}</div>
                  {s.is_default && <Badge bg="primary" className="mt-2">Default</Badge>}
                  <div className="d-flex gap-2 mt-3">
                    <Button size="sm" variant="outline-primary" onClick={() => open(s)}><FaEdit className="me-1" />Edit</Button>
                    <Button size="sm" variant="outline-danger" onClick={() => remove(s)}><FaTrash /></Button>
                  </div>
                </div>
              </Col>
            ))}
            {!signers.length && <p className="text-muted">No signers yet. Add the organizer and instructors who sign certificates.</p>}
          </Row>
        </Card.Body>
      </Card>

      <Modal show={!!editing} onHide={() => !saving && setEditing(null)} centered size={form.signature ? "lg" : undefined}>
        <Form onSubmit={save}>
          <Modal.Header closeButton><Modal.Title>{editing?.id ? "Edit signer" : "Add signer"}</Modal.Title></Modal.Header>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Name</Form.Label>
              <Form.Control required maxLength={120} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Nakibul Islam" />
            </Form.Group>
            <Row className="g-3 mb-3">
              <Col sm={6}>
                <Form.Group controlId="signer-role">
                  <Form.Label>Role</Form.Label>
                  <Form.Control required maxLength={70} value={splitRole(form.designation)[0]} onChange={(e) => setForm((f) => ({ ...f, designation: joinRole(e.target.value, splitRole(f.designation)[1]) }))} placeholder="e.g. Co-Founder" />
                </Form.Group>
              </Col>
              <Col sm={6}>
                <Form.Group controlId="signer-org">
                  <Form.Label>Organization <span className="text-muted fw-normal">(optional)</span></Form.Label>
                  <Form.Control maxLength={45} value={splitRole(form.designation)[1]} onChange={(e) => setForm((f) => ({ ...f, designation: joinRole(splitRole(f.designation)[0], e.target.value) }))} placeholder="e.g. ZAN Tech" />
                </Form.Group>
              </Col>
              <Col xs={12}><Form.Text muted className="mt-0">Printed under the name, the organization on its own line.</Form.Text></Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Signature (optional)</Form.Label>
              <div className="cert-sig-thumb lg mb-2">{form.signature ? <img src={form.signature} alt="" /> : <span>No signature</span>}</div>
              <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={pickSignature} />
              <div className="d-flex gap-2">
                <Button size="sm" variant="outline-secondary" onClick={() => fileRef.current?.click()}><FaUpload className="me-1" />Upload image</Button>
                {form.signature && <Button size="sm" variant="link" className="text-danger" onClick={() => setForm((f) => ({ ...f, signature: null }))}>Remove</Button>}
              </div>
              <Form.Text muted>A PNG with a transparent background looks best. It is resized automatically.</Form.Text>
            </Form.Group>
            {form.signature && (
              <Form.Group className="mb-3">
                <Form.Label>Size and position</Form.Label>
                <CertificatePreview
                  certificate={{
                    title: "Certificate of Completion",
                    recipient_name: "Recipient Name",
                    description: "This is how the signature sits on new certificates. Drag it to move it, or drag its corner dot to resize it.",
                    code: "ZT-XXXX-XXXX",
                    signers: [{ name: form.name || "Signer name", designation: form.designation || "Role", signature: form.signature, ...sigLayout(form) }],
                  }}
                  onSignatureChange={(_, layout) => setForm((f) => ({ ...f, ...layout }))}
                />
                <div className="mt-2">
                  <SignatureControls value={form} onChange={(layout) => setForm((f) => ({ ...f, ...layout }))} idPrefix="signer-sig" />
                </div>
                <Form.Text muted>New certificates start with this. Each certificate can still be adjusted on its own.</Form.Text>
              </Form.Group>
            )}
            <Form.Check type="switch" id="signer-default" label="Add to new certificates by default" checked={form.is_default} onChange={(e) => setForm((f) => ({ ...f, is_default: e.target.checked }))} />
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" onClick={() => setEditing(null)} disabled={saving}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? <Spinner size="sm" animation="border" /> : "Save signer"}</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default Signers;
