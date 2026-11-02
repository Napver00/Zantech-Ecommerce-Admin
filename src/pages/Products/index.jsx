import React, { useState, useEffect } from "react";
import { FaPlus, FaTrash, FaPencilAlt } from "react-icons/fa";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import { Button, Form } from "react-bootstrap";
import axiosInstance from "../../config/axios";
import Loading from "../../components/Loading";
import QuickEditModal from "../../components/Products/ProductsList/QuickEditModal";
import CommonTable from "../../components/Common/CommonTable";
import { ListHeader, ListCard, ListToolbar, SearchBox, ResultCount, Pager, Pill } from "../../components/List/List";
import { taka } from "../../components/List/format";
import "./Products.css";
import usePageTitle from "../../hooks/usePageTitle";

import confirmDialog from "../../utils/confirmDialog";
const Products = () => {
  usePageTitle("Products");
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

  const fetchProducts = async (page = pagination.currentPage, limit = searchParams.limit) => {
    setLoading(true);
    setTableLoading(true);
    try {
      const params = {
        page,
        limit,
        ...(searchParams.search && { search: searchParams.search }),
      };

      const response = await axiosInstance.get("/products/all", { params });
      const result = response.data;

      if (!result.success) {
        throw new Error(result.message || "Failed to fetch products");
      }

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
        perPage: limit,
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

  const handleDeleteProduct = async (id) => {
    if (await confirmDialog("Are you sure you want to delete this product?")) {
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
      quantity: product.quantity ?? "",
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
        products.map((prod) => {
          if (prod.id !== selectedProduct.id) return prod;
          const price = parseFloat(editForm.price) || 0;
          const discount = parseFloat(editForm.discount) || 0;
          return {
            ...prod,
            ...editForm,
            quantity: parseInt(editForm.quantity),
            price,
            discount,
            discountedPrice: price - discount,
            discountPercentage: price > 0 ? (discount / price) * 100 : 0,
          };
        })
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

  const stockPill = (qty) => {
    const n = Number(qty) || 0;
    if (n <= 0) return <Pill tone="bad">Out of stock</Pill>;
    if (n <= 5) return <Pill tone="warn">{n} left</Pill>;
    return <Pill tone="good">{n} in stock</Pill>;
  };

  const headers = [
    {
      key: "name",
      label: "Product",
      render: (row) => (
        <div className="ls-with-thumb">
          {row.image_paths?.length ? (
            <img src={row.image_paths[0]} alt="" className="ls-thumb" loading="lazy" />
          ) : (
            <span className="ls-thumb is-empty">No photo</span>
          )}
          <span className="min-w-0">
            <span className="ls-cell-main text-truncate d-block" style={{ maxWidth: 340 }} title={row.name}>{row.name}</span>
            <span className="ls-cell-sub">#{row.id}{Number(row.is_bundle) === 1 ? " · Bundle" : ""}</span>
          </span>
        </div>
      ),
    },
    {
      key: "price",
      label: "Price",
      align: "end",
      nowrap: true,
      render: (row) => {
        const hasDiscount = Number(row.discountPercentage) > 0;
        return (
          <>
            <span className="ls-money d-block">{taka(hasDiscount ? row.discountedPrice : row.price)}</span>
            {hasDiscount && (
              <span className="ls-cell-sub">
                <s>{taka(row.price)}</s> −{Math.round(row.discountPercentage)}%
              </span>
            )}
          </>
        );
      },
    },
    { key: "quantity", label: "Stock", render: (row) => stockPill(row.quantity) },
    {
      key: "status",
      label: "In store",
      render: (row) => (
        <Form.Check
          type="switch"
          id={`product-shown-${row.id}`}
          checked={row.status === "1"}
          disabled={!!statusToggleLoading[row.id]}
          onChange={() => handleStatusToggle(row.id)}
          label={<span className="small text-muted">{row.status === "1" ? "Shown" : "Hidden"}</span>}
          aria-label={`Show ${row.name} in the store`}
        />
      ),
    },
  ];

  const renderActions = (product) => (
    <div className="d-inline-flex gap-1">
      <Button variant="outline-secondary" size="sm" onClick={() => handleQuickEdit(product)}
        title="Quick edit price and stock" aria-label={`Quick edit ${product.name}`}>
        <FaPencilAlt />
      </Button>
      <Button variant="outline-danger" size="sm" onClick={() => handleDeleteProduct(product.id)}
        title="Delete" aria-label={`Delete ${product.name}`}>
        <FaTrash />
      </Button>
    </div>
  );

  if (pageLoading && !products.length) {
    return <Loading />;
  }

  return (
    <div className="products-page">
      <ListHeader
        title="Products"
        subtitle="Everything in the store. Open a product to edit its photos, categories and description."
        actions={
          <Button onClick={() => navigate("/products/add")}>
            <FaPlus className="me-2" aria-hidden="true" />New product
          </Button>
        }
      />

      <QuickEditModal
        show={showQuickEdit}
        handleClose={() => !editLoading && setShowQuickEdit(false)}
        editForm={editForm}
        handleEditFormChange={handleEditFormChange}
        handleSubmit={handleQuickEditSubmit}
        editLoading={editLoading}
      />

      <ListCard>
        <ListToolbar
          end={<ResultCount page={pagination.currentPage} perPage={pagination.perPage || searchParams.limit} total={pagination.totalRows} noun="products" />}
        >
          <SearchBox
            value={searchParams.search}
            onChange={(v) => setSearchParams((prev) => ({ ...prev, search: v }))}
            placeholder="Search products by name"
            busy={isSearching}
          />
        </ListToolbar>

        <CommonTable
          headers={headers}
          data={products}
          tableLoading={tableLoading}
          loading={loading}
          renderActions={renderActions}
          onRowClick={(row) => navigate(`/products/${row.id}`)}
          rowLabel={(row) => `Open ${row.name}`}
          emptyTitle={searchParams.search ? "No products match" : "No products yet"}
          emptyText={searchParams.search ? `Nothing matches “${searchParams.search}”.` : "Add your first product to start selling."}
          emptyAction={
            searchParams.search ? (
              <Button variant="outline-secondary" size="sm" onClick={() => setSearchParams((prev) => ({ ...prev, search: "" }))}>Clear search</Button>
            ) : (
              <Button size="sm" onClick={() => navigate("/products/add")}><FaPlus className="me-1" /> New product</Button>
            )
          }
        />

        <Pager
          page={pagination.currentPage}
          lastPage={pagination.totalPages}
          onPage={handlePageChange}
          perPage={searchParams.limit}
          onPerPage={(limit) => {
            setSearchParams((prev) => ({ ...prev, limit }));
            fetchProducts(1, limit);
          }}
        />
      </ListCard>
    </div>
  );
};

export default Products;
