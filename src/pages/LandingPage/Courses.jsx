import React, { useState, useEffect, useCallback } from "react";
import { FaPlus, FaEdit, FaTrash, FaSearch, FaSpinner, FaTimes } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import axiosInstance from "../../config/axios";
import { Card, Form, InputGroup, Button, Row, Col, Badge } from "react-bootstrap";
import CommonTable from "../../components/Common/CommonTable";
import usePageTitle from "../../hooks/usePageTitle";

const STATUS_VARIANT = { published: "success", draft: "secondary" };

const Courses = () => {
  usePageTitle("Courses");
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const fetchCourses = useCallback(async (title = "") => {
    setTableLoading(true);
    try {
      const params = {};
      if (title) params.title = title;
      const res = await axiosInstance.get("/courses", { params });
      if (!res.data.success) throw new Error(res.data.message);
      const raw = res.data.data;
      setCourses(Array.isArray(raw) ? raw : raw ? [raw] : []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to fetch courses");
      setCourses([]);
    } finally {
      setLoading(false);
      setTableLoading(false);
      setIsSearching(false);
    }
  }, []);

  useEffect(() => { fetchCourses(); }, [fetchCourses]);

  // Debounced search
  useEffect(() => {
    if (!search && !isSearching) return;
    setIsSearching(true);
    const id = setTimeout(() => fetchCourses(search), 500);
    return () => clearTimeout(id);
  }, [search]);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this course? This will also remove all its curriculum, schedules, mentors and images.")) return;
    try {
      setTableLoading(true);
      await axiosInstance.delete(`/courses/${id}`);
      toast.success("Course deleted");
      fetchCourses(search);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete course");
    } finally {
      setTableLoading(false);
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      setTableLoading(true);
      await axiosInstance.patch(`/courses/status/${id}`);
      toast.success(`Status changed to ${currentStatus === "draft" ? "published" : "draft"}`);
      fetchCourses(search);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update status");
    } finally {
      setTableLoading(false);
    }
  };

  const headers = [
    {
      key: "thumbnail",
      label: "Thumb",
      render: (row) =>
        row.thumbnail ? (
          <img
            src={row.thumbnail}
            alt={row.title}
            style={{ width: 48, height: 36, objectFit: "cover", borderRadius: 4 }}
          />
        ) : (
          <div
            style={{ width: 48, height: 36, background: "#e9ecef", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <span style={{ fontSize: 10, color: "#adb5bd" }}>No img</span>
          </div>
        ),
    },
    { key: "id", label: "ID" },
    { key: "title", label: "Title" },
    { key: "category", label: "Category", render: (row) => row.category || "—" },
    {
      key: "price",
      label: "Price",
      render: (row) =>
        row.price != null ? (
          <span>
            {row.discount_price ? (
              <>
                <span className="text-decoration-line-through text-muted me-1">৳{Number(row.price).toLocaleString()}</span>
                <span className="text-success fw-bold">৳{Number(row.discount_price).toLocaleString()}</span>
              </>
            ) : (
              <span>৳{Number(row.price).toLocaleString()}</span>
            )}
          </span>
        ) : "—",
    },
    {
      key: "reg_link",
      label: "Reg Link",
      render: (row) =>
        row.reg_link ? (
          <a href={row.reg_link} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-secondary py-0">Link</a>
        ) : "—",
    },
    { key: "serial_number", label: "Serial", render: (row) => row.serial_number ?? "—" },
    {
      key: "status",
      label: "Status",
      render: (row) => (
        <Button
          variant={STATUS_VARIANT[row.status] || "secondary"}
          size="sm"
          onClick={() => handleToggleStatus(row.id, row.status)}
          disabled={tableLoading}
          style={{ minWidth: 80 }}
        >
          {row.status === "published" ? "Published" : "Draft"}
        </Button>
      ),
    },
    {
      key: "created_at",
      label: "Created",
      render: (row) => new Date(row.created_at).toLocaleDateString(),
    },
  ];

  const renderActions = (course) => (
    <div className="d-flex gap-2">
      <Button
        variant="outline-primary"
        size="sm"
        onClick={() => navigate(`/landing/courses/${course.slug}`)}
        disabled={tableLoading}
        title="Edit"
      >
        <FaEdit />
      </Button>
      <Button
        variant="outline-danger"
        size="sm"
        onClick={() => handleDelete(course.id)}
        disabled={tableLoading}
        title="Delete"
      >
        <FaTrash />
      </Button>
    </div>
  );

  return (
    <div className="courses-container">
      <Card className="modern-card border-0">
        <Card.Body className="p-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h4 className="mb-1 fw-bold text-primary">Courses</h4>
              <p className="text-muted small mb-0">
                {loading ? "Loading..." : `${courses.length} course${courses.length !== 1 ? "s" : ""} found`}
              </p>
            </div>
            <Button variant="primary" onClick={() => navigate("/landing/courses/add")}>
              <FaPlus className="me-2" /> Add Course
            </Button>
          </div>

          <Row className="mb-4">
            <Col md={4}>
              <InputGroup>
                <InputGroup.Text>
                  {isSearching ? <FaSpinner className="fa-spin" /> : <FaSearch />}
                </InputGroup.Text>
                <Form.Control
                  placeholder="Search by title..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  disabled={loading}
                />
                {search && (
                  <Button variant="outline-secondary" onClick={() => setSearch("")}>
                    <FaTimes />
                  </Button>
                )}
              </InputGroup>
            </Col>
          </Row>

          <CommonTable
            headers={headers}
            data={courses}
            tableLoading={tableLoading}
            loading={loading}
            renderActions={renderActions}
          />
        </Card.Body>
      </Card>
    </div>
  );
};

export default Courses;
