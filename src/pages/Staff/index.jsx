import React, { useEffect, useMemo, useState } from "react";
import { FaPlus, FaTrash, FaUserShield } from "react-icons/fa";
import { toast } from "react-hot-toast";
import { Button, Form, Modal, Row, Col } from "react-bootstrap";
import axiosInstance from "../../config/axios";
import usePageTitle from "../../hooks/usePageTitle";
import CommonTable from "../../components/Common/CommonTable";
import { ListHeader, ListCard, ListToolbar, SearchBox, ResultCount, FilterTabs, Pill } from "../../components/List/List";
import "../../components/Editor/Editor.css";
import "../../components/List/List.css";
import confirmDialog from "../../utils/confirmDialog";
import { ROLES, ASSIGNABLE_ROLES, roleLabel, rolesOf, rolesOfUser, primaryRole } from "../../config/access";
import { navSectionsFor } from "../../config/navigation";

// Roles offered in the pickers. "member" is an old role: shown only for people who still have it.
const PICKABLE = ["stuff", "course_manager", "content_manager", "inventory_manager", "admin"];
const EMPTY = { name: "", email: "", phone: "", password: "", address: "", roles: ["stuff"] };

const myId = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}").id;
  } catch {
    return null;
  }
};

/** What a set of roles opens in the admin, as section names. */
const sectionsFor = (roles) => navSectionsFor(roles).map((s) => s.title);

/**
 * Tick any number of roles. Admin already covers everything, so the others
 * are greyed out while it is ticked.
 */
const RolePicker = ({ value, onChange, idPrefix, extra = [] }) => {
  const options = [...PICKABLE, ...extra.filter((r) => !PICKABLE.includes(r))];
  const isAdmin = value.includes("admin");
  const toggle = (r) => onChange(value.includes(r) ? value.filter((x) => x !== r) : rolesOf([...value, r]));
  const sees = sectionsFor(value);
  return (
    <>
      <div className="ed-choices staff-role-picks" role="group" aria-label="Roles">
        {options.map((r) => {
          const on = value.includes(r);
          const covered = isAdmin && r !== "admin";
          return (
            <label key={r} className={`ed-choice ${on && !covered ? "is-selected" : ""} ${covered ? "is-covered" : ""}`} htmlFor={`${idPrefix}-${r}`}>
              <input type="checkbox" id={`${idPrefix}-${r}`} checked={on || covered} disabled={covered} onChange={() => toggle(r)} />
              <span className="ed-choice-text">
                <strong>{ROLES[r].label}</strong>
                <small>{covered ? "Included with Admin" : ROLES[r].hint}</small>
              </span>
            </label>
          );
        })}
      </div>
      <p className="staff-sees" aria-live="polite">
        {value.length === 0 ? (
          <span className="text-danger">Pick at least one role.</span>
        ) : (
          <>
            <strong>They will see:</strong> {sees.length ? sees.join(", ") : "only their profile"}.
          </>
        )}
      </p>
    </>
  );
};

