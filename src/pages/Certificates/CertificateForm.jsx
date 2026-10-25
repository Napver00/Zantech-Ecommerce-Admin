import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import { Badge, Button, ButtonGroup, Card, Col, Form, ProgressBar, Row, Spinner, Table } from "react-bootstrap";
import {
  FaArrowDown, FaArrowLeft, FaArrowUp, FaCheckCircle, FaDownload, FaEnvelope, FaMagic, FaPlus, FaTrash, FaUsers, FaUser,
} from "react-icons/fa";
import axiosInstance from "../../config/axios";
import Loading from "../../components/Loading";
import usePageTitle from "../../hooks/usePageTitle";
import CertificatePreview from "../../components/Certificates/CertificatePreview";
import {
  PROGRAM_TYPES, TEMPLATES, certificateFilename, createCertificatePdf, createCombinedPdf, suggestDescription,
} from "../../utils/certificate";
import { downloadBlob, emailInvoicePdf } from "../../utils/invoicePdf";
import "./Certificates.css";

import confirmDialog from "../../utils/confirmDialog";
const today = () => new Date().toISOString().slice(0, 10);

// "Name, email" per line → recipients.
const parseLines = (text) =>
  text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const email = (line.match(/[^\s,;<>]+@[^\s,;<>]+\.[^\s,;<>]+/) || [])[0] || "";
      const name = line.replace(email, "").replace(/[<>]/g, "").replace(/[,;\t]+/g, " ").replace(/\s+/g, " ").trim();
      return { recipient_name: name, recipient_email: email, student_id: null };
    })
    .filter((r) => r.recipient_name);

