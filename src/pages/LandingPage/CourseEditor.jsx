import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { Row, Col, Form, Button } from "react-bootstrap";
import { FaPlus, FaTrash, FaExternalLinkAlt } from "react-icons/fa";
import JoditEditor from "jodit-react";
import axiosInstance from "../../config/axios";
import confirmDialog from "../../utils/confirmDialog";
import {
  EditorPage, EditorSection, SectionNav, SaveBar, Field, ChoiceGroup, ImageDrop, TagsField,
  useUnsavedChanges, showFirstError, editorHtml,
} from "../../components/Editor/Editor";
import { CurriculumEditor, CourseDetailFields, BootcampFields } from "./CourseDetailFields";
import {
  emptyCurriculum, emptyDetails, curriculumsFromCourse, detailsFromCourse, appendCurriculums, appendDetails,
} from "./courseDetailUtils";

// One form for adding and editing a course or bootcamp.

const SITE_URL = "https://zantechbd.com";
const FORM_ID = "course-form";

const COURSE_TYPES = [
  { value: "online_live", label: "Online live" },
  { value: "recorded", label: "Recorded" },
  { value: "offline", label: "In person" },
  { value: "hybrid", label: "Hybrid" },
];

const emptySchedule = () => ({ course_type: "online_live", start_datetime: "" });
const emptyMentor = () => ({
  id: null, name: "", description: "", experience: "", is_student_mentor: false, image: null, imagePreview: null, imageUrl: null, removeImage: false,
});

const formFromCourse = (d, kind) => ({
  kind: d?.kind || kind || "course",
  title: d?.title || "",
  category: d?.category || "",
  serial_number: d?.serial_number ?? "",
  short_description: d?.short_description || "",
  description: d?.description || "",
  tags: Array.isArray(d?.tags) ? d.tags.join(", ") : d?.tags || "",
  payment_type: d?.payment_type || "one_time",
  price: d?.price ?? "",
  discount_price: d?.discount_price ?? "",
  duration_months: d?.duration_months ?? "",
  has_admission: Number(d?.admission_fee) > 0,
  admission_fee: d?.admission_fee ?? "",
  admission_fee_label: d?.admission_fee_label || "",
  start_date: d?.start_date || "",
  end_date: d?.end_date || "",
  registration_deadline: d?.registration_deadline || "",
  venue: d?.venue || "",
  seats: d?.seats ?? "",
  recap_link: d?.recap_link || "",
  is_active: d?.is_active ?? true,
  meta_title: d?.meta_title || "",
  meta_description: d?.meta_description || "",
  thumbnail: null,
  thumbnailPreview: null,
  thumbnailUrl: d?.thumbnail || null,
});

const initialState = (course, kind) => ({
  form: formFromCourse(course, kind),
  curriculums: course ? curriculumsFromCourse(course) : [emptyCurriculum()],
  details: course ? detailsFromCourse(course) : emptyDetails(),
  schedules: course?.schedules?.length
    ? course.schedules.map((s) => ({
        course_type: s.course_type || "online_live",
        start_datetime: s.start_datetime ? s.start_datetime.slice(0, 16) : "",
      }))
    : [emptySchedule()],
  mentors: course?.mentors?.length
    ? course.mentors.map((m) => ({
        ...emptyMentor(),
        id: m.id ?? null,
        name: m.name || "",
        description: m.description || "",
        experience: m.experience || "",
        is_student_mentor: !!m.is_student_mentor,
        imageUrl: m.image || null,
      }))
    : [emptyMentor()],
});

const plainText = (html) => (html || "").replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
const taka = (n) => `৳${Number(n).toLocaleString("en-US", { maximumFractionDigits: 2 })}`;

// Which section each field lives in, so its error lights up the jump list.
const FIELD_SECTION = {
  title: "basics", category: "basics", description: "description", discount_price: "pricing",
  duration_months: "pricing", admission_fee: "pricing", start_date: "bootcamp",
};
const ERROR_ORDER = ["title", "category", "description", "discount_price", "duration_months", "admission_fee", "start_date"];

