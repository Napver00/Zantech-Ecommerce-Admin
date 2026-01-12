import React, { useState, useEffect } from "react";
import {
  FaPlus,
  FaSpinner,
  FaEye,
  FaEdit,
  FaTrash,
  FaPencilAlt,
  FaChevronDown,
} from "react-icons/fa";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import { Card, Button, Dropdown } from "react-bootstrap";
import axiosInstance from "../../config/axios";
import Loading from "../../components/Loading";
import ProductFilters from "../../components/Products/ProductsList/ProductFilters";
import ProductPagination from "../../components/Products/ProductsList/ProductPagination";
import QuickEditModal from "../../components/Products/ProductsList/QuickEditModal";
import CommonTable from "../../components/Common/CommonTable"; // Import CommonTable
import "./Products.css";
import usePageTitle from "../../hooks/usePageTitle";

const Products = () => {
  usePageTitle("Manage Products");
  const [urlParams, setUrlParams] = useSearchParams();
  const initialPage = parseInt(urlParams.get("page") || "1", 10);

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: initialPage,
    perPage: 5,
    totalPages: 1,
    totalRows: 0,
    hasMorePages: false,
  });
  const [searchParams, setSearchParams] = useState({
    search: "",
    limit: 10,
  });
  const [showQuickEdit, setShowQuickEdit] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    short_description: "",
    quantity: "",
    price: "",
    discount: "0",
  });
  const navigate = useNavigate();
  const [searchTimeout, setSearchTimeout] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [statusToggleLoading, setStatusToggleLoading] = useState({});

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        await fetchProducts(initialPage);
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

      const response = await axiosInstance.get("/products/all", { params });
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
      
      // Sync URL if the fetched page is different (e.g. redirected from invalid page)
      if (result.pagination.current_page !== page) {
         setUrlParams(prev => {
             prev.set("page", result.pagination.current_page.toString());
             return prev;
         });
      }

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

  const handleDeleteProduct = async (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        setTableLoading(true);
        const token = localStorage.getItem("token");

        if (!token) {
          throw new Error(
            "Authentication token not found. Please login again."
          );
        }

        const response = await axiosInstance.delete(`/products/delete/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const result = response.data;

        if (!result.success) {
          throw new Error(result.message || "Failed to delete product");
        }

        await new Promise((resolve) => setTimeout(resolve, 300));

        setProducts(products.filter((prod) => prod.id !== id));
        toast.success("Product deleted successfully");

        if (products.length === 1 && pagination.currentPage > 1) {
          fetchProducts(pagination.currentPage - 1);
        }
      } catch (err) {
        console.error("Error deleting product:", err);
        const errorMessage =
          err.response?.data?.message ||
          err.message ||
          "Failed to delete product";
        toast.error(errorMessage);

        if (err.response?.status === 401) {
          localStorage.removeItem("token");
          navigate("/login");
        }
      } finally {
        setTableLoading(false);
      }
    }
  };

  const handlePageChange = (page) => {
    setUrlParams((prev) => {
      prev.set("page", page.toString());
      return prev;
    });
    fetchProducts(page);
  };

  const handleQuickEdit = (product) => {
    setSelectedProduct(product);
    setEditForm({
      name: product.name || "",
      price: product.price || "",
      quantity: product.quantity || "",
      discount: product.discount?.toString() || "0",
    });
    setShowQuickEdit(true);
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: value === "" ? (name === "discount" ? "0" : value) : value,
    }));
  };

  const handleQuickEditSubmit = async (e) => {
    e.preventDefault();
    setEditLoading(true);

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        toast.error("Authentication token not found. Please login again.");
        navigate("/login");
        return;
      }

      const response = await axiosInstance.put(
        `/products/update/${selectedProduct.id}`,
        editForm,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = response.data;

      if (!result.success) {
        throw new Error(result.message || "Failed to update product");
      }

      setProducts(
        products.map((prod) =>
          prod.id === selectedProduct.id
            ? { ...prod, ...editForm, quantity: parseInt(editForm.quantity) }
            : prod
        )
      );

      toast.success("Product updated successfully");
      setShowQuickEdit(false);
    } catch (err) {
      console.error("Error updating product:", err);
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Failed to update product";
      toast.error(errorMessage);

      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
      }
    } finally {
      setEditLoading(false);
    }
  };

  const handleStatusToggle = async (productId) => {
    if (statusToggleLoading[productId]) return;

    try {
      setStatusToggleLoading((prev) => ({ ...prev, [productId]: true }));
      const token = localStorage.getItem("token");

      if (!token) {
        toast.error("Please login again");
        navigate("/login");
        return;
      }

      const response = await axiosInstance.post(
        `/products/toggle-status/${productId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.data) {
        throw new Error("No response received from server");
      }

      setProducts((prevProducts) =>
        prevProducts.map((prod) =>
          prod.id === productId
            ? { ...prod, status: prod.status === "1" ? "0" : "1" }
            : prod
        )
      );

      toast.success("Status updated successfully");
    } catch (err) {
      console.error("Toggle status error:", {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
      });

      if (err.response?.status === 401) {
        toast.error("Session expired. Please login again");
        localStorage.removeItem("token");
        navigate("/login");
      } else {
        toast.error(err.response?.data?.message || "Failed to update status");
      }
    } finally {
      setStatusToggleLoading((prev) => ({ ...prev, [productId]: false }));
    }
  };

  const headers = [
    { key: "id", label: "ID" },
    {
      key: "image_paths",
      label: "Image",
      render: (row) =>
        row.image_paths && row.image_paths.length > 0 ? (
          <img
            src={row.image_paths[0]}
            alt={row.name}
            className="product-image"
          />
        ) : (
          <div className="no-image-placeholder">
            <span>No image</span>
          </div>
        ),
    },
    { key: "name", label: "Name", render: (row) => <h6>{row.name}</h6> },
    {
      key: "price",
      label: "Price",
      render: (row) => (
        <div>
          <span className="fw-semibold">
            ৳{parseFloat(row.price).toLocaleString()}
          </span>

          {row.discountPercentage > 0 && (
            <>
              <span className="ms-2 text-danger">
                -{parseFloat(row.discountPercentage).toFixed(0)}%
              </span>
              <span className="ms-2 text-success fw-semibold">
                ৳{parseFloat(row.discountedPrice).toLocaleString()}
              </span>
            </>
          )}
        </div>
      ),
    },
    {
      key: "quantity",
      label: "Stock",
      render: (row) => (
        <span
          className={`px-2 py-1 ${
            row.quantity > 0 ? "text-success" : "text-danger"
          }`}
        >
          {row.quantity > 0 ? `${row.quantity} In Stock` : "Out of Stock"}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (row) => (
        <span
          className={`px-2 py-1 status-badge ${
            row.status === "1" ? "text-success" : "text-secondary"
          }`}
          role="button"
          onClick={() => handleStatusToggle(row.id)}
          title="Click to toggle status"
        >
          {statusToggleLoading[row.id] ? (
            <FaSpinner className="spinner-border spinner-border-sm" />
          ) : row.status === "1" ? (
            "Active"
          ) : (
            "Inactive"
          )}
        </span>
      ),
    },
  ];

  const renderActions = (product) => (
    <div className="d-flex gap-2">
      <Button
        variant="outline-primary"
        size="sm"
        onClick={() => navigate(`/products/${product.id}`)}
        title="View"
        disabled={loading}
        className="view-btn"
      >
        <FaEye />
      </Button>
      <Dropdown>
        <Dropdown.Toggle
          variant="outline-primary"
          size="sm"
          disabled={loading}
          className="action-dropdown-toggle"
        >
          <FaEdit /> Edit <FaChevronDown size={10} />
        </Dropdown.Toggle>
        <Dropdown.Menu className="action-dropdown-menu">
          <Dropdown.Item
            onClick={() => handleQuickEdit(product)}
            className="action-dropdown-item"
          >
            <FaPencilAlt className="me-2" /> Quick Edit
          </Dropdown.Item>
          <Dropdown.Item
            onClick={() => navigate(`/products/${product.id}`)}
            className="action-dropdown-item"
          >
            <FaEdit className="me-2" /> Full Edit
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown>
      <Button
        variant="outline-danger"
        size="sm"
        onClick={() => handleDeleteProduct(product.id)}
        title="Delete"
        disabled={loading}
        className="delete-btn"
      >
        {loading ? (
          <FaSpinner className="spinner-border spinner-border-sm" />
        ) : (
          <FaTrash />
        )}
      </Button>
    </div>
  );

  if (pageLoading) {
    return <Loading />;
  }

  return (
    <div className="products-container">
      <Card className="modern-card">
        <Card.Body className="p-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h4 className="page-title mb-1">Products</h4>
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
            <Button
              variant="primary"
              onClick={() => navigate("/products/add")}
              disabled={loading}
              className="add-product-btn"
            >
              {loading ? (
                <FaSpinner className="spinner-border spinner-border-sm me-2" />
              ) : (
                <FaPlus className="me-2" />
              )}{" "}
              Add Product
            </Button>
          </div>

          <ProductFilters
            searchParams={searchParams}
            handleFilterChange={handleFilterChange}
            loading={loading}
            isSearching={isSearching}
            setSearchParams={setSearchParams}
          />

          <QuickEditModal
            show={showQuickEdit}
            handleClose={() => !editLoading && setShowQuickEdit(false)}
            editForm={editForm}
            handleEditFormChange={handleEditFormChange}
            handleSubmit={handleQuickEditSubmit}
            editLoading={editLoading}
          />

          <CommonTable
            headers={headers}
            data={products}
            tableLoading={tableLoading}
            loading={loading}
            renderActions={renderActions}
          />

          <ProductPagination
            pagination={pagination}
            tableLoading={tableLoading}
            handlePageChange={handlePageChange}
          />
        </Card.Body>
      </Card>
    </div>
  );
};

export default Products;
