import React, { useEffect, useState } from "react";
import { Form } from "react-bootstrap";
import { toast } from "react-hot-toast";
import { FaFacebook, FaGlobe, FaInstagram, FaLinkedin, FaTiktok, FaYoutube } from "react-icons/fa";
import axiosInstance from "../../config/axios";
import confirmDialog from "../../utils/confirmDialog";
import { EditorSection, Field, SaveBar, useUnsavedChanges, showFirstError } from "../../components/Editor/Editor";
import "../../components/Editor/Editor.css";

const FORM_ID = "company-form";
const FIELDS = [
  "name", "email", "phone", "location",
  "hero_title", "hero_subtitle", "hero_description",
  "about_title", "about_description1", "about_description2",
  "footer_text",
];

const SOCIAL_ICONS = { facebook: FaFacebook, linkedin: FaLinkedin, instagram: FaInstagram, youtube: FaYoutube, tiktok: FaTiktok };

const pick = (data) => Object.fromEntries(FIELDS.map((k) => [k, data?.[k] ?? ""]));

const CompanyInfo = () => {
  const [company, setCompany] = useState(null);
  const [form, setForm] = useState(pick(null));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const { dirty, markSaved } = useUnsavedChanges(form, !loading);

  useEffect(() => {
    axiosInstance
      .get("/company")
      .then((res) => {
        setCompany(res.data?.data);
        setForm(pick(res.data?.data));
      })
      .catch(() => toast.error("Couldn't load the company details"))
      .finally(() => setLoading(false));
  }, []);

  const set = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((x) => { const n = { ...x }; delete n[name]; return n; });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const found = {};
    if (!form.name.trim()) found.name = "Enter the company name.";
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email.trim())) found.email = "That doesn't look like an email address.";
    setErrors(found);
    if (Object.keys(found).length) {
      showFirstError(found, ["name", "email"]);
      return;
    }

    setSaving(true);
    try {
      await axiosInstance.put(`/company/${company?.id || 1}`, form);
      markSaved();
      toast.success("Website details saved");
    } catch (err) {
      const apiErrors = err.response?.data?.errors;
      if (apiErrors && typeof apiErrors === "object") {
        const mapped = Object.fromEntries(Object.entries(apiErrors).map(([k, v]) => [k, Array.isArray(v) ? v[0] : String(v)]));
        setErrors(mapped);
        showFirstError(mapped, FIELDS);
      }
      toast.error(err.response?.data?.message || "Couldn't save. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const discard = async () => {
    if (!(await confirmDialog("Discard your unsaved changes?"))) return;
    setForm(pick(company));
    setErrors({});
  };

  if (loading) {
    return (
      <div className="ed-section p-4 text-muted" aria-busy="true">Loading company details…</div>
    );
  }

  const text = (name, label, { rows, help, placeholder, required, type } = {}) => (
    <Field name={name} label={label} help={help} error={errors[name]} required={required} labelFor={`company-${name}`}>
      <Form.Control
        id={`company-${name}`}
        name={name}
        type={type}
        as={rows ? "textarea" : undefined}
        rows={rows}
        value={form[name]}
        onChange={set}
        placeholder={placeholder}
      />
    </Field>
  );

  return (
    <>
      <form id={FORM_ID} onSubmit={handleSubmit} noValidate>
        <EditorSection id="hero" title="Top of the homepage" help="The first thing visitors read on zantechbd.com.">
          {text("hero_title", "Headline", { placeholder: "e.g. Robotics and IoT for every student" })}
          {text("hero_subtitle", "Subheading")}
          {text("hero_description", "Intro paragraph", { rows: 3 })}
        </EditorSection>

        <EditorSection id="about" title="About section">
          {text("about_title", "Heading")}
          <div className="ed-grid">
            {text("about_description1", "First paragraph", { rows: 5 })}
            {text("about_description2", "Second paragraph", { rows: 5 })}
          </div>
        </EditorSection>

        <EditorSection id="contact" title="Contact details" help="Shown in the contact section and footer.">
          <div className="ed-grid">
            {text("name", "Company name", { required: true })}
            {text("email", "Email", { type: "email" })}
            {text("phone", "Phone", { type: "tel" })}
            {text("location", "Address")}
          </div>
          {text("footer_text", "Footer line", { help: "The small line at the very bottom, e.g. copyright." })}
        </EditorSection>

        {company?.social_links?.length > 0 && (
          <EditorSection id="social" title="Social media" help="These links are set up on the server and can't be changed here yet.">
            <ul className="lp-socials">
              {company.social_links.map((l) => {
                const Icon = SOCIAL_ICONS[String(l.platform).toLowerCase()] || FaGlobe;
                return (
                  <li key={l.id}>
                    <a href={l.url} target="_blank" rel="noreferrer">
                      <Icon aria-hidden="true" />{l.platform}
                    </a>
                  </li>
                );
              })}
            </ul>
          </EditorSection>
        )}
      </form>

      <SaveBar
        formId={FORM_ID}
        dirty={dirty}
        saving={saving}
        errorCount={Object.keys(errors).length}
        onShowErrors={() => showFirstError(errors, FIELDS)}
        onDiscard={discard}
        cleanText="Website details are up to date"
      />
    </>
  );
};

export default CompanyInfo;
