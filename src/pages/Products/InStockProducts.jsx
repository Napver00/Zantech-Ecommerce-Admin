import React, { useState, useEffect } from "react";
import {
  FaSpinner,
  FaChevronLeft,
  FaChevronRight,
  FaSearch,
  FaTimes,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  Card,
  Pagination,
  Form,
  InputGroup,
  Button,
  Row,
  Col,
} from "react-bootstrap";
import axiosInstance from "../../config/axios";
import Loading from "../../components/Loading";
import usePageTitle from '../../hooks/usePageTitle';
import "./Products.css";

const InStockProducts = () => {
  usePageTitle('In Stock Products');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    perPage: 5,
    totalPages: 1,
    totalRows: 0,
    hasMorePages: false,
  });
  const [searchParams, setSearchParams] = useState({
    search: "",
    limit: 10,
  });
  const navigate = useNavigate();
  const [searchTimeout, setSearchTimeout] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        await fetchProducts();
      } finally {
        setPageLoading(false);
      }
    };

    loadInitialData();
  }, []);

  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    const timeoutId = setTimeout(() => {
      if (searchParams.search !== "") {
        setIsSearching(true);
        fetchProducts(1);
      } else if (searchParams.search === "" && !pageLoading) {
        fetchProducts(1);
      }
    }, 500);

    setSearchTimeout(timeoutId);

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [searchParams.search]);

  const fetchProducts = async (page = pagination.currentPage) => {
    setLoading(true);
    setTableLoading(true);
    try {
      const params = {
        page,
        limit: searchParams.limit,
        ...(searchParams.search && { search: searchParams.search }),
      };

      const response = await axiosInstance.get("/in-stock-products", {
        params,
      });
      const result = response.data;

      if (!result.success) {
        throw new Error(result.message || "Failed to fetch products");
      }

      await new Promise((resolve) => setTimeout(resolve, 300));

      setProducts(result.data);
      setPagination({
        currentPage: result.pagination.current_page,
        perPage: result.pagination.per_page,
        totalPages: result.pagination.total_pages,
        totalRows: result.pagination.total_rows,
        hasMorePages: result.pagination.has_more_pages,
      });
    } catch (err) {
      console.error("Error fetching products:", err);
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Failed to fetch products";
      toast.error(errorMessage);

      setProducts([]);
      setPagination({
        currentPage: page,
        perPage: searchParams.limit,
        totalPages: 1,
        totalRows: 0,
        hasMorePages: false,
      });
    } finally {
      setLoading(false);
      setTableLoading(false);
      setIsSearching(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setSearchParams((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
  };

  const handlePageChange = (page) => {
    fetchProducts(page);
  };

  const renderPagination = () => {
    const items = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(
      1,
      pagination.currentPage - Math.floor(maxVisiblePages / 2)
    );
    let endPage = Math.min(
      pagination.totalPages,
      startPage + maxVisiblePages - 1
    );

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    items.push(
      <Pagination.Prev
        key="prev"
        onClick={() => handlePageChange(pagination.currentPage - 1)}
        disabled={pagination.currentPage === 1}
      >
        <FaChevronLeft size={12} />
      </Pagination.Prev>
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
          active={number === pagination.currentPage}
          onClick={() => handlePageChange(number)}
        >
          {number}
        </Pagination.Item>
      );
    }

    if (endPage < pagination.totalPages) {
      if (endPage < pagination.totalPages - 1) {
        items.push(<Pagination.Ellipsis key="ellipsis2" disabled />);
      }
      items.push(
        <Pagination.Item
          key={pagination.totalPages}
          onClick={() => handlePageChange(pagination.totalPages)}
        >
          {pagination.totalPages}
        </Pagination.Item>
      );
    }

    items.push(
      <Pagination.Next
        key="next"
        onClick={() => handlePageChange(pagination.currentPage + 1)}
        disabled={!pagination.hasMorePages}
      >
        <FaChevronRight size={12} />
      </Pagination.Next>
    );

    return items;
  };

  if (pageLoading) {
    return <Loading />;
  }

  return (
    <div className="products-container">
      <Card className="modern-card">
        <Card.Body className="p-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h4 className="page-title mb-1">In Stock Products</h4>
              {loading && tableLoading ? (
                <div className="d-flex align-items-center">
                  <FaSpinner className="spinner-border spinner-border-sm me-2" />
                  <p className="page-subtitle mb-0">Loading products...</p>
                </div>
              ) : (
                <p className="page-subtitle mb-0">
                  Showing {products.length} of {pagination.totalRows} products
                </p>
              )}
            </div>
          </div>

          <div className="filters-section mb-4">
            <Row className="g-3 align-items-center">
              <Col md={4}>
                <Form onSubmit={handleSearch}>
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
                      placeholder="Search products..."
                      name="search"
                      value={searchParams.search}
                      onChange={handleFilterChange}
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
              <Col md={8} className="d-flex justify-content-end gap-2">
                <Form.Select
                  name="limit"
                  value={searchParams.limit}
                  onChange={handleFilterChange}
                  disabled={loading}
                  style={{ width: "auto" }}
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

          <div className="table-container position-relative">
            {tableLoading && (
              <div
                className="position-absolute w-100 h-100 d-flex justify-content-center align-items-center"
                style={{
                  top: 0,
                  left: 0,
                  backgroundColor: "rgba(255, 255, 255, 0.8)",
                  zIndex: 1000,
                  backdropFilter: "blur(2px)",
                }}
              >
                <div className="text-center">
                  <Loading />
                  <p className="text-muted mt-2 mb-0">
                    {loading ? "Loading products..." : "Updating products..."}
                  </p>
                </div>
              </div>
            )}

            {loading && !tableLoading ? (
              <div className="text-center py-5">
                <Loading />
                <p className="text-muted mt-3 mb-0">Loading products...</p>
              </div>
            ) : products.length > 0 ? (
              <div className="table-responsive">
                <table className="table table-hover align-middle modern-table">
                  <thead className="bg-light">
                    <tr>
                      <th>ID</th>
                      <th>Image</th>
                      <th>Name</th>
                      <th>Price</th>
                      <th>Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => (
                      <tr key={product.id}>
                        <td data-label="ID">{product.id}</td>
                        <td data-label="Image">
                          {product.image_paths &&
                          product.image_paths.length > 0 ? (
                            <img
                              src={product.image_paths[0]}
                              alt={product.name}
                              className="product-image"
                            />
                          ) : (
                            <div className="no-image-placeholder">
                              <span>No image</span>
                            </div>
                          )}
                        </td>
                        <td data-label="Name">
                          <div>
                            <h6 className="mb-0">{product.name}</h6>
                          </div>
                        </td>
                        <td data-label="Price">
                          <div>
                            <span className="fw-semibold">
                              ৳{parseFloat(product.price).toLocaleString()}
                            </span>
                            {product.discount > 0 && (
                              <span className="ms-2 text-danger">
                                -{parseFloat(product.discount).toFixed(0)}%
                              </span>
                            )}
                          </div>
                        </td>
                        <td data-label="Stock">
                          <span
                            className={`px-2 py-1 ${
                              product.quantity > 0
                                ? "text-success"
                                : "text-danger"
                            }`}
                          >
                            {product.quantity > 0
                              ? `${product.quantity} In Stock`
                              : "Out of Stock"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-5">
                <p className="text-muted mb-0">No products found</p>
              </div>
            )}
          </div>

          {pagination.totalPages > 1 && (
            <div className="pagination-container mt-4 position-relative">
              {tableLoading && (
                <div
                  className="position-absolute w-100 h-100 d-flex justify-content-center align-items-center"
                  style={{
                    top: 0,
                    left: 0,
                    backgroundColor: "rgba(255, 255, 255, 0.8)",
                    zIndex: 1000,
                    backdropFilter: "blur(2px)",
                  }}
                >
                  <div className="text-center">
                    <Loading />
                    <p className="text-muted mt-2 mb-0">Changing page...</p>
                  </div>
                </div>
              )}
              <Pagination className="mb-0 modern-pagination">
                {renderPagination()}
              </Pagination>
            </div>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default InStockProducts;
