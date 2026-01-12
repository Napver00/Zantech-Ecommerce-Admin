import React from 'react';
import { Card, Button, Spinner, Modal, Form, Alert } from 'react-bootstrap';
import { FaLayerGroup, FaTrash } from 'react-icons/fa';

const ProductCategories = ({ product, showCategoryModal, setShowCategoryModal, handleAddCategories, selectedCategories, setSelectedCategories, allCategories, categoryError, categoryLoading, handleDeleteCategory, deleteCategoryLoading }) => {
    return (
        <Card className="border mb-4">
            <Card.Header className="bg-light d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Categories</h5>
                <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={() => setShowCategoryModal(true)}
                    className="add-btn"
                >
                    <FaLayerGroup className="me-2" /> Add Categories
                </Button>
            </Card.Header>
            <Card.Body>
                {product.categories && product.categories.length > 0 ? (
                    <div className="categories-grid">
                        {product.categories.map(category => (
                            <div key={category.id} className="category-item">
                                <div className="category-content">
                                    <span className="category-name">{category.name}</span>
                                    <Button
                                        variant="link"
                                        className="category-remove-btn"
                                        onClick={() => handleDeleteCategory(category.id)}
                                        disabled={deleteCategoryLoading === category.id}
                                    >
                                        {deleteCategoryLoading === category.id ? (
                                            <Spinner animation="border" size="sm" />
                                        ) : (
                                            <FaTrash size={12} />
                                        )}
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-4 text-muted">No categories assigned</div>
                )}
            </Card.Body>
            <Modal
                show={showCategoryModal}
                onHide={() => !categoryLoading && setShowCategoryModal(false)}
                centered
            >
                <Modal.Header closeButton>
                    <Modal.Title>Add Product Categories</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form.Group className="mb-3">
                        <Form.Label>Select Categories</Form.Label>
                        <div className="border rounded p-3" style={{ maxHeight: "300px", overflowY: "auto" }}>
                            {allCategories.map(category => (
                                <Form.Check
                                    key={category.id}
                                    type="checkbox"
                                    id={`category-${category.id}`}
                                    label={category.name}
                                    checked={selectedCategories.includes(category.id)}
                                    onChange={(e) => {
                                        if (e.target.checked) {
                                            setSelectedCategories([...selectedCategories, category.id]);
                                        } else {
                                            setSelectedCategories(selectedCategories.filter(id => id !== category.id));
                                        }
                                    }}
                                    className="mb-2"
                                />
                            ))}
                        </div>
                    </Form.Group>
                    {categoryError && (
                        <Alert variant="danger">
                            {categoryError}
                        </Alert>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button
                        variant="secondary"
                        onClick={() => setShowCategoryModal(false)}
                        disabled={categoryLoading}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleAddCategories}
                        disabled={categoryLoading || selectedCategories.length === 0}
                    >
                        {categoryLoading ? 'Adding...' : 'Add Categories'}
                    </Button>
                </Modal.Footer>
            </Modal>
        </Card>
    );
};

export default ProductCategories;