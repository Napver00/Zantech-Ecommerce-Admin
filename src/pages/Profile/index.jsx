import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button, Form, Spinner } from "react-bootstrap";
import { FaEye, FaEyeSlash, FaSignOutAlt } from "react-icons/fa";
import { toast } from "react-hot-toast";
import axiosInstance from "../../config/axios";
import Loading from "../../components/Loading";
import { EditorSection, Field, useUnsavedChanges } from "../../components/Editor/Editor";
import "../../components/Editor/Editor.css";
import useRole, { announceUserChange } from "../../hooks/useRole";
import { ROLES, roleLabel } from "../../config/access";
import { navSectionsFor } from "../../config/navigation";
import { shortDate } from "../../components/List/format";
import confirmDialog from "../../utils/confirmDialog";
import usePageTitle from "../../hooks/usePageTitle";
import "./Profile.css";

const pickDetails = (p) => ({ name: p?.name || "", email: p?.email || "", phone: p?.phone || "", address: p?.address || "" });
const firstError = (err, fallback) => {
  const errors = err.response?.data?.errors;
  if (errors && typeof errors === "object") return Object.values(errors).flat()[0];
  return err.response?.data?.message || fallback;
};

// Rough guide only; the server just needs 8+ characters.
const strengthOf = (pw) => {
  if (!pw) return null;
  let score = 0;
  if (pw.length >= 8) score += 1;
  if (pw.length >= 12) score += 1;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score += 1;
  if (/\d/.test(pw)) score += 1;
  if (/[^A-Za-z0-9]/.test(pw)) score += 1;
  if (pw.length < 8) return { label: "Too short", tone: "bad", width: 20 };
  if (score <= 2) return { label: "Weak", tone: "warn", width: 45 };
  if (score === 3) return { label: "Good", tone: "ok", width: 70 };
  return { label: "Strong", tone: "good", width: 100 };
};

