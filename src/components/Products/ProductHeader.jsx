import React from 'react';
import { Button, Badge, Spinner } from 'react-bootstrap';
import { FaArrowLeft, FaTrash } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const ProductHeader = ({ product, handleDelete, handleToggleStatus, statusLoading }) => {
    const navigate = useNavigate();

    return (
        <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
                <Button
                    variant="link"
                    className="p-0 mb-2 text-decoration-none"
                    onClick={() => navigate('/products')}
                >
                    <FaArrowLeft className="me-2" /> Back to Products
                </Button>
                <h2 className="page-title mb-1">Product Details</h2>
                <p className="text-muted mb-0">View and manage product information</p>
            </div>
            <div className="d-flex gap-2">
                <Button
                    variant="outline-danger"
                    onClick={handleDelete}
                    className="delete-btn"
                >
                    <FaTrash className="me-2" /> Delete Product
                </Button>
                <Badge
                    bg={product.status === "1" ? "success" : "secondary"}
                    className="px-3 py-2 fs-6 status-badge"
                    role="button"
                    onClick={handleToggleStatus}
                    style={{ cursor: statusLoading ? 'not-allowed' : 'pointer' }}
                    disabled={statusLoading}
                >
                    {statusLoading ? (
                        <Spinner animation="border" size="sm" className="me-1" />
                    ) : null}
                    {product.status === "1" ? "Active" : "Inactive"}
                </Badge>
            </div>
        </div>
    );
};

export default ProductHeader;