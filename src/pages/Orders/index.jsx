import React, { useState, useEffect } from "react";
import {
  FaSearch,
  FaSpinner,
  FaEye,
  FaTimes,
  FaPlus,
  FaCalendarAlt,
} from "react-icons/fa";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import axiosInstance from "../../config/axios";
import {
  Card,
  Form,
  InputGroup,
  Button,
  Pagination,
  Row,
  Col,
} from "react-bootstrap";
import Loading from "../../components/Loading";
import "./Orders.css";
import usePageTitle from "../../hooks/usePageTitle";
import CommonTable from "../../components/Common/CommonTable";

const Orders = () => {
  usePageTitle("Manage Orders");
  const navigate = useNavigate();
  const [urlSearchParams, setUrlSearchParams] = useSearchParams();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Initialize state from URL params
  const [searchParams, setSearchParams] = useState({
    search: urlSearchParams.get("search") || "",
    page: parseInt(urlSearchParams.get("page")) || 1,
    limit: parseInt(urlSearchParams.get("limit")) || 10,
    startDate: urlSearchParams.get("startDate")
      ? new Date(urlSearchParams.get("startDate"))
      : null,
    endDate: urlSearchParams.get("endDate")
      ? new Date(urlSearchParams.get("endDate"))
      : null,
  });

  const [pagination, setPagination] = useState({
    total: 0,
    current_page: 1,
    per_page: 10,
    last_page: 1,
    from: 0,
    to: 0,
  });
  const [searchTimeout, setSearchTimeout] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState({});
  const [filterStatus, setFilterStatus] = useState(
    urlSearchParams.get("status") || ""
  );

  // Update URL when state changes
  useEffect(() => {
    const params = {};
    if (searchParams.search) params.search = searchParams.search;
    if (searchParams.page > 1) params.page = searchParams.page;
    if (searchParams.limit !== 10) params.limit = searchParams.limit;
    if (searchParams.startDate)
      params.startDate = searchParams.startDate.toISOString();
    if (searchParams.endDate)
      params.endDate = searchParams.endDate.toISOString();
    if (filterStatus) params.status = filterStatus;

    setUrlSearchParams(params);
    fetchOrders();
  }, [
    searchParams.page,
    searchParams.limit,
    searchParams.startDate,
    searchParams.endDate,
    filterStatus,
  ]);

  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    const timeoutId = setTimeout(() => {
      if (searchParams.search !== "") {
        setIsSearching(true);
        fetchOrders(1);
      }
    }, 500);

    setSearchTimeout(timeoutId);

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [searchParams.search]);

  const fetchOrders = async (page = searchParams.page) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: searchParams.limit,
        ...(searchParams.search && { search: searchParams.search }),
        ...(searchParams.startDate && {
          start_date: searchParams.startDate.toISOString().split("T")[0],
        }),
        ...(searchParams.endDate && {
          end_date: searchParams.endDate.toISOString().split("T")[0],
        }),
      };

      const response = await axiosInstance.get("/orders", { params });
      const result = response.data;

      if (!result.success) {
        throw new Error(result.message || "Failed to fetch orders");
      }

      setOrders(result.data);
      if (result.pagination) {
        setPagination(result.pagination);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error(error.response?.data?.message || "Failed to fetch orders");
      setOrders([]);
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
    window.scrollTo(0, 0);
  };

  const handleLimitChange = (e) => {
    const limit = parseInt(e.target.value);
    setSearchParams((prev) => ({
      ...prev,
      limit,
      page: 1,
    }));
  };

  const handleFilterStatusChange = (e) => {
    setFilterStatus(e.target.value);
  };

  const handleDateChange = (e, type) => {
    const value = e.target.value ? new Date(e.target.value) : null;

    if (
      type === "start" &&
      value &&
      searchParams.endDate &&
      value > searchParams.endDate
    ) {
      toast.error("Start date cannot be after end date");
      return;
    }

    if (
      type === "end" &&
      value &&
      searchParams.startDate &&
      value < searchParams.startDate
    ) {
      toast.error("End date cannot be before start date");
      return;
    }

    setSearchParams((prev) => ({
      ...prev,
      [type === "start" ? "startDate" : "endDate"]: value,
      page: 1,
    }));
  };

  const clearDateFilter = () => {
    setSearchParams((prev) => ({
      ...prev,
      startDate: null,
      endDate: null,
      page: 1,
    }));
  };

  const filteredOrders = filterStatus
    ? orders.filter((order) => order.status?.toString() === filterStatus)
    : orders;

  const handleStatusChange = async (orderId, newStatus) => {
    setUpdatingStatus((prev) => ({ ...prev, [orderId]: true }));
    try {
      const response = await axiosInstance.put(
        `/orders/update-status/${orderId}`,
        {
          status: parseInt(newStatus),
        }
      );

      console.log("API Response:", response.data);

      if (response.data.success) {
        toast.success(
          response.data.message || "Order status updated successfully"
        );
        setOrders((prev) =>
          prev.map((order) =>
            order.order_id === orderId
              ? {
                  ...order,
                  status: response.data.data.new_status.toString(),
                  status_change_desc: response.data.data.status_change_desc,
                }
              : order
          )
        );
      } else {
        throw new Error(response.data.message || "Failed to update status");
      }
    } catch (error) {
      console.error("Status update error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        headers: error.response?.headers,
      });

      if (error.response) {
        toast.error(
          error.response.data?.message ||
            `Error ${error.response.status}: ${error.response.statusText}`
        );
      } else if (error.request) {
        toast.error(
          "No response received from server. Please check your internet connection."
        );
      } else {
        toast.error(
          error.message || "Something went wrong while updating the status"
        );
      }
    } finally {
      setUpdatingStatus((prev) => ({ ...prev, [orderId]: false }));
    }
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

    if (endPage < pagination.last_page) {
      if (endPage < pagination.last_page - 1) {
        items.push(<Pagination.Ellipsis key="ellipsis2" disabled />);
      }
      items.push(
        <Pagination.Item
          key={pagination.last_page}
          onClick={() => handlePageChange(pagination.last_page)}
        >
          {pagination.last_page}
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

    return items;
  };

  const headers = [
    { key: "order_id", label: "Order ID", render: (row) => `#${row.order_id}` },
    { key: "invoice_code", label: "Invoice Code" },
    {
      key: "customer_info",
      label: "Customer Info",
      render: (row) => (
        <div className="customer-info">
          <div className="customer-name">{row.user_name}</div>
          <div className="customer-phone text-muted">
            <small>📞 {row.user_phone}</small>
          </div>
          <div className="customer-email text-muted">
            <small>✉️ {row.user_email}</small>
          </div>
        </div>
      ),
    },
    {
      key: "total_amount",
      label: "Total Amount",
      render: (row) => `৳${parseFloat(row.total_amount).toLocaleString()}`,
    },
    {
      key: "paid_amount",
      label: "Paid Amount",
      render: (row) => (
        <span className="text-success">
          ৳{parseFloat(row.paid_amount || 0).toLocaleString()}
        </span>
      ),
    },
    {
      key: "due_amount",
      label: "Due Amount",
      render: (row) => (
        <span
          className={
            parseFloat(row.due_amount || 0) > 0 ? "text-danger" : "text-success"
          }
        >
          ৳{parseFloat(row.due_amount || 0).toLocaleString()}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (row) => (
        <Form.Select
          value={row.status?.toString() || "0"}
          onChange={(e) => handleStatusChange(row.order_id, e.target.value)}
          disabled={updatingStatus[row.order_id]}
          size="sm"
          className="status-select"
        >
          <option value="0">On Processing</option>
          <option value="1">Completed</option>
          <option value="2">On Hold</option>
          <option value="3">Cancelled</option>
          <option value="4">Refunded</option>
        </Form.Select>
      ),
    },
    {
      key: "order_placed_date_time",
      label: "Order Date",
      render: (row) => new Date(row.order_placed_date_time).toLocaleString(),
    },
  ];

  const renderActions = (order) => (
    <Button
      variant="outline-primary"
      size="sm"
      className="view-btn"
      onClick={() => navigate(`/orders/${order.order_id}`)}
    >
      <FaEye className="me-1" /> View
    </Button>
  );

  if (loading && !orders.length) {
    return <Loading />;
  }

  return (
    <div className="orders-container">
      <Card className="modern-card">
        <Card.Body className="p-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h2 className="page-title mb-1">Orders</h2>
              <p className="text-muted mb-0">
                Manage and track all your orders
              </p>
            </div>
            <div className="d-flex gap-2">
              <Button
                variant="info"
                onClick={() => navigate("/orders/custom-invoice")}
                className="create-order-btn"
              >
                <FaPlus className="me-2" /> Custom Invoice
              </Button>
              <Button
                variant="primary"
                onClick={() => navigate("/orders/create")}
                className="create-order-btn"
              >
                <FaPlus className="me-2" /> Create Order
              </Button>
            </div>
          </div>

          <div className="filters-section mb-4">
            <Row className="g-3">
              <Col md={3}>
                <div className="search-box">
                  <InputGroup>
                    <InputGroup.Text className="search-icon">
                      {isSearching ? (
                        <FaSpinner className="spinner" />
                      ) : (
                        <FaSearch />
                      )}
                    </InputGroup.Text>
                    <Form.Control
                      type="text"
                      placeholder="Search orders..."
                      value={searchParams.search}
                      onChange={handleSearch}
                      className="search-input"
                    />
                    {searchParams.search && (
                      <Button
                        variant="link"
                        className="clear-search"
                        onClick={() => {
                          setSearchParams((prev) => ({ ...prev, search: "" }));
                          fetchOrders(1);
                        }}
                      >
                        <FaTimes />
                      </Button>
                    )}
                  </InputGroup>
                </div>
              </Col>
              <Col md={3}>
                <div className="date-filter-box">
                  <InputGroup>
                    <InputGroup.Text>
                      <FaCalendarAlt />
                    </InputGroup.Text>
                    <Form.Control
                      type="date"
                      value={
                        searchParams.startDate
                          ? searchParams.startDate.toISOString().split("T")[0]
                          : ""
                      }
                      onChange={(e) => handleDateChange(e, "start")}
                      className="date-input"
                      max={
                        searchParams.endDate
                          ? searchParams.endDate.toISOString().split("T")[0]
                          : new Date().toISOString().split("T")[0]
                      }
                    />
                    <Form.Control
                      type="date"
                      value={
                        searchParams.endDate
                          ? searchParams.endDate.toISOString().split("T")[0]
                          : ""
                      }
                      onChange={(e) => handleDateChange(e, "end")}
                      className="date-input"
                      min={
                        searchParams.startDate
                          ? searchParams.startDate.toISOString().split("T")[0]
                          : undefined
                      }
                      max={new Date().toISOString().split("T")[0]}
                    />
                  </InputGroup>
                </div>
              </Col>
              <Col md={2}>
                <Form.Select
                  value={filterStatus}
                  onChange={handleFilterStatusChange}
                  className="status-filter"
                >
                  <option value="">All Statuses</option>
                  <option value="0">On Processing</option>
                  <option value="1">Completed</option>
                  <option value="2">On Hold</option>
                  <option value="3">Cancelled</option>
                  <option value="4">Refunded</option>
                </Form.Select>
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
            data={filteredOrders}
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
    </div>
  );
};

export default Orders;
