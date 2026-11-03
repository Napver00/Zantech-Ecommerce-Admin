import React, { useEffect, useMemo, useState } from "react";
import { FaTrash, FaEnvelope, FaCopy } from "react-icons/fa";
import { toast } from "react-hot-toast";
import { Button, Offcanvas } from "react-bootstrap";
import axiosInstance from "../../config/axios";
import usePageTitle from "../../hooks/usePageTitle";
import CommonTable from "../../components/Common/CommonTable";
import { ListHeader, ListCard, ListToolbar, SearchBox, ResultCount, Pager } from "../../components/List/List";
import { timeAgo, fullDate } from "../../components/List/format";
import confirmDialog from "../../utils/confirmDialog";
import "../../components/List/List.css";
import "./Contact.css";

const PER_PAGE_DEFAULT = 20;

// The website's form sends first and last name, email, a short subject (project_type) and the message.
const fullName = (c) => [c.f_name, c.l_name].filter(Boolean).join(" ") || c.email || "Someone";

const Contact = () => {
  usePageTitle("Contacts");
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(PER_PAGE_DEFAULT);
  const [open, setOpen] = useState(null);

  useEffect(() => {
    axiosInstance
      .get("/contact")
      .then((res) => setContacts(res.data?.data || []))
      .catch((err) => toast.error(err.response?.data?.message || "Couldn't load messages"))
      .finally(() => setLoading(false));
  }, []);

  // All messages come in one go, so search and paging happen here.
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return contacts;
    return contacts.filter((c) =>
      [fullName(c), c.email, c.project_type, c.message].some((v) => String(v || "").toLowerCase().includes(q))
    );
  }, [contacts, search]);

  const lastPage = Math.max(1, Math.ceil(filtered.length / perPage));
  const current = Math.min(page, lastPage);
  const rows = filtered.slice((current - 1) * perPage, current * perPage);

  const remove = async (c) => {
    if (!(await confirmDialog(`Delete the message from ${fullName(c)}? This can't be undone.`))) return;
    try {
      await axiosInstance.delete(`/contact/${c.id}`);
      setContacts((list) => list.filter((x) => x.id !== c.id));
      if (open?.id === c.id) setOpen(null);
      toast.success("Message deleted");
    } catch (err) {
      toast.error(err.response?.data?.message || "Couldn't delete the message");
    }
  };

  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied");
    } catch {
      toast.error("Couldn't copy. Select the text instead.");
    }
  };

  const headers = [
    {
      key: "name",
      label: "From",
      render: (row) => (
        <>
          <span className="ls-cell-main">{fullName(row)}</span>
          <span className="ls-cell-sub text-truncate d-block" style={{ maxWidth: 240 }}>{row.email}</span>
        </>
      ),
    },
    {
      key: "message",
      label: "Message",
      render: (row) => (
        <>
          {row.project_type && <span className="ct-subject">{row.project_type}</span>}
          <span className="ct-preview">{row.message}</span>
        </>
      ),
    },
    {
      key: "created_at",
      label: "Received",
      nowrap: true,
      render: (row) => <span className="ls-cell-sub" title={fullDate(row.created_at)}>{timeAgo(row.created_at)}</span>,
    },
  ];

  const renderActions = (c) => (
    <Button variant="outline-danger" size="sm" onClick={() => remove(c)} title="Delete" aria-label={`Delete the message from ${fullName(c)}`}>
      <FaTrash />
    </Button>
  );

  const replySubject = open?.project_type ? `Re: ${open.project_type}` : "Re: your message to ZAN Tech";
  const replyBody = `Hi ${open?.f_name || ""},\n\n`;

  return (
    <div className="contacts-page">
      <ListHeader title="Contacts" subtitle="Messages from the contact form on zantechbd.com. Open one to read it in full and reply." />

      <ListCard>
        <ListToolbar end={<ResultCount page={current} perPage={perPage} total={filtered.length} noun="messages" />}>
          <SearchBox
            value={search}
            onChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            placeholder="Search names, emails, subjects or text"
          />
        </ListToolbar>

        <CommonTable
          headers={headers}
          data={rows}
          tableLoading={loading}
          loading={loading}
          renderActions={renderActions}
          onRowClick={setOpen}
          rowLabel={(row) => `Read the message from ${fullName(row)}`}
          emptyTitle={search ? "No messages match" : "No messages yet"}
          emptyText={search ? `Nothing matches “${search}”.` : "When someone uses the contact form, their message lands here."}
        />

        <Pager
          page={current}
          lastPage={lastPage}
          onPage={setPage}
          perPage={perPage}
          onPerPage={(n) => {
            setPerPage(n);
            setPage(1);
          }}
        />
      </ListCard>

      <Offcanvas show={!!open} onHide={() => setOpen(null)} placement="end" className="ct-panel">
        {open && (
          <>
            <Offcanvas.Header closeButton>
              <Offcanvas.Title as="h2" className="h5 mb-0">{fullName(open)}</Offcanvas.Title>
            </Offcanvas.Header>
            <Offcanvas.Body>
              {open.project_type && <p className="ct-subject is-large">{open.project_type}</p>}
              <p className="ct-when">Sent {fullDate(open.created_at)}</p>

              {open.email && (
                <div className="ct-actions">
                  <a className="btn btn-primary" href={`mailto:${open.email}?subject=${encodeURIComponent(replySubject)}&body=${encodeURIComponent(replyBody)}`}>
                    <FaEnvelope className="me-2" aria-hidden="true" />Reply by email
                  </a>
                </div>
              )}

              <div className="ct-message">{open.message}</div>

              {open.email && (
                <dl className="ct-details">
                  <div>
                    <dt>Email</dt>
                    <dd>
                      <span>{open.email}</span>
                      <button type="button" onClick={() => copy(open.email)} aria-label="Copy email" title="Copy">
                        <FaCopy aria-hidden="true" />
                      </button>
                    </dd>
                  </div>
                </dl>
              )}

              <Button variant="link" className="ct-delete" onClick={() => remove(open)}>
                <FaTrash className="me-2" aria-hidden="true" />Delete message
              </Button>
            </Offcanvas.Body>
          </>
        )}
      </Offcanvas>
    </div>
  );
};

export default Contact;
