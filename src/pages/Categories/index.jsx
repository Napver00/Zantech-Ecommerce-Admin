import React, { useState, useEffect } from "react";
import { FaPlus, FaEdit, FaTrash } from "react-icons/fa";
import { toast } from "react-hot-toast";
import axiosInstance from "../../config/axios";
import { Form, Button, Modal } from "react-bootstrap";
import Loading from "../../components/Loading";
import "./Categories.css";
import usePageTitle from '../../hooks/usePageTitle';
import CommonTable from "../../components/Common/CommonTable";
import { ListHeader, ListCard, ListToolbar, SearchBox, ResultCount, Pager, Pill } from "../../components/List/List";

import confirmDialog from "../../utils/confirmDialog";
const Categories = () => {
  usePageTitle('Categories');
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
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [pagination, setPagination] = useState({
    total_rows: 0,
    current_page: 1,
    per_page: 10,
    total_pages: 1,
    has_more_pages: false,
  });

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        await fetchCategories(1);
      } finally {
        setPageLoading(false);
      }
    };

    if (pageLoading) {
      loadInitialData();
    } else {
      fetchCategories(page);
    }
  }, [page, limit]);

  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    const timeoutId = setTimeout(() => {
      setIsSearching(true);
      setPage(1);
      fetchCategories(1);
    }, 500);

    setSearchTimeout(timeoutId);

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [searchParams.search]);

  const fetchCategories = async (pageNum = page) => {
    setLoading(true);
    setTableLoading(true);
    try {
      const params = {
        page: pageNum,
        limit,
        ...(searchParams.search && { search: searchParams.search }),
      };

      const response = await axiosInstance.get("/categories", { params });
      const result = response.data;

      if (!result.success) {
        throw new Error(result.message || "Failed to fetch categories");
      }

      setCategories(result.data);
      setPagination(
        result.pagination || {
          total_rows: result.data.length,
          current_page: pageNum,
          per_page: limit,
          total_pages: 1,
          has_more_pages: false,
        }
      );
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

  const handlePageChange = (p) => {
    if (p < 1 || (pagination && p > pagination.total_pages)) return;
    setPage(p);
  };

  const handleLimitChange = (e) => {
    setLimit(parseInt(e.target.value));
    setPage(1);
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance.post("/categories", formData);
      fetchCategories(page);
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
      fetchCategories(page);
      setShowModal(false);
      setFormData({ name: "", description: "" });
      setSelectedCategory(null);
      toast.success("Category updated successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update category");
    }
  };

  const handleDeleteCategory = async (id) => {
    if (await confirmDialog("Are you sure you want to delete this category?")) {
      try {
        setTableLoading(true);
        await axiosInstance.delete(`/categories/${id}`);
        toast.success("Category deleted successfully");
        fetchCategories(page);
      } catch (error) {
        toast.error(
          error.response?.data?.message || "Failed to delete category"
        );
      } finally {
        setTableLoading(false);
      }
    }
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
    {
      key: 'name',
      label: 'Category',
      render: (row) => (
        <>
          <span className="ls-cell-main">{row.name}</span>
          <span className="ls-cell-sub">#{row.id}</span>
        </>
      ),
    },
    {
      key: 'description',
      label: 'Description',
      render: (row) => (
        <span className="text-muted d-inline-block text-truncate" style={{ maxWidth: 420 }} title={row.description || ''}>
          {row.description || '—'}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (row.status === 0 ? <Pill tone="good">Active</Pill> : <Pill>Inactive</Pill>),
    },
  ];

  const renderActions = (category) => (
    <div className="d-inline-flex gap-1">
      <Button variant="outline-secondary" size="sm" onClick={() => openEditModal(category)}
        disabled={tableLoading} title="Edit" aria-label={`Edit ${category.name}`}>
        <FaEdit />
      </Button>
      <Button variant="outline-danger" size="sm" onClick={() => handleDeleteCategory(category.id)}
        disabled={tableLoading} title="Delete" aria-label={`Delete ${category.name}`}>
        <FaTrash />
      </Button>
    </div>
  );

  if (pageLoading && !categories.length) {
    return <Loading />;
  }

  return (
    <div className="categories-page">
      <ListHeader
        title="Categories"
        subtitle="How products are grouped in the store menu and filters."
        actions={<Button onClick={openAddModal}><FaPlus className="me-2" aria-hidden="true" />New category</Button>}
      />

      <ListCard>
        <ListToolbar end={<ResultCount page={pagination.current_page} perPage={limit} total={pagination.total_rows} noun="categories" />}>
          <SearchBox
            value={searchParams.search}
            onChange={(v) => setSearchParams((prev) => ({ ...prev, search: v }))}
            placeholder="Search categories"
            busy={isSearching}
          />
        </ListToolbar>

        <CommonTable
          headers={headers}
          data={categories}
          tableLoading={tableLoading}
          loading={loading}
          renderActions={renderActions}
          onRowClick={(row) => openEditModal(row)}
          rowLabel={(row) => `Edit ${row.name}`}
          emptyTitle={searchParams.search ? 'No categories match' : 'No categories yet'}
          emptyText={searchParams.search ? `Nothing matches “${searchParams.search}”.` : 'Create a category, then pick it when adding products.'}
          emptyAction={!searchParams.search && <Button size="sm" onClick={openAddModal}><FaPlus className="me-1" /> New category</Button>}
        />

        <Pager
          page={pagination.current_page}
          lastPage={pagination.total_pages}
          onPage={handlePageChange}
          perPage={limit}
          onPerPage={(n) => handleLimitChange({ target: { value: n } })}
        />
      </ListCard>

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
    </div>
  );
};

export default Categories;