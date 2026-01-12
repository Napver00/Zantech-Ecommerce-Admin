import React, { useState, useEffect } from 'react';
import { FaUser, FaCalendarAlt, FaSearch, FaSpinner, FaTimes } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import axiosInstance from '../../config/axios';
import { Card, Modal, Button, Pagination, Badge, Form, InputGroup, Row, Col } from 'react-bootstrap';
import Loading from '../../components/Loading';
import './Activity.css';
import usePageTitle from '../../hooks/usePageTitle';
import CommonTable from '../../components/Common/CommonTable';

const Activity = () => {
  usePageTitle('Activity Logs');
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchParams, setSearchParams] = useState({
    search: "",
    page: 1,
    limit: 10,
    startDate: null,
    endDate: null,
    type: "",
  });
  const [pagination, setPagination] = useState({
    total_rows: 0,
    current_page: 1,
    per_page: 10,
    total_pages: 1,
    has_more_pages: false,
  });
  const [searchTimeout, setSearchTimeout] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    fetchActivities();
  }, [searchParams.page, searchParams.limit, searchParams.startDate, searchParams.endDate, searchParams.type]);

  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    const timeoutId = setTimeout(() => {
      if (searchParams.search !== "") {
        setIsSearching(true);
        fetchActivities(1);
      }
    }, 500);

    setSearchTimeout(timeoutId);

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [searchParams.search]);

  const fetchActivities = async (page = searchParams.page) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: searchParams.limit,
        ...(searchParams.search && { search: searchParams.search }),
        ...(searchParams.startDate && {
          start_date: searchParams.startDate.toISOString().split('T')[0]
        }),
        ...(searchParams.endDate && {
          end_date: searchParams.endDate.toISOString().split('T')[0]
        }),
        ...(searchParams.type && { type: searchParams.type }),
      };

      const response = await axiosInstance.get("/activitys", { params });
      const result = response.data;

      if (!result.success) {
        throw new Error(result.message || "Failed to fetch activities");
      }

      setActivities(result.data);
      if (result.pagination) {
        setPagination(result.pagination);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch activities");
      setActivities([]);
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  };

  const handleSearch = (e) => {
    const { value } = e.target;
    setSearchParams((prev) => ({
      ...prev,
      search: value,
      page: 1,
    }));
  };

  const handlePageChange = (page) => {
    setSearchParams((prev) => ({
      ...prev,
      page,
    }));
  };

  const handleLimitChange = (e) => {
    const limit = parseInt(e.target.value);
    setSearchParams((prev) => ({
      ...prev,
      limit,
      page: 1,
    }));
  };

  const handleTypeChange = (e) => {
    setSearchParams((prev) => ({
      ...prev,
      type: e.target.value,
      page: 1,
    }));
  };

  const handleDateChange = (dates) => {
    const [start, end] = dates;

    if (start && end && start > end) {
      toast.error("Start date cannot be after end date");
      return;
    }

    const formattedStart = start ? new Date(start.setHours(0, 0, 0, 0)) : null;
    const formattedEnd = end ? new Date(end.setHours(23, 59, 59, 999)) : null;

    setSearchParams(prev => ({
      ...prev,
      startDate: formattedStart,
      endDate: formattedEnd,
      page: 1
    }));
  };

  const clearDateFilter = () => {
    setSearchParams(prev => ({
      ...prev,
      startDate: null,
      endDate: null,
      page: 1
    }));
  };

  const handleUserClick = (user) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const handleCloseUserModal = () => {
    setShowUserModal(false);
    setSelectedUser(null);
  };

  const getActivityTypeText = (type) => {
    const types = {
      coupon: 'Coupon',
      order: 'Order',
      product: 'Product',
      user: 'User',
      default: type
    };

    return types[type] || types.default;
  };

  const renderPagination = () => {
    const items = [];
    const maxPages = 5;
    let startPage = Math.max(1, pagination.current_page - Math.floor(maxPages / 2));
    let endPage = Math.min(pagination.total_pages, startPage + maxPages - 1);

    if (endPage - startPage + 1 < maxPages) {
      startPage = Math.max(1, endPage - maxPages + 1);
    }

    items.push(
      <Pagination.Prev
        key="prev"
        onClick={() => handlePageChange(pagination.current_page - 1)}
        disabled={pagination.current_page === 1}
      />
    );

    if (startPage > 1) {
      items.push(
        <Pagination.Item key={1} onClick={() => handlePageChange(1)}>
          1
        </Pagination.Item>
      );
      if (startPage > 2) {
        items.push(<Pagination.Ellipsis key="ellipsis1" disabled />);
      }
    }

    for (let number = startPage; number <= endPage; number++) {
      items.push(
        <Pagination.Item
          key={number}
          active={number === pagination.current_page}
          onClick={() => handlePageChange(number)}
        >
          {number}
        </Pagination.Item>
      );
    }

    if (endPage < pagination.total_pages) {
      if (endPage < pagination.total_pages - 1) {
        items.push(<Pagination.Ellipsis key="ellipsis2" disabled />);
      }
      items.push(
        <Pagination.Item
          key={pagination.total_pages}
          onClick={() => handlePageChange(pagination.total_pages)}
        >
          {pagination.total_pages}
        </Pagination.Item>
      );
    }

    items.push(
      <Pagination.Next
        key="next"
        onClick={() => handlePageChange(pagination.current_page + 1)}
        disabled={pagination.current_page === pagination.total_pages}
      />
    );

    return items;
  };

  const headers = [
    { key: 'id', label: 'ID', render: (row) => `#${row.id}` },
    { key: 'type', label: 'Type', render: (row) => getActivityTypeText(row.type) },
    {
      key: 'user',
      label: 'User',
      render: (row) => (
        <Button
          variant="link"
          className="p-0 text-decoration-none user-link"
          onClick={() => handleUserClick(row.user)}
        >
          <FaUser className="me-1" />
          {row.user.name}
        </Button>
      ),
    },
    { key: 'description', label: 'Description' },
    {
      key: 'created_at',
      label: 'Date',
      render: (row) => (
        <div className="d-flex align-items-center">
          <FaCalendarAlt className="me-2 text-muted" />
          {new Date(row.created_at).toLocaleString()}
        </div>
      ),
    },
  ];

  if (loading && activities.length === 0) {
    return <Loading />;
  }

  return (
    <div className="activity-container">
      <Card className="modern-card">
        <Card.Body className="p-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h2 className="page-title mb-1">Activity Logs</h2>
              <p className="text-muted mb-0">Track and monitor all system activities</p>
            </div>
          </div>

          <div className="filters-section mb-4">
            <Row className="g-3">
              <Col md={2}>
                <Form.Select
                  value={searchParams.limit}
                  onChange={handleLimitChange}
                  className="limit-select"
                >
                  <option value="5">5 per page</option>
                  <option value="10">10 per page</option>
                  <option value="20">20 per page</option>
                  <option value="50">50 per page</option>
                </Form.Select>
              </Col>
              <Col md={2}>
                {(searchParams.startDate || searchParams.endDate) && (
                  <Button
                    variant="outline-secondary"
                    onClick={clearDateFilter}
                    className="clear-dates-btn w-100"
                  >
                    <FaTimes className="me-2" /> Clear Dates
                  </Button>
                )}
              </Col>
            </Row>
          </div>
          
          <CommonTable
            headers={headers}
            data={activities}
            tableLoading={loading}
            loading={loading}
          />

          {pagination.total_pages > 1 && (
            <div className="pagination-container mt-4">
              <Pagination className="modern-pagination">
                {renderPagination()}
              </Pagination>
            </div>
          )}
        </Card.Body>
      </Card>

      <Modal show={showUserModal} onHide={handleCloseUserModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <FaUser className="me-2" />
            User Details
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedUser && (
            <div className="user-details">
              <div className="mb-3">
                <h6 className="text-muted mb-2">Basic Information</h6>
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Name:</span>
                  <span className="fw-medium">{selectedUser.name}</span>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Email:</span>
                  <span className="fw-medium">{selectedUser.email}</span>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Phone:</span>
                  <span className="fw-medium">{selectedUser.phone || 'N/A'}</span>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Address:</span>
                  <span className="fw-medium">{selectedUser.address || 'N/A'}</span>
                </div>
              </div>

              <div className="mb-3">
                <h6 className="text-muted mb-2">Account Information</h6>
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Role:</span>
                  <Badge bg={selectedUser.type === 'admin' ? 'primary' : 'secondary'}>
                    {selectedUser.type.toUpperCase()}
                  </Badge>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Status:</span>
                  <Badge bg={selectedUser.status === 1 ? 'success' : 'danger'}>
                    {selectedUser.status === 1 ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Member Since:</span>
                  <span className="fw-medium">
                    {new Date(selectedUser.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="d-flex justify-content-between">
                  <span className="text-muted">Last Updated:</span>
                  <span className="fw-medium">
                    {new Date(selectedUser.updated_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseUserModal}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Activity;