import React, { useState, useEffect, useCallback } from "react";
import { FaPlus, FaEdit, FaTrash, FaSearch, FaSpinner, FaTimes } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import axiosInstance from "../../config/axios";
import { Card, Form, InputGroup, Button, Row, Col, Badge, Pagination } from "react-bootstrap";
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
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [pagination, setPagination] = useState({
    total_rows: 0,
    current_page: 1,
    per_page: 10,
    total_pages: 1,
    has_more_pages: false,
  });

  const fetchCourses = useCallback(async (title = "", pageNum = 1) => {
    setTableLoading(true);
    try {
      const params = { page: pageNum, limit };
      if (title) params.title = title;
      const res = await axiosInstance.get("/courses", { params });
      if (!res.data.success) throw new Error(res.data.message);
      const raw = Array.isArray(res.data.data) ? res.data.data : res.data.data ? [res.data.data] : [];
      setCourses(raw);
      setPagination(
        res.data.pagination || {
          total_rows: raw.length,
          current_page: pageNum,
          per_page: limit,
          total_pages: 1,
          has_more_pages: false,
        }
      );
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to fetch courses");
      setCourses([]);
    } finally {
      setLoading(false);
      setTableLoading(false);
      setIsSearching(false);
    }
  }, [limit]);

  useEffect(() => { fetchCourses(search, page); }, [page, limit]);

  // Debounced search
  useEffect(() => {
    setIsSearching(true);
    const id = setTimeout(() => {
      setPage(1);
      fetchCourses(search, 1);
    }, 500);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const handlePageChange = (p) => {
    if (p < 1 || (pagination && p > pagination.total_pages)) return;
    setPage(p);
  };

  const handleLimitChange = (e) => {
    setLimit(parseInt(e.target.value));
    setPage(1);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this course? This will also remove all its curriculum, schedules, mentors and images.")) return;
    try {
      setTableLoading(true);
      await axiosInstance.delete(`/courses/${id}`);
      toast.success("Course deleted");
      fetchCourses(search, page);
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
      fetchCourses(search, page);
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
      key: "payment_type",
      label: "Type",
      render: (row) => (
        <Badge bg={row.payment_type === "monthly" ? "info" : "secondary"}>
          {row.payment_type === "monthly" ? "Monthly" : "One Time"}
        </Badge>
      ),
    },
    {
      key: "price",
      label: "Price",
      render: (row) =>
        row.payment_type === "monthly" ? (
          row.monthly_fee != null ? (
            <span className="text-success fw-bold">৳{Number(row.monthly_fee).toLocaleString()}/mo</span>
          ) : "—"
        ) : row.price != null ? (
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
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4">
            <div>
              <h4 className="mb-1 fw-bold text-primary">Courses</h4>
              <p className="text-muted small mb-0">
                {loading ? "Loading..." : `${pagination.total_rows} course${pagination.total_rows !== 1 ? "s" : ""} found`}
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
            <Col md={2}>
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
            data={courses}
            tableLoading={tableLoading}
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

export default Courses;
