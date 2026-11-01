import React, { useMemo, useRef, useState } from "react";
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

// One form for writing a new post and editing an existing one.

const FORM_ID = "post-form";
const MAX_THUMB_MB = 2;

const CATEGORIES = [
  { value: "Blog", label: "Blog", hint: "News and articles, on the store" },
  { value: "Tutorial", label: "Tutorial", hint: "Step-by-step guides, on the main site" },
  { value: "workshop", label: "Workshop", hint: "Event write-ups with photos, on the main site" },
];

// Where each kind of post is read by the public.
const publicUrl = (post) => {
  if (!post?.slug) return null;
  if (post.category === "Tutorial") return `https://zantechbd.com/tutorial/${post.slug}`;
  if (post.category === "workshop") return `https://zantechbd.com/workshop/${post.slug}`;
  return `https://store.zantechbd.com/postdetails/${post.slug}`;
};

const formFromPost = (p) => ({
  title: p?.title || "",
  category: p?.category || "Blog",
  tags: Array.isArray(p?.tags) ? p.tags.filter(Boolean).join(", ") : "",
  content: p?.content || "",
  meta_title: p?.meta_title || "",
  meta_description: p?.meta_description || "",
  thumbnail: null,
  thumbnailPreview: null,
  thumbnailUrl: p?.thumbnail_url || null,
});

const plainText = (html) => (html || "").replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
const wordCount = (html) => (plainText(html).match(/\S+/g) || []).length;

const SECTION_OF = { title: "post", content: "content", thumbnail: "post" };
const ERROR_ORDER = ["title", "thumbnail", "content"];

