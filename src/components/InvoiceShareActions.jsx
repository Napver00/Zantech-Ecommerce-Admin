import React, { useState } from "react";
import { Button, Form, Modal, Spinner } from "react-bootstrap";
import { FaDownload, FaEnvelope, FaWhatsapp } from "react-icons/fa";
import { toast } from "react-hot-toast";
import axiosInstance from "../config/axios";
import {
  createInvoicePdf,
  downloadBlob,
  emailInvoicePdf,
  invoicePdfFilename,
  shareInvoiceOnWhatsApp,
} from "../utils/invoicePdf";

/**
 * Download / WhatsApp / Email buttons for an invoice. The PDF is made in the
 * browser from the same HTML as "Print", so all three look identical.
 *
 * - buildHtml: () => invoice HTML string
 * - emailEndpoint: backend route that mails the uploaded PDF
 * - whatsappText: message sent along with the PDF
 */
const InvoiceShareActions = ({
  buildHtml,
  invoiceNo,
  emailEndpoint,
  defaultEmail = "",
  phone = "",
  whatsappText = "",
  customerName = "",
  buttonClassName = "d-flex align-items-center gap-2 shadow-sm border",
  buttonVariant = "white",
}) => {
  const [busy, setBusy] = useState(null); // "download" | "whatsapp" | "email"
  const [showEmail, setShowEmail] = useState(false);
  const [email, setEmail] = useState(defaultEmail);
  const [message, setMessage] = useState("");

  const filename = invoicePdfFilename(invoiceNo);

  const makePdf = async () => {
    const html = buildHtml();
    if (!html) throw new Error("Invoice is not ready yet");
    return createInvoicePdf(html);
  };

  const handleDownload = async () => {
    setBusy("download");
    try {
      downloadBlob(await makePdf(), filename);
    } catch (err) {
      console.error(err);
      toast.error("Could not create the PDF");
    } finally {
      setBusy(null);
    }
  };

  const handleWhatsApp = async () => {
    setBusy("whatsapp");
    try {
      const result = await shareInvoiceOnWhatsApp({ blob: await makePdf(), filename, text: whatsappText, phone });
      if (result === "downloaded") {
        toast.success("PDF downloaded. Attach it in the WhatsApp chat that just opened.", { duration: 6000 });
      }
    } catch (err) {
      console.error(err);
      toast.error("Could not share the invoice");
    } finally {
      setBusy(null);
    }
  };

  const openEmail = () => {
    setEmail(defaultEmail || "");
    setMessage("");
    setShowEmail(true);
  };

  const handleEmail = async (e) => {
    e.preventDefault();
    setBusy("email");
    try {
      const res = await emailInvoicePdf(axiosInstance, emailEndpoint, {
        blob: await makePdf(),
        filename,
        email: email.trim(),
        message: message.trim(),
      });
      toast.success(res?.message || `Invoice sent to ${email}`);
      setShowEmail(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send the invoice email");
    } finally {
      setBusy(null);
    }
  };

  const spin = <Spinner animation="border" size="sm" />;

  return (
    <>
      <Button variant={buttonVariant} className={buttonClassName} onClick={handleDownload} disabled={!!busy} title="Download invoice PDF">
        {busy === "download" ? spin : <FaDownload />}
        <span className="d-none d-md-inline">PDF</span>
      </Button>
      <Button variant={buttonVariant} className={buttonClassName} onClick={handleWhatsApp} disabled={!!busy} title="Send invoice PDF on WhatsApp">
        {busy === "whatsapp" ? spin : <FaWhatsapp style={{ color: "#25D366" }} />}
        <span className="d-none d-md-inline">WhatsApp</span>
      </Button>
      <Button variant={buttonVariant} className={buttonClassName} onClick={openEmail} disabled={!!busy} title="Email invoice PDF">
        <FaEnvelope />
        <span className="d-none d-md-inline">Email PDF</span>
      </Button>

      <Modal show={showEmail} onHide={() => busy !== "email" && setShowEmail(false)} centered className="modern-modal">
        <Form onSubmit={handleEmail}>
          <Modal.Header closeButton className="bg-light">
            <Modal.Title>Email invoice {invoiceNo}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p className="text-muted small mb-3">
              The invoice is attached as a PDF{customerName ? ` for ${customerName}` : ""}.
            </p>
            <Form.Group className="mb-3">
              <Form.Label className="fw-medium">Send to</Form.Label>
              <Form.Control
                type="email"
                required
                placeholder="customer@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
              />
              {!defaultEmail && <Form.Text muted>No email on file for this customer. Enter one.</Form.Text>}
            </Form.Group>
            <Form.Group>
              <Form.Label className="fw-medium">Message (optional)</Form.Label>
              <Form.Control as="textarea" rows={3} maxLength={2000} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Thanks for your order!" />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" onClick={() => setShowEmail(false)} disabled={busy === "email"}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={busy === "email"}>
              {busy === "email" ? <>{spin} Sending…</> : <><FaEnvelope className="me-2" />Send invoice</>}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </>
  );
};

export default InvoiceShareActions;
