import React, { useState, useEffect } from "react";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaSearch,
  FaSpinner,
  FaTimes,
} from "react-icons/fa";
import { toast } from "react-hot-toast";
import axiosInstance from "../../config/axios";
import {
  Card,
  Form,
  InputGroup,
  Button,
  Row,
  Col,
  Modal,
} from "react-bootstrap";
import Loading from "../../components/Loading";
import "./Categories.css";
import usePageTitle from '../../hooks/usePageTitle';
import CommonTable from "../../components/Common/CommonTable";

const Categories = () => {
  usePageTitle('Manage Categories');
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageLoading, setPageLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });
  const [searchParams, setSearchParams] = useState({
    search: "",
  });
  const [searchTimeout, setSearchTimeout] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        await fetchCategories();
      } finally {
        setPageLoading(false);
      }
    };

    if (pageLoading) {
      loadInitialData();
    } else {
      fetchCategories();
    }
  }, []);

  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    const timeoutId = setTimeout(() => {
      setIsSearching(true);
      fetchCategories();
    }, 500);

    setSearchTimeout(timeoutId);

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [searchParams.search]);

  const fetchCategories = async () => {
    setLoading(true);
    setTableLoading(true);
    try {
      const params = {
        ...(searchParams.search && { search: searchParams.search }),
      };

      const response = await axiosInstance.get("/categories", { params });
      const result = response.data;

      if (!result.success) {
        throw new Error(result.message || "Failed to fetch categories");
      }

      await new Promise((resolve) => setTimeout(resolve, 300));

      setCategories(result.data);
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast.error(
        error.response?.data?.message || "Failed to fetch categories"
      );
      setCategories([]);
    } finally {
      setLoading(false);
      setTableLoading(false);
      setIsSearching(false);
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance.post("/categories", formData);
      fetchCategories();
      setShowModal(false);
      setFormData({ name: "", description: "" });
      toast.success("Category added successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add category");
    }
  };

  const handleEditCategory = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance.put(`/categories/${selectedCategory.id}`, formData);
      fetchCategories();
      setShowModal(false);
      setFormData({ name: "", description: "" });
      setSelectedCategory(null);
      toast.success("Category updated successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update category");
    }
  };

  const handleDeleteCategory = async (id) => {
    if (window.confirm("Are you sure you want to delete this category?")) {
      try {
        setTableLoading(true);
        await axiosInstance.delete(`/categories/${id}`);
        toast.success("Category deleted successfully");
        fetchCategories();
      } catch (error) {
        toast.error(
          error.response?.data?.message || "Failed to delete category"
        );
      } finally {
        setTableLoading(false);
      }
    }
  };

  const handleSearch = (e) => {
    const { value } = e.target;
    setSearchParams((prev) => ({
      ...prev,
      search: value,
    }));
  };

  const openEditModal = (category) => {
    setModalMode("edit");
    setSelectedCategory(category);
    setFormData({
      name: category.name,
      description: category.description,
    });
    setShowModal(true);
  };

  const openAddModal = () => {
    setModalMode("add");
    setSelectedCategory(null);
    setFormData({ name: "", description: "" });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setFormData({ name: "", description: "" });
    setSelectedCategory(null);
  };

  const headers = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name' },
    { key: 'description', label: 'Description' },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <span className={`px-2 py-1 ${row.status === 0 ? "text-success" : "text-secondary"}`}>
          {row.status === 0 ? "Active" : "Inactive"}
        </span>
      ),
    },
  ];

  const renderActions = (category) => (
    <div className="d-flex gap-2">
      <Button
        variant="outline-primary"
        size="sm"
        onClick={() => openEditModal(category)}
        disabled={tableLoading}
        title="Edit"
        className="view-btn"
      >
        <FaEdit />
      </Button>
      <Button
        variant="outline-danger"
        size="sm"
        onClick={() => handleDeleteCategory(category.id)}
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
              <h2 className="page-title mb-1">Categories</h2>
              {loading && tableLoading ? (
                <div className="d-flex align-items-center">
                  <FaSpinner className="spinner-border spinner-border-sm me-2" />
                  <p className="page-subtitle mb-0">Loading categories...</p>
                </div>
              ) : (
                <p className="page-subtitle mb-0">
                  Showing {categories.length} categories
                </p>
              )}
            </div>
            <Button
              variant="primary"
              onClick={openAddModal}
              className="create-category-btn"
            >
              <FaPlus className="me-2" /> Add Category
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
                      placeholder="Search categories..."
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
            data={categories}
            tableLoading={tableLoading}
            loading={loading}
            renderActions={renderActions}
          />
          <Modal show={showModal} onHide={closeModal} centered>
            <Modal.Header closeButton>
              <Modal.Title>
                {modalMode === "add" ? "Add New Category" : "Edit Category"}
              </Modal.Title>
            </Modal.Header>
            <Form
              onSubmit={
                modalMode === "add" ? handleAddCategory : handleEditCategory
              }
            >
              <Modal.Body>
                <Form.Group className="mb-3">
                  <Form.Label>Name</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={3}
                  />
                </Form.Group>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="secondary" onClick={closeModal}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary">
                  {modalMode === "add" ? "Add Category" : "Update Category"}
                </Button>
              </Modal.Footer>
            </Form>
          </Modal>
        </Card.Body>
      </Card>
    </div>
  );
};

export default Categories;