const CourseEditor = ({ course = null, initialKind = "course", tabs = null, activeTab = "details", tabContent = null }) => {
  const navigate = useNavigate();
  const isEdit = !!course;
  const editorRef = useRef(null);

  const [state, setState] = useState(() => initialState(course, initialKind));
  const { form, curriculums, details, schedules, mentors } = state;
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [savedCourse, setSavedCourse] = useState(course);

  const { dirty, markSaved } = useUnsavedChanges(state);
  // Mentors are refreshed from the server after a save; mark the form saved once that render is done.
  const [saveCount, setSaveCount] = useState(0);
  useEffect(() => {
    if (saveCount) markSaved();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saveCount]);

  const isBootcamp = form.kind === "bootcamp";
  const isMonthly = form.payment_type === "monthly";
  const noun = isBootcamp ? "bootcamp" : "course";
  const listUrl = `/landing?tab=${isBootcamp ? "bootcamps" : "courses"}`;

  // ── state helpers ──────────────────────────────────────────────────────────
  const patch = (key, value) => setState((s) => ({ ...s, [key]: typeof value === "function" ? value(s[key]) : value }));
  const setField = (name, value) => {
    patch("form", (f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((e) => { const n = { ...e }; delete n[name]; return n; });
  };
  const onInput = (e) => {
    const { name, value, type, checked } = e.target;
    setField(name, type === "checkbox" ? checked : value);
  };
  const setCurriculums = (v) => patch("curriculums", v);
  const setDetails = (v) => patch("details", v);
  const setSchedule = (i, k, v) => patch("schedules", (list) => list.map((s, x) => (x === i ? { ...s, [k]: v } : s)));
  const setMentor = (i, k, v) => patch("mentors", (list) => list.map((m, x) => (x === i ? { ...m, [k]: v } : m)));

  const editorConfig = useMemo(
    () => ({ readonly: false, placeholder: "What students learn, who it's for, and how classes run…", height: 380 }),
    []
  );

  // ── price summary ──────────────────────────────────────────────────────────
  const realPrice = form.discount_price !== "" ? Number(form.discount_price) : form.price !== "" ? Number(form.price) : null;
  const monthlyFee = isMonthly && realPrice != null && Number(form.duration_months) > 0
    ? Math.round((realPrice / Number(form.duration_months)) * 100) / 100
    : null;
  const showStrike = form.price !== "" && form.discount_price !== "" && Number(form.price) > Number(form.discount_price);

  // ── validation ─────────────────────────────────────────────────────────────
  const validate = (form) => {
    const e = {};
    if (!form.title.trim()) e.title = `Give the ${noun} a title.`;
    if (!form.category.trim()) e.category = "Add a category, e.g. Robotics.";
    if (!isEdit && !plainText(form.description)) e.description = "Write a short description. Parents read this first.";
    if (isMonthly) {
      if (form.discount_price === "") e.discount_price = "Monthly courses need the full course price here.";
      if (!(Number(form.duration_months) > 0)) e.duration_months = "How many months does the course run?";
    }
    if (form.has_admission && !(Number(form.admission_fee) > 0)) e.admission_fee = "Enter the fee amount, or turn the fee off.";
    if (isBootcamp && !form.start_date) e.start_date = "A bootcamp needs a start date.";
    return e;
  };

  const buildFormData = (form) => {
    const fd = new FormData();
    fd.append("title", form.title.trim());
    fd.append("kind", form.kind);
    ["start_date", "end_date", "registration_deadline", "venue", "seats", "recap_link"].forEach((k) =>
      fd.append(k, isBootcamp ? form[k] ?? "" : "")
    );
    fd.append("description", form.description || "");
    if (form.short_description) fd.append("short_description", form.short_description);
    if (form.category) fd.append("category", form.category);
    if (form.price !== "") fd.append("price", form.price);
    if (form.discount_price !== "") fd.append("discount_price", form.discount_price);
    fd.append("payment_type", form.payment_type);
    if (isMonthly) fd.append("duration_months", form.duration_months);
    fd.append("admission_fee", form.has_admission ? form.admission_fee : "");
    fd.append("admission_fee_label", form.has_admission ? form.admission_fee_label.trim() : "");
    if (form.serial_number !== "") fd.append("serial_number", form.serial_number);
    if (form.thumbnail) fd.append("thumbnail", form.thumbnail);
    form.tags.split(",").map((t) => t.trim()).filter(Boolean).forEach((t) => fd.append("tags[]", t));

    appendCurriculums(fd, curriculums);
    appendDetails(fd, details);

    schedules.filter((s) => s.start_datetime).forEach((s, i) => {
      fd.append(`schedules[${i}][course_type]`, s.course_type);
      fd.append(`schedules[${i}][start_datetime]`, s.start_datetime);
    });
    mentors.filter((m) => m.name.trim()).forEach((m, i) => {
      // The id keeps a saved mentor (and its photo); without it the server adds a new mentor.
      if (m.id) fd.append(`mentors[${i}][id]`, m.id);
      fd.append(`mentors[${i}][name]`, m.name);
      if (m.description) fd.append(`mentors[${i}][description]`, m.description);
      if (m.experience) fd.append(`mentors[${i}][experience]`, m.experience);
      fd.append(`mentors[${i}][is_student_mentor]`, m.is_student_mentor ? 1 : 0);
      if (m.image) fd.append(`mentors[${i}][image]`, m.image);
      else if (m.removeImage) fd.append(`mentors[${i}][remove_image]`, 1);
    });

    if (isEdit) {
      fd.append("is_active", form.is_active ? 1 : 0);
      if (form.meta_title) fd.append("meta_title", form.meta_title);
      if (form.meta_description) fd.append("meta_description", form.meta_description);
      fd.append("_method", "PUT");
    }
    return fd;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // The description editor saves on blur; read the latest text first.
    const latest = editorHtml(editorRef);
    const current = typeof latest === "string" ? { ...form, description: latest } : form;
    if (current.description !== form.description) setField("description", current.description);

    const found = validate(current);
    setErrors(found);
    if (Object.keys(found).length) {
      showFirstError(found, ERROR_ORDER);
      return;
    }

    setSaving(true);
    try {
      const url = isEdit ? `/courses/${savedCourse.id}` : "/courses";
      const res = await axiosInstance.post(url, buildFormData(current), { headers: { "Content-Type": "multipart/form-data" } });
      if (isEdit) {
        toast.success("Changes saved");
        setSavedCourse((c) => ({ ...c, title: form.title, is_active: form.is_active }));
        if (form.thumbnailPreview) patch("form", (f) => ({ ...f, thumbnailUrl: f.thumbnailPreview, thumbnail: null, thumbnailPreview: null }));
        // New mentors get their ids here, so the next save updates them instead of adding them again.
        try {
          const fresh = await axiosInstance.get(`/courses/${res.data?.data?.slug || savedCourse.slug}`);
          const freshMentors = fresh.data?.data?.mentors;
          if (Array.isArray(freshMentors)) {
            patch("mentors", initialState({ mentors: freshMentors }, initialKind).mentors);
            setSavedCourse((c) => ({ ...c, mentors: freshMentors }));
          }
        } catch {
          /* the save went through; the ids load next time the page opens */
        }
        setSaveCount((n) => n + 1);
      } else {
        markSaved();
        const created = res.data?.data;
        toast.success(`${isBootcamp ? "Bootcamp" : "Course"} created as a draft`);
        navigate(created?.slug ? `/landing/courses/${created.slug}` : listUrl, { replace: true });
      }
    } catch (err) {
      const apiErrors = err.response?.data?.errors;
      if (apiErrors && typeof apiErrors === "object") {
        const mapped = Object.fromEntries(Object.entries(apiErrors).map(([k, v]) => [k.split(".")[0], Array.isArray(v) ? v[0] : String(v)]));
        setErrors(mapped);
        showFirstError(mapped, ERROR_ORDER);
      }
      toast.error(err.response?.data?.message || `Couldn't save the ${noun}. Check the form and try again.`);
    } finally {
      setSaving(false);
    }
  };

  const discard = async () => {
    if (!(await confirmDialog("Discard your unsaved changes?"))) return;
    setState(initialState(savedCourse, initialKind));
    setErrors({});
  };

  // ── jump list ──────────────────────────────────────────────────────────────
  const errorSections = new Set(Object.keys(errors).map((k) => FIELD_SECTION[k]).filter(Boolean));
  const has = (ok) => (ok ? "done" : "empty");
  const sections = [
    { id: "basics", label: "Basics", state: has(form.title.trim() && form.category.trim()) },
    { id: "description", label: "Description", state: has(plainText(form.description)) },
    { id: "pricing", label: "Price & payment", state: has(form.price !== "" || form.discount_price !== "") },
    ...(isBootcamp ? [{ id: "bootcamp", label: "Dates & venue", state: has(form.start_date) }] : []),
    { id: "curriculum", label: isBootcamp ? "Agenda" : "Curriculum", state: has(curriculums.some((c) => c.title.trim())) },
    { id: "highlights", label: "At a glance", state: has(details.age_group || details.level || details.session_duration) },
    { id: "slots", label: "Class slots", state: has(details.class_slots.some((s) => s.label.trim())) },
    { id: "includes", label: "Included & skills", state: has(details.includes.some((x) => x.trim()) || details.skills.some((x) => x.trim())) },
    { id: "projects", label: "Projects", state: has(details.projects.some((p) => p.title.trim())) },
    { id: "faqs", label: "Questions", state: has(details.faqs.some((f) => f.question.trim())) },
    ...(isBootcamp ? [] : [{ id: "schedules", label: "Start dates", state: has(schedules.some((s) => s.start_datetime)) }]),
    { id: "mentors", label: "Mentors", state: has(mentors.some((m) => m.name.trim())) },
    ...(isEdit ? [{ id: "visibility", label: "Visibility & search", state: "done" }] : []),
  ].map((s) => (errorSections.has(s.id) ? { ...s, state: "error" } : s));

  const publicUrl = savedCourse?.slug ? `${SITE_URL}/${isBootcamp ? "bootcamp" : "course"}/${savedCourse.slug}` : null;
  const status = savedCourse
    ? savedCourse.status === "published" && savedCourse.is_active
      ? { cls: "is-live", text: "Published" }
      : savedCourse.status === "published"
        ? { cls: "is-off", text: "Hidden from website" }
        : { cls: "is-warn", text: "Draft" }
    : null;

  const onDetailsTab = activeTab === "details";

  return (
    <EditorPage
      title={isEdit ? savedCourse.title || `Untitled ${noun}` : `New ${noun}`}
      meta={
        isEdit ? (
          <>
            <span className={`ed-status ${status.cls}`}>{status.text}</span>
            <span>{isBootcamp ? "Bootcamp" : "Course"}</span>
          </>
        ) : (
          <span>Only a title, category and description are needed to save. You can fill in the rest later.</span>
        )
      }
      actions={publicUrl && (
        <a className="btn btn-outline-secondary" href={publicUrl} target="_blank" rel="noreferrer">
          <FaExternalLinkAlt className="me-2" aria-hidden="true" />View on website
        </a>
      )}
      nav={onDetailsTab ? <SectionNav sections={sections} /> : null}
      footer={onDetailsTab && (
        <SaveBar
          formId={FORM_ID}
          dirty={dirty || !isEdit}
          saving={saving}
          errorCount={Object.keys(errors).length}
          onShowErrors={() => showFirstError(errors, ERROR_ORDER)}
          onDiscard={isEdit ? discard : null}
          saveLabel={isEdit ? "Save changes" : `Create ${noun}`}
          savingLabel={isEdit ? "Saving…" : "Creating…"}
          dirtyText={isEdit ? "You have unsaved changes" : `New ${noun}, not saved yet`}
        />
      )}
    >
      {tabs}
      {!onDetailsTab && tabContent}

      <form id={FORM_ID} onSubmit={handleSubmit} noValidate hidden={!onDetailsTab}>
        {/* ── Basics ── */}
        <EditorSection id="basics" title="Basics" help={`The name and picture people see in the ${noun} list and at the top of its page.`}>
          <Field name="kind" label="Type">
            <ChoiceGroup
              name="kind"
              value={form.kind}
              onChange={(v) => setField("kind", v)}
              options={[
                { value: "course", label: "Course", hint: "Regular classes over weeks or months" },
                { value: "bootcamp", label: "Bootcamp", hint: "A short program on fixed dates" },
              ]}
            />
          </Field>
          <Field name="title" label="Title" required error={errors.title} labelFor="course-title">
            <Form.Control id="course-title" name="title" value={form.title} onChange={onInput}
              placeholder={isBootcamp ? "e.g. Young Innovators Bootcamp — Winter 2026" : "e.g. Robotics Level 1"} />
          </Field>
          <Row>
            <Col md={8}>
              <Field name="short_description" label="Card summary" labelFor="course-short"
                help={`${form.short_description.length}/500 · Shown on the ${noun} card in lists.`}>
                <Form.Control id="course-short" as="textarea" rows={2} name="short_description" maxLength={500}
                  value={form.short_description} onChange={onInput} placeholder="One or two sentences about what students do." />
              </Field>
            </Col>
            <Col md={4}>
              <Field name="category" label="Category" required labelFor="course-category" error={errors.category}>
                <Form.Control id="course-category" name="category" value={form.category} onChange={onInput} placeholder="e.g. Robotics" />
              </Field>
              <Field name="serial_number" label="Position in list" labelFor="course-serial" help="Lower numbers show first.">
                <Form.Control id="course-serial" type="number" min={0} name="serial_number" value={form.serial_number}
                  onChange={onInput} placeholder="e.g. 1" />
              </Field>
            </Col>
          </Row>
          <Row>
            <Col md={6}>
              <Field name="thumbnail" label="Cover image" help="Landscape works best, about 1200 × 675.">
                <ImageDrop
                  id="course-thumb"
                  preview={form.thumbnailPreview}
                  currentUrl={form.thumbnailUrl}
                  onFile={(file) => patch("form", (f) => ({ ...f, thumbnail: file, thumbnailPreview: URL.createObjectURL(file) }))}
                  onRemove={() => patch("form", (f) => ({ ...f, thumbnail: null, thumbnailPreview: null }))}
                />
              </Field>
            </Col>
            <Col md={6}>
              <Field name="tags" label="Tags" help="Separate with commas. Used for search on the website.">
                <TagsField value={form.tags} onChange={(v) => setField("tags", v)} />
              </Field>
            </Col>
          </Row>
        </EditorSection>

        {/* ── Description ── */}
        <EditorSection id="description" title="Description" help={`The full text on the ${noun} page.`}>
          <Field name="description" label="Description" required={!isEdit} error={errors.description}>
            <JoditEditor
              ref={editorRef}
              value={form.description}
              config={editorConfig}
              onBlur={(val) => setField("description", val)}
            />
          </Field>
        </EditorSection>

        {/* ── Price ── */}
        <EditorSection id="pricing" title="Price & payment" help="What parents pay, and how.">
          <Field name="payment_type" label="How parents pay">
            <ChoiceGroup
              name="payment_type"
              value={form.payment_type}
              onChange={(v) => setField("payment_type", v)}
              options={[
                { value: "one_time", label: "One payment", hint: "The full price at once" },
                { value: "monthly", label: "Monthly", hint: "The price split over the months" },
              ]}
            />
          </Field>
          <div className="ed-grid">
            <Field name="price" label="Regular price" labelFor="course-price" help="Optional. Shown crossed out next to the real price.">
              <div className="ed-money"><span>৳</span>
                <Form.Control id="course-price" type="number" min={0} step="0.01" name="price" value={form.price} onChange={onInput} placeholder="0" />
              </div>
            </Field>
            <Field name="discount_price" label={isMonthly ? "Full course price" : "Price parents pay"} labelFor="course-discount"
              required={isMonthly} error={errors.discount_price}
              help={isMonthly ? "Split evenly across the months." : "Leave empty to charge the regular price."}>
              <div className="ed-money"><span>৳</span>
                <Form.Control id="course-discount" type="number" min={0} step="0.01" name="discount_price" value={form.discount_price} onChange={onInput} placeholder="0" />
              </div>
            </Field>
            {isMonthly && (
              <Field name="duration_months" label="Months" labelFor="course-months" required error={errors.duration_months}>
                <Form.Control id="course-months" type="number" min={1} name="duration_months" value={form.duration_months} onChange={onInput} placeholder="e.g. 4" />
              </Field>
            )}
          </div>

          {realPrice != null && (
            <div className="ed-summary mb-3" aria-live="polite">
              <span>Parents see</span>
              {showStrike && <s>{taka(form.price)}</s>}
              <strong>{isMonthly && monthlyFee != null ? `${taka(monthlyFee)} a month` : taka(realPrice)}</strong>
              {isMonthly && monthlyFee != null && <span>for {form.duration_months} months ({taka(realPrice)} in total)</span>}
              {form.has_admission && Number(form.admission_fee) > 0 && (
                <span>+ {taka(form.admission_fee)} {form.admission_fee_label || "one-time fee"}</span>
              )}
            </div>
          )}

          <div className="ed-item mb-0">
            <Form.Check
              type="switch"
              id="has-admission"
              label="Add a one-time fee (e.g. a robotics kit or admission)"
              checked={form.has_admission}
              onChange={(e) => setField("has_admission", e.target.checked)}
            />
            {form.has_admission && (
              <div className="ed-grid mt-3">
                <Field name="admission_fee_label" label="What it's for" labelFor="course-fee-label">
                  <Form.Control id="course-fee-label" name="admission_fee_label" maxLength={100} value={form.admission_fee_label}
                    onChange={onInput} placeholder="e.g. Robotics kit" />
                </Field>
                <Field name="admission_fee" label="Amount" required labelFor="course-fee" error={errors.admission_fee}>
                  <div className="ed-money"><span>৳</span>
                    <Form.Control id="course-fee" type="number" min={0} step="0.01" name="admission_fee" value={form.admission_fee} onChange={onInput} placeholder="0" />
                  </div>
                </Field>
              </div>
            )}
          </div>
        </EditorSection>

        {isBootcamp && <BootcampFields form={form} onChange={onInput} errors={errors} />}

        <CurriculumEditor
          title={isBootcamp ? "Agenda, day by day" : "Curriculum"}
          curriculums={curriculums}
          setCurriculums={setCurriculums}
          curriculumLink={details.curriculum_link}
          onCurriculumLinkChange={(v) => setDetails((d) => ({ ...d, curriculum_link: v }))}
        />

        <CourseDetailFields details={details} setDetails={setDetails} />

        {/* ── Start dates (courses only; a bootcamp's date is under Dates & venue) ── */}
        {!isBootcamp && (
        <EditorSection id="schedules" title="Start dates" optional
          count={schedules.filter((s) => s.start_datetime).length}
          help="When each batch starts and how it's taught.">
          {schedules.map((s, i) => (
            <div key={i} className="ed-item">
              <div className="ed-item-head">
                <span>Batch {i + 1}</span>
                {schedules.length > 1 && (
                  <Button variant="outline-danger" size="sm" aria-label={`Remove batch ${i + 1}`}
                    onClick={() => patch("schedules", (l) => l.filter((_, x) => x !== i))}>
                    <FaTrash />
                  </Button>
                )}
              </div>
              <div className="ed-grid">
                <Field name={`schedule-${i}-type`} label="How it's taught">
                  <Form.Select value={s.course_type} onChange={(e) => setSchedule(i, "course_type", e.target.value)}>
                    {COURSE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </Form.Select>
                </Field>
                <Field name={`schedule-${i}-start`} label="Starts on">
                  <Form.Control type="datetime-local" value={s.start_datetime} onChange={(e) => setSchedule(i, "start_datetime", e.target.value)} />
                </Field>
              </div>
            </div>
          ))}
          <Button variant="outline-primary" size="sm" onClick={() => patch("schedules", (l) => [...l, emptySchedule()])}>
            <FaPlus className="me-1" /> Add start date
          </Button>
        </EditorSection>
        )}

        {/* ── Mentors ── */}
        <EditorSection id="mentors" title="Mentors" optional
          count={mentors.filter((m) => m.name.trim()).length}
          help="The people teaching. A new photo replaces the old one when you save.">
          {mentors.map((m, i) => (
            <div key={i} className="ed-item">
              <div className="ed-item-head">
                <span>{m.name.trim() || `Mentor ${i + 1}`}</span>
                {mentors.length > 1 && (
                  <Button variant="outline-danger" size="sm" aria-label={`Remove ${m.name || `mentor ${i + 1}`}`}
                    onClick={() => patch("mentors", (l) => l.filter((_, x) => x !== i))}>
                    <FaTrash />
                  </Button>
                )}
              </div>
              <Row className="g-3">
                <Col sm={4} md={3}>
                  <ImageDrop
                    id={`mentor-img-${i}`}
                    aspect="1 / 1"
                    hint="Square photo"
                    preview={m.imagePreview}
                    currentUrl={m.removeImage ? null : m.imageUrl}
                    onFile={(file) => patch("mentors", (l) => l.map((x, k) => (k === i ? { ...x, image: file, imagePreview: URL.createObjectURL(file), removeImage: false } : x)))}
                    onRemove={() => patch("mentors", (l) => l.map((x, k) => (k === i ? { ...x, image: null, imagePreview: null } : x)))}
                    onClearCurrent={() => patch("mentors", (l) => l.map((x, k) => (k === i ? { ...x, removeImage: true } : x)))}
                  />
                  <Form.Check className="mt-2" id={`mentor-student-${i}`} label="Student mentor"
                    checked={m.is_student_mentor} onChange={(e) => setMentor(i, "is_student_mentor", e.target.checked)} />
                </Col>
                <Col sm={8} md={9}>
                  <div className="ed-grid">
                    <Field name={`mentor-${i}-name`} label="Name">
                      <Form.Control value={m.name} onChange={(e) => setMentor(i, "name", e.target.value)} placeholder="Full name" />
                    </Field>
                    <Field name={`mentor-${i}-exp`} label="Experience">
                      <Form.Control value={m.experience} onChange={(e) => setMentor(i, "experience", e.target.value)} placeholder="e.g. 5 years in robotics" />
                    </Field>
                  </div>
                  <Field name={`mentor-${i}-bio`} label="Short bio">
                    <Form.Control as="textarea" rows={3} value={m.description} onChange={(e) => setMentor(i, "description", e.target.value)}
                      placeholder="A few lines parents will read." />
                  </Field>
                </Col>
              </Row>
            </div>
          ))}
          <Button variant="outline-primary" size="sm" onClick={() => patch("mentors", (l) => [...l, emptyMentor()])}>
            <FaPlus className="me-1" /> Add mentor
          </Button>
        </EditorSection>

        {/* ── Visibility (edit only) ── */}
        {isEdit && (
          <EditorSection id="visibility" title="Visibility & search" help="Whether the page is on the website, and how it appears in Google.">
            <div className="ed-item">
              <Form.Check
                type="switch"
                id="course-active"
                name="is_active"
                label={form.is_active ? "Shown on the website" : "Hidden from the website"}
                checked={form.is_active}
                onChange={onInput}
              />
              <p className="ed-hint mb-0">Publishing a draft is done from the {noun} list.</p>
            </div>
            <Field name="meta_title" label="Search title" labelFor="course-meta-title"
              help={`${form.meta_title.length}/60${form.meta_title.length > 60 ? " · Google may cut off the end" : ""} · Leave empty to use the ${noun} title.`}>
              <Form.Control id="course-meta-title" name="meta_title" value={form.meta_title} onChange={onInput} />
            </Field>
            <Field name="meta_description" label="Search description" labelFor="course-meta-desc"
              help={`${form.meta_description.length}/160${form.meta_description.length > 160 ? " · Google may cut off the end" : ""} · The line under the title in Google.`}>
              <Form.Control id="course-meta-desc" as="textarea" rows={2} name="meta_description" value={form.meta_description} onChange={onInput} />
            </Field>
          </EditorSection>
        )}
      </form>
    </EditorPage>
  );
};

export default CourseEditor;