const CertificateForm = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  usePageTitle(isEdit ? "Edit certificate" : "Issue certificates");
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [programs, setPrograms] = useState({ courses: [], bootcamps: [], workshops: [] });
  const [savedSigners, setSavedSigners] = useState([]);

  const [form, setForm] = useState({
    template: "participation",
    title: TEMPLATES.participation.title,
    program_type: "bootcamp",
    course_id: "",
    post_id: "",
    program_title: "",
    description: "",
    issue_date: today(),
    signers: [],
  });
  const [descTouched, setDescTouched] = useState(false);
  const [code, setCode] = useState("");

  // Recipients
  const [mode, setMode] = useState("single"); // single | bulk
  const [single, setSingle] = useState({ recipient_name: "", recipient_email: "", student_id: null });
  const [loaded, setLoaded] = useState([]); // from the course/bootcamp, with a "selected" flag
  const [loadingPeople, setLoadingPeople] = useState(false);
  const [pasted, setPasted] = useState("");

  const [saving, setSaving] = useState(false);
  const [issued, setIssued] = useState(null); // bulk result
  const [batch, setBatch] = useState(null); // { label, done, total }

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  useEffect(() => {
    (async () => {
      try {
        const [p, s] = await Promise.all([axiosInstance.get("/certificates/programs"), axiosInstance.get("/certificate-signers")]);
        setPrograms(p.data.data);
        const signers = s.data.data || [];
        setSavedSigners(signers);

        if (isEdit) {
          const { data } = await axiosInstance.get(`/certificates/${id}`);
          const c = data.data;
          setForm({
            template: c.template,
            title: c.title,
            program_type: c.program_type,
            course_id: c.course_id || "",
            post_id: c.post_id || "",
            program_title: c.program_title || "",
            description: c.description,
            issue_date: String(c.issue_date).slice(0, 10),
            signers: c.signers || [],
          });
          setSingle({ recipient_name: c.recipient_name, recipient_email: c.recipient_email || "", student_id: c.student_id });
          setCode(c.code);
          setDescTouched(true);
        } else {
          set({ signers: signers.filter((x) => x.is_default).slice(0, 3).map(({ name, designation, signature }) => ({ name, designation, signature })) });
        }
      } catch (err) {
        toast.error(err.response?.data?.message || "Could not load certificate data");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const programList = useMemo(
    () => ({ course: programs.courses, bootcamp: programs.bootcamps, workshop: programs.workshops })[form.program_type] || [],
    [form.program_type, programs]
  );
  const selectedProgram = useMemo(() => {
    if (form.program_type === "workshop") return programs.workshops.find((w) => String(w.id) === String(form.post_id));
    return programList.find((c) => String(c.id) === String(form.course_id));
  }, [form.program_type, form.course_id, form.post_id, programs, programList]);

  // Keep the suggested wording in step with the choices until the admin edits it.
  useEffect(() => {
    if (descTouched) return;
    set({
      description: suggestDescription({
        template: form.template,
        programType: form.program_type,
        program: selectedProgram,
        programTitle: form.program_title,
      }),
    });
  }, [form.template, form.program_type, selectedProgram, form.program_title, descTouched]);

  const pickTemplate = (key) => {
    const fromTemplate = Object.values(TEMPLATES).some((t) => t.title === form.title);
    set({ template: key, ...(fromTemplate || !form.title ? { title: TEMPLATES[key].title } : {}) });
  };

  const pickProgramType = (type) => {
    set({ program_type: type, course_id: "", post_id: "", program_title: "" });
    setLoaded([]);
  };

  // Signers
  const updateSigner = (i, patch) => set({ signers: form.signers.map((s, j) => (j === i ? { ...s, ...patch } : s)) });
  const moveSigner = (i, dir) => {
    const list = [...form.signers];
    [list[i], list[i + dir]] = [list[i + dir], list[i]];
    set({ signers: list });
  };
  const applySaved = (i, signerId) => {
    const s = savedSigners.find((x) => String(x.id) === signerId);
    if (s) updateSigner(i, { name: s.name, designation: s.designation, signature: s.signature || null });
  };

  // Recipients from the course
  const loadPeople = async () => {
    if (!form.course_id) return toast.error(`Choose the ${form.program_type} first`);
    setLoadingPeople(true);
    try {
      const { data } = await axiosInstance.get("/certificates/recipients", { params: { course_id: form.course_id } });
      const list = (data.data || []).map((p) => ({ ...p, selected: !p.already_issued }));
      setLoaded(list);
      if (!list.length) toast("No approved registrations or enrolled students found. Add names below.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not load students");
    } finally {
      setLoadingPeople(false);
    }
  };

  const bulkRecipients = useMemo(() => {
    const fromCourse = loaded.filter((p) => p.selected).map(({ recipient_name, recipient_email, student_id }) => ({ recipient_name, recipient_email: recipient_email || "", student_id }));
    return [...fromCourse, ...parseLines(pasted)];
  }, [loaded, pasted]);

  const previewCert = {
    ...form,
    code: code || "ZT-XXXX-XXXX",
    recipient_name: mode === "bulk" && !isEdit ? bulkRecipients[0]?.recipient_name || "Recipient Name" : single.recipient_name || "Recipient Name",
  };

  const payload = () => ({
    template: form.template,
    title: form.title.trim(),
    program_type: form.program_type,
    course_id: ["course", "bootcamp"].includes(form.program_type) ? form.course_id || null : null,
    post_id: form.program_type === "workshop" ? form.post_id || null : null,
    program_title: form.program_title.trim() || null,
    description: form.description.trim(),
    issue_date: form.issue_date,
    signers: form.signers.filter((s) => s.name?.trim()).map((s) => ({ name: s.name.trim(), designation: (s.designation || "").trim(), signature: s.signature || null })),
  });

  const validate = () => {
    if (!form.title.trim()) return "Give the certificate a title.";
    if (["course", "bootcamp"].includes(form.program_type) && !form.course_id) return `Choose the ${form.program_type}.`;
    if (form.program_type === "workshop" && !form.post_id && !form.program_title.trim()) return "Choose the workshop or type its name.";
    if (!form.description.trim()) return "Write the certificate text.";
    const signers = form.signers.filter((s) => s.name?.trim());
    if (!signers.length) return "Add at least one signer.";
    if (signers.some((s) => !s.designation?.trim())) return "Each signer needs a role (e.g. Organizer).";
    if (mode === "single" || isEdit) {
      if (!single.recipient_name.trim()) return "Enter the recipient's name.";
    } else if (!bulkRecipients.length) return "Add at least one recipient.";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const problem = validate();
    if (problem) return toast.error(problem);
    setSaving(true);
    try {
      if (isEdit) {
        await axiosInstance.put(`/certificates/${id}`, { ...payload(), ...single, recipient_email: single.recipient_email || null });
        toast.success("Certificate updated");
        navigate(`/certificates/${id}`);
      } else if (mode === "single") {
        const { data } = await axiosInstance.post("/certificates", { ...payload(), ...single, recipient_email: single.recipient_email || null });
        toast.success(`Certificate ${data.data.code} issued`);
        navigate(`/certificates/${data.data.id}`);
      } else {
        const { data } = await axiosInstance.post("/certificates/bulk", {
          ...payload(),
          recipients: bulkRecipients.map((r) => ({ ...r, recipient_email: r.recipient_email || null })),
        });
        setIssued(data.data);
        toast.success(data.message);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not save the certificate");
    } finally {
      setSaving(false);
    }
  };

  // After a bulk issue
  const downloadAll = async () => {
    setBatch({ label: "Making PDF", done: 0, total: issued.length });
    try {
      const blob = await createCombinedPdf(issued, (done, total) => setBatch({ label: "Making PDF", done, total }));
      downloadBlob(blob, `ZAN-Tech-Certificates-${(issued[0]?.program_title || "batch").replace(/[^\w-]+/g, "_")}.pdf`);
    } catch (err) {
      console.error(err);
      toast.error("Could not create the PDF");
    } finally {
      setBatch(null);
    }
  };

  const emailAll = async () => {
    const targets = issued.filter((c) => c.recipient_email && !c.emailed_at);
    if (!targets.length) return toast("Nobody in this batch has an email address.");
    if (!await confirmDialog(`Email certificates to ${targets.length} people from info@zantechbd.com?`)) return;
    let sent = 0;
    const failed = [];
    for (const c of targets) {
      setBatch({ label: "Emailing", done: sent + failed.length, total: targets.length });
      try {
        const blob = await createCertificatePdf(c);
        await emailInvoicePdf(axiosInstance, `/certificates/${c.id}/email`, { blob, filename: certificateFilename(c) });
        sent++;
        setIssued((list) => list.map((x) => (x.id === c.id ? { ...x, emailed_at: new Date().toISOString() } : x)));
      } catch {
        failed.push(c.recipient_name);
      }
    }
    setBatch(null);
    if (failed.length) toast.error(`Sent ${sent}. Failed: ${failed.join(", ")}`, { duration: 8000 });
    else toast.success(`Sent ${sent} certificates`);
  };

  if (loading) return <Loading />;

  if (issued) {
    const withEmail = issued.filter((c) => c.recipient_email).length;
    return (
      <div className="certificates-page">
        <Card className="modern-card border-0">
          <Card.Body className="p-4">
            <div className="d-flex align-items-center gap-3 mb-3">
              <FaCheckCircle className="text-success" size={32} />
              <div>
                <h4 className="mb-0 fw-bold">{issued.length} certificates issued</h4>
                <p className="text-muted mb-0 small">{issued[0]?.program_title || issued[0]?.title}</p>
              </div>
            </div>
            <div className="d-flex flex-wrap gap-2 mb-3">
              <Button variant="primary" onClick={downloadAll} disabled={!!batch}><FaDownload className="me-2" />Download all (one PDF)</Button>
              <Button variant="outline-primary" onClick={emailAll} disabled={!!batch || !withEmail}><FaEnvelope className="me-2" />Email {withEmail} with an email</Button>
              <Button variant="outline-secondary" as={Link} to="/certificates">Go to all certificates</Button>
            </div>
            {batch && (
              <div className="mb-3">
                <div className="small text-muted mb-1">{batch.label} {batch.done} / {batch.total}…</div>
                <ProgressBar now={(batch.done / batch.total) * 100} animated />
              </div>
            )}
            <Table responsive hover className="mb-0 align-middle">
              <thead><tr><th>Code</th><th>Name</th><th>Email</th><th>Emailed</th><th /></tr></thead>
              <tbody>
                {issued.map((c) => (
                  <tr key={c.id}>
                    <td className="font-monospace fw-semibold">{c.code}</td>
                    <td>{c.recipient_name}</td>
                    <td className="text-muted">{c.recipient_email || "—"}</td>
                    <td>{c.emailed_at ? <Badge bg="success">Sent</Badge> : <span className="text-muted">—</span>}</td>
                    <td className="text-end"><Link to={`/certificates/${c.id}`}>Open</Link></td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      </div>
    );
  }

  return (
    <div className="certificates-page">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
        <div>
          <Button variant="link" className="p-0 text-decoration-none mb-1" onClick={() => navigate(isEdit ? `/certificates/${id}` : "/certificates")}>
            <FaArrowLeft className="me-1" /> Back
          </Button>
          <h4 className="mb-0 fw-bold text-primary">{isEdit ? `Edit certificate ${code}` : "Issue certificates"}</h4>
        </div>
      </div>

      <Form onSubmit={handleSubmit}>
        <Row className="g-4">
          <Col xl={6}>
            {/* 1. Programme */}
            <Card className="modern-card border-0 mb-4">
              <Card.Body className="p-4">
                <h6 className="cert-step"><span>1</span> What is it for?</h6>
                <ButtonGroup className="w-100 mb-3 flex-wrap">
                  {Object.entries(PROGRAM_TYPES).map(([key, label]) => (
                    <Button key={key} variant={form.program_type === key ? "primary" : "outline-primary"} onClick={() => pickProgramType(key)}>{label}</Button>
                  ))}
                </ButtonGroup>

                {["course", "bootcamp"].includes(form.program_type) && (
                  <Form.Group className="mb-3">
                    <Form.Label>{PROGRAM_TYPES[form.program_type]}</Form.Label>
                    <Form.Select value={form.course_id} onChange={(e) => { set({ course_id: e.target.value, program_title: "" }); setLoaded([]); }}>
                      <option value="">Choose…</option>
                      {programList.map((c) => (
                        <option key={c.id} value={c.id}>{c.title}{c.start_date ? ` (${String(c.start_date).slice(0, 10)})` : ""}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                )}
                {form.program_type === "workshop" && (
                  <Form.Group className="mb-3">
                    <Form.Label>Workshop</Form.Label>
                    <Form.Select value={form.post_id} onChange={(e) => set({ post_id: e.target.value })}>
                      <option value="">Not listed, I'll type the name</option>
                      {programs.workshops.map((w) => <option key={w.id} value={w.id}>{w.title}</option>)}
                    </Form.Select>
                  </Form.Group>
                )}
                <Form.Group>
                  <Form.Label>
                    {form.program_type === "custom" ? "Event or reason (optional)" : "Name printed on the certificate"}
                  </Form.Label>
                  <Form.Control
                    value={form.program_title}
                    onChange={(e) => set({ program_title: e.target.value })}
                    placeholder={selectedProgram?.title || (form.program_type === "custom" ? "e.g. National Robotics Olympiad volunteer" : "e.g. Line Following Robot Workshop at Feni Govt. College")}
                    maxLength={255}
                  />
                  {selectedProgram && <Form.Text muted>Leave empty to use “{selectedProgram.title}”.</Form.Text>}
                </Form.Group>
              </Card.Body>
            </Card>

            {/* 2. Certificate text */}
            <Card className="modern-card border-0 mb-4">
              <Card.Body className="p-4">
                <h6 className="cert-step"><span>2</span> Certificate</h6>
                <Form.Label>Type</Form.Label>
                <div className="d-flex flex-wrap gap-2 mb-3">
                  {Object.entries(TEMPLATES).map(([key, t]) => (
                    <Button key={key} size="sm" variant={form.template === key ? "dark" : "outline-secondary"} onClick={() => pickTemplate(key)}>{t.label}</Button>
                  ))}
                </div>
                <Row className="g-3">
                  <Col md={8}>
                    <Form.Group>
                      <Form.Label>Heading</Form.Label>
                      <Form.Control value={form.title} onChange={(e) => set({ title: e.target.value })} maxLength={120} required />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label>Issue date</Form.Label>
                      <Form.Control type="date" value={form.issue_date} onChange={(e) => set({ issue_date: e.target.value })} required />
                    </Form.Group>
                  </Col>
                  <Col xs={12}>
                    <Form.Group>
                      <div className="d-flex justify-content-between align-items-end mb-1">
                        <Form.Label className="mb-0">Text</Form.Label>
                        <Button size="sm" variant="link" className="p-0 text-decoration-none" onClick={() => setDescTouched(false)}>
                          <FaMagic className="me-1" /> Suggest text
                        </Button>
                      </div>
                      <Form.Control
                        as="textarea"
                        rows={4}
                        maxLength={1200}
                        value={form.description}
                        onChange={(e) => { setDescTouched(true); set({ description: e.target.value }); }}
                        placeholder="In recognition of their active participation in…"
                        required
                      />
                      <Form.Text muted>{form.description.length}/1200 · Long text is printed smaller so it always fits.</Form.Text>
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* 3. Signers */}
            <Card className="modern-card border-0 mb-4">
              <Card.Body className="p-4">
                <div className="d-flex justify-content-between align-items-center">
                  <h6 className="cert-step mb-0"><span>3</span> Signed by</h6>
                  <Link to="/certificates/signers" className="small">Manage saved signers</Link>
                </div>
                <div className="mt-3 d-grid gap-2">
                  {form.signers.map((s, i) => (
                    <div key={i} className="cert-signer-row">
                      <div className="cert-sig-thumb">{s.signature ? <img src={s.signature} alt="" /> : <span>No signature</span>}</div>
                      <div className="flex-grow-1 d-grid gap-2">
                        <Form.Select size="sm" value="" onChange={(e) => applySaved(i, e.target.value)}>
                          <option value="">Pick a saved signer…</option>
                          {savedSigners.map((x) => <option key={x.id} value={x.id}>{x.name} · {x.designation}</option>)}
                        </Form.Select>
                        <Row className="g-2">
                          <Col sm={6}><Form.Control size="sm" placeholder="Name" value={s.name} onChange={(e) => updateSigner(i, { name: e.target.value })} maxLength={120} /></Col>
                          <Col sm={6}><Form.Control size="sm" placeholder="Role, e.g. Instructor" value={s.designation} onChange={(e) => updateSigner(i, { designation: e.target.value })} maxLength={120} /></Col>
                        </Row>
                      </div>
                      <div className="d-flex flex-column gap-1">
                        <Button size="sm" variant="light" disabled={i === 0} onClick={() => moveSigner(i, -1)} title="Move left"><FaArrowUp /></Button>
                        <Button size="sm" variant="light" disabled={i === form.signers.length - 1} onClick={() => moveSigner(i, 1)} title="Move right"><FaArrowDown /></Button>
                        <Button size="sm" variant="light" className="text-danger" onClick={() => set({ signers: form.signers.filter((_, j) => j !== i) })} title="Remove"><FaTrash /></Button>
                      </div>
                    </div>
                  ))}
                </div>
                {form.signers.length < 3 && (
                  <Button size="sm" variant="outline-primary" className="mt-2" onClick={() => set({ signers: [...form.signers, { name: "", designation: "", signature: null }] })}>
                    <FaPlus className="me-1" /> Add signer
                  </Button>
                )}
                <Form.Text muted className="d-block mt-2">Up to 3 signers. Changes here only affect this certificate.</Form.Text>
              </Card.Body>
            </Card>

            {/* 4. Recipients */}
            <Card className="modern-card border-0 mb-4">
              <Card.Body className="p-4">
                <h6 className="cert-step"><span>4</span> {isEdit ? "Recipient" : "Who gets it?"}</h6>
                {!isEdit && (
                  <ButtonGroup className="mb-3">
                    <Button variant={mode === "single" ? "primary" : "outline-primary"} onClick={() => setMode("single")}><FaUser className="me-2" />One person</Button>
                    <Button variant={mode === "bulk" ? "primary" : "outline-primary"} onClick={() => setMode("bulk")}><FaUsers className="me-2" />A whole group</Button>
                  </ButtonGroup>
                )}

                {(mode === "single" || isEdit) ? (
                  <Row className="g-3">
                    <Col md={6}>
                      <Form.Label>Name on certificate</Form.Label>
                      <Form.Control value={single.recipient_name} onChange={(e) => setSingle((s) => ({ ...s, recipient_name: e.target.value }))} maxLength={150} placeholder="e.g. Raif Hassan" />
                    </Col>
                    <Col md={6}>
                      <Form.Label>Email (to send it)</Form.Label>
                      <Form.Control type="email" value={single.recipient_email} onChange={(e) => setSingle((s) => ({ ...s, recipient_email: e.target.value }))} maxLength={191} placeholder="optional" />
                    </Col>
                  </Row>
                ) : (
                  <>
                    {["course", "bootcamp"].includes(form.program_type) && (
                      <div className="mb-3">
                        <Button variant="outline-secondary" size="sm" onClick={loadPeople} disabled={loadingPeople || !form.course_id}>
                          {loadingPeople ? <Spinner size="sm" animation="border" className="me-2" /> : <FaUsers className="me-2" />}
                          Load students from this {form.program_type}
                        </Button>
                        {loaded.length > 0 && (
                          <div className="cert-people mt-2">
                            <div className="d-flex justify-content-between small text-muted px-2 py-1">
                              <span>{loaded.filter((p) => p.selected).length} of {loaded.length} selected</span>
                              <span>
                                <Button size="sm" variant="link" className="p-0 me-2" onClick={() => setLoaded((l) => l.map((p) => ({ ...p, selected: true })))}>All</Button>
                                <Button size="sm" variant="link" className="p-0" onClick={() => setLoaded((l) => l.map((p) => ({ ...p, selected: false })))}>None</Button>
                              </span>
                            </div>
                            {loaded.map((p, i) => (
                              <label key={`${p.student_id}-${i}`} className="cert-person">
                                <Form.Check
                                  checked={p.selected}
                                  onChange={() => setLoaded((l) => l.map((x, j) => (j === i ? { ...x, selected: !x.selected } : x)))}
                                />
                                <span className="flex-grow-1">
                                  <span className="fw-medium">{p.recipient_name}</span>
                                  <span className="text-muted small d-block">{p.recipient_email || "no email"}</span>
                                </span>
                                {p.already_issued && <Badge bg="warning" text="dark">Has one</Badge>}
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    <Form.Group>
                      <Form.Label>{loaded.length ? "Add more people" : "People"} <span className="text-muted fw-normal">(one per line: Name, email)</span></Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={5}
                        value={pasted}
                        onChange={(e) => setPasted(e.target.value)}
                        placeholder={"Raif Hassan, raif@example.com\nNusrat Jahan\nTanvir Ahmed, tanvir@example.com"}
                      />
                      <Form.Text muted>Paste straight from Excel or Google Sheets. The email is optional.</Form.Text>
                    </Form.Group>
                    <div className="mt-3 fw-semibold">{bulkRecipients.length} certificate{bulkRecipients.length === 1 ? "" : "s"} will be issued</div>
                  </>
                )}
              </Card.Body>
            </Card>

            <div className="d-flex gap-2 mb-4">
              <Button type="submit" variant="primary" size="lg" disabled={saving}>
                {saving ? <><Spinner size="sm" animation="border" className="me-2" />Saving…</> : isEdit ? "Save changes" : mode === "bulk" ? `Issue ${bulkRecipients.length || ""} certificates` : "Issue certificate"}
              </Button>
              <Button variant="outline-secondary" size="lg" onClick={() => navigate(-1)} disabled={saving}>Cancel</Button>
            </div>
          </Col>

          <Col xl={6}>
            <div className="cert-preview-sticky">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="fw-semibold">Preview</span>
                <span className="small text-muted">{mode === "bulk" && !isEdit ? "Showing the first name" : "Exactly as the PDF"}</span>
              </div>
              <CertificatePreview certificate={previewCert} />
            </div>
          </Col>
        </Row>
      </Form>
    </div>
  );
};

export default CertificateForm;
