import React, { useEffect, useState } from "react";
import { Button, Form, Modal, Spinner } from "react-bootstrap";
import { FaEnvelope } from "react-icons/fa";
import { toast } from "react-hot-toast";
import axiosInstance from "../../config/axios";
import { certificateFilename, createCertificatePdf } from "../../utils/certificate";
import { emailInvoicePdf } from "../../utils/invoicePdf";

/** Sends one certificate PDF to its recipient (from info@zantechbd.com). */
const CertificateEmailModal = ({ certificate, show, onHide, onSent }) => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (show) {
      setEmail(certificate?.recipient_email || "");
      setMessage("");
    }
  }, [show, certificate]);

  const handleSend = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      const blob = await createCertificatePdf(certificate);
      const res = await emailInvoicePdf(axiosInstance, `/certificates/${certificate.id}/email`, {
        blob,
        filename: certificateFilename(certificate),
        email: email.trim(),
        message: message.trim(),
      });
      toast.success(res?.message || `Certificate sent to ${email}`);
      onSent?.(res?.data);
      onHide();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Failed to send the certificate");
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal show={show} onHide={() => !sending && onHide()} centered className="modern-modal">
      <Form onSubmit={handleSend}>
        <Modal.Header closeButton className="bg-light">
          <Modal.Title>Email certificate</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="text-muted small mb-3">
            {certificate?.recipient_name}'s certificate is attached as a PDF, with a link to verify it online.
          </p>
          <Form.Group className="mb-3">
            <Form.Label className="fw-medium">Send to</Form.Label>
            <Form.Control type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="student@example.com" autoFocus />
            {!certificate?.recipient_email && <Form.Text muted>No email saved for this certificate. It will be saved after sending.</Form.Text>}
          </Form.Group>
          <Form.Group>
            <Form.Label className="fw-medium">Personal message (optional)</Form.Label>
            <Form.Control as="textarea" rows={3} maxLength={2000} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Well done! It was great having you in the bootcamp." />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={onHide} disabled={sending}>Cancel</Button>
          <Button type="submit" variant="primary" disabled={sending}>
            {sending ? <><Spinner animation="border" size="sm" className="me-2" />Sending…</> : <><FaEnvelope className="me-2" />Send certificate</>}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default CertificateEmailModal;
