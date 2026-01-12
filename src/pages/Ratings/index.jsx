import React, { useState, useEffect } from "react";
import { FaPlus, FaEdit, FaTrash, FaTimes } from "react-icons/fa";
import { toast } from "react-hot-toast";
import axiosInstance, { IMAGE_BASE_URL } from "../../config/axios"; // Import IMAGE_BASE_URL
import { Card, Form, Button, Modal, Pagination, Table, Row, Col } from "react-bootstrap";
import Select from "react-select/async";
import Loading from "../../components/Loading";
import "./Ratings.css";
import usePageTitle from '../../hooks/usePageTitle';
import CommonTable from "../../components/Common/CommonTable";

const Ratings = () => {
  usePageTitle('Manage Ratings');
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    star: "",
    reating: "",
    product_id: "",
  });
  const [searchParams, setSearchParams] = useState({
    page: 1,
    limit: 10,
    status: "",
    star: "",
  });
  const [pagination, setPagination] = useState({
    total_rows: 0,
    current_page: 1,
    per_page: 10,
    total_pages: 1,
    has_more_pages: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusToggleLoading, setStatusToggleLoading] = useState({});

  useEffect(() => {
    fetchRatings();
  }, [searchParams.page, searchParams.limit, searchParams.status, searchParams.star]);

  const fetchRatings = async (page = searchParams.page) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: searchParams.limit,
        ...(searchParams.status && { status: searchParams.status }),
        ...(searchParams.star && { star: searchParams.star }),
      };

      const response = await axiosInstance.get("/ratings", { params });
      if (response.data.success) {
        setRatings(response.data.data);
        if (response.data.pagination) {
          setPagination(response.data.pagination);
        }
      } else {
        throw new Error(response.data.message || "Failed to fetch ratings");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch ratings");
      setRatings([]);
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async (inputValue) => {
    try {
      const response = await axiosInstance.get("/products", {
        params: { search: inputValue },
      });
      return response.data.data.map((product) => ({
        value: product.id,
        label: `${product.name} (৳${product.price})`,
        image: product.image_paths && product.image_paths.length > 0 ? product.image_paths[0] : null,
      }));
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch products");
      return [];
    }
  };

  const handleAddRating = async (e) => {
    e.preventDefault();
    if (!formData.product_id || !formData.star) {
      toast.error("Please select a product and rating");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await axiosInstance.post("/ratings", formData);
      if (response.data.success) {
        setShowModal(false);
        setFormData({ star: "", reating: "", product_id: "" });
        await fetchRatings(1);
        toast.success("Rating added successfully");
      } else {
        throw new Error(response.data.message || "Failed to add rating");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add rating");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (id) => {
    setStatusToggleLoading((prev) => ({ ...prev, [id]: true }));
    try {
      const response = await axiosInstance.patch(`/ratings/toggle-status/${id}`);
      if (response.data.success) {
        setRatings((prevRatings) =>
          prevRatings.map((rating) =>
            rating.id === id ? { ...rating, status: response.data.data.status } : rating
          )
        );
        toast.success("Rating status updated successfully");
      } else {
        throw new Error(response.data.message || "Failed to update rating status");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update rating status");
    } finally {
      setStatusToggleLoading((prev) => ({ ...prev, [id]: false }));
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setSearchParams(prev => ({
      ...prev,
      [name]: value,
      page: 1
    }));
  };

  const renderPagination = () => {
    const items = [];
    const maxPages = 5;
    let startPage = Math.max(1, pagination.current_page - Math.floor(maxPages / 2));
    let endPage = Math.min(pagination.total_pages, startPage + maxPages - 1);

    if (endPage - startPage + 1 < maxPages) {
      startPage = Math.max(1, endPage - maxPages + 1);
    }

    if (startPage > 1) {
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
      items.push(
        <Pagination.Next
          key="next"
          onClick={() => handlePageChange(pagination.current_page + 1)}
          disabled={pagination.current_page === pagination.total_pages}
        />
      );
      items.push(
        <Pagination.Last
          key="last"
          onClick={() => handlePageChange(pagination.total_pages)}
          disabled={pagination.current_page === pagination.total_pages}
        />
      );
    }

    return items;
  };

  const handlePageChange = (page) => {
    setSearchParams((prev) => ({
      ...prev,
      page,
    }));
  };

  const headers = [
    { key: 'id', label: 'ID' },
    {
      key: 'star',
      label: 'Star Rating',
      render: (row) => (
        <div className="d-flex align-items-center gap-1">
          {[...Array(5)].map((_, index) => (
            <span
              key={index}
              style={{
                color: index < row.star ? "#ffc107" : "#e4e5e9",
              }}
            >
              ★
            </span>
          ))}
        </div>
      ),
    },
    { key: 'reating', label: 'Review Text', render: (row) => row.reating || "No review" },
    {
      key: 'product',
      label: 'Product',
      render: (row) => (
        row.product ? (
          <div className="d-flex align-items-center">
            {row.product.image ? (
              <img
                src={row.product.image}
                alt={row.product.name}
                className="product-image"
              />
            ) : (
              <div className="no-image-placeholder">
                <span>No image</span>
              </div>
            )}
            <div>{row.product.name}</div>
          </div>
        ) : (
          "N/A"
        )
      ),
    },
    {
      key: 'user',
      label: 'User',
      render: (row) => (
        row.user ? (
          <div>{row.user.name}</div>
        ) : (
          "N/A"
        )
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <span className={row.status === "1" ? "text-success" : "text-danger"}>
          {row.status === "1" ? "Active" : "Inactive"}
        </span>
      ),
    },
  ];

  const renderActions = (rating) => (
    <Button
      variant={rating.status === "1" ? "outline-danger" : "outline-success"}
      size="sm"
      onClick={() => handleToggleStatus(rating.id)}
      disabled={statusToggleLoading[rating.id]}
      className="view-btn"
    >
      {statusToggleLoading[rating.id]
        ? rating.status === "1"
          ? "Deactivating..."
          : "Activating..."
        : rating.status === "1"
        ? "Deactivate"
        : "Activate"}
    </Button>
  );

  if (loading && ratings.length === 0) {
    return <Loading />;
  }

  return (
    <div className="orders-container">
      <Card className="modern-card">
        <Card.Body className="p-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h2 className="page-title mb-1">Ratings</h2>
              <p className="text-muted mb-0">Manage and track all your product ratings</p>
            </div>
            <Button
              variant="primary"
              className="create-order-btn"
              onClick={() => {
                setFormData({ star: "", reating: "", product_id: "" });
                setShowModal(true);
              }}
            >
              <FaPlus className="me-2" /> Add Rating
            </Button>
          </div>

          <div className="filters-section mb-4">
            <Row className="g-3 align-items-center">
              <Col md={2}>
                <Form.Select
                  className="status-filter"
                  name="star"
                  value={searchParams.star}
                  onChange={handleFilterChange}
                >
                  <option value="">All Stars</option>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <option key={star} value={star}>
                      {star} Star{star > 1 ? "s" : ""}
                    </option>
                  ))}
                </Form.Select>
              </Col>
              <Col md={2}>
                <Form.Select
                  className="status-filter"
                  name="status"
                  value={searchParams.status}
                  onChange={handleFilterChange}
                >
                  <option value="">All Status</option>
                  <option value="1">Active</option>
                  <option value="0">Inactive</option>
                </Form.Select>
              </Col>
              <Col md={2}>
                <Form.Select
                  value={searchParams.limit}
                  onChange={(e) => {
                    setSearchParams(prev => ({
                      ...prev,
                      limit: parseInt(e.target.value),
                      page: 1
                    }));
                  }}
                  className="limit-select"
                >
                  <option value="5">5 per page</option>
                  <option value="10">10 per page</option>
                  <option value="20">20 per page</option>
                  <option value="50">50 per page</option>
                </Form.Select>
              </Col>
            </Row>
          </div>

          <CommonTable
            headers={headers}
            data={ratings}
            tableLoading={loading}
            loading={loading}
            renderActions={renderActions}
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

      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Add New Rating</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleAddRating}>
          <Modal.Body>
            <Row className="g-3">
              <Col md={12}>
                <Form.Group>
                  <Form.Label>Product</Form.Label>
                  <Select
                    cacheOptions
                    defaultOptions
                    loadOptions={loadProducts}
                    onChange={(selectedOption) =>
                      setFormData({
                        ...formData,
                        product_id: selectedOption ? selectedOption.value : "",
                      })
                    }
                    placeholder="Select a product"
                  />
                </Form.Group>
              </Col>
              <Col md={12}>
                <Form.Group>
                  <Form.Label>Star Rating</Form.Label>
                  <Form.Control
                    as="select"
                    name="star"
                    value={formData.star}
                    onChange={(e) =>
                      setFormData({ ...formData, star: e.target.value })
                    }
                    required
                  >
                    <option value="">Select star rating</option>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <option key={star} value={star}>
                        {star} Star{star > 1 ? "s" : ""}
                      </option>
                    ))}
                  </Form.Control>
                </Form.Group>
              </Col>
              <Col md={12}>
                <Form.Group>
                  <Form.Label>Review Text (Optional)</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="reating"
                    value={formData.reating}
                    onChange={(e) =>
                      setFormData({ ...formData, reating: e.target.value })
                    }
                  />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Close
            </Button>
            <Button variant="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Adding..." : "Add Rating"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default Ratings;