import React, { useState, useEffect } from "react";
import {
  FaSpinner,
  FaCalendarAlt,
  FaSearch,
  FaTimes,
  FaEye,
} from "react-icons/fa";
import { toast } from "react-hot-toast";
import axiosInstance from "../../config/axios";
import {
  Card,
  Form,
  Pagination,
  Modal,
  Button,
  Row,
  Col,
  InputGroup,
} from "react-bootstrap";
import Loading from "../../components/Loading";
import "./Transitions.css";
import "../Categories/Categories.css";
import usePageTitle from '../../hooks/usePageTitle';
import CommonTable from "../../components/Common/CommonTable";

const Transitions = () => {
  usePageTitle('Manage Transitions');
  const [transitions, setTransitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useState({
    page: 1,
    limit: 10,
    start_date: null,
    end_date: null,
    duration: "",
  });
  const [pagination, setPagination] = useState({
    total: 0,
    current_page: 1,
    per_page: 10,
    last_page: 1,
    from: 1,
    to: 1,
  });
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);

  useEffect(() => {
    fetchTransitions();
  }, [
    searchParams.page,
    searchParams.limit,
    searchParams.duration,
    searchParams.start_date,
    searchParams.end_date,
  ]);

  const formatDateForAPI = (date) => {
    if (!date) return null;
    return date.toISOString().split('T')[0];
  };

  const fetchTransitions = async (page = searchParams.page) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: searchParams.limit,
        duration: searchParams.duration,
        start_date: formatDateForAPI(searchParams.start_date),
        end_date: formatDateForAPI(searchParams.end_date),
      };

      const response = await axiosInstance.get("/transiions", { params });
      const result = response.data;

      if (!result.success) {
        throw new Error(result.message || "Failed to fetch transitions");
      }

      setTransitions(result.data);
      if (result.pagination) {
        setPagination(result.pagination);
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to fetch transitions"
      );
      setTransitions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDurationChange = (e) => {
    const duration = e.target.value;
    setSearchParams((prev) => ({
      ...prev,
      duration,
      start_date: null,
      end_date: null,
      page: 1,
    }));
  };

  const handleDateChange = (e, type) => {
    const value = e.target.value ? new Date(e.target.value + 'T00:00:00') : null;
    
    if (type === 'start' && value && searchParams.end_date && value > searchParams.end_date) {
      toast.error("Start date cannot be after end date");
      return;
    }
    
    if (type === 'end' && value && searchParams.start_date && value < searchParams.start_date) {
      toast.error("End date cannot be before start date");
      return;
    }

    if (type === 'end' && value) {
      value.setHours(23, 59, 59, 999);
    }

    setSearchParams((prev) => ({
      ...prev,
      [type === 'start' ? 'start_date' : 'end_date']: value,
      duration: "",
      page: 1,
    }));
  };

  const clearFilters = () => {
    setSearchParams((prev) => ({
      ...prev,
      start_date: null,
      end_date: null,
      duration: "",
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

  const handleRowClick = (transition) => {
    setSelectedPayment(transition);
    setShowPaymentModal(true);
  };

  const handleCloseModal = () => {
    setShowPaymentModal(false);
    setSelectedPayment(null);
  };

  const getPaymentTypeText = (type) => {
    switch (type) {
      case "1":
        return "Cash";
      case "3":
        return "Bank";
      case "4":
        return "Mobile Banking";
      case "0":
        return "Not Paid";
      default:
        return "Unknown";
    }
  };

  const getStatusText = (status) => {
    return status === "1" ? "Paid" : "Unpaid";
  };

  const renderPagination = () => {
    const items = [];
    const maxPages = 5;
    let startPage = Math.max(
      1,
      pagination.current_page - Math.floor(maxPages / 2)
    );
    let endPage = Math.min(pagination.last_page, startPage + maxPages - 1);

    if (endPage - startPage + 1 < maxPages) {
      startPage = Math.max(1, endPage - maxPages + 1);
    }

    items.push(
      <Pagination.First
        key="first"
        onClick={() => handlePageChange(1)}
        disabled={pagination.current_page === 1}
      />
    );

    items.push(
      <Pagination.Prev
        key="prev"
        onClick={() => handlePageChange(pagination.current_page - 1)}
        disabled={pagination.current_page === 1}
      />
    );

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

    items.push(
      <Pagination.Next
        key="next"
        onClick={() => handlePageChange(pagination.current_page + 1)}
        disabled={pagination.current_page === pagination.last_page}
      />
    );

    items.push(
      <Pagination.Last
        key="last"
        onClick={() => handlePageChange(pagination.last_page)}
        disabled={pagination.current_page === pagination.last_page}
      />
    );

    return items;
  };

  const headers = [
    { key: 'transition_id', label: 'ID', render: (row) => `#${row.transition_id}` },
    { key: 'payment_id', label: 'Payment ID' },
    { key: 'amount', label: 'Amount', render: (row) => `৳${parseFloat(row.amount).toLocaleString()}` },
    { key: 'payment_details.order_id', label: 'Order ID' },
    {
      key: 'payment_details.status',
      label: 'Status',
      render: (row) => (
        <span className={`status-badge ${row.payment_details.status === "1" ? "active" : "inactive"}`}>
          {getStatusText(row.payment_details.status)}
        </span>
      ),
    },
    { key: 'payment_details.payment_type', label: 'Payment Type', render: (row) => getPaymentTypeText(row.payment_details.payment_type) },
    { key: 'created_at', label: 'Date', render: (row) => new Date(row.created_at).toLocaleString() },
  ];

  const renderActions = (transition) => (
    <Button
      variant="outline-primary"
      size="sm"
      className="view-btn"
      onClick={() => handleRowClick(transition)}
    >
      <FaEye className="me-1" /> View
    </Button>
  );

  if (loading && !transitions.length) {
    return <Loading />;
  }

  return (
    <div className="transitions-container">
      <Card className="modern-card">
        <Card.Body className="p-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h2 className="page-title mb-1">Transitions</h2>
              <p className="text-muted mb-0">
                Manage and track all payment transitions
              </p>
            </div>
          </div>

          <div className="filters-section mb-4">
            <Row className="g-3">
              <Col md={3}>
                <Form.Select
                  value={searchParams.duration}
                  onChange={handleDurationChange}
                  className="status-filter"
                >
                  <option value="">All Time</option>
                  <option value="today">Today</option>
                  <option value="this_week">This Week</option>
                  <option value="this_month">This Month</option>
                </Form.Select>
              </Col>
              <Col md={3}>
                <div className="date-filter-box">
                  <InputGroup>
                    <InputGroup.Text>
                      <FaCalendarAlt />
                    </InputGroup.Text>
                    <Form.Control
                      type="date"
                      value={searchParams.start_date ? formatDateForAPI(searchParams.start_date) : ''}
                      onChange={(e) => handleDateChange(e, 'start')}
                      className="date-input"
                      max={searchParams.end_date ? formatDateForAPI(searchParams.end_date) : formatDateForAPI(new Date())}
                    />
                    <Form.Control
                      type="date"
                      value={searchParams.end_date ? formatDateForAPI(searchParams.end_date) : ''}
                      onChange={(e) => handleDateChange(e, 'end')}
                      className="date-input"
                      min={searchParams.start_date ? formatDateForAPI(searchParams.start_date) : undefined}
                      max={formatDateForAPI(new Date())}
                    />
                  </InputGroup>
                </div>
              </Col>
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
              <Col md={1}>
                {(searchParams.duration ||
                  searchParams.start_date ||
                  searchParams.end_date) && (
                  <Button
                    variant="outline-secondary"
                    onClick={clearFilters}
                    className="clear-dates-btn w-100"
                  >
                    <FaTimes />
                  </Button>
                )}
              </Col>
            </Row>
          </div>
          
          <CommonTable
            headers={headers}
            data={transitions}
            tableLoading={loading}
            loading={loading}
            renderActions={renderActions}
          />

          {pagination.last_page > 1 && (
            <div className="pagination-container mt-4">
              <Pagination className="modern-pagination">
                {renderPagination()}
              </Pagination>
            </div>
          )}
        </Card.Body>
      </Card>

      <Modal
        show={showPaymentModal}
        onHide={handleCloseModal}
        centered
        className="modern-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>Payment Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedPayment && (
            <div className="payment-details">
              <Card className="border mb-4">
                <Card.Header className="bg-light">
                  <h5 className="mb-0">Basic Information</h5>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={6}>
                      <div className="mb-3">
                        <label className="text-muted d-block mb-1">
                          Transition ID
                        </label>
                        <span className="fw-medium">
                          #{selectedPayment.transition_id}
                        </span>
                      </div>
                      <div className="mb-3">
                        <label className="text-muted d-block mb-1">
                          Payment ID
                        </label>
                        <span className="fw-medium">
                          {selectedPayment.payment_id}
                        </span>
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className="mb-3">
                        <label className="text-muted d-block mb-1">
                          Order ID
                        </label>
                        <span className="fw-medium">
                          {selectedPayment.payment_details.order_id}
                        </span>
                      </div>
                      <div className="mb-3">
                        <label className="text-muted d-block mb-1">Date</label>
                        <span className="fw-medium">
                          {new Date(
                            selectedPayment.created_at
                          ).toLocaleString()}
                        </span>
                      </div>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              <Card className="border">
                <Card.Header className="bg-light">
                  <h5 className="mb-0">Payment Information</h5>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={6}>
                      <div className="mb-3">
                        <label className="text-muted d-block mb-1">
                          Total Amount
                        </label>
                        <span className="fw-medium">
                          ৳
                          {parseFloat(
                            selectedPayment.payment_details.total_amount
                          ).toLocaleString()}
                        </span>
                      </div>
                      <div className="mb-3">
                        <label className="text-muted d-block mb-1">
                          Paid Amount
                        </label>
                        <span className="fw-medium text-success">
                          ৳
                          {parseFloat(
                            selectedPayment.payment_details.padi_amount
                          ).toLocaleString()}
                        </span>
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className="mb-3">
                        <label className="text-muted d-block mb-1">
                          Due Amount
                        </label>
                        <span
                          className={`fw-medium ${
                            parseFloat(
                              selectedPayment.payment_details.due_amount
                            ) > 0
                              ? "text-danger"
                              : "text-success"
                          }`}
                        >
                          ৳
                          {parseFloat(
                            selectedPayment.payment_details.due_amount
                          ).toLocaleString()}
                        </span>
                      </div>
                      <div className="mb-3">
                        <label className="text-muted d-block mb-1">
                          Payment Type
                        </label>
                        <span className="fw-medium">
                          {getPaymentTypeText(
                            selectedPayment.payment_details.payment_type
                          )}
                        </span>
                      </div>
                    </Col>
                  </Row>
                  <Row>
                    <Col md={6}>
                      <div className="mb-3">
                        <label className="text-muted d-block mb-1">
                          Status
                        </label>
                        <span
                          className={`status-badge ${
                            selectedPayment.payment_details.status === "1"
                              ? "active"
                              : "inactive"
                          }`}
                        >
                          {getStatusText(
                            selectedPayment.payment_details.status
                          )}
                        </span>
                      </div>
                    </Col>
                    {selectedPayment.payment_details.trxed && (
                      <Col md={6}>
                        <div className="mb-3">
                          <label className="text-muted d-block mb-1">
                            Transaction ID
                          </label>
                          <span className="fw-medium">
                            {selectedPayment.payment_details.trxed}
                          </span>
                        </div>
                      </Col>
                    )}
                  </Row>
                  {selectedPayment.payment_details.phone && (
                    <Row>
                      <Col md={6}>
                        <div className="mb-3">
                          <label className="text-muted d-block mb-1">
                            Phone
                          </label>
                          <span className="fw-medium">
                            {selectedPayment.payment_details.phone}
                          </span>
                        </div>
                      </Col>
                    </Row>
                  )}
                </Card.Body>
              </Card>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Transitions;