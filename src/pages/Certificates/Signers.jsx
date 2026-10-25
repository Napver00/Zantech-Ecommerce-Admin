import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import { Badge, Button, Card, Col, Form, Modal, Row, Spinner } from "react-bootstrap";
import { FaArrowLeft, FaEdit, FaPlus, FaSignature, FaTrash, FaUpload } from "react-icons/fa";
import axiosInstance from "../../config/axios";
import Loading from "../../components/Loading";
import usePageTitle from "../../hooks/usePageTitle";
import { signatureFromFile } from "../../utils/certificate";
import "./Certificates.css";

import confirmDialog from "../../utils/confirmDialog";
const EMPTY = { name: "", designation: "", signature: null, is_default: false };

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
    setForm(signer ? { name: signer.name, designation: signer.designation, signature: signer.signature, is_default: signer.is_default } : EMPTY);
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
                  <div className="text-muted small">{s.designation}</div>
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

      <Modal show={!!editing} onHide={() => !saving && setEditing(null)} centered>
        <Form onSubmit={save}>
          <Modal.Header closeButton><Modal.Title>{editing?.id ? "Edit signer" : "Add signer"}</Modal.Title></Modal.Header>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Name</Form.Label>
              <Form.Control required maxLength={120} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Nakibul Islam" />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Role printed under the name</Form.Label>
              <Form.Control required maxLength={120} value={form.designation} onChange={(e) => setForm((f) => ({ ...f, designation: e.target.value }))} placeholder="e.g. Organizer, Chief Instructor" />
            </Form.Group>
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
