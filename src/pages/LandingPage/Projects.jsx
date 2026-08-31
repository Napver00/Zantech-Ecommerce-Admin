import React, { useState, useEffect } from "react";
import { Card, Button, Badge, Form, Row, Col, Pagination } from "react-bootstrap";
import { toast } from "react-hot-toast";
import axiosInstance from "../../config/axios";
import { FaPlus, FaTrash, FaEdit, FaImage, FaFolderOpen } from "react-icons/fa";
import usePageTitle from "../../hooks/usePageTitle";
import Loading from "../../components/Loading";
import "./Projects.css";
import { useNavigate } from "react-router-dom";

const Projects = () => {
  usePageTitle("Our Projects");
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [pagination, setPagination] = useState({
    total_rows: 0,
    current_page: 1,
    per_page: 10,
    total_pages: 1,
    has_more_pages: false,
  });

  useEffect(() => {
    fetchProjects(page);
  }, [page, limit]);

  const fetchProjects = async (pageNum = page) => {
    try {
      setLoading(true);
      const response = await axiosInstance.get("/projects", { params: { page: pageNum, limit } });
      if (response.data.success) {
        const raw = response.data.data;
        setProjects(raw);
        setPagination(
          response.data.pagination || {
            total_rows: raw.length,
            current_page: pageNum,
            per_page: limit,
            total_pages: 1,
            has_more_pages: false,
          }
        );
      } else {
        toast.error("Failed to fetch projects.");
      }
    } catch (error) {
      toast.error("An error occurred while fetching projects.");
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (p) => {
    if (p < 1 || (pagination && p > pagination.total_pages)) return;
    setPage(p);
  };

  const handleLimitChange = (e) => {
    setLimit(parseInt(e.target.value));
    setPage(1);
  };

  const handleDelete = (id, title) => {
    toast(
      (t) => (
        <div className="delete-confirm-toast">
          <p className="mb-2">
            Delete <strong>{title}</strong>? This can't be undone.
          </p>
          <div className="d-flex gap-2 justify-content-end">
            <Button size="sm" variant="light" onClick={() => toast.dismiss(t.id)}>
              Cancel
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={async () => {
                toast.dismiss(t.id);
                try {
                  const response = await axiosInstance.delete(`/projects/${id}`);
                  if (response.data.success) {
                    toast.success("Project deleted successfully!");
                    fetchProjects(page);
                  } else {
                    toast.error("Failed to delete project.");
                  }
                } catch (error) {
                  toast.error("An error occurred while deleting the project.");
                }
              }}
            >
              Delete
            </Button>
          </div>
        </div>
      ),
      { duration: 8000 }
    );
  };

  const showEmptyState = !loading && projects.length === 0;

  return (
    <div className="tab-content-container">
      <Card className="modern-card border-0">
        <Card.Header className="bg-white d-flex flex-wrap justify-content-between align-items-center gap-2 border-bottom card-header-custom pt-4 px-4 pb-3">
          <div>
            <h4 className="mb-1 fw-bold text-primary">Our Projects</h4>
            <p className="text-muted small mb-0">
              {loading
                ? "Loading..."
                : `${pagination.total_rows} project${pagination.total_rows !== 1 ? "s" : ""} in your portfolio`}
            </p>
          </div>
          <Button
            variant="primary"
            onClick={() => navigate("/landing/projects/add")}
            className="shadow-sm px-4"
          >
            <FaPlus className="me-2" /> Add Project
          </Button>
        </Card.Header>
        <Card.Body className="p-4">
          {!showEmptyState && (
            <div className="d-flex justify-content-end mb-4">
              <Form.Select
                value={limit}
                onChange={handleLimitChange}
                className="limit-select project-limit-select"
              >
                <option value="5">5 per page</option>
                <option value="10">10 per page</option>
                <option value="20">20 per page</option>
                <option value="50">50 per page</option>
              </Form.Select>
            </div>
          )}

          {loading ? (
            <div className="project-grid-loading">
              <Loading />
            </div>
          ) : showEmptyState ? (
            <div className="project-empty-state">
              <div className="project-empty-icon">
                <FaFolderOpen />
              </div>
              <h5 className="mb-1">No projects yet</h5>
              <p className="text-muted mb-4">
                Add your first project to showcase it on the public landing page.
              </p>
              <Button variant="primary" onClick={() => navigate("/landing/projects/add")}>
                <FaPlus className="me-2" /> Add Your First Project
              </Button>
            </div>
          ) : (
            <Row className="g-4 project-grid">
              {projects.map((project) => (
                <Col key={project.id} xs={12} sm={6} lg={4} xl={3}>
                  <div className="project-card">
                    <div className="project-card-img-wrap">
                      {project.image_url ? (
                        <img src={project.image_url} alt={project.title} className="project-card-img" />
                      ) : (
                        <div className="project-card-img-placeholder">
                          <FaImage />
                        </div>
                      )}
                      <span
                        className={`project-status-badge ${
                          project.status === "active" ? "is-active" : "is-inactive"
                        }`}
                      >
                        {project.status === "active" ? "Active" : "Inactive"}
                      </span>
                    </div>

                    <div className="project-card-body">
                      <h6 className="project-card-title" title={project.title}>
                        {project.title}
                      </h6>
                      <p className="project-card-desc">{project.description}</p>

                      {project.technologies?.length > 0 && (
                        <div className="d-flex flex-wrap gap-1 project-card-tags">
                          {project.technologies.slice(0, 3).map((tech) => (
                            <Badge key={tech.id} bg="light" text="dark" className="border fw-normal">
                              {tech.name}
                            </Badge>
                          ))}
                          {project.technologies.length > 3 && (
                            <Badge bg="light" text="muted" className="border fw-normal">
                              +{project.technologies.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="project-card-footer">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        className="flex-grow-1"
                        onClick={() => navigate(`/landing/projects/${project.slug}`)}
                      >
                        <FaEdit className="me-1" /> Edit
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleDelete(project.id, project.title)}
                        title="Delete project"
                      >
                        <FaTrash />
                      </Button>
                    </div>
                  </div>
                </Col>
              ))}
            </Row>
          )}

          {pagination.total_pages > 1 && (
            <div className="pagination-container mt-4 d-flex justify-content-center">
              <Pagination className="modern-pagination">
                <Pagination.Prev
                  onClick={() => handlePageChange(pagination.current_page - 1)}
                  disabled={pagination.current_page === 1}
                />
                {[...Array(pagination.total_pages)].map((_, index) => (
                  <Pagination.Item
                    key={index + 1}
                    active={index + 1 === pagination.current_page}
                    onClick={() => handlePageChange(index + 1)}
                  >
                    {index + 1}
                  </Pagination.Item>
                ))}
                <Pagination.Next
                  onClick={() => handlePageChange(pagination.current_page + 1)}
                  disabled={!pagination.has_more_pages}
                />
              </Pagination>
            </div>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default Projects;
