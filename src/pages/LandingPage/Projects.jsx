import React, { useState, useEffect } from "react";
import { Card, Button, Badge, Form, Row, Col, Pagination } from "react-bootstrap";
import { toast } from "react-hot-toast";
import axiosInstance from "../../config/axios";
import { FaPlus, FaTrash, FaEdit } from "react-icons/fa";
import usePageTitle from "../../hooks/usePageTitle";
import "./Projects.css";
import { useNavigate } from "react-router-dom";
import CommonTable from "../../components/Common/CommonTable";

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

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this project?")) {
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
    }
  };

  const headers = [
    {
      key: "image_url",
      label: "Image",
      render: (row) => (
        <img
          src={row.image_url}
          alt={row.title}
          className="rounded project-thumb"
        />
      ),
    },
    {
      key: "title",
      label: "Title",
      render: (row) => <span className="fw-bold">{row.title}</span>,
    },
    {
      key: "description",
      label: "Description",
      render: (row) => (
        <span className="text-muted small line-clamp-2 d-inline-block">
          {row.description}
        </span>
      ),
    },
    {
      key: "technologies",
      label: "Technologies",
      render: (row) => (
        <div className="d-flex flex-wrap gap-1">
          {row.technologies.slice(0, 3).map((tech) => (
            <Badge key={tech.id} bg="light" text="dark" className="border fw-normal">
              {tech.name}
            </Badge>
          ))}
          {row.technologies.length > 3 && (
            <Badge bg="light" text="muted" className="border fw-normal">
              +{row.technologies.length - 3}
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (row) => (
        <span
          className={`badge rounded-pill bg-${
            row.status === "active" ? "success" : "light text-muted border"
          }`}
        >
          {row.status === "active" ? "Active" : "Inactive"}
        </span>
      ),
    },
  ];

  const renderActions = (project) => (
    <div className="d-flex gap-2">
      <Button
        variant="outline-primary"
        size="sm"
        onClick={() => navigate(`/landing/projects/${project.slug}`)}
      >
        <FaEdit className="me-1" /> Edit
      </Button>
      <Button
        variant="outline-danger"
        size="sm"
        onClick={() => handleDelete(project.id)}
      >
        <FaTrash />
      </Button>
    </div>
  );

  return (
    <div className="tab-content-container">
      <Card className="modern-card border-0">
        <Card.Header className="bg-white d-flex flex-wrap justify-content-between align-items-center gap-2 border-bottom card-header-custom pt-4 px-4 pb-3">
          <div>
            <h4 className="mb-1 fw-bold text-primary">Our Projects</h4>
            <p className="text-muted small mb-0">
              {loading ? "Loading..." : `${pagination.total_rows} project${pagination.total_rows !== 1 ? "s" : ""} found`}
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
          <Row className="mb-4">
            <Col md={2} className="ms-auto">
              <Form.Select value={limit} onChange={handleLimitChange} className="limit-select">
                <option value="5">5 per page</option>
                <option value="10">10 per page</option>
                <option value="20">20 per page</option>
                <option value="50">50 per page</option>
              </Form.Select>
            </Col>
          </Row>

          <CommonTable
            headers={headers}
            data={projects}
            tableLoading={loading}
            loading={loading}
            renderActions={renderActions}
          />

          {pagination.total_pages > 1 && (
            <div className="pagination-container mt-4">
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