const Staff = () => {
  usePageTitle("Staff");
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState({});
  const [editing, setEditing] = useState(null); // staff member whose roles are being changed
  const [editRoles, setEditRoles] = useState([]);
  const me = myId();

  const load = async () => {
    try {
      const res = await axiosInstance.get("/stuff");
      setStaff((res.data?.data || []).map((s) => ({ ...s, roles: rolesOfUser(s) })));
    } catch (err) {
      // The API answers 404 when there are no staff yet
      if (err.response?.status !== 404) toast.error(err.response?.data?.message || "Couldn't load staff");
      setStaff([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // A handful of people, so search and the role filter run here. Admins count under every role.
  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    return staff.filter(
      (s) =>
        (!roleFilter || s.roles.includes(roleFilter)) &&
        (!q || [s.name, s.email, s.phone].some((v) => String(v || "").toLowerCase().includes(q)))
    );
  }, [staff, search, roleFilter]);

  const counts = useMemo(
    () => staff.reduce((c, s) => { s.roles.forEach((r) => { c[r] = (c[r] || 0) + 1; }); return c; }, {}),
    [staff]
  );
  const tabs = [
    { value: "", label: "Everyone", count: staff.length },
    ...ASSIGNABLE_ROLES.filter((r) => counts[r] || r !== "member").map((r) => ({ value: r, label: ROLES[r].label, count: counts[r] || 0 })),
  ];

  const openEdit = (s) => {
    setEditing(s);
    setEditRoles(s.roles);
  };

  const saveRoles = async (e) => {
    e.preventDefault();
    const roles = rolesOf(editRoles.includes("admin") ? ["admin"] : editRoles);
    if (!roles.length) return;
    const s = editing;
    if (roles.join() === s.roles.join()) {
      setEditing(null);
      return;
    }
    setBusy((b) => ({ ...b, [s.id]: true }));
    try {
      await axiosInstance.put(`/stuff/role/${s.id}`, { roles });
      const main = primaryRole(roles);
      setStaff((list) => list.map((x) => (x.id === s.id ? { ...x, roles, role: main, type: main } : x)));
      toast.success(`${s.name} is now ${roleLabel(roles)}`);
      setEditing(null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Couldn't change the roles");
    } finally {
      setBusy((b) => ({ ...b, [s.id]: false }));
    }
  };

  const toggleStatus = async (s) => {
    setBusy((b) => ({ ...b, [s.id]: true }));
    try {
      await axiosInstance.patch(`/users/toggle-status/${s.id}`);
      setStaff((list) => list.map((x) => (x.id === s.id ? { ...x, status: x.status === 1 ? 0 : 1 } : x)));
    } catch (err) {
      toast.error(err.response?.data?.message || "Couldn't change that");
    } finally {
      setBusy((b) => ({ ...b, [s.id]: false }));
    }
  };

  const remove = async (s) => {
    if (!(await confirmDialog(`Delete ${s.name}'s staff account? They can no longer sign in to the admin.`))) return;
    try {
      await axiosInstance.delete(`/stuff/delete/${s.id}`);
      setStaff((list) => list.filter((x) => x.id !== s.id));
      toast.success("Staff account deleted");
    } catch (err) {
      toast.error(err.response?.data?.message || "Couldn't delete the account");
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    const roles = rolesOf(form.roles.includes("admin") ? ["admin"] : form.roles);
    if (!roles.length) {
      toast.error("Pick at least one role");
      return;
    }
    setSaving(true);
    try {
      const { roles: _picked, ...rest } = form;
      await axiosInstance.post("/register", { ...rest, type: primaryRole(roles), roles });
      toast.success(`${form.name} added as ${roleLabel(roles)}`);
      setShowModal(false);
      setForm(EMPTY);
      load();
    } catch (err) {
      const errors = err.response?.data?.errors;
      toast.error(
        errors && typeof errors === "object"
          ? Object.values(errors).flat().join(" ")
          : err.response?.data?.message || "Couldn't add the staff member"
      );
    } finally {
      setSaving(false);
    }
  };

  const headers = [
    {
      key: "name",
      label: "Person",
      render: (row) => (
        <>
          <span className="ls-cell-main">{row.name}{row.id === me && <span className="ls-cell-sub d-inline ms-2">(you)</span>}</span>
          <span className="ls-cell-sub">{row.email}{row.phone ? ` · ${row.phone}` : ""}</span>
        </>
      ),
    },
    {
      key: "roles",
      label: "Roles",
      render: (row) => (
        <div className="staff-role-cell">
          <span className="staff-role-pills">
            {(row.roles.includes("admin") ? ["admin"] : row.roles).map((r) => (
              <Pill key={r} tone={r === "admin" ? "info" : "muted"}>{ROLES[r].label}</Pill>
            ))}
          </span>
          <Button
            size="sm"
            variant="link"
            className="staff-role-edit"
            disabled={row.id === me || !!busy[row.id]}
            onClick={() => openEdit(row)}
            title={row.id === me ? "Another admin has to change your roles" : undefined}
            aria-label={`Change roles of ${row.name}`}
          >
            Change
          </Button>
        </div>
      ),
    },
    {
      key: "status",
      label: "Can sign in",
      render: (row) =>
        row.id === me ? (
          <Pill tone="good">Active</Pill>
        ) : (
          <Form.Check
            type="switch"
            id={`staff-active-${row.id}`}
            checked={row.status === 1}
            disabled={!!busy[row.id]}
            onChange={() => toggleStatus(row)}
            label={<span className="small text-muted">{row.status === 1 ? "Active" : "Turned off"}</span>}
          />
        ),
    },
  ];

  const renderActions = (row) =>
    row.id === me ? null : (
      <Button variant="outline-danger" size="sm" onClick={() => remove(row)} title="Delete" aria-label={`Delete ${row.name}`}>
        <FaTrash />
      </Button>
    );

  return (
    <div className="staff-page">
      <ListHeader
        title="Staff"
        subtitle="Who can sign in to this admin, and what each person can use. One person can have several roles."
        actions={<Button onClick={() => { setForm(EMPTY); setShowModal(true); }}><FaPlus className="me-2" aria-hidden="true" />Add staff</Button>}
      />

      <dl className="staff-roles">
        {["admin", "stuff", "course_manager", "content_manager", "inventory_manager"].map((r) => (
          <div key={r}>
            <dt>{ROLES[r].label}</dt>
            <dd>{ROLES[r].hint}</dd>
          </div>
        ))}
      </dl>

      <ListCard>
        <FilterTabs label="Filter staff by role" value={roleFilter} onChange={setRoleFilter} tabs={tabs} />
        <ListToolbar end={<ResultCount total={shown.length} perPage={Math.max(1, shown.length)} noun="people" />}>
          <SearchBox value={search} onChange={setSearch} placeholder="Search by name, email or phone" />
        </ListToolbar>
        <CommonTable
          headers={headers}
          data={shown}
          tableLoading={loading}
          loading={loading}
          renderActions={renderActions}
          emptyTitle={search || roleFilter ? "Nobody matches" : "No staff yet"}
          emptyText={search || roleFilter ? "Try another name or role." : "Add the people who run the store, courses and website."}
        />
      </ListCard>

      {/* Change someone's roles */}
      <Modal show={!!editing} onHide={() => !busy[editing?.id] && setEditing(null)} centered size="lg">
        {editing && (
          <Form onSubmit={saveRoles}>
            <Modal.Header closeButton>
              <Modal.Title as="h2" className="h5 mb-0"><FaUserShield className="me-2 text-muted" aria-hidden="true" />Roles for {editing.name}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <p className="text-muted small mb-3">Tick every part of the work they do. Changes apply on their next click; no need to sign out.</p>
              <RolePicker value={editRoles} onChange={setEditRoles} idPrefix={`edit-${editing.id}`} extra={editing.roles} />
            </Modal.Body>
            <Modal.Footer>
              <Button variant="outline-secondary" onClick={() => setEditing(null)} disabled={!!busy[editing.id]}>Cancel</Button>
              <Button type="submit" disabled={!!busy[editing.id] || !editRoles.length}>{busy[editing.id] ? "Saving…" : "Save roles"}</Button>
            </Modal.Footer>
          </Form>
        )}
      </Modal>

      {/* Add someone */}
      <Modal show={showModal} onHide={() => !saving && setShowModal(false)} centered size="lg">
        <Form onSubmit={submit}>
          <Modal.Header closeButton>
            <Modal.Title as="h2" className="h5 mb-0">Add staff</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Roles <span className="text-muted fw-normal">(pick one or more)</span></Form.Label>
              <RolePicker value={form.roles} onChange={(roles) => setForm((f) => ({ ...f, roles }))} idPrefix="new-staff" />
            </Form.Group>
            <Row className="g-3">
              <Col sm={6}>
                <Form.Group controlId="staff-name">
                  <Form.Label>Full name</Form.Label>
                  <Form.Control value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
                </Form.Group>
              </Col>
              <Col sm={6}>
                <Form.Group controlId="staff-phone">
                  <Form.Label>Phone</Form.Label>
                  <Form.Control
                    type="tel"
                    inputMode="numeric"
                    placeholder="01XXXXXXXXX"
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value.replace(/\D/g, "").slice(0, 11) }))}
                    required
                    pattern="[0-9]{11}"
                    title="11 digits, for example 01712345678"
                  />
                </Form.Group>
              </Col>
              <Col sm={6}>
                <Form.Group controlId="staff-email">
                  <Form.Label>Email (they sign in with this)</Form.Label>
                  <Form.Control type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} required />
                </Form.Group>
              </Col>
              <Col sm={6}>
                <Form.Group controlId="staff-password">
                  <Form.Label>Password</Form.Label>
                  <Form.Control
                    type="password"
                    autoComplete="new-password"
                    value={form.password}
                    onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                    required
                    minLength={8}
                  />
                  <Form.Text>At least 8 characters. Share it with them privately.</Form.Text>
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" onClick={() => setShowModal(false)} disabled={saving}>Cancel</Button>
            <Button type="submit" disabled={saving || !form.roles.length}>{saving ? "Adding…" : "Add staff"}</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default Staff;