const Profile = () => {
  usePageTitle("Your profile");
  const navigate = useNavigate();
  const role = useRole();
  const [profile, setProfile] = useState(null);
  const [details, setDetails] = useState(pickDetails(null));
  const [detailErrors, setDetailErrors] = useState({});
  const [savingDetails, setSavingDetails] = useState(false);
  const [pw, setPw] = useState({ current_password: "", new_password: "", new_password_confirmation: "" });
  const [pwErrors, setPwErrors] = useState({});
  const [showPw, setShowPw] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const { dirty, markSaved } = useUnsavedChanges(details, !!profile);

  useEffect(() => {
    axiosInstance
      .get("/profile")
      .then((res) => {
        setProfile(res.data?.data);
        setDetails(pickDetails(res.data?.data));
      })
      .catch(() => toast.error("Couldn't load your profile"));
  }, []);

  const sections = useMemo(() => navSectionsFor(role), [role]);

  const setDetail = (e) => {
    const { name, value } = e.target;
    setDetails((d) => ({ ...d, [name]: name === "phone" ? value.replace(/[^\d+]/g, "").slice(0, 14) : value }));
    if (detailErrors[name]) setDetailErrors((x) => ({ ...x, [name]: null }));
  };

  const saveDetails = async (e) => {
    e.preventDefault();
    const found = {};
    if (!details.name.trim()) found.name = "Enter your name.";
    if (!/^\S+@\S+\.\S+$/.test(details.email.trim())) found.email = "Enter a valid email. You sign in with it.";
    setDetailErrors(found);
    if (Object.keys(found).length) return;

    setSavingDetails(true);
    try {
      const payload = Object.fromEntries(Object.entries(details).map(([k, v]) => [k, v.trim()]).filter(([, v]) => v !== ""));
      const res = await axiosInstance.put("/update-user-info", payload);
      const saved = res.data?.data || {};
      setProfile((p) => ({ ...p, ...saved }));
      markSaved();
      // Keep the header's name in step
      try {
        const stored = JSON.parse(localStorage.getItem("user") || "{}");
        localStorage.setItem("user", JSON.stringify({ ...stored, ...pickDetails(saved) }));
        announceUserChange();
      } catch {
        /* storage unavailable */
      }
      toast.success("Your details are saved");
    } catch (err) {
      const errors = err.response?.data?.errors;
      if (errors && typeof errors === "object") {
        setDetailErrors(Object.fromEntries(Object.entries(errors).map(([k, v]) => [k, Array.isArray(v) ? v[0] : String(v)])));
      }
      toast.error(firstError(err, "Couldn't save your details"));
    } finally {
      setSavingDetails(false);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    const found = {};
    if (!pw.current_password) found.current_password = "Enter the password you use now.";
    if (pw.new_password.length < 8) found.new_password = "Use at least 8 characters.";
    else if (pw.new_password === pw.current_password) found.new_password = "Pick a password different from the current one.";
    if (pw.new_password_confirmation !== pw.new_password) found.new_password_confirmation = "The two new passwords don't match.";
    setPwErrors(found);
    if (Object.keys(found).length) return;

    setSavingPw(true);
    try {
      await axiosInstance.post("/change-password", pw);
      setPw({ current_password: "", new_password: "", new_password_confirmation: "" });
      setPwErrors({});
      toast.success("Password changed. Use the new one next time you sign in.");
    } catch (err) {
      const msg = firstError(err, "Couldn't change your password");
      if (/current password/i.test(msg)) setPwErrors({ current_password: "That isn't your current password." });
      toast.error(msg);
    } finally {
      setSavingPw(false);
    }
  };

  const signOutEverywhere = async () => {
    if (!(await confirmDialog("Sign out on every device, including this one? You'll need your password to sign in again."))) return;
    setSigningOut(true);
    try {
      await axiosInstance.post("/logout"); // removes every sign-in token for this account
    } catch {
      /* sign out here anyway */
    }
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    announceUserChange();
    navigate("/login");
  };

  if (!profile) return <Loading />;

  const initials = (profile.name || "?").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  const strength = strengthOf(pw.new_password);
  const pwType = showPw ? "text" : "password";

  return (
    <div className="pf-page">
      <header className="pf-head">
        <span className="pf-avatar" aria-hidden="true">{initials}</span>
        <div className="pf-head-text">
          <h1>{profile.name}</h1>
          <p>
            <span className="pf-role">{roleLabel(role)}</span>
            <span>{profile.email}</span>
            {profile.created_at && <span>Joined {shortDate(profile.created_at)}</span>}
          </p>
        </div>
      </header>

      <div className="pf-body">
        <div className="pf-main">
          <form onSubmit={saveDetails} noValidate>
            <EditorSection id="details" title="Your details" help="Your name shows in the activity log. You sign in with your email.">
              <div className="ed-grid">
                <Field name="name" label="Full name" required error={detailErrors.name} labelFor="pf-name">
                  <Form.Control id="pf-name" name="name" value={details.name} onChange={setDetail} autoComplete="name" />
                </Field>
                <Field name="email" label="Email" required error={detailErrors.email} labelFor="pf-email">
                  <Form.Control id="pf-email" name="email" type="email" value={details.email} onChange={setDetail} autoComplete="email" />
                </Field>
                <Field name="phone" label="Phone" error={detailErrors.phone} labelFor="pf-phone">
                  <Form.Control id="pf-phone" name="phone" type="tel" inputMode="tel" value={details.phone} onChange={setDetail} placeholder="01XXXXXXXXX" />
                </Field>
                <Field name="address" label="Address" error={detailErrors.address} labelFor="pf-address" help="Optional">
                  <Form.Control id="pf-address" name="address" value={details.address} onChange={setDetail} autoComplete="street-address" />
                </Field>
              </div>
              <div className="pf-actions">
                {dirty && (
                  <Button type="button" variant="link" className="ed-discard" onClick={() => { setDetails(pickDetails(profile)); setDetailErrors({}); }}>
                    Undo changes
                  </Button>
                )}
                <Button type="submit" disabled={!dirty || savingDetails}>
                  {savingDetails ? <><Spinner animation="border" size="sm" className="me-2" />Saving…</> : "Save details"}
                </Button>
              </div>
            </EditorSection>
          </form>

          <form onSubmit={changePassword} noValidate>
            <EditorSection id="password" title="Password" help="At least 8 characters. A short sentence is easy to remember and hard to guess.">
              <Field name="current_password" label="Current password" error={pwErrors.current_password} labelFor="pf-pw-current">
                <Form.Control
                  id="pf-pw-current"
                  type={pwType}
                  autoComplete="current-password"
                  value={pw.current_password}
                  onChange={(e) => { setPw((p) => ({ ...p, current_password: e.target.value })); setPwErrors((x) => ({ ...x, current_password: null })); }}
                />
              </Field>
              <div className="ed-grid">
                <Field name="new_password" label="New password" error={pwErrors.new_password} labelFor="pf-pw-new">
                  <Form.Control
                    id="pf-pw-new"
                    type={pwType}
                    autoComplete="new-password"
                    value={pw.new_password}
                    onChange={(e) => { setPw((p) => ({ ...p, new_password: e.target.value })); setPwErrors((x) => ({ ...x, new_password: null })); }}
                  />
                  {strength && (
                    <div className={`pf-strength is-${strength.tone}`} aria-live="polite">
                      <span className="pf-strength-bar"><span style={{ width: `${strength.width}%` }} /></span>
                      <span>{strength.label}</span>
                    </div>
                  )}
                </Field>
                <Field name="new_password_confirmation" label="New password again" error={pwErrors.new_password_confirmation} labelFor="pf-pw-confirm">
                  <Form.Control
                    id="pf-pw-confirm"
                    type={pwType}
                    autoComplete="new-password"
                    value={pw.new_password_confirmation}
                    onChange={(e) => { setPw((p) => ({ ...p, new_password_confirmation: e.target.value })); setPwErrors((x) => ({ ...x, new_password_confirmation: null })); }}
                  />
                </Field>
              </div>
              <div className="pf-actions">
                <Button type="button" variant="link" className="pf-show" onClick={() => setShowPw((s) => !s)} aria-pressed={showPw}>
                  {showPw ? <FaEyeSlash className="me-1" aria-hidden="true" /> : <FaEye className="me-1" aria-hidden="true" />}
                  {showPw ? "Hide passwords" : "Show passwords"}
                </Button>
                <Button type="submit" disabled={savingPw || !pw.current_password || !pw.new_password}>
                  {savingPw ? <><Spinner animation="border" size="sm" className="me-2" />Changing…</> : "Change password"}
                </Button>
              </div>
            </EditorSection>
          </form>
        </div>

        <aside className="pf-side">
          <section className="pf-card" aria-labelledby="pf-access-title">
            <h2 id="pf-access-title">What you can use</h2>
            <p className="pf-card-text">{ROLES[role]?.hint || "Your role decides which sections you see."}</p>
            <ul className="pf-access">
              {sections.map((s) => (
                <li key={s.key}>
                  <span className="pf-access-group">{s.title}</span>
                  <span className="pf-access-links">
                    {s.items.map((item) => (
                      <Link key={item.label} to={item.path || item.subItems?.[0]?.path}>{item.label}</Link>
                    ))}
                  </span>
                </li>
              ))}
            </ul>
            {role !== "admin" && <p className="pf-card-text mb-0">Need something else? An admin can change your role on the Staff page.</p>}
          </section>

          <section className="pf-card" aria-labelledby="pf-signout-title">
            <h2 id="pf-signout-title">Signed-in devices</h2>
            <p className="pf-card-text">Lost a phone or used a shared computer? Sign out everywhere and sign back in here.</p>
            <Button variant="outline-danger" size="sm" onClick={signOutEverywhere} disabled={signingOut}>
              <FaSignOutAlt className="me-2" aria-hidden="true" />Sign out on all devices
            </Button>
          </section>
        </aside>
      </div>
    </div>
  );
};

export default Profile;
