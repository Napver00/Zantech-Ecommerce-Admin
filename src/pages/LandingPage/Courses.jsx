import React, { useState, useEffect } from "react";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaSearch,
  FaSpinner,
  FaTimes,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import axiosInstance from "../../config/axios";
import { Card, Form, InputGroup, Button, Row, Col } from "react-bootstrap";
import Loading from "../../components/Loading";
import CommonTable from "../../components/Common/CommonTable";
import usePageTitle from "../../hooks/usePageTitle";

const Courses = () => {
  usePageTitle("Courses");
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [searchParams, setSearchParams] = useState({
    search: "",
  });
  const [searchTimeout, setSearchTimeout] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    const timeoutId = setTimeout(() => {
      setIsSearching(true);
      fetchCourses();
    }, 500);

    setSearchTimeout(timeoutId);

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [searchParams.search]);

  const fetchCourses = async () => {
    setLoading(true);
    setTableLoading(true);
    try {
      const params = {
        category: "Course",
        ...(searchParams.search && { title: searchParams.search }),
      };

      const response = await axiosInstance.get("/posts", { params });
      const result = response.data;

      if (!result.success) {
        throw new Error(result.message || "Failed to fetch courses");
      }

      await new Promise((resolve) => setTimeout(resolve, 300));
      setCourses(Array.isArray(result.data) ? result.data : [result.data]);
    } catch (error) {
      console.error("Error fetching courses:", error);
      toast.error(error.response?.data?.message || "Failed to fetch courses");
      setCourses([]);
    } finally {
      setLoading(false);
      setTableLoading(false);
      setIsSearching(false);
    }
  };

  const handleDeleteCourse = async (id) => {
    if (window.confirm("Are you sure you want to delete this course?")) {
      try {
        setTableLoading(true);
        await axiosInstance.delete(`/posts/${id}`);
        toast.success("Course deleted successfully");
        fetchCourses();
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to delete course");
      } finally {
        setTableLoading(false);
      }
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      await axiosInstance.patch(`/posts/status/${id}`);
      toast.success("Status updated successfully");
      fetchCourses();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update status");
    }
  };

  const handleSearch = (e) => {
    const { value } = e.target;
    setSearchParams((prev) => ({
      ...prev,
      search: value,
    }));
  };

  const headers = [
    { key: "id", label: "ID" },
    { key: "title", label: "Title" },
    { key: "category", label: "Category" },
    {
      key: "reg_link",
      label: "Reg Link",
      render: (row) =>
        row.reg_link ? (
          <a href={row.reg_link} target="_blank" rel="noreferrer">
            Link
          </a>
        ) : (
          "N/A"
        ),
    },
    { key: "serial", label: "Serial" },
    {
      key: "status",
      label: "Status",
      render: (row) => (
        <Button
          variant={
            row.status === "published" || row.status === "active"
              ? "success"
              : "danger"
          }
          size="sm"
          onClick={() => handleToggleStatus(row.id)}
        >
          {row.status}
        </Button>
      ),
    },
    {
      key: "created_at",
      label: "Created At",
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
        className="view-btn"
      >
        <FaEdit />
      </Button>
      <Button
        variant="outline-danger"
        size="sm"
        onClick={() => handleDeleteCourse(course.id)}
        disabled={tableLoading}
        title="Delete"
        className="delete-btn"
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
                Manage your educational courses
              </p>
            </div>
            <Button
              variant="primary"
              onClick={() => navigate("/landing/courses/add")}
              className="create-course-btn"
            >
              <FaPlus className="me-2" /> Add Course
            </Button>
          </div>

          <div className="filters-section mb-4">
            <Row className="g-3 align-items-center">
              <Col md={4}>
                <Form onSubmit={(e) => e.preventDefault()}>
                  <InputGroup className="search-box">
                    <InputGroup.Text className="search-icon">
                      {isSearching ? (
                        <FaSpinner className="spinner-border spinner-border-sm" />
                      ) : (
                        <FaSearch />
                      )}
                    </InputGroup.Text>
                    <Form.Control
                      type="text"
                      placeholder="Search courses..."
                      name="search"
                      value={searchParams.search}
                      onChange={handleSearch}
                      disabled={loading}
                      className={`search-input ${
                        isSearching ? "searching" : ""
                      }`}
                    />
                    {searchParams.search && !isSearching && (
                      <Button
                        variant="link"
                        className="clear-search"
                        onClick={() => {
                          setSearchParams((prev) => ({ ...prev, search: "" }));
                        }}
                        disabled={loading}
                      >
                        <FaTimes />
                      </Button>
                    )}
                  </InputGroup>
                </Form>
              </Col>
            </Row>
          </div>

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
