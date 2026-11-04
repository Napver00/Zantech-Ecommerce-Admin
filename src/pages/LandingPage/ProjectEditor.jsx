import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { Form } from "react-bootstrap";
import { FaExternalLinkAlt } from "react-icons/fa";
import JoditEditor from "jodit-react";
import axiosInstance from "../../config/axios";
import confirmDialog from "../../utils/confirmDialog";
import {
  EditorPage, EditorSection, SectionNav, SaveBar, Field, ChoiceGroup, ImageDrop, TagsField,
  useUnsavedChanges, showFirstError, editorHtml,
} from "../../components/Editor/Editor";
import "../../components/Editor/Editor.css";
import { PROJECT_CATEGORIES } from "./projectCategories";

// One form for adding a portfolio project and editing an existing one.

const FORM_ID = "project-form";
const MAX_IMAGE_MB = 2;
const BACK = "/landing?tab=projects";

const formFromProject = (p) => ({
  title: p?.title || "",
  description: p?.description || "",
  longdescription: p?.longdescription || "",
  technologies: (p?.technologies || []).map((t) => t.name).join(", "),
  status: p?.status || "active",
  category: p?.category || "rnd",
  image: null,
  imagePreview: null,
  imageUrl: p?.image_url || null,
});

const splitTags = (value) => [...new Set(value.split(",").map((t) => t.trim()).filter(Boolean))];
const plainText = (html) => (html || "").replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();

const SECTION_OF = { title: "basics", description: "basics", technologies: "basics", image: "basics", longdescription: "story" };
const ERROR_ORDER = ["title", "description", "technologies", "image", "longdescription"];

