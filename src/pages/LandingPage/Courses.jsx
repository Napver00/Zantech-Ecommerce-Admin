import React, { useCallback, useEffect, useState } from "react";
import { FaPlus, FaTrash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { Button, Form } from "react-bootstrap";
import axiosInstance from "../../config/axios";
import CommonTable from "../../components/Common/CommonTable";
import { ListCard, ListToolbar, SearchBox, ResultCount, Pager, Pill } from "../../components/List/List";
import { taka, shortDate } from "../../components/List/format";
import confirmDialog from "../../utils/confirmDialog";

const Courses = ({ kind = "course" }) => {
  const isBootcamp = kind === "bootcamp";
  const noun = isBootcamp ? "bootcamp" : "course";
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [pagination, setPagination] = useState({ total_rows: 0, total_pages: 1 });
  const [busy, setBusy] = useState({});

  // Wait for a pause in typing before searching.
  useEffect(() => {
    const t = setTimeout(() => {
      setQuery(search.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit, kind, ...(query && { title: query }) };
      const res = await axiosInstance.get("/courses", { params });
      const raw = Array.isArray(res.data?.data) ? res.data.data : res.data?.data ? [res.data.data] : [];
      setCourses(raw);
      setPagination(res.data?.pagination || { total_rows: raw.length, total_pages: 1 });
    } catch (err) {
      toast.error(err.response?.data?.message || `Couldn't load ${noun}s`);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  }, [page, limit, kind, query, noun]);

  useEffect(() => {
    load();
  }, [load]);

  const open = (c) => navigate(`/landing/courses/${c.slug}`);
  const addNew = () => navigate(`/landing/courses/add${isBootcamp ? "?kind=bootcamp" : ""}`);

  const togglePublished = async (c) => {
    const next = c.status === "published" ? "draft" : "published";
    setBusy((b) => ({ ...b, [c.id]: true }));
    setCourses((list) => list.map((x) => (x.id === c.id ? { ...x, status: next } : x)));
    try {
      await axiosInstance.patch(`/courses/status/${c.id}`);
      toast.success(next === "published" ? `${c.title} is on the website` : `${c.title} is now a draft`);
    } catch (err) {
      setCourses((list) => list.map((x) => (x.id === c.id ? { ...x, status: c.status } : x)));
      toast.error(err.response?.data?.message || "Couldn't change that. Try again.");
    } finally {
      setBusy((b) => ({ ...b, [c.id]: false }));
    }
  };

  const remove = async (c) => {
    if (!(await confirmDialog(`Delete “${c.title}”? Its curriculum, schedules, mentors and photos go too.`))) return;
    try {
      await axiosInstance.delete(`/courses/${c.id}`);
      toast.success(`${isBootcamp ? "Bootcamp" : "Course"} deleted`);
      if (courses.length === 1 && page > 1) setPage(page - 1);
      else load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Couldn't delete it");
    }
  };

  const today = new Date(new Date().toDateString());

  const headers = [
    {
      key: "title",
      label: isBootcamp ? "Bootcamp" : "Course",
      render: (row) => (
        <div className="ls-with-thumb">
          {row.thumbnail ? <img src={row.thumbnail} alt="" className="ls-thumb" loading="lazy" /> : <span className="ls-thumb is-empty">No photo</span>}
          <span className="min-w-0">
            <span className="ls-cell-main text-truncate d-block" style={{ maxWidth: 320 }} title={row.title}>{row.title}</span>
            <span className="ls-cell-sub">
              {[row.category, row.payment_type === "monthly" ? "Monthly" : "One-time payment"].filter(Boolean).join(" · ")}
            </span>
          </span>
        </div>
      ),
    },
    ...(isBootcamp
      ? [
          {
            key: "start_date",
            label: "When",
            render: (row) => {
              if (!row.start_date) return <span className="ls-cell-sub">No date set</span>;
              const ended = row.end_date && new Date(row.end_date) < today;
              return (
                <>
                  <span className="d-block">
                    {shortDate(row.start_date)}
                    {row.end_date && row.end_date !== row.start_date ? ` – ${shortDate(row.end_date)}` : ""}
                  </span>
                  {ended && <Pill tone="muted">Ended</Pill>}
                </>
              );
            },
          },
          {
            key: "seats",
            label: "Seats",
            nowrap: true,
            render: (row) => {
              const taken = Number(row.seats_taken) || 0;
              if (!row.seats) return <span>{taken} registered</span>;
              const full = taken >= Number(row.seats);
              return full ? <Pill tone="bad">Full · {taken}/{row.seats}</Pill> : <span>{taken} of {row.seats}</span>;
            },
          },
        ]
      : []),
    {
      key: "price",
      label: "Price",
      align: "end",
      nowrap: true,
      render: (row) => {
        const real = row.discount_price ?? row.price;
        const struck = row.price != null && row.discount_price != null && Number(row.discount_price) < Number(row.price);
        const monthly = row.payment_type === "monthly";
        return (
          <>
            <span className="ls-money d-block">
              {monthly && row.monthly_fee != null ? `${taka(row.monthly_fee)}/mo` : real != null ? taka(real) : "—"}
            </span>
            {monthly && row.duration_months ? (
              <span className="ls-cell-sub">{row.duration_months} months</span>
            ) : struck ? (
              <span className="ls-cell-sub"><s>{taka(row.price)}</s></span>
            ) : null}
            {Number(row.admission_fee) > 0 && (
              <span className="ls-cell-sub d-block">+ {taka(row.admission_fee)} {row.admission_fee_label || "admission"}</span>
            )}
          </>
        );
      },
    },
    {
      key: "status",
      label: "On website",
      render: (row) => (
        <Form.Check
          type="switch"
          id={`${kind}-published-${row.id}`}
          checked={row.status === "published"}
          disabled={!!busy[row.id]}
          onChange={() => togglePublished(row)}
          label={<span className="small text-muted">{row.status === "published" ? "Published" : "Draft"}</span>}
          aria-label={`Publish ${row.title}`}
        />
      ),
    },
  ];

  const renderActions = (row) => (
    <Button variant="outline-danger" size="sm" onClick={() => remove(row)} title="Delete" aria-label={`Delete ${row.title}`}>
      <FaTrash />
    </Button>
  );

  return (
    <ListCard>
      <ListToolbar
        end={
          <>
            <ResultCount page={page} perPage={limit} total={pagination.total_rows} noun={`${noun}s`} />
            <Button size="sm" onClick={addNew}>
              <FaPlus className="me-1" aria-hidden="true" />New {noun}
            </Button>
          </>
        }
      >
        <SearchBox value={search} onChange={setSearch} placeholder={`Search ${noun}s by title`} busy={loading && !!search} />
      </ListToolbar>

      <CommonTable
        headers={headers}
        data={courses}
        tableLoading={loading}
        loading={loading}
        renderActions={renderActions}
        onRowClick={open}
        rowLabel={(row) => `Edit ${row.title}`}
        emptyTitle={query ? `No ${noun}s match` : `No ${noun}s yet`}
        emptyText={query ? `Nothing matches “${query}”.` : isBootcamp ? "Add a bootcamp with its dates and seats to take registrations." : "Add a course to list it on the website."}
        emptyAction={!query && <Button size="sm" onClick={addNew}><FaPlus className="me-1" aria-hidden="true" /> New {noun}</Button>}
      />

      <Pager
        page={page}
        lastPage={pagination.total_pages || 1}
        onPage={setPage}
        perPage={limit}
        onPerPage={(n) => {
          setLimit(n);
          setPage(1);
        }}
      />
    </ListCard>
  );
};

export default Courses;
