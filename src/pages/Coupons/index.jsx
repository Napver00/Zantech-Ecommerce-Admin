import React, { useState, useEffect } from "react";
import { FaPlus, FaEdit, FaTrash } from "react-icons/fa";
import { toast } from "react-hot-toast";
import axiosInstance from "@/config/axios";
import { Form, Button, Modal, Row, Col, ListGroup, Badge } from "react-bootstrap";
import AsyncSelect from "react-select/async";
import "./Coupons.css";
import Loading from "@/components/Loading";
import usePageTitle from '@/hooks/usePageTitle';
import CommonTable from "@/components/Common/CommonTable";
import { ListHeader, ListCard, ListToolbar, SearchBox, ResultCount, Pager, Pill } from "@/components/List/List";
import { shortDate } from "@/components/List/format";

import confirmDialog from "../../utils/confirmDialog";
const Coupons = () => {
  usePageTitle('Coupons');
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageLoading, setPageLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [formData, setFormData] = useState({
    code: "",
    amount: "",
    type: "percent",
    min_pur: "",
    is_global: 1,
    max_usage: "",
    max_usage_per_user: "",
    start_date: "",
    end_date: "",
    status: 1,
  });
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [searchParams, setSearchParams] = useState({
    search: "",
    page: 1,
    limit: 10,
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

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        await fetchCoupons();
      } finally {
        setPageLoading(false);
      }
    };

    if (pageLoading) {
      loadInitialData();
    } else {
      fetchCoupons();
    }
  }, [searchParams.page, searchParams.limit]);

  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    const timeoutId = setTimeout(() => {
      if (searchParams.search !== "") {
        setIsSearching(true);
        fetchCoupons(1);
      } else if (searchParams.search === "" && !pageLoading) {
        fetchCoupons(1);
      }
    }, 500);

    setSearchTimeout(timeoutId);

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [searchParams.search]);

  const fetchCoupons = async (page = pagination.current_page) => {
    setLoading(true);
    setTableLoading(true);
    try {
      const params = {
        page,
        limit: searchParams.limit,
        ...(searchParams.search && { search: searchParams.search }),
      };

      const response = await axiosInstance.get("/coupons", { params });
      const result = response.data;

      if (result.success) {
        setCoupons(result.data);
        if (result.pagination) {
          setPagination({
            total: result.pagination.total ?? result.pagination.total_rows,
            current_page: result.pagination.current_page,
            per_page: result.pagination.per_page,
            last_page: result.pagination.last_page ?? result.pagination.total_pages,
            from: result.pagination.from || 0,
            to: result.pagination.to || 0,
          });
        } else {
          setPagination(prev => ({
            ...prev,
            current_page: page,
            total: result.data.length,
            last_page: page,
            from: ((page - 1) * searchParams.limit) + 1,
            to: ((page - 1) * searchParams.limit) + result.data.length,
          }));
        }
      } else {
        throw new Error(result.message || "Failed to fetch coupons");
      }
      await new Promise(resolve => setTimeout(resolve, 300));
    } catch (error) {
      console.error("Error fetching coupons:", error);
      toast.error(error.response?.data?.message || "Failed to fetch coupons");
      setCoupons([]);
      setPagination(prev => ({
        ...prev,
        current_page: page,
        total: 0,
        last_page: 1,
        from: 0,
        to: 0,
      }));
    } finally {
      setLoading(false);
      setTableLoading(false);
      setIsSearching(false);
    }
  };

  const loadProducts = async (inputValue) => {
    try {
      const response = await axiosInstance.get("/products", {
        params: { search: inputValue, limit: 10 },
      });
      return response.data.data.map((product) => ({
        value: product.id,
        label: `${product.name} (৳${product.price})`,
      }));
    } catch {
      toast.error("Failed to fetch products");
      return [];
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddCoupon = async (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      is_global: formData.is_global ? 1 : 0,
    };

    if (!payload.is_global) {
      payload.item_ids = selectedProducts.map(p => p.value);
    }


    try {
      const response = await axiosInstance.post("/coupons", payload);
      if (response.data.success) {
        fetchCoupons(pagination.current_page);
        setShowModal(false);
        resetModal();
        toast.success("Coupon added successfully");
      } else {
        throw new Error(response.data.message || "Failed to add coupon");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add coupon");
    }
  };

  const handleEditCoupon = async (e) => {
    e.preventDefault();

    const payload = {
        ...formData,
        is_global: formData.is_global ? 1 : 0,
    }
    delete payload.items;


    try {
      const response = await axiosInstance.put(
        `/coupons/${selectedCoupon.id}`,
        payload
      );
      if (response.data.success) {
        if (!formData.is_global) {
            const originalItems = selectedCoupon.items.map(item => item.id);
            const newItems = selectedProducts.map(item => item.value);

            const itemsToAdd = newItems.filter(id => !originalItems.includes(id));
            const itemsToRemove = originalItems.filter(id => !newItems.includes(id));

            if (itemsToAdd.length > 0) {
                await axiosInstance.post(`/coupons/add-items/${selectedCoupon.id}`, { item_ids: itemsToAdd });
            }
            if (itemsToRemove.length > 0) {
                for (const itemId of itemsToRemove) {
                    await axiosInstance.post(`/coupons/remove-items/${selectedCoupon.id}`, { item_id: itemId });
                }
            }
        }


        fetchCoupons(pagination.current_page);
        setShowModal(false);
        resetModal();
        toast.success("Coupon updated successfully");
      } else {
        throw new Error(response.data.message || "Failed to update coupon");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update coupon");
    }
  };

  const handleDeleteCoupon = async (id) => {
    if (await confirmDialog("Are you sure you want to delete this coupon?")) {
      try {
        setTableLoading(true);
        const response = await axiosInstance.delete(`/coupons/${id}`);
        if (response.data.success) {
          toast.success("Coupon deleted successfully");
          fetchCoupons(coupons.length === 1 && pagination.current_page > 1 ? pagination.current_page - 1 : pagination.current_page);
        } else {
          throw new Error(response.data.message || "Failed to delete coupon");
        }
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to delete coupon");
      } finally {
        setTableLoading(false);
      }
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      const response = await axiosInstance.patch(`/coupons/toggle-status/${id}`);
      if (response.data.success) {
        toast.success("Status updated successfully");
        fetchCoupons(pagination.current_page);
      } else {
        throw new Error(response.data.message || "Failed to toggle status");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to toggle status");
    }
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

  const openEditModal = (coupon) => {
    setModalMode("edit");
    setSelectedCoupon(coupon);
    setFormData({
      code: coupon.code,
      amount: coupon.amount,
      type: coupon.type,
      min_pur: coupon.min_pur || "",
      is_global: coupon.is_global,
      max_usage: coupon.max_usage,
      max_usage_per_user: coupon.max_usage_per_user,
      start_date: coupon.start_date,
      end_date: coupon.end_date,
      status: coupon.status,
    });
    if (coupon.items && coupon.items.length > 0) {
      setSelectedProducts(coupon.items.map(item => ({ value: item.id, label: item.name })));
    }
    setShowModal(true);
  };

  const openAddModal = () => {
    setModalMode("add");
    setSelectedCoupon(null);
    resetModal(true); // Keep modal open
    setShowModal(true);
  };

  const resetModal = (keepOpen = false) => {
    if (!keepOpen) setShowModal(false);
    setFormData({ code: "", amount: "", type: "percent", min_pur: "", is_global: 1, max_usage: "", max_usage_per_user: "", start_date: "", end_date: "", status: 1 });
    setSelectedCoupon(null);
    setSelectedProducts([]);
  };

  const closeModal = () => {
    resetModal();
  };


  const openViewModal = (coupon) => {
    setSelectedCoupon(coupon);
    setShowViewModal(true);
  };

  const closeViewModal = () => {
    setShowViewModal(false);
    setSelectedCoupon(null);
  }

  // Helper function to format currency
  const formatCurrency = (value) => {
    if (value === null || value === undefined) return 'N/A';
    return `৳${parseFloat(value).toLocaleString()}`;
  };

  // Where a coupon stands today: scheduled, running, ended or switched off.
  const couponState = (c) => {
    if (!c.status) return { tone: "muted", label: "Off" };
    const today = new Date().toISOString().slice(0, 10);
    if (c.start_date && c.start_date > today) return { tone: "info", label: "Scheduled" };
    if (c.end_date && c.end_date < today) return { tone: "bad", label: "Expired" };
    return { tone: "good", label: "Running" };
  };

  const discountText = (c) =>
    c.type === "percent" ? `${parseFloat(c.amount)}% off` : `${formatCurrency(c.amount)} off`;

  const headers = [
    {
      key: 'code',
      label: 'Coupon',
      render: (row) => (
        <>
          <span className="ls-cell-main coupon-code">{row.code}</span>
          <span className="ls-cell-sub">{discountText(row)}{Number(row.min_pur) > 0 ? ` · on orders over ${formatCurrency(row.min_pur)}` : ''}</span>
        </>
      ),
    },
    {
      key: 'dates',
      label: 'Valid',
      render: (row) => {
        const s = couponState(row);
        return (
          <>
            <Pill tone={s.tone}>{s.label}</Pill>
            <span className="ls-cell-sub mt-1">{shortDate(row.start_date)} – {shortDate(row.end_date)}</span>
          </>
        );
      },
    },
    {
      key: 'total_orders',
      label: 'Used',
      align: 'end',
      nowrap: true,
      render: (row) => (
        <>
          <span className="ls-money d-block">{Number(row.total_orders || 0).toLocaleString()} {Number(row.total_orders) === 1 ? 'order' : 'orders'}</span>
          <span className="ls-cell-sub">{formatCurrency(row.total_sales || 0)} sales</span>
        </>
      ),
    },
    {
      key: 'status',
      label: 'On',
      render: (row) => (
        <Form.Check
          type="switch"
          id={`coupon-on-${row.id}`}
          checked={!!row.status}
          onChange={() => handleToggleStatus(row.id)}
          aria-label={`Coupon ${row.code} on or off`}
        />
      ),
    },
  ];

  const renderActions = (coupon) => (
    <div className="d-inline-flex gap-1">
      <Button variant="outline-secondary" size="sm" onClick={() => openEditModal(coupon)}
        disabled={tableLoading} title="Edit" aria-label={`Edit ${coupon.code}`}>
        <FaEdit />
      </Button>
      <Button variant="outline-danger" size="sm" onClick={() => handleDeleteCoupon(coupon.id)}
        disabled={tableLoading} title="Delete" aria-label={`Delete ${coupon.code}`}>
        <FaTrash />
      </Button>
    </div>
  );

  if (pageLoading && !coupons.length) {
    return <Loading />;
  }

  return (
    <div className="coupons-page">
      <ListHeader
        title="Coupons"
        subtitle="Discount codes customers type at checkout."
        actions={<Button onClick={openAddModal}><FaPlus className="me-2" aria-hidden="true" />New coupon</Button>}
      />

      <ListCard>
        <ListToolbar end={<ResultCount page={pagination.current_page} perPage={searchParams.limit} total={pagination.total} noun="coupons" />}>
          <SearchBox
            value={searchParams.search}
            onChange={(v) => setSearchParams((prev) => ({ ...prev, search: v }))}
            placeholder="Search by code"
            busy={isSearching}
          />
        </ListToolbar>

        <CommonTable
          headers={headers}
          data={coupons}
          tableLoading={tableLoading}
          loading={loading}
          renderActions={renderActions}
          onRowClick={(row) => openViewModal(row)}
          rowLabel={(row) => `View coupon ${row.code}`}
          emptyTitle={searchParams.search ? 'No coupons match' : 'No coupons yet'}
          emptyText={searchParams.search ? `Nothing matches “${searchParams.search}”.` : 'Create a code to offer a discount at checkout.'}
          emptyAction={!searchParams.search && <Button size="sm" onClick={openAddModal}><FaPlus className="me-1" /> New coupon</Button>}
        />

        <Pager
          page={pagination.current_page}
          lastPage={pagination.last_page}
          onPage={handlePageChange}
          perPage={searchParams.limit}
          onPerPage={(n) => handleLimitChange({ target: { value: n } })}
        />
      </ListCard>

          <Modal show={showModal} onHide={closeModal} centered size="lg">
            <Modal.Header closeButton>
              <Modal.Title>
                {modalMode === "add" ? "Add New Coupon" : "Edit Coupon"}
              </Modal.Title>
            </Modal.Header>
            <Form
              onSubmit={
                modalMode === "add" ? handleAddCoupon : handleEditCoupon
              }
            >
              <Modal.Body>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Code</Form.Label>
                      <Form.Control type="text" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })} required />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Amount</Form.Label>
                      <Form.Control type="number" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} required min="0" step="0.01" />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Type</Form.Label>
                      <Form.Select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })}>
                        <option value="percent">Percent</option>
                        <option value="flat">Flat</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6} className="d-flex align-items-center">
                    <Form.Group className="mb-3 mt-3">
                      <Form.Check type="checkbox" label="Is Global" checked={formData.is_global} onChange={(e) => setFormData({ ...formData, is_global: e.target.checked ? 1 : 0 })} />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Minimum Purchase</Form.Label>
                      <Form.Control type="number" name="min_pur" value={formData.min_pur} onChange={handleInputChange} min="0" placeholder="e.g., 500"/>
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Max Usage</Form.Label>
                      <Form.Control type="number" value={formData.max_usage} onChange={(e) => setFormData({ ...formData, max_usage: e.target.value })} min="0" placeholder="e.g., 100"/>
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Max Usage Per User</Form.Label>
                      <Form.Control type="number" value={formData.max_usage_per_user} onChange={(e) => setFormData({ ...formData, max_usage_per_user: e.target.value })} min="0" placeholder="e.g., 1" />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Start Date</Form.Label>
                      <Form.Control type="date" value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>End Date</Form.Label>
                      <Form.Control type="date" value={formData.end_date} onChange={(e) => setFormData({ ...formData, end_date: e.target.value })} />
                    </Form.Group>
                  </Col>
                </Row>

                {!formData.is_global && (
                  <Form.Group className="mb-3">
                    <Form.Label>Select Products</Form.Label>
                    <AsyncSelect isMulti cacheOptions defaultOptions loadOptions={loadProducts} value={selectedProducts} onChange={setSelectedProducts} />
                  </Form.Group>
                )}

                <Form.Group className="mb-3">
                  <Form.Check type="switch" label="Active" checked={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.checked })} />
                </Form.Group>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="secondary" onClick={closeModal}>Cancel</Button>
                <Button type="submit" variant="primary">{modalMode === "add" ? "Add Coupon" : "Update Coupon"}</Button>
              </Modal.Footer>
            </Form>
          </Modal>

          <Modal show={showViewModal} onHide={closeViewModal} centered size="lg">
            <Modal.Header closeButton>
              <Modal.Title>Coupon Details</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {selectedCoupon && (
                <div>
                  <Row className="mb-3">
                    <Col md={6}><strong>ID:</strong> {selectedCoupon.id}</Col>
                    <Col md={6}><strong>Code:</strong> <Badge bg="info">{selectedCoupon.code}</Badge></Col>
                  </Row>
                  <hr />
                  
                  <Row className="mb-3">
                    <Col md={6}><strong>Amount:</strong> {formatCurrency(selectedCoupon.amount)}</Col>
                    <Col md={6}><strong>Type:</strong> <Badge bg={selectedCoupon.type === 'percent' ? 'success' : 'warning'}>{selectedCoupon.type}</Badge></Col>
                  </Row>
                  <hr />
                  
                  <Row className="mb-3">
                    <Col md={6}><strong>Minimum Purchase:</strong> {formatCurrency(selectedCoupon.min_pur)}</Col>
                    <Col md={6}><strong>Global:</strong> {selectedCoupon.is_global ? <Badge bg="success">Yes</Badge> : <Badge bg="secondary">No</Badge>}</Col>
                  </Row>
                  <hr />
                  
                  <Row className="mb-3">
                    <Col md={4}><strong>Max Usage:</strong> {selectedCoupon.max_usage || 'Unlimited'}</Col>
                    <Col md={4}><strong>Max Usage/User:</strong> {selectedCoupon.max_usage_per_user || 'Unlimited'}</Col>
                    <Col md={4}><strong>Status:</strong> {selectedCoupon.status ? <Badge bg="success">Active</Badge> : <Badge bg="danger">Inactive</Badge>}</Col>
                  </Row>
                  <hr />
                  
                  <Row className="mb-3">
                    <Col md={6}><strong>Start Date:</strong> {selectedCoupon.start_date || 'Not set'}</Col>
                    <Col md={6}><strong>End Date:</strong> {selectedCoupon.end_date || 'Not set'}</Col>
                  </Row>
                  <hr />
                  
                  {/* New Usage Statistics Section */}
                  <div className="mb-3">
                    <h5 className="text-primary">Usage Statistics</h5>
                    <Row>
                      <Col md={6}>
                        <div className="p-3 bg-light rounded">
                          <div className="d-flex justify-content-between align-items-center">
                            <span><strong>Total Orders:</strong></span>
                            <Badge bg="primary" style={{ fontSize: '1rem' }}>
                              {selectedCoupon.total_orders || 0}
                            </Badge>
                          </div>
                        </div>
                      </Col>
                      <Col md={6}>
                        <div className="p-3 bg-light rounded">
                          <div className="d-flex justify-content-between align-items-center">
                            <span><strong>Total Sales:</strong></span>
                            <Badge bg="success" style={{ fontSize: '1rem' }}>
                              {formatCurrency(selectedCoupon.total_sales)}
                            </Badge>
                          </div>
                        </div>
                      </Col>
                    </Row>
                  </div>
                  <hr />
                  
                  <div>
                    <h5 className="text-primary">Associated Items</h5>
                    {selectedCoupon.items && selectedCoupon.items.length > 0 ? (
                      <ListGroup>
                        {selectedCoupon.items.map(item => (
                          <ListGroup.Item key={item.id} className="d-flex justify-content-between align-items-center">
                            {item.name}
                            <Badge bg="secondary" pill>{item.id}</Badge>
                          </ListGroup.Item>
                        ))}
                      </ListGroup>
                    ) : (
                      <div className="text-center p-3 bg-light rounded">
                        <p className="text-muted mb-0">
                          {selectedCoupon.is_global ? 'This coupon applies to all products' : 'No items associated with this coupon'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={closeViewModal}>Close</Button>
            </Modal.Footer>
          </Modal>

    </div>
  );
};

export default Coupons;