import React, { useState, useEffect } from "react";
import { FaPlus, FaEdit, FaTrash, FaSearch, FaSpinner, FaTimes } from "react-icons/fa";
import { toast } from "react-hot-toast";
import axiosInstance from "@/config/axios";
import { Card, Form, InputGroup, Button, Row, Col, Modal, Badge } from "react-bootstrap";
import Loading from "@/components/Loading";
import "./FAQ.css";
import usePageTitle from '@/hooks/usePageTitle';
import CommonTable from "@/components/Common/CommonTable";

const FAQ = () => {
    usePageTitle('Manage FAQs');
    const [faqs, setFaqs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tableLoading, setTableLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState("add");
    const [selectedFaq, setSelectedFaq] = useState(null);
    const [formData, setFormData] = useState({
        question: "",
        answer: "",
        category: "store",
    });
    const [searchParams, setSearchParams] = useState({
        search: "",
    });
    const [searchTimeout, setSearchTimeout] = useState(null);
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        fetchFaqs();
    }, []);

    useEffect(() => {
        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }

        const timeoutId = setTimeout(() => {
            setIsSearching(true);
            fetchFaqs();
        }, 500);

        setSearchTimeout(timeoutId);

        return () => {
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
        };
    }, [searchParams.search]);

    const fetchFaqs = async () => {
        setLoading(true);
        setTableLoading(true);
        try {
            const params = {
                ...(searchParams.search && { search: searchParams.search }),
            };

            const response = await axiosInstance.get("/faqs", { params });
            const result = response.data;

            if (!result.success) {
                throw new Error(result.message || "Failed to fetch FAQs");
            }

            setFaqs(result.data);
        } catch (error) {
            console.error("Error fetching FAQs:", error);
            toast.error(
                error.response?.data?.message || "Failed to fetch FAQs"
            );
            setFaqs([]);
        } finally {
            setLoading(false);
            setTableLoading(false);
            setIsSearching(false);
        }
    };

    const handleAddFaq = async (e) => {
        e.preventDefault();
        try {
            await axiosInstance.post("/faqs", formData);
            fetchFaqs();
            setShowModal(false);
            setFormData({ question: "", answer: "", category: "store" });
            toast.success("FAQ added successfully");
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to add FAQ");
        }
    };

    const handleEditFaq = async (e) => {
        e.preventDefault();
        try {
            await axiosInstance.put(`/faqs/${selectedFaq.id}`, formData);
            fetchFaqs();
            setShowModal(false);
            setFormData({ question: "", answer: "", category: "store" });
            setSelectedFaq(null);
            toast.success("FAQ updated successfully");
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to update FAQ");
        }
    };

    const handleDeleteFaq = async (id) => {
        if (window.confirm("Are you sure you want to delete this FAQ?")) {
            try {
                setTableLoading(true);
                await axiosInstance.delete(`/faqs/${id}`);
                toast.success("FAQ deleted successfully");
                fetchFaqs();
            } catch (error) {
                toast.error(
                    error.response?.data?.message || "Failed to delete FAQ"
                );
            } finally {
                setTableLoading(false);
            }
        }
    };

    const handleToggleStatus = async (id) => {
        try {
            await axiosInstance.patch(`/faqs/status/${id}`);
            toast.success("Status updated successfully");
            fetchFaqs();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to update status");
        }
    }

    const handleSearch = (e) => {
        const { value } = e.target;
        setSearchParams((prev) => ({
            ...prev,
            search: value,
        }));
    };

    const openEditModal = (faq) => {
        setModalMode("edit");
        setSelectedFaq(faq);
        setFormData({
            question: faq.question,
            answer: faq.answer,
            category: faq.category,
        });
        setShowModal(true);
    };

    const openAddModal = () => {
        setModalMode("add");
        setSelectedFaq(null);
        setFormData({ question: "", answer: "", category: "store" });
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setFormData({ question: "", answer: "", category: "store" });
        setSelectedFaq(null);
    };

    const headers = [
        { key: 'id', label: 'ID' },
        { key: 'question', label: 'Question' },
        { key: 'answer', label: 'Answer' },
        { key: 'category', label: 'Category' },
        {
            key: 'status',
            label: 'Status',
            render: (row) => (
                <Badge
                    bg={row.status === 1 ? "success" : "danger"}
                    onClick={() => handleToggleStatus(row.id)}
                    style={{ cursor: "pointer" }}
                >
                    {row.status === 1 ? "Active" : "Inactive"}
                </Badge>
            ),
        },
    ];

    const renderActions = (faq) => (
        <div className="d-flex gap-2">
            <Button
                variant="outline-primary"
                size="sm"
                onClick={() => openEditModal(faq)}
                disabled={tableLoading}
                title="Edit"
                className="view-btn"
            >
                <FaEdit />
            </Button>
            <Button
                variant="outline-danger"
                size="sm"
                onClick={() => handleDeleteFaq(faq.id)}
                disabled={tableLoading}
                title="Delete"
                className="delete-btn"
            >
                <FaTrash />
            </Button>
        </div>
    );

    if (loading) {
        return <Loading />;
    }

    return (
        <div className="faq-container">
            <Card className="modern-card">
                <Card.Body className="p-4">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <div>
                            <h2 className="page-title mb-1">FAQs</h2>
                            <p className="page-subtitle mb-0">
                                Showing {faqs.length} FAQs
                            </p>
                        </div>
                        <Button
                            variant="primary"
                            onClick={openAddModal}
                            className="create-faq-btn"
                        >
                            <FaPlus className="me-2" /> Add FAQ
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
                                            placeholder="Search FAQs..."
                                            name="search"
                                            value={searchParams.search}
                                            onChange={handleSearch}
                                            disabled={loading}
                                            className={`search-input ${isSearching ? "searching" : ""
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
                        data={faqs}
                        tableLoading={tableLoading}
                        loading={loading}
                        renderActions={renderActions}
                    />
                    <Modal show={showModal} onHide={closeModal} centered>
                        <Modal.Header closeButton>
                            <Modal.Title>
                                {modalMode === "add" ? "Add New FAQ" : "Edit FAQ"}
                            </Modal.Title>
                        </Modal.Header>
                        <Form
                            onSubmit={
                                modalMode === "add" ? handleAddFaq : handleEditFaq
                            }
                        >
                            <Modal.Body>
                                <Form.Group className="mb-3">
                                    <Form.Label>Question</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={3}
                                        value={formData.question}
                                        onChange={(e) =>
                                            setFormData({ ...formData, question: e.target.value })
                                        }
                                        required
                                    />
                                </Form.Group>
                                <Form.Group className="mb-3">
                                    <Form.Label>Answer</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        value={formData.answer}
                                        onChange={(e) =>
                                            setFormData({ ...formData, answer: e.target.value })
                                        }
                                        rows={3}
                                        required
                                    />
                                </Form.Group>
                                <Form.Group className="mb-3">
                                    <Form.Label>Category</Form.Label>
                                    <Form.Select
                                        value={formData.category}
                                        onChange={(e) =>
                                            setFormData({ ...formData, category: e.target.value })
                                        }
                                    >
                                        <option value="store">Store</option>
                                        <option value="landingpage">Landing Page</option>
                                    </Form.Select>
                                </Form.Group>
                            </Modal.Body>
                            <Modal.Footer>
                                <Button variant="secondary" onClick={closeModal}>
                                    Cancel
                                </Button>
                                <Button type="submit" variant="primary">
                                    {modalMode === "add" ? "Add FAQ" : "Update FAQ"}
                                </Button>
                            </Modal.Footer>
                        </Form>
                    </Modal>
                </Card.Body>
            </Card>
        </div>
    );
};

export default FAQ;

