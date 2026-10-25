import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import { Badge, Button, Card, Col, Form, Modal, Row, Spinner } from "react-bootstrap";
import {
  FaArrowLeft, FaBan, FaCopy, FaDownload, FaEdit, FaEnvelope, FaExternalLinkAlt, FaPrint, FaTrash, FaUndo, FaWhatsapp,
} from "react-icons/fa";
import axiosInstance from "../../config/axios";
import Loading from "../../components/Loading";
import usePageTitle from "../../hooks/usePageTitle";
import CertificatePreview from "../../components/Certificates/CertificatePreview";
import CertificateEmailModal from "../../components/Certificates/CertificateEmailModal";
import { PROGRAM_TYPES, TEMPLATES, certificateFilename, createCertificatePdf, printCertificate } from "../../utils/certificate";
import { downloadBlob, shareInvoiceOnWhatsApp } from "../../utils/invoicePdf";
import "./Certificates.css";

const fmt = (d, time = false) =>
  d ? new Date(time ? d : `${String(d).slice(0, 10)}T00:00:00`).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", ...(time ? { hour: "numeric", minute: "2-digit" } : {}) }) : "—";

const ViewCertificate = () => {
  usePageTitle("Certificate");
  const { id } = useParams();
  const navigate = useNavigate();
  const [cert, setCert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);
  const [showEmail, setShowEmail] = useState(false);
  const [showRevoke, setShowRevoke] = useState(false);
  const [reason, setReason] = useState("");

  const load = async () => {
    try {
      const { data } = await axiosInstance.get(`/certificates/${id}`);
      setCert(data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Certificate not found");
      navigate("/certificates");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const run = async (key, fn) => {
    setBusy(key);
    try {
      await fn();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || err.message || "Something went wrong");
    } finally {
      setBusy(null);
    }
  };

  const download = () => run("pdf", async () => downloadBlob(await createCertificatePdf(cert), certificateFilename(cert)));

  const whatsapp = () =>
    run("wa", async () => {
      const text = `Congratulations ${cert.recipient_name}! Here is your ${cert.title} from ZAN Tech. Verify it online: ${cert.verify_url}`;
      const result = await shareInvoiceOnWhatsApp({ blob: await createCertificatePdf(cert), filename: certificateFilename(cert), text, phone: "" });
      if (result === "downloaded") toast.success("PDF downloaded. Attach it in the WhatsApp chat that just opened.", { duration: 6000 });
    });

  const setStatus = (status) =>
    run("status", async () => {
      await axiosInstance.patch(`/certificates/${id}/status`, { status, reason: status === "revoked" ? reason.trim() || null : null });
      toast.success(status === "revoked" ? "Certificate revoked" : "Certificate restored");
      setShowRevoke(false);
      setReason("");
      await load();
    });

  const remove = () => {
    if (!window.confirm(`Delete certificate ${cert.code}? Its QR code will stop working. Revoking keeps a record instead.`)) return;
    run("delete", async () => {
      await axiosInstance.delete(`/certificates/${id}`);
      toast.success("Certificate deleted");
      navigate("/certificates");
    });
  };

  const copyLink = () => navigator.clipboard?.writeText(cert.verify_url).then(() => toast.success("Verify link copied"));

  if (loading || !cert) return <Loading />;

  const revoked = cert.status === "revoked";
  const program = cert.course || cert.workshop;
  const spin = <Spinner size="sm" animation="border" />;

  return (
    <div className="certificates-page">
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-3">
        <div>
          <Button variant="link" className="p-0 text-decoration-none mb-1" onClick={() => navigate("/certificates")}>
            <FaArrowLeft className="me-1" /> All certificates
          </Button>
          <h4 className="mb-1 fw-bold d-flex align-items-center gap-2 flex-wrap">
            <span className="font-monospace">{cert.code}</span>
            {revoked ? <Badge bg="danger">Revoked</Badge> : <Badge bg="success">Valid</Badge>}
          </h4>
          <p className="text-muted mb-0">{cert.recipient_name} · {cert.title}</p>
        </div>
        <div className="d-flex flex-wrap gap-2">
          <Button variant="primary" onClick={download} disabled={!!busy}>{busy === "pdf" ? spin : <FaDownload />}<span className="ms-2">PDF</span></Button>
          <Button variant="white" className="border shadow-sm" onClick={() => setShowEmail(true)} disabled={!!busy || revoked}><FaEnvelope /><span className="ms-2">Email</span></Button>
          <Button variant="white" className="border shadow-sm" onClick={whatsapp} disabled={!!busy || revoked}>{busy === "wa" ? spin : <FaWhatsapp style={{ color: "#25D366" }} />}<span className="ms-2">WhatsApp</span></Button>
          <Button variant="white" className="border shadow-sm" onClick={() => printCertificate(cert)} disabled={!!busy}><FaPrint /><span className="ms-2 d-none d-md-inline">Print</span></Button>
          <Button variant="white" className="border shadow-sm" as={Link} to={`/certificates/${id}/edit`}><FaEdit /><span className="ms-2 d-none d-md-inline">Edit</span></Button>
        </div>
      </div>

      {revoked && (
        <div className="alert alert-danger d-flex justify-content-between align-items-center flex-wrap gap-2">
          <span><strong>Revoked.</strong> The verify page tells anyone who scans it that this certificate is no longer valid.{cert.revoked_reason ? ` Reason: ${cert.revoked_reason}` : ""}</span>
          <Button size="sm" variant="outline-danger" onClick={() => setStatus("active")} disabled={!!busy}><FaUndo className="me-1" />Restore</Button>
        </div>
      )}

      <Row className="g-4">
        <Col xl={8}>
          <CertificatePreview certificate={cert} />
        </Col>
        <Col xl={4}>
          <Card className="modern-card border-0 mb-3">
            <Card.Body className="p-4">
              <h6 className="fw-bold mb-3">Details</h6>
              <dl className="cert-dl">
                <dt>Awarded to</dt><dd>{cert.recipient_name}</dd>
                <dt>Email</dt><dd>{cert.recipient_email || <span className="text-muted">none</span>}</dd>
                <dt>Type</dt><dd>{TEMPLATES[cert.template]?.label || cert.template}</dd>
                <dt>{PROGRAM_TYPES[cert.program_type]}</dt>
                <dd>
                  {cert.program_title || "—"}
                  {program?.slug && cert.program_type !== "custom" && (
                    <a className="ms-1" href={`https://zantechbd.com/${cert.program_type === "workshop" ? "workshop" : cert.program_type}/${program.slug}`} target="_blank" rel="noreferrer"><FaExternalLinkAlt size={11} /></a>
                  )}
                </dd>
                <dt>Issued</dt><dd>{fmt(cert.issue_date)}</dd>
                <dt>Signed by</dt><dd>{(cert.signers || []).map((s) => `${s.name} (${s.designation})`).join(", ")}</dd>
                <dt>Emailed</dt><dd>{cert.emailed_at ? `${fmt(cert.emailed_at, true)}${cert.email_count > 1 ? ` · ${cert.email_count} times` : ""}` : "Not yet"}</dd>
                <dt>Created</dt><dd>{fmt(cert.created_at, true)}{cert.creator?.name ? ` by ${cert.creator.name}` : ""}</dd>
              </dl>
            </Card.Body>
          </Card>

          <Card className="modern-card border-0 mb-3">
            <Card.Body className="p-4">
              <h6 className="fw-bold mb-2">Verify link</h6>
              <p className="small text-muted mb-2">The QR code on the certificate opens this page on the main website.</p>
              <div className="cert-link">{cert.verify_url}</div>
              <div className="d-flex gap-2 mt-2">
                <Button size="sm" variant="outline-primary" onClick={copyLink}><FaCopy className="me-1" />Copy</Button>
                <Button size="sm" variant="outline-secondary" href={cert.verify_url} target="_blank" rel="noreferrer"><FaExternalLinkAlt className="me-1" />Open</Button>
              </div>
            </Card.Body>
          </Card>

          <Card className="modern-card border-0">
            <Card.Body className="p-4">
              <h6 className="fw-bold mb-3 text-danger">Danger zone</h6>
              <div className="d-flex flex-wrap gap-2">
                {!revoked && <Button size="sm" variant="outline-danger" onClick={() => setShowRevoke(true)} disabled={!!busy}><FaBan className="me-1" />Revoke</Button>}
                <Button size="sm" variant="danger" onClick={remove} disabled={!!busy}><FaTrash className="me-1" />Delete</Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <CertificateEmailModal certificate={cert} show={showEmail} onHide={() => setShowEmail(false)} onSent={load} />

      <Modal show={showRevoke} onHide={() => setShowRevoke(false)} centered>
        <Modal.Header closeButton><Modal.Title>Revoke {cert.code}?</Modal.Title></Modal.Header>
        <Modal.Body>
          <p className="text-muted">Anyone who scans the QR code will see that this certificate is no longer valid. You can restore it later.</p>
          <Form.Label>Reason (optional, shown on the verify page)</Form.Label>
          <Form.Control value={reason} onChange={(e) => setReason(e.target.value)} maxLength={255} placeholder="e.g. Issued by mistake" />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setShowRevoke(false)}>Cancel</Button>
          <Button variant="danger" onClick={() => setStatus("revoked")} disabled={busy === "status"}>{busy === "status" ? spin : "Revoke certificate"}</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ViewCertificate;
