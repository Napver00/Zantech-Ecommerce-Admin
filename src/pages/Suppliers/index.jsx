import React, { useState, useEffect } from "react";
import { FaPlus, FaEdit, FaTrash, FaSearch, FaSpinner, FaTimes, FaSave } from "react-icons/fa";
import { toast } from "react-hot-toast";
import axiosInstance from "../../config/axios";
import { Card, Form, InputGroup, Button, Table, Row, Col, Modal } from "react-bootstrap";
import Loading from "../../components/Loading";
import "./Suppliers.css";
import usePageTitle from '../../hooks/usePageTitle';
import CommonTable from "../../components/Common/CommonTable";

const Suppliers = () => {
    usePageTitle('Manage Suppliers');
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState("add");
    const [selectedSupplier, setSelectedSupplier] = useState(null);
    const [searchParams, setSearchParams] = useState({
        search: "",
    });
    const [isSearching, setIsSearching] = useState(false);
    const [searchTimeout, setSearchTimeout] = useState(null);
    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        phone2: "",
        address: "",
    });
    const [editingPaidAmount, setEditingPaidAmount] = useState(null);
    const [paidAmountInput, setPaidAmountInput] = useState("");
    const [updateLoading, setUpdateLoading] = useState(false);

    useEffect(() => {
        fetchSuppliers();
    }, []);

    useEffect(() => {
        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }

        const timeoutId = setTimeout(() => {
            if (searchParams.search !== "") {
                setIsSearching(true);
                fetchSuppliers();
            }
        }, 500);

        setSearchTimeout(timeoutId);

        return () => {
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
        };
    }, [searchParams.search]);

    const fetchSuppliers = async () => {
        try {
            const response = await axiosInstance.get("/suppliers", {
                params: {
                    search: searchParams.search,
                },
            });
            setSuppliers(response.data.data);
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to fetch suppliers");
        } finally {
            setLoading(false);
            setIsSearching(false);
        }
    };

    const handleSearch = (e) => {
        setSearchParams((prev) => ({ ...prev, search: e.target.value }));
    };

    const handleAddSupplier = async (e) => {
        e.preventDefault();
        try {
            const response = await axiosInstance.post("/suppliers", formData);
            setSuppliers([...suppliers, response.data.data]);
            setShowModal(false);
            setFormData({ name: "", phone: "", phone2: "", address: "" });
            toast.success("Supplier added successfully");
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to add supplier");
        }
    };

    const handleEditSupplier = async (e) => {
        e.preventDefault();
        try {
            const response = await axiosInstance.put(
                `/suppliers/${selectedSupplier.id}`,
                formData
            );
            setSuppliers(
                suppliers.map((sup) =>
                    sup.id === selectedSupplier.id ? response.data.data : sup
                )
            );
            setShowModal(false);
            setFormData({ name: "", phone: "", phone2: "", address: "" });
            setSelectedSupplier(null);
            toast.success("Supplier updated successfully");
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to update supplier");
        }
    };

    const handleDeleteSupplier = async (id) => {
        if (window.confirm("Are you sure you want to delete this supplier?")) {
            try {
                await axiosInstance.delete(`/suppliers/${id}`);
                setSuppliers(suppliers.filter((sup) => sup.id !== id));
                toast.success("Supplier deleted successfully");
            } catch (error) {
                toast.error(
                    error.response?.data?.message || "Failed to delete supplier"
                );
            }
        }
    };

    const handleUpdatePaidAmount = async (supplierId, newAmount) => {
        if (updateLoading || !newAmount || newAmount < 0) return;

        const supplier = suppliers.find((s) => s.id === supplierId);
        if (!supplier) return;

        const totalAmount = parseFloat(supplier.total_amount);
        const paidAmount = parseFloat(newAmount);

        if (paidAmount > totalAmount) {
          toast.error("Paid amount cannot exceed total amount");
          return;
        }

        setUpdateLoading(true);
        try {
            const response = await axiosInstance.put(`/suppliers/update-paid-amount/${supplierId}`, {
                paid_amount: paidAmount,
            });

            if (response.data.success) {
                toast.success("Paid amount updated successfully");
                fetchSuppliers();
            } else {
                toast.error("Failed to update paid amount");
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "An error occurred");
        } finally {
            setUpdateLoading(false);
            setEditingPaidAmount(null);
        }
    };

    const openEditModal = (supplier) => {
        setModalMode("edit");
        setSelectedSupplier(supplier);
        setFormData({
            name: supplier.name,
            phone: supplier.phone,
            phone2: supplier.phone2 || "",
            address: supplier.address,
        });
        setShowModal(true);
    };

    const openAddModal = () => {
        setModalMode("add");
        setSelectedSupplier(null);
        setFormData({ name: "", phone: "", phone2: "", address: "" });
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setFormData({ name: "", phone: "", phone2: "", address: "" });
        setSelectedSupplier(null);
    };

    const headers = [
        { key: 'id', label: 'ID', render: (row) => `#${row.id}` },
        { key: 'name', label: 'Name' },
        {
            key: 'phone',
            label: 'Phone',
            render: (row) => (
                <div>
                    <div>{row.phone}</div>
                    {row.phone2 && <div className="text-muted">{row.phone2}</div>}
                </div>
            )
        },
        { key: 'address', label: 'Address' },
        { key: 'total_amount', label: 'Total Amount', render: (row) => `৳${parseFloat(row.total_amount).toLocaleString()}` },
        {
            key: 'paid_amount',
            label: 'Paid Amount',
            render: (row) => (
                <div className="d-flex align-items-center gap-2">
                    {editingPaidAmount === row.id ? (
                        <>
                            <Form.Control
                                type="number"
                                min="0"
                                step="0.01"
                                defaultValue={row.paid_amount}
                                onKeyPress={(e) => {
                                    if (e.key === "Enter") {
                                        handleUpdatePaidAmount(row.id, e.target.value);
                                    }
                                }}
                                onBlur={(e) => handleUpdatePaidAmount(row.id, e.target.value)}
                                autoFocus
                                size="sm"
                                style={{ width: "120px" }}
                                disabled={updateLoading}
                                className="modern-input"
                            />
                            {updateLoading && <FaSpinner className="spinner-border spinner-border-sm" />}
                        </>
                    ) : (
                        <div
                            className="d-flex align-items-center gap-2"
                            onClick={() => {
                                setEditingPaidAmount(row.id);
                                setPaidAmountInput(row.paid_amount);
                            }}
                            style={{ cursor: "pointer" }}
                        >
                            <span className="fw-medium text-success">
                                ৳{parseFloat(row.paid_amount).toLocaleString()}
                            </span>
                            <FaEdit size={12} className="text-muted" />
                        </div>
                    )}
                </div>
            )
        },
        {
            key: 'due_amount',
            label: 'Due Amount',
            render: (row) => (
                <span className={row.due_amount > 0 ? 'text-danger fw-bold' : 'text-success'}>
                    ৳{parseFloat(row.due_amount).toLocaleString()}
                </span>
            )
        }
    ];

    const renderActions = (supplier) => (
        <div className="d-flex gap-2">
            <Button
                variant="outline-primary"
                size="sm"
                onClick={() => openEditModal(supplier)}
                title="Edit"
                className="view-btn"
            >
                <FaEdit />
            </Button>
            <Button
                variant="outline-danger"
                size="sm"
                onClick={() => handleDeleteSupplier(supplier.id)}
                title="Delete"
                className="delete-btn"
            >
                <FaTrash />
            </Button>
        </div>
    );

    if (loading && !suppliers.length) {
        return <Loading />;
    }

    return (
        <div className="orders-container">
            <Card className="modern-card">
                <Card.Body className="p-4">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <div>
                            <h2 className="page-title mb-1">Suppliers</h2>
                            <p className="text-muted mb-0">Manage your suppliers and their information</p>
                        </div>
                        <Button
                            variant="primary"
                            onClick={openAddModal}
                            className="create-order-btn"
                        >
                            <FaPlus className="me-2" /> Add Supplier
                        </Button>
                    </div>

                    <div className="filters-section mb-4">
                        <Row className="g-3">
                            <Col md={4}>
                                <div className="search-box">
                                    <InputGroup>
                                        <InputGroup.Text className="search-icon">
                                            {isSearching ? <FaSpinner className="spinner" /> : <FaSearch />}
                                        </InputGroup.Text>
                                        <Form.Control
                                            type="text"
                                            placeholder="Search suppliers..."
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
                                                    fetchSuppliers();
                                                }}
                                            >
                                                <FaTimes />
                                            </Button>
                                        )}
                                    </InputGroup>
                                </div>
                            </Col>
                        </Row>
                    </div>

                    <CommonTable
                        headers={headers}
                        data={suppliers}
                        tableLoading={loading}
                        loading={loading}
                        renderActions={renderActions}
                    />

                </Card.Body>
            </Card>

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>
                                {modalMode === "add" ? "Add New Supplier" : "Edit Supplier"}
                            </h3>
                            <button className="btn-close" onClick={closeModal} />
                        </div>
                        <form
                            onSubmit={
                                modalMode === "add" ? handleAddSupplier : handleEditSupplier
                            }
                        >
                            <div className="modal-body">
                                <div className="mb-3">
                                    <label className="form-label">Name</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={formData.name}
                                        onChange={(e) =>
                                            setFormData({ ...formData, name: e.target.value })
                                        }
                                        required
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Phone</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={formData.phone}
                                        onChange={(e) =>
                                            setFormData({ ...formData, phone: e.target.value })
                                        }
                                        required
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">
                                        Secondary Phone (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={formData.phone2}
                                        onChange={(e) =>
                                            setFormData({ ...formData, phone2: e.target.value })
                                        }
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Address</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={formData.address}
                                        onChange={(e) =>
                                            setFormData({ ...formData, address: e.target.value })
                                        }
                                        required
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={closeModal}
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    {modalMode === "add" ? "Add Supplier" : "Update Supplier"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Suppliers;