const ProjectEditor = ({ project = null }) => {
  const navigate = useNavigate();
  const isEdit = !!project;
  const editorRef = useRef(null);
  const [saved, setSaved] = useState(project);
  const [form, setForm] = useState(() => formFromProject(project));
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const { dirty, markSaved } = useUnsavedChanges(form);
  // After a save the form is refilled from the server; mark it saved once that render is done.
  const [saveCount, setSaveCount] = useState(0);
  useEffect(() => {
    if (saveCount) markSaved();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saveCount]);

  const editorConfig = useMemo(
    () => ({ readonly: false, placeholder: "What was built, how, and what came out of it…", height: 420, showXPathInStatusbar: false }),
    []
  );

  const set = (name, value) => {
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((e) => { const n = { ...e }; delete n[name]; return n; });
  };
  const onInput = (e) => set(e.target.name, e.target.value);

  const pickImage = (file) => {
    if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
      setErrors((e) => ({ ...e, image: `That image is larger than ${MAX_IMAGE_MB} MB. Pick a smaller one.` }));
      return;
    }
    setErrors((e) => { const n = { ...e }; delete n.image; return n; });
    setForm((f) => ({ ...f, image: file, imagePreview: URL.createObjectURL(file) }));
  };

  // Technologies are their own records on an existing project: add the new names, remove the dropped ones.
  const syncTechnologies = async (projectId, wanted) => {
    const current = saved?.technologies || [];
    const currentNames = current.map((t) => t.name.toLowerCase());
    const wantedLower = wanted.map((t) => t.toLowerCase());
    const toRemove = current.filter((t) => !wantedLower.includes(t.name.toLowerCase()));
    const toAdd = wanted.filter((t) => !currentNames.includes(t.toLowerCase()));
    await Promise.all(toRemove.map((t) => axiosInstance.delete(`/projects/technologie/${t.id}`)));
    for (const name of toAdd) {
      await axiosInstance.post(`/projects/technologie/${projectId}`, { name });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const latest = editorHtml(editorRef);
    const current = latest !== undefined ? { ...form, longdescription: latest } : form;
    const techs = splitTags(current.technologies);

    const found = {};
    if (!current.title.trim()) found.title = "Give the project a name.";
    if (!current.description.trim()) found.description = "Write a sentence or two for the project card.";
    if (!techs.length) found.technologies = "Add at least one technology, e.g. Arduino.";
    setErrors(found);
    if (Object.keys(found).length) {
      showFirstError(found, ERROR_ORDER);
      return;
    }

    const fd = new FormData();
    fd.append("title", current.title.trim());
    fd.append("description", current.description.trim());
    fd.append("longdescription", current.longdescription || "");
    if (current.image) fd.append("image", current.image);
    fd.append("category", current.category);
    if (isEdit) fd.append("status", current.status);
    else techs.forEach((t) => fd.append("technologies[]", t));

    setSaving(true);
    try {
      const res = await axiosInstance.post(isEdit ? `/projects/${saved.id}` : "/projects", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const data = res.data?.data || {};

      if (isEdit) {
        await syncTechnologies(saved.id, techs);
        const fresh = await axiosInstance.get(`/projects/${data.slug || saved.slug}`);
        const next = fresh.data?.data || saved;
        setSaved(next);
        setForm(formFromProject(next));
        setSaveCount((n) => n + 1);
        toast.success("Changes saved");
        // A new title gives the project a new address.
        if (next.slug && next.slug !== saved.slug) navigate(`/landing/projects/${next.slug}`, { replace: true });
      } else {
        markSaved();
        toast.success("Project added");
        navigate(data.slug ? `/landing/projects/${data.slug}` : BACK, { replace: true });
      }
    } catch (err) {
      const apiErrors = err.response?.data?.errors;
      if (apiErrors && typeof apiErrors === "object") {
        const mapped = Object.fromEntries(Object.entries(apiErrors).map(([k, v]) => [k.split(".")[0], Array.isArray(v) ? v[0] : String(v)]));
        setErrors(mapped);
        showFirstError(mapped, ERROR_ORDER);
      }
      toast.error(err.response?.data?.message || "Couldn't save the project. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const discard = async () => {
    if (!(await confirmDialog("Discard your unsaved changes?"))) return;
    setForm(formFromProject(saved));
    setErrors({});
  };

  const techCount = splitTags(form.technologies).length;
  const errorSections = new Set(Object.keys(errors).map((k) => SECTION_OF[k]).filter(Boolean));
  const sections = [
    { id: "basics", label: "Project card", state: form.title.trim() && form.description.trim() && techCount ? "done" : "empty" },
    { id: "story", label: "Full write-up", state: plainText(form.longdescription) ? "done" : "empty" },
    ...(isEdit ? [{ id: "visibility", label: "On the website", state: "done" }] : []),
  ].map((s) => (errorSections.has(s.id) ? { ...s, state: "error" } : s));

  const live = isEdit && saved.status === "active";
  const url = live && saved.slug ? `https://zantechbd.com/project/${saved.slug}` : null;

  return (
    <EditorPage
      back={{ label: "Projects", onClick: () => navigate(BACK) }}
      title={isEdit ? saved.title || "Untitled project" : "New project"}
      meta={
        isEdit ? (
          <>
            <span className={`ed-status ${live ? "is-live" : "is-off"}`}>{live ? "On the website" : "Hidden"}</span>
            <span>{PROJECT_CATEGORIES.find((c) => c.value === saved.category)?.label || "ZAN Tech R&D"}</span>
            <span>{techCount} {techCount === 1 ? "technology" : "technologies"}</span>
          </>
        ) : (
          <span>Shows in the portfolio on zantechbd.com as soon as you add it.</span>
        )
      }
      actions={url && (
        <a className="btn btn-outline-secondary" href={url} target="_blank" rel="noreferrer">
          <FaExternalLinkAlt className="me-2" aria-hidden="true" />View on website
        </a>
      )}
      nav={<SectionNav sections={sections} />}
      footer={
        <SaveBar
          formId={FORM_ID}
          dirty={dirty}
          saving={saving}
          errorCount={Object.keys(errors).length}
          onShowErrors={() => showFirstError(errors, ERROR_ORDER)}
          onDiscard={isEdit ? discard : null}
          saveLabel={isEdit ? "Save changes" : "Add project"}
          savingLabel={isEdit ? "Saving…" : "Adding…"}
          cleanText={isEdit ? "All changes saved" : "New project, nothing filled in yet"}
          dirtyText={isEdit ? "You have unsaved changes" : "Not added yet"}
        />
      }
    >
      <form id={FORM_ID} onSubmit={handleSubmit} noValidate>
        <EditorSection id="basics" title="Project card" help="What visitors see in the portfolio grid.">
          <Field name="category" label="Whose project is it?">
            <ChoiceGroup name="category" value={form.category} onChange={(v) => set("category", v)} options={PROJECT_CATEGORIES} columns={2} />
          </Field>
          <Field name="title" label="Name" required error={errors.title} labelFor="project-title">
            <Form.Control id="project-title" name="title" value={form.title} onChange={onInput}
              placeholder="e.g. Smart irrigation controller" />
          </Field>
          <Field name="description" label="Short description" required error={errors.description} labelFor="project-desc"
            help={`${form.description.length} characters. One or two sentences read best on the card.`}>
            <Form.Control id="project-desc" as="textarea" rows={3} name="description" value={form.description} onChange={onInput}
              placeholder="What it does and who it was for." />
          </Field>
          <div className="ed-grid">
            <Field name="image" label="Cover image" error={errors.image} help={`Landscape works best. Up to ${MAX_IMAGE_MB} MB.`}>
              <ImageDrop
                id="project-image"
                hint={`JPG, PNG or WebP, up to ${MAX_IMAGE_MB} MB`}
                preview={form.imagePreview}
                currentUrl={form.imageUrl}
                onFile={pickImage}
                onRemove={() => setForm((f) => ({ ...f, image: null, imagePreview: null }))}
              />
            </Field>
            <Field name="technologies" label="Technologies" required error={errors.technologies}
              help="Separate with commas. Shown as tags on the card.">
              <TagsField value={form.technologies} onChange={(v) => set("technologies", v)} placeholder="e.g. ESP32, React, MQTT" />
            </Field>
          </div>
        </EditorSection>

        <EditorSection id="story" title="Full write-up" optional
          help="Shown on the project's own page. Photos you paste in are saved with it.">
          <Field name="longdescription" error={errors.longdescription}>
            <JoditEditor ref={editorRef} value={form.longdescription} config={editorConfig} onBlur={(v) => set("longdescription", v)} />
          </Field>
        </EditorSection>

        {isEdit && (
          <EditorSection id="visibility" title="On the website">
            <ChoiceGroup
              name="status"
              value={form.status}
              onChange={(v) => set("status", v)}
              options={[
                { value: "active", label: "Shown", hint: "In the portfolio and at its own link" },
                { value: "inactive", label: "Hidden", hint: "Kept here, invisible to visitors" },
              ]}
            />
          </EditorSection>
        )}
      </form>
    </EditorPage>
  );
};

export default ProjectEditor;
