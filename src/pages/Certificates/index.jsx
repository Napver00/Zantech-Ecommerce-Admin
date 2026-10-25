import React, { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { Badge, Button, Card, Col, Form, InputGroup, Pagination, ProgressBar, Row, Spinner } from "react-bootstrap";
import { FaCertificate, FaDownload, FaEnvelope, FaEye, FaFilePdf, FaPaperPlane, FaPlus, FaSearch, FaSignature, FaTimes } from "react-icons/fa";
import axiosInstance from "../../config/axios";
import Loading from "../../components/Loading";
import CommonTable from "../../components/Common/CommonTable";
import usePageTitle from "../../hooks/usePageTitle";
import CertificateEmailModal from "../../components/Certificates/CertificateEmailModal";
import { PROGRAM_TYPES, certificateFilename, createCertificatePdf, createCombinedPdf } from "../../utils/certificate";
import { downloadBlob, emailInvoicePdf } from "../../utils/invoicePdf";
import "./Certificates.css";

import confirmDialog from "../../utils/confirmDialog";
const fmt = (d) => (d ? new Date(`${String(d).slice(0, 10)}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—");

// Filters as API params; "issued" (one day) becomes a date range.
const filterParams = ({ issued, ...rest }) => {
  const params = Object.fromEntries(Object.entries(rest).filter(([, v]) => v));
  if (issued) Object.assign(params, { start_date: issued, end_date: issued });
  return params;
};

const BATCH_LIMIT = 300;

const Certificates = () => {
  usePageTitle("Certificates");
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState({ total_rows: 0, current_page: 1, total_pages: 1, has_more_pages: false });
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ search: "", program_type: "", status: "", issued: "" });
  const [batch, setBatch] = useState(null); // { label, done, total }
  const [firstLoad, setFirstLoad] = useState(true);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [emailCert, setEmailCert] = useState(null);

  const fetchRows = useCallback(async (p, f) => {
    setLoading(true);
    try {
      const params = { page: p, limit: 20 };
      Object.assign(params, filterParams(f));
      const { data } = await axiosInstance.get("/certificates", { params });
      setRows(data.data || []);
      setPagination(data.pagination);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load certificates");
    } finally {
      setLoading(false);
      setFirstLoad(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => fetchRows(page, filters), filters.search ? 400 : 0);
    return () => clearTimeout(t);
  }, [page, filters, fetchRows]);

  const setFilter = (k, v) => {
    setPage(1);
    setFilters((f) => ({ ...f, [k]: v }));
  };

  // List rows leave out signers; fetch the full certificate before drawing it.
  const full = async (row) => (await axiosInstance.get(`/certificates/${row.id}`)).data.data;

  const download = async (row) => {
    setBusyId(row.id);
    try {
      const cert = await full(row);
      downloadBlob(await createCertificatePdf(cert), certificateFilename(cert));
    } catch (err) {
      console.error(err);
      toast.error("Could not create the PDF");
    } finally {
      setBusyId(null);
    }
  };

  const openEmail = async (row) => {
    setBusyId(row.id);
    try {
      setEmailCert(await full(row));
    } catch {
      toast.error("Could not load the certificate");
    } finally {
      setBusyId(null);
    }
  };

  // Batch actions work on every certificate matching the current filters
  // (e.g. one bootcamp, or the custom certificates issued on one day).
  const loadMatching = async () => {
    const { data } = await axiosInstance.get("/certificates", { params: { ...filterParams(filters), page: 1, limit: BATCH_LIMIT } });
    const list = (data.data || []).filter((c) => c.status !== "revoked");
    if ((data.pagination?.total_rows || 0) > BATCH_LIMIT) {
      toast(`Only the newest ${BATCH_LIMIT} are included. Narrow the filters to get the rest.`, { duration: 6000 });
    }
    const fulls = [];
    for (let i = 0; i < list.length; i++) {
      setBatch({ label: "Loading", done: i, total: list.length });
      fulls.push(await full(list[i]));
    }
    return fulls;
  };

  const downloadMatching = async () => {
    setBatch({ label: "Loading", done: 0, total: 1 });
    try {
      const certs = await loadMatching();
      if (!certs.length) return toast("No valid certificates match these filters.");
      const blob = await createCombinedPdf(certs, (done, total) => setBatch({ label: "Making PDF", done, total }));
      const label = filters.search || certs[0].program_title || filters.issued || "certificates";
      downloadBlob(blob, `ZAN-Tech-Certificates-${String(label).replace(/[^\w-]+/g, "_")}.pdf`);
      toast.success(`${certs.length} certificates in one PDF`);
    } catch (err) {
      console.error(err);
      toast.error("Could not create the PDF");
    } finally {
      setBatch(null);
    }
  };

  const emailMatching = async () => {
    setBatch({ label: "Loading", done: 0, total: 1 });
    try {
      const certs = await loadMatching();
      const withEmail = certs.filter((c) => c.recipient_email);
      const notYet = withEmail.filter((c) => !c.emailed_at);
      if (!withEmail.length) return toast("None of these certificates has an email address.");
      let targets = notYet;
      if (notYet.length < withEmail.length) {
        const again = await confirmDialog({
          title: `${withEmail.length - notYet.length} of ${withEmail.length} were emailed before`,
          message: "Send to everyone again, or only to the people who haven't had it yet?",
          confirmLabel: `All ${withEmail.length}`,
          cancelLabel: `Only ${notYet.length} new`,
          tone: "primary",
        });
        targets = again ? withEmail : notYet;
      }
      if (!targets.length) return toast("Everyone here has already been emailed.");
      if (!await confirmDialog(`Email ${targets.length} certificate${targets.length === 1 ? "" : "s"} (PDF attached) from info@zantechbd.com?`)) return;

      let sent = 0;
      const failed = [];
      for (const c of targets) {
        setBatch({ label: "Emailing", done: sent + failed.length, total: targets.length });
        try {
          const blob = await createCertificatePdf(c);
          await emailInvoicePdf(axiosInstance, `/certificates/${c.id}/email`, { blob, filename: certificateFilename(c) });
          sent++;
        } catch {
          failed.push(c.recipient_name);
        }
      }
      if (failed.length) toast.error(`Sent ${sent}. Failed: ${failed.join(", ")}`, { duration: 10000 });
      else toast.success(`Sent ${sent} certificate${sent === 1 ? "" : "s"}`);
      fetchRows(page, filters);
    } catch (err) {
      console.error(err);
      toast.error("Could not send the certificates");
    } finally {
      setBatch(null);
    }
  };

  const headers = [
    {
      key: "code",
      label: "Code",
      render: (r) => <Link to={`/certificates/${r.id}`} className="font-monospace fw-semibold text-decoration-none">{r.code}</Link>,
    },
    {
      key: "recipient_name",
      label: "Awarded to",
      render: (r) => (
        <div>
          <div className="fw-medium">{r.recipient_name}</div>
          <div className="small text-muted">{r.recipient_email || "no email"}</div>
        </div>
      ),
    },
    {
      key: "title",
      label: "Certificate",
      render: (r) => (
        <div>
          <div>{r.title}</div>
          <div className="small text-muted">
            <Badge bg="light" text="dark" className="me-1 fw-normal">{PROGRAM_TYPES[r.program_type]}</Badge>
            {r.program_title || ""}
          </div>
        </div>
      ),
    },
    { key: "issue_date", label: "Issued", render: (r) => fmt(r.issue_date) },
    {
      key: "status",
      label: "Status",
      render: (r) => (
        <div className="d-flex flex-column gap-1 align-items-start">
          {r.status === "revoked" ? <Badge bg="danger">Revoked</Badge> : <Badge bg="success">Valid</Badge>}
          {r.emailed_at && <Badge bg="info" className="fw-normal">Emailed{r.email_count > 1 ? ` ×${r.email_count}` : ""}</Badge>}
        </div>
      ),
    },
  ];

  const renderActions = (r) => (
    <div className="d-flex gap-2">
      <Button size="sm" variant="outline-secondary" onClick={() => navigate(`/certificates/${r.id}`)} title="Open"><FaEye /></Button>
      <Button size="sm" variant="outline-primary" onClick={() => download(r)} disabled={busyId === r.id} title="Download PDF">
        {busyId === r.id ? <Spinner size="sm" animation="border" /> : <FaDownload />}
      </Button>
      <Button size="sm" variant="outline-success" onClick={() => openEmail(r)} disabled={busyId === r.id || r.status === "revoked"} title="Email PDF"><FaEnvelope /></Button>
    </div>
  );

  if (firstLoad) return <Loading />;

  return (
    <div className="certificates-page">
      <Card className="modern-card border-0">
        <Card.Body className="p-4">
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4">
            <div>
              <h4 className="mb-1 fw-bold text-primary"><FaCertificate className="me-2" />Certificates</h4>
              <p className="text-muted small mb-0">{loading ? "Loading…" : `${pagination.total_rows} certificate${pagination.total_rows === 1 ? "" : "s"}`}</p>
            </div>
            <div className="d-flex gap-2">
              <Button variant="outline-secondary" as={Link} to="/certificates/signers"><FaSignature className="me-2" />Signers</Button>
              <Button variant="primary" as={Link} to="/certificates/new"><FaPlus className="me-2" />Issue certificates</Button>
            </div>
          </div>

          <Row className="g-2 mb-4">
            <Col md={5}>
              <InputGroup>
                <InputGroup.Text><FaSearch /></InputGroup.Text>
                <Form.Control placeholder="Search name, email, code or programme…" value={filters.search} onChange={(e) => setFilter("search", e.target.value)} />
                {filters.search && <Button variant="outline-secondary" onClick={() => setFilter("search", "")}><FaTimes /></Button>}
              </InputGroup>
            </Col>
            <Col md={3}>
              <Form.Select value={filters.program_type} onChange={(e) => setFilter("program_type", e.target.value)}>
                <option value="">All programmes</option>
                {Object.entries(PROGRAM_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </Form.Select>
            </Col>
            <Col md={2}>
              <Form.Select value={filters.status} onChange={(e) => setFilter("status", e.target.value)}>
                <option value="">Any status</option>
                <option value="active">Valid</option>
                <option value="revoked">Revoked</option>
              </Form.Select>
            </Col>
            <Col md={2}>
              <Form.Control type="date" value={filters.issued} onChange={(e) => setFilter("issued", e.target.value)} title="Issued on" />
            </Col>
          </Row>

          {pagination.total_rows > 0 && (
            <div className="cert-batch mb-4">
              <div className="small">
                <strong>All {pagination.total_rows} shown{Object.values(filters).some(Boolean) ? " with these filters" : ""}:</strong>{" "}
                <span className="text-muted">tip: search a programme name or pick an issue date to get one batch.</span>
              </div>
              <div className="d-flex flex-wrap gap-2">
                <Button size="sm" variant="primary" onClick={downloadMatching} disabled={!!batch}><FaFilePdf className="me-2" />Download all (one PDF)</Button>
                <Button size="sm" variant="outline-primary" onClick={emailMatching} disabled={!!batch}><FaPaperPlane className="me-2" />Email all</Button>
              </div>
              {batch && (
                <div className="w-100">
                  <div className="small text-muted mb-1">{batch.label} {batch.done} / {batch.total}… keep this tab open.</div>
                  <ProgressBar now={batch.total ? (batch.done / batch.total) * 100 : 0} animated />
                </div>
              )}
            </div>
          )}

          {rows.length === 0 && !loading ? (
            <div className="text-center py-5">
              <FaCertificate size={42} className="text-muted mb-3" />
              <h5>No certificates yet</h5>
              <p className="text-muted">Issue one for a single student, or for a whole course, bootcamp or workshop at once.</p>
              <Button as={Link} to="/certificates/new"><FaPlus className="me-2" />Issue certificates</Button>
            </div>
          ) : (
            <CommonTable headers={headers} data={rows} tableLoading={loading} loading={loading} renderActions={renderActions} />
          )}

          {pagination.total_pages > 1 && (
            <div className="pagination-container mt-4">
              <Pagination className="modern-pagination">
                <Pagination.Prev onClick={() => setPage((p) => p - 1)} disabled={pagination.current_page === 1} />
                {[...Array(pagination.total_pages)].map((_, i) => (
                  <Pagination.Item key={i + 1} active={i + 1 === pagination.current_page} onClick={() => setPage(i + 1)}>{i + 1}</Pagination.Item>
                ))}
                <Pagination.Next onClick={() => setPage((p) => p + 1)} disabled={!pagination.has_more_pages} />
              </Pagination>
            </div>
          )}
        </Card.Body>
      </Card>

      <CertificateEmailModal
        certificate={emailCert}
        show={!!emailCert}
        onHide={() => setEmailCert(null)}
        onSent={() => fetchRows(page, filters)}
      />
    </div>
  );
};

export default Certificates;
