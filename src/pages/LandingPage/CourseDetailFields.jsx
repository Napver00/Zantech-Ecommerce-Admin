import React, { useState } from "react";
import { Row, Col, Form, Button, Badge, Alert } from "react-bootstrap";
import { FaPlus, FaTrash, FaFileImport, FaGoogleDrive } from "react-icons/fa";
import { emptyLesson, emptyCurriculum, parseCurriculumText, emptySlot } from "./courseDetailUtils";
import { EditorSection } from "../../components/Editor/Editor";

// Shared by AddCourse and ViewCourse: curriculum (modules → lessons) and the
// course-details-page sections (highlights, includes, skills, projects, FAQs).

// ─── Curriculum ───────────────────────────────────────────────────────────────

const CurriculumImport = ({ onImport, hasExisting }) => {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const parsed = text.trim() ? parseCurriculumText(text) : [];
  const lessonCount = parsed.reduce((n, m) => n + m.lessons.length, 0);

  const apply = (mode) => {
    onImport(parsed, mode);
    setText("");
    setOpen(false);
  };

  if (!open) {
    return (
      <Button variant="outline-success" size="sm" className="mb-3" onClick={() => setOpen(true)}>
        <FaFileImport className="me-1" /> Paste curriculum from Google Doc
      </Button>
    );
  }

  return (
    <div className="border rounded p-3 mb-3 bg-light">
      <Form.Label className="fw-semibold">Paste curriculum text</Form.Label>
      <Form.Text className="d-block text-muted mb-2">
        Open the curriculum in Google Drive, select all, copy, and paste here. Lines starting with{" "}
        <code>Module 1</code>, <code>Chapter 1</code> (or <code>#</code>) become modules; lines starting with{" "}
        <code>Lesson 1</code>, <code>-</code>, <code>•</code> or <code>1.</code> become lessons; other lines become the
        description of the module/lesson above them. <code>Title | description</code> on one line also works.
      </Form.Text>
      <Form.Control
        as="textarea"
        rows={10}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={"Module 1: Python Basics\nGet introduced to Python and write basic code.\nLesson 1: Welcome to Python\nLearn about programs and algorithms.\nLesson 2: Variables\n...\nModule 2: Loops\n- While loop\n- Nested loop"}
        style={{ fontFamily: "monospace", fontSize: "0.85rem" }}
      />
      {parsed.length > 0 && (
        <Alert variant="info" className="py-2 mt-2 mb-2 small">
          Found <strong>{parsed.length}</strong> module{parsed.length !== 1 && "s"} and{" "}
          <strong>{lessonCount}</strong> lesson{lessonCount !== 1 && "s"}:{" "}
          {parsed.map((m) => `${m.title} (${m.lessons.length})`).join(", ")}
        </Alert>
      )}
      <div className="d-flex gap-2 mt-2">
        <Button size="sm" variant="primary" disabled={!parsed.length} onClick={() => apply("replace")}>
          {hasExisting ? "Replace current curriculum" : "Import"}
        </Button>
        {hasExisting && (
          <Button size="sm" variant="outline-primary" disabled={!parsed.length} onClick={() => apply("append")}>
            Add after current modules
          </Button>
        )}
        <Button size="sm" variant="light" onClick={() => setOpen(false)}>Cancel</Button>
      </div>
    </div>
  );
};

export const CurriculumEditor = ({ curriculums, setCurriculums, curriculumLink, onCurriculumLinkChange, title = "Curriculum" }) => {
  const setModule = (i, field, value) =>
    setCurriculums((p) => p.map((c, idx) => (idx === i ? { ...c, [field]: value } : c)));
  const removeModule = (i) => setCurriculums((p) => p.filter((_, idx) => idx !== i));
  const setLesson = (i, j, field, value) =>
    setCurriculums((p) =>
      p.map((c, idx) =>
        idx === i ? { ...c, lessons: c.lessons.map((l, k) => (k === j ? { ...l, [field]: value } : l)) } : c
      )
    );
  const addLesson = (i) =>
    setCurriculums((p) => p.map((c, idx) => (idx === i ? { ...c, lessons: [...c.lessons, emptyLesson()] } : c)));
  const removeLesson = (i, j) =>
    setCurriculums((p) =>
      p.map((c, idx) => (idx === i ? { ...c, lessons: c.lessons.filter((_, k) => k !== j) } : c))
    );

  const hasExisting = curriculums.some((c) => c.title.trim());
  const handleImport = (modules, mode) =>
    setCurriculums((p) => (mode === "append" ? [...p.filter((c) => c.title.trim()), ...modules] : modules));

  const lessonTotal = curriculums.reduce((n, c) => n + c.lessons.length, 0);

  return (
    <EditorSection
      id="curriculum"
      title={title}
      count={`${curriculums.length} module${curriculums.length === 1 ? "" : "s"} · ${lessonTotal} lesson${lessonTotal === 1 ? "" : "s"}`}
      help="Modules and the lessons inside them, shown on the course page in this order."
    >
        <Form.Group className="mb-3">
          <Form.Label><FaGoogleDrive className="me-1 text-success" /> Curriculum PDF link (Google Drive)</Form.Label>
          <Form.Control
            type="url"
            value={curriculumLink}
            onChange={(e) => onCurriculumLinkChange(e.target.value)}
            placeholder="https://drive.google.com/file/d/..."
          />
          <Form.Text className="text-muted">
            Shown as a "Download Curriculum" button on the course page. Set the file's sharing to "Anyone with the link".
          </Form.Text>
        </Form.Group>

        <CurriculumImport onImport={handleImport} hasExisting={hasExisting} />

        {curriculums.map((c, i) => (
          <div key={i} className="ed-item">
            <div className="ed-item-head">
              <span>Module {i + 1}</span>
              {curriculums.length > 1 && (
                <Button variant="outline-danger" size="sm" onClick={() => removeModule(i)} aria-label={`Remove module ${i + 1}`}>
                  <FaTrash />
                </Button>
              )}
            </div>
            <Form.Group className="mb-2">
              <Form.Label>Title <span className="text-danger">*</span></Form.Label>
              <Form.Control
                value={c.title}
                onChange={(e) => setModule(i, "title", e.target.value)}
                placeholder="Module title"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={c.description}
                onChange={(e) => setModule(i, "description", e.target.value)}
                placeholder="What will students learn in this module?"
              />
            </Form.Group>

            <div className="ps-3 border-start">
              <div className="small fw-semibold text-muted mb-2">Lessons ({c.lessons.length})</div>
              {c.lessons.map((l, j) => (
                <Row key={j} className="g-2 mb-2 align-items-start">
                  <Col xs="auto" className="pt-2 small text-muted" style={{ width: 70 }}>Lesson {j + 1}</Col>
                  <Col md={4}>
                    <Form.Control
                      size="sm"
                      value={l.title}
                      onChange={(e) => setLesson(i, j, "title", e.target.value)}
                      placeholder="Lesson title"
                    />
                  </Col>
                  <Col>
                    <Form.Control
                      size="sm"
                      as="textarea"
                      rows={1}
                      value={l.description}
                      onChange={(e) => setLesson(i, j, "description", e.target.value)}
                      placeholder="Short description (optional)"
                    />
                  </Col>
                  <Col xs="auto">
                    <Button variant="outline-danger" size="sm" onClick={() => removeLesson(i, j)}>
                      <FaTrash />
                    </Button>
                  </Col>
                </Row>
              ))}
              <Button variant="outline-secondary" size="sm" onClick={() => addLesson(i)}>
                <FaPlus className="me-1" /> Add Lesson
              </Button>
            </div>
          </div>
        ))}
        <Button variant="outline-primary" size="sm" onClick={() => setCurriculums((p) => [...p, emptyCurriculum()])}>
          <FaPlus className="me-1" /> Add module
        </Button>
    </EditorSection>
  );
};

// ─── Bootcamp details (dates, venue, seats) ───────────────────────────────────

export const BootcampFields = ({ form, onChange, errors }) => (
  <EditorSection
    id="bootcamp"
    title="Dates & venue"
    help="When and where the bootcamp happens. Registration stops on the closing date or when seats run out."
  >
      <Row>
        <Col md={4}>
          <Form.Group className="mb-3">
            <Form.Label>Start date <span className="text-danger">*</span></Form.Label>
            <div data-field="start_date" className={errors?.start_date ? "ed-field has-error mb-0" : ""}>
              <Form.Control type="date" name="start_date" value={form.start_date} onChange={onChange} />
              {errors?.start_date && <p className="ed-error">{errors.start_date}</p>}
            </div>
          </Form.Group>
        </Col>
        <Col md={4}>
          <Form.Group className="mb-3">
            <Form.Label>End date</Form.Label>
            <Form.Control type="date" name="end_date" value={form.end_date} onChange={onChange} min={form.start_date || undefined} />
          </Form.Group>
        </Col>
        <Col md={4}>
          <Form.Group className="mb-3">
            <Form.Label>Registration closes</Form.Label>
            <Form.Control type="date" name="registration_deadline" value={form.registration_deadline} onChange={onChange} />
            <Form.Text className="text-muted">Leave empty to close on the last day.</Form.Text>
          </Form.Group>
        </Col>
      </Row>
      <Row>
        <Col md={8}>
          <Form.Group className="mb-3">
            <Form.Label>Venue</Form.Label>
            <Form.Control name="venue" value={form.venue} onChange={onChange} placeholder='e.g. ZAN Tech Lab, Dhanmondi — or "Online"' />
          </Form.Group>
        </Col>
        <Col md={4}>
          <Form.Group className="mb-3">
            <Form.Label>Total seats</Form.Label>
            <Form.Control type="number" min={1} name="seats" value={form.seats} onChange={onChange} placeholder="Unlimited" />
            <Form.Text className="text-muted">Registration stops when seats are full.</Form.Text>
          </Form.Group>
        </Col>
      </Row>
      <Form.Group className="mb-3">
        <Form.Label>Highlights post link <span className="text-muted fw-normal">(after the bootcamp ends)</span></Form.Label>
        <Form.Control name="recap_link" value={form.recap_link} onChange={onChange}
          placeholder="/workshop/young-innovators-boot-camp-session-1 — or paste the full link" />
        <Form.Text className="text-muted">
          Post the bootcamp photos/activities in Workshops, then paste that post's link here. Completed bootcamps show a "See Bootcamp Highlights" button.
        </Form.Text>
      </Form.Group>
  </EditorSection>
);

// ─── Course page details ──────────────────────────────────────────────────────

const StringListEditor = ({ label, help, items, onChange, placeholder }) => (
  <Form.Group className="mb-3">
    <Form.Label>{label}</Form.Label>
    {help && <Form.Text className="d-block text-muted mb-2">{help}</Form.Text>}
    {items.map((item, i) => (
      <div key={i} className="d-flex gap-2 mb-2">
        <Form.Control
          size="sm"
          value={item}
          onChange={(e) => onChange(items.map((s, k) => (k === i ? e.target.value : s)))}
          placeholder={placeholder}
        />
        <Button variant="outline-danger" size="sm" onClick={() => onChange(items.filter((_, k) => k !== i))}>
          <FaTrash />
        </Button>
      </div>
    ))}
    <Button variant="outline-secondary" size="sm" onClick={() => onChange([...items, ""])}>
      <FaPlus className="me-1" /> Add
    </Button>
  </Form.Group>
);

// "Preferred Class Slot" options: name, optional seat limit, and an on/off
// switch. Full or switched-off slots show greyed out on the website and
// can't be picked. A seat is taken once a registration is approved (paid);
// registrations still waiting for the payment check are shown beside it.
const SlotStatus = ({ slot }) => {
  const limit = Number(slot.capacity) || null;
  const paid = `${slot.taken}${limit ? ` / ${limit}` : ""} paid`;
  const badge = slot.closed
    ? <Badge bg="secondary">Closed · {paid}</Badge>
    : limit && slot.taken >= limit
      ? <Badge bg="danger">Full · {paid}</Badge>
      : <Badge bg={slot.taken ? "success" : "light"} text={slot.taken ? undefined : "dark"}>Open · {paid}</Badge>;

  return (
    <span className="d-inline-flex gap-1 align-items-center">
      {badge}
      {slot.pending > 0 && (
        <Badge bg="warning" text="dark" title="Registrations waiting for the payment check. They take a seat once approved.">
          +{slot.pending} waiting
        </Badge>
      )}
    </span>
  );
};

const ClassSlotEditor = ({ slots, onChange }) => {
  const update = (i, field, value) => onChange(slots.map((s, k) => (k === i ? { ...s, [field]: value } : s)));

  return (
    <Form.Group className="mb-1">
      <Form.Label>&quot;Preferred Class Slot&quot; options</Form.Label>
      <Form.Text className="d-block text-muted mb-3">
        Parents pick one of these on the website registration form. A seat counts once you approve the registration
        (payment checked). Set a seat limit and the slot closes by itself when it&apos;s full, or switch it off any time.
        Leave empty if there is no slot choice.
      </Form.Text>
      {slots.map((slot, i) => (
        <div key={i} className={`border rounded p-2 mb-2 ${slot.closed ? "bg-light" : ""}`}>
          <div className="d-flex gap-2 align-items-center">
            <Form.Control
              size="sm"
              value={slot.label}
              onChange={(e) => update(i, "label", e.target.value)}
              placeholder="e.g. Slot A — Friday 4:00–5:30 PM & Saturday 4:00–5:30 PM"
              aria-label={`Slot ${i + 1} name`}
            />
            <Button variant="outline-danger" size="sm" onClick={() => onChange(slots.filter((_, k) => k !== i))}
              aria-label={`Remove slot ${i + 1}`} title="Remove slot">
              <FaTrash />
            </Button>
          </div>
          <div className="d-flex flex-wrap gap-3 align-items-center mt-2">
            <Form.Group className="d-flex align-items-center gap-2 mb-0">
              <Form.Label className="mb-0 small text-muted text-nowrap" htmlFor={`slot-cap-${i}`}>Seat limit</Form.Label>
              <Form.Control
                id={`slot-cap-${i}`}
                size="sm"
                type="number"
                min="1"
                style={{ width: 96 }}
                value={slot.capacity}
                onChange={(e) => update(i, "capacity", e.target.value)}
                placeholder="No limit"
              />
            </Form.Group>
            <Form.Check
              type="switch"
              id={`slot-open-${i}`}
              className="mb-0"
              label={slot.closed ? "Closed — hidden from picking" : "Open for registration"}
              checked={!slot.closed}
              onChange={(e) => update(i, "closed", !e.target.checked)}
            />
            {slot.label.trim() && <SlotStatus slot={slot} />}
          </div>
        </div>
      ))}
      <Button variant="outline-secondary" size="sm" onClick={() => onChange([...slots, emptySlot()])}>
        <FaPlus className="me-1" /> Add slot
      </Button>
      <Form.Text className="d-block text-muted mt-2">
        Renaming a slot doesn&apos;t move students who already registered for its old name.
      </Form.Text>
    </Form.Group>
  );
};

export const CourseDetailFields = ({ details, setDetails }) => {
  const set = (key, value) => setDetails((p) => ({ ...p, [key]: value }));
  const setItem = (key, i, field, value) =>
    setDetails((p) => ({ ...p, [key]: p[key].map((x, k) => (k === i ? { ...x, [field]: value } : x)) }));

  return (
    <>
      {/* ── Course Highlights ── */}
      <EditorSection
        id="highlights"
        title="At a glance"
        optional
        help="The short facts parents see near the top of the course page. Module and lesson counts come from the curriculum."
      >
          <Row>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Age Group</Form.Label>
                <Form.Control value={details.age_group} onChange={(e) => set("age_group", e.target.value)} placeholder="e.g. Age 10-16" />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Level</Form.Label>
                <Form.Control value={details.level} onChange={(e) => set("level", e.target.value)} placeholder="e.g. Beginner" />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Class Duration</Form.Label>
                <Form.Control value={details.session_duration} onChange={(e) => set("session_duration", e.target.value)} placeholder="e.g. 90 mins per class" />
              </Form.Group>
            </Col>
          </Row>
          <Row>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Activities & Projects</Form.Label>
                <Form.Control value={details.total_activities} onChange={(e) => set("total_activities", e.target.value)} placeholder="e.g. 100+" />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Number of Quizzes</Form.Label>
                <Form.Control type="number" min={0} value={details.total_quizzes} onChange={(e) => set("total_quizzes", e.target.value)} placeholder="e.g. 24" />
              </Form.Group>
            </Col>
          </Row>
          <Form.Group>
            <Form.Label>Certificate Description</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={details.certificate_description}
              onChange={(e) => set("certificate_description", e.target.value)}
              placeholder="What certificate students earn and when. Leave empty to hide this section."
            />
          </Form.Group>
      </EditorSection>

      {/* ── Registration form ── */}
      <EditorSection id="slots" title="Class slots" optional
        help="The batch or time choices parents pick from on the registration form.">
          <ClassSlotEditor slots={details.class_slots} onChange={(v) => set("class_slots", v)} />
      </EditorSection>

      {/* ── Includes + Skills ── */}
      <EditorSection id="includes" title="What's included & skills" optional
        help="Two short bullet lists on the course page.">
          <Row>
            <Col md={6}>
              <StringListEditor
                label='"This course includes"'
                help="Short bullet points shown in the box next to the overview."
                items={details.includes}
                onChange={(v) => set("includes", v)}
                placeholder="e.g. 48 live hands-on sessions"
              />
            </Col>
            <Col md={6}>
              <StringListEditor
                label="Skills you'll gain"
                help="Learning outcomes, one per row."
                items={details.skills}
                onChange={(v) => set("skills", v)}
                placeholder="e.g. Build and program Arduino robots"
              />
            </Col>
          </Row>
      </EditorSection>

      {/* ── Projects ── */}
      <EditorSection id="projects" title="Projects students build" optional
        count={details.projects.filter((x) => x.title.trim()).length}
        help="A title and one line about each project.">
          {details.projects.map((p, i) => (
            <Row key={i} className="g-2 mb-2 align-items-start">
              <Col md={4}>
                <Form.Control size="sm" value={p.title} onChange={(e) => setItem("projects", i, "title", e.target.value)} placeholder="Project title" />
              </Col>
              <Col>
                <Form.Control size="sm" as="textarea" rows={1} value={p.description} onChange={(e) => setItem("projects", i, "description", e.target.value)} placeholder="Short description" />
              </Col>
              <Col xs="auto">
                <Button variant="outline-danger" size="sm" onClick={() => set("projects", details.projects.filter((_, k) => k !== i))}>
                  <FaTrash />
                </Button>
              </Col>
            </Row>
          ))}
          <Button variant="outline-primary" size="sm" onClick={() => set("projects", [...details.projects, { title: "", description: "" }])}>
            <FaPlus className="me-1" /> Add project
          </Button>
      </EditorSection>

      {/* ── FAQs ── */}
      <EditorSection id="faqs" title="Questions parents ask" optional
        count={details.faqs.filter((x) => x.question.trim()).length}
        help="Shown as an FAQ list at the bottom of the course page.">
          {details.faqs.map((f, i) => (
            <div key={i} className="border rounded p-2 mb-2">
              <div className="d-flex gap-2 mb-2">
                <Form.Control size="sm" value={f.question} onChange={(e) => setItem("faqs", i, "question", e.target.value)} placeholder="Question" />
                <Button variant="outline-danger" size="sm" onClick={() => set("faqs", details.faqs.filter((_, k) => k !== i))}>
                  <FaTrash />
                </Button>
              </div>
              <Form.Control size="sm" as="textarea" rows={2} value={f.answer} onChange={(e) => setItem("faqs", i, "answer", e.target.value)} placeholder="Answer" />
            </div>
          ))}
          <Button variant="outline-primary" size="sm" onClick={() => set("faqs", [...details.faqs, { question: "", answer: "" }])}>
            <FaPlus className="me-1" /> Add question
          </Button>
      </EditorSection>
    </>
  );
};
