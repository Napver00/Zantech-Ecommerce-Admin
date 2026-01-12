import React, { useState, useEffect } from "react";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaSearch,
  FaSpinner,
  FaTimes,
  FaEye,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import axiosInstance from "../../config/axios";
import {
  Card,
  Form,
  InputGroup,
  Button,
  Row,
  Col,
} from "react-bootstrap";
import Loading from "../../components/Loading";
import "./Career.css";
import usePageTitle from '../../hooks/usePageTitle';
import CommonTable from "../../components/Common/CommonTable";

const Careers = () => {
  usePageTitle('Manage Careers');
  const navigate = useNavigate();
  const [careers, setCareers] = useState([]);
  const [applicationCounts, setApplicationCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [pageLoading, setPageLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [searchParams, setSearchParams] = useState({
    search: "",
  });
  const [searchTimeout, setSearchTimeout] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        await fetchCareers();
      } finally {
        setPageLoading(false);
      }
    };

    if (pageLoading) {
      loadInitialData();
    } else {
      fetchCareers();
    }
  }, []);

  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    const timeoutId = setTimeout(() => {
      setIsSearching(true);
      fetchCareers();
    }, 500);

    setSearchTimeout(timeoutId);

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [searchParams.search]);

  useEffect(() => {
    if (careers.length > 0) {
      fetchApplicationCounts();
    }
  }, [careers]);

  const fetchCareers = async () => {
    setLoading(true);
    setTableLoading(true);
    try {
      const params = {
        ...(searchParams.search && { search: searchParams.search }),
      };

      const response = await axiosInstance.get("/careers", { params });
      const result = response.data;

      if (!result.success) {
        throw new Error(result.message || "Failed to fetch careers");
      }

      await new Promise((resolve) => setTimeout(resolve, 300));

      setCareers(result.data);
    } catch (error) {
      console.error("Error fetching careers:", error);
      toast.error(
        error.response?.data?.message || "Failed to fetch careers"
      );
      setCareers([]);
    } finally {
      setLoading(false);
      setTableLoading(false);
      setIsSearching(false);
    }
  };

  const fetchApplicationCounts = async () => {
    const counts = {};
    for (const career of careers) {
      try {
        const response = await axiosInstance.get(`/careers/forms/${career.id}`);
        if (response.data.success) {
          counts[career.id] = response.data.data.total_submissions;
        } else {
          counts[career.id] = 0;
        }
      } catch (error) {
        counts[career.id] = 0;
      }
    }
    setApplicationCounts(counts);
  };


  const handleDeleteCareer = async (id) => {
    if (window.confirm("Are you sure you want to delete this career?")) {
      try {
        setTableLoading(true);
        await axiosInstance.delete(`/careers/${id}`);
        toast.success("Career deleted successfully");
        fetchCareers();
      } catch (error) {
        toast.error(
          error.response?.data?.message || "Failed to delete career"
        );
      } finally {
        setTableLoading(false);
      }
    }
  };
  
  const handleToggleStatus = async (id) => {
    try {
      await axiosInstance.patch(`/careers/status/${id}`);
      toast.success("Status updated successfully");
      fetchCareers();
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
    { key: 'id', label: 'ID' },
    { key: 'job_title', label: 'Job Title' },
    { key: 'deadline', label: 'Deadline' },
    {
        key: 'applications',
        label: 'Applications',
        render: (row) => (
            <Button
                variant="outline-info"
                size="sm"
                onClick={() => navigate(`/careers/${row.id}/applications`)}
            >
                <FaEye className="me-1" /> View ({applicationCounts[row.id] || 0})
            </Button>
        ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <Button
            variant={row.status === 1 ? 'success' : 'danger'}
            size="sm"
            onClick={() => handleToggleStatus(row.id)}
        >
            {row.status === 1 ? "Active" : "Inactive"}
        </Button>
      ),
    },
  ];

  const renderActions = (career) => (
    <div className="d-flex gap-2">
      <Button
        variant="outline-primary"
        size="sm"
        onClick={() => navigate(`/careers/${career.id}`)}
        disabled={tableLoading}
        title="Edit"
        className="view-btn"
      >
        <FaEdit />
      </Button>
      <Button
        variant="outline-danger"
        size="sm"
        onClick={() => handleDeleteCareer(career.id)}
        disabled={tableLoading}
        title="Delete"
        className="delete-btn"
      >
        <FaTrash />
      </Button>
    </div>
  );

  if (pageLoading) {
    return <Loading />;
  }

  return (
    <div className="categories-container">
      <Card className="modern-card">
        <Card.Body className="p-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h2 className="page-title mb-1">Careers</h2>
              {loading && tableLoading ? (
                <div className="d-flex align-items-center">
                  <FaSpinner className="spinner-border spinner-border-sm me-2" />
                  <p className="page-subtitle mb-0">Loading careers...</p>
                </div>
              ) : (
                <p className="page-subtitle mb-0">
                  Showing {careers.length} careers
                </p>
              )}
            </div>
            <Button
              variant="primary"
              onClick={() => navigate('/careers/add')}
              className="create-category-btn"
            >
              <FaPlus className="me-2" /> Add Career
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
                      placeholder="Search careers..."
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
            data={careers}
            tableLoading={tableLoading}
            loading={loading}
            renderActions={renderActions}
          />
        </Card.Body>
      </Card>
    </div>
  );
};

export default Careers;