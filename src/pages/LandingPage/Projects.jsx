import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Form } from "react-bootstrap";
import { toast } from "react-hot-toast";
import { FaPlus, FaTrash, FaPen } from "react-icons/fa";
import axiosInstance from "../../config/axios";
import confirmDialog from "../../utils/confirmDialog";
import { ListCard, ListToolbar, ResultCount, Pager } from "../../components/List/List";

const Projects = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(12);
  const [pagination, setPagination] = useState({ total_rows: 0, total_pages: 1 });
  const [busy, setBusy] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/projects", { params: { page, limit } });
      const list = res.data?.data || [];
      setProjects(list);
      setPagination(res.data?.pagination || { total_rows: list.length, total_pages: 1 });
    } catch {
      toast.error("Couldn't load projects");
    } finally {
      setLoading(false);
    }
  }, [page, limit]);

  useEffect(() => {
    load();
  }, [load]);

  const open = (p) => navigate(`/landing/projects/${p.slug}`);

  const toggleShown = async (p) => {
    const next = p.status === "active" ? "inactive" : "active";
    setBusy((b) => ({ ...b, [p.id]: true }));
    setProjects((list) => list.map((x) => (x.id === p.id ? { ...x, status: next } : x)));
    try {
      await axiosInstance.post(`/projects/${p.id}`, { status: next });
      toast.success(next === "active" ? `${p.title} is on the website` : `${p.title} is hidden`);
    } catch {
      setProjects((list) => list.map((x) => (x.id === p.id ? { ...x, status: p.status } : x)));
      toast.error("Couldn't change that. Try again.");
    } finally {
      setBusy((b) => ({ ...b, [p.id]: false }));
    }
  };

  const remove = async (p) => {
    if (!(await confirmDialog(`Delete “${p.title}”? It's removed from the website and can't be brought back.`))) return;
    try {
      await axiosInstance.delete(`/projects/${p.id}`);
      toast.success("Project deleted");
      if (projects.length === 1 && page > 1) setPage(page - 1);
      else load();
    } catch {
      toast.error("Couldn't delete the project");
    }
  };

  const newButton = (
    <Button size="sm" onClick={() => navigate("/landing/projects/add")}>
      <FaPlus className="me-1" aria-hidden="true" />New project
    </Button>
  );

  return (
    <ListCard>
      <ListToolbar end={newButton}>
        <ResultCount page={page} perPage={limit} total={pagination.total_rows} noun="projects" />
      </ListToolbar>

      {loading && !projects.length ? (
        <div className="lp-grid" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <div key={i} className="lp-card table-skeleton">
              <span className="skeleton-line" style={{ height: 140, borderRadius: 0 }} />
              <div className="lp-card-body">
                <span className="skeleton-line" style={{ width: "70%" }} />
                <span className="skeleton-line mt-2" style={{ width: "90%" }} />
              </div>
            </div>
          ))}
        </div>
      ) : !projects.length ? (
        <div className="empty-state">
          <p className="empty-state-title">No projects yet</p>
          <p className="empty-state-text">Add work you've done to show it in the portfolio on the website.</p>
          {newButton}
        </div>
      ) : (
        <ul className="lp-grid list-unstyled mb-0">
          {projects.map((p) => {
            const shown = p.status === "active";
            return (
              <li key={p.id} className={`lp-card ${shown ? "" : "is-hidden"}`}>
                <button type="button" className="lp-card-img" onClick={() => open(p)} tabIndex={-1} aria-hidden="true">
                  {p.image_url ? <img src={p.image_url} alt="" loading="lazy" /> : <span className="lp-noimg">No cover image</span>}
                </button>
                <div className="lp-card-body">
                  <button type="button" className="lp-card-title" onClick={() => open(p)}>{p.title}</button>
                  {p.description && <p className="lp-card-desc">{p.description}</p>}
                  {p.technologies?.length > 0 && (
                    <div className="lp-tags">
                      {p.technologies.slice(0, 4).map((t) => <span key={t.id} className="lp-tag">{t.name}</span>)}
                      {p.technologies.length > 4 && <span className="lp-tag">+{p.technologies.length - 4}</span>}
                    </div>
                  )}
                </div>
                <div className="lp-card-foot">
                  <Form.Check
                    type="switch"
                    id={`project-shown-${p.id}`}
                    checked={shown}
                    disabled={!!busy[p.id]}
                    onChange={() => toggleShown(p)}
                    label={shown ? "On website" : "Hidden"}
                  />
                  <div className="d-inline-flex gap-1">
                    <Button variant="outline-secondary" size="sm" onClick={() => open(p)} aria-label={`Edit ${p.title}`} title="Edit">
                      <FaPen />
                    </Button>
                    <Button variant="outline-danger" size="sm" onClick={() => remove(p)} aria-label={`Delete ${p.title}`} title="Delete">
                      <FaTrash />
                    </Button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Pager
        page={page}
        lastPage={pagination.total_pages || 1}
        onPage={setPage}
        perPage={limit}
        perPageOptions={[12, 24, 48]}
        onPerPage={(n) => {
          setLimit(n);
          setPage(1);
        }}
      />
    </ListCard>
  );
};

export default Projects;