const PostEditor = ({ post = null }) => {
  const navigate = useNavigate();
  const isEdit = !!post;
  const editorRef = useRef(null);
  const [saved, setSaved] = useState(post);
  const [form, setForm] = useState(() => formFromPost(post));
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const { dirty, markSaved } = useUnsavedChanges(form);

  const editorConfig = useMemo(
    () => ({ readonly: false, placeholder: "Start writing…", height: 520, showXPathInStatusbar: false }),
    []
  );

  const set = (name, value) => {
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((e) => { const n = { ...e }; delete n[name]; return n; });
  };
  const onInput = (e) => set(e.target.name, e.target.value);

  const pickThumbnail = (file) => {
    if (file.size > MAX_THUMB_MB * 1024 * 1024) {
      setErrors((e) => ({ ...e, thumbnail: `That image is larger than ${MAX_THUMB_MB} MB. Pick a smaller one.` }));
      return;
    }
    setErrors((e) => { const n = { ...e }; delete n.thumbnail; return n; });
    setForm((f) => ({ ...f, thumbnail: file, thumbnailPreview: URL.createObjectURL(file) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const latest = editorHtml(editorRef);
    const current = latest !== undefined ? { ...form, content: latest } : form;
    const found = {};
    if (!current.title.trim()) found.title = "Give the post a title.";
    if (!plainText(current.content)) found.content = "Write something before saving.";
    setErrors(found);
    if (Object.keys(found).length) {
      showFirstError(found, ERROR_ORDER);
      return;
    }

    const fd = new FormData();
    fd.append("title", current.title.trim());
    fd.append("content", current.content);
    fd.append("category", current.category);
    current.tags.split(",").map((t) => t.trim()).filter(Boolean).forEach((t) => fd.append("tags[]", t));
    if (current.thumbnail) fd.append("thumbnail", current.thumbnail);
    if (isEdit) {
      fd.append("meta_title", current.meta_title);
      fd.append("meta_description", current.meta_description);
      fd.append("_method", "PUT");
    }

    setSaving(true);
    try {
      const res = await axiosInstance.post(isEdit ? `/posts/${saved.id}` : "/posts", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      markSaved();
      if (isEdit) {
        toast.success("Changes saved");
        setSaved((p) => ({ ...p, title: current.title, category: current.category }));
        if (current.thumbnailPreview) setForm((f) => ({ ...f, thumbnailUrl: f.thumbnailPreview, thumbnail: null, thumbnailPreview: null }));
      } else {
        toast.success("Post published");
        const slug = res.data?.data?.slug;
        navigate(slug ? `/blog/${slug}` : "/blog", { replace: true });
      }
    } catch (err) {
      const apiErrors = err.response?.data?.errors;
      if (apiErrors && typeof apiErrors === "object") {
        const mapped = Object.fromEntries(Object.entries(apiErrors).map(([k, v]) => [k.split(".")[0], Array.isArray(v) ? v[0] : String(v)]));
        setErrors(mapped);
        showFirstError(mapped, ERROR_ORDER);
      }
      toast.error(err.response?.data?.message || "Couldn't save the post. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const discard = async () => {
    if (!(await confirmDialog("Discard your unsaved changes?"))) return;
    setForm(formFromPost(saved));
    setErrors({});
  };

  const words = wordCount(form.content);
  const errorSections = new Set(Object.keys(errors).map((k) => SECTION_OF[k]).filter(Boolean));
  const sections = [
    { id: "post", label: "Title & cover", state: form.title.trim() ? "done" : "empty" },
    { id: "content", label: "Writing", state: words ? "done" : "empty" },
    ...(isEdit ? [{ id: "search", label: "Search appearance", state: "done" }] : []),
  ].map((s) => (errorSections.has(s.id) ? { ...s, state: "error" } : s));

  const url = publicUrl(saved);
  const kind = CATEGORIES.find((c) => c.value === (saved?.category || form.category))?.label || "Post";

  return (
    <EditorPage
      title={isEdit ? saved.title || "Untitled post" : "New post"}
      meta={
        isEdit ? (
          <>
            <span className="ed-status is-live">Published</span>
            <span>{kind}</span>
            <span>{words.toLocaleString()} words</span>
          </>
        ) : (
          <span>A title and some writing are all you need. It goes live when you publish.</span>
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
          saveLabel={isEdit ? "Save changes" : "Publish post"}
          savingLabel={isEdit ? "Saving…" : "Publishing…"}
          cleanText={isEdit ? "All changes saved" : "New post, nothing written yet"}
          dirtyText={isEdit ? "You have unsaved changes" : "Not published yet"}
        />
      }
    >
      <form id={FORM_ID} onSubmit={handleSubmit} noValidate>
        <EditorSection id="post" title="Title & cover" help="How the post shows up in lists and when it's shared.">
          <Field name="title" label="Title" required error={errors.title} labelFor="post-title">
            <Form.Control id="post-title" name="title" value={form.title} onChange={onInput}
              className="post-title-input" placeholder="e.g. Build a line-following robot in one afternoon" />
          </Field>
          <Field name="category" label="Type of post">
            <ChoiceGroup name="category" value={form.category} onChange={(v) => set("category", v)} options={CATEGORIES} />
          </Field>
          <div className="ed-grid">
            <Field name="thumbnail" label="Cover image" error={errors.thumbnail} help={`Landscape, about 1200 × 630. Up to ${MAX_THUMB_MB} MB.`}>
              <ImageDrop
                id="post-thumb"
                hint={`JPG, PNG or WebP, up to ${MAX_THUMB_MB} MB`}
                preview={form.thumbnailPreview}
                currentUrl={form.thumbnailUrl}
                onFile={pickThumbnail}
                onRemove={() => setForm((f) => ({ ...f, thumbnail: null, thumbnailPreview: null }))}
              />
            </Field>
            <Field name="tags" label="Tags" help="Separate with commas. Helps people find related posts.">
              <TagsField value={form.tags} onChange={(v) => set("tags", v)} placeholder="e.g. arduino, sensors, beginner" />
            </Field>
          </div>
        </EditorSection>

        <EditorSection id="content" title="Writing" count={words ? `${words.toLocaleString()} words` : null}
          help="Use headings to break up long posts. Images you paste in are saved with the post.">
          <Field name="content" label="Post" required error={errors.content}>
            <JoditEditor ref={editorRef} value={form.content} config={editorConfig} onBlur={(v) => set("content", v)} />
          </Field>
        </EditorSection>

        {isEdit && (
          <EditorSection id="search" title="Search appearance" optional
            help="How the post looks in Google results. Leave empty to use the title.">
            <div className="ed-serp" aria-hidden="true">
              <span className="ed-serp-title">{form.meta_title || form.title || "Post title"}</span>
              <span className="ed-serp-url">{url || "zantechbd.com"}</span>
              <span className="ed-serp-desc">{form.meta_description || plainText(form.content).slice(0, 155) || "A short description of the post."}</span>
            </div>
            <Field name="meta_title" label="Search title" labelFor="post-meta-title" help={`${form.meta_title.length}/60${form.meta_title.length > 60 ? " · Google may cut off the end" : ""}`}>
              <Form.Control id="post-meta-title" name="meta_title" value={form.meta_title} onChange={onInput} />
            </Field>
            <Field name="meta_description" label="Search description" labelFor="post-meta-desc" help={`${form.meta_description.length}/160${form.meta_description.length > 160 ? " · Google may cut off the end" : ""}`}>
              <Form.Control id="post-meta-desc" as="textarea" rows={3} name="meta_description" value={form.meta_description} onChange={onInput} />
            </Field>
          </EditorSection>
        )}
      </form>
    </EditorPage>
  );
};

export default PostEditor;
