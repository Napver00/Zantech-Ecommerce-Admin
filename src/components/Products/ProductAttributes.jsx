import React from 'react';
import { Card, Button, Spinner, Modal, Form, Alert, Tab, Nav } from 'react-bootstrap';
import { FaLayerGroup, FaTag, FaTrash } from 'react-icons/fa';

const ProductAttributes = ({ 
    product,
    show,
    handleClose,
    handleShow,
    // Categories Props
    allCategories,
    selectedCategories,
    setSelectedCategories,
    categoryLoading,
    handleAddCategories,
    handleDeleteCategory,
    deleteCategoryLoading,
    categoryError,
    // Tags Props
    tagInput,
    setTagInput,
    tagLoading,
    handleAddTags,
    handleDeleteTag,
    deleteTagLoading,
    tagError
}) => {
    return (
        <Card className="border mb-4">
            <Card.Header className="bg-light d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Attributes</h5>
                <Button variant="outline-primary" size="sm" onClick={handleShow} className="add-btn">
                    Edit Attributes
                </Button>
            </Card.Header>
            <Card.Body>
                <div className="mb-3">
                    <h6 className="mb-2 d-flex align-items-center gap-2"><FaLayerGroup /> Categories</h6>
                    {product.categories && product.categories.length > 0 ? (
                        <div className="d-flex flex-wrap gap-2">
                            {product.categories.map(category => (
                                <div key={category.id} className="category-chip">
                                    <span>{category.name}</span>
                                </div>
                            ))}
                        </div>
                    ) : <p className="text-muted">No categories assigned.</p>}
                </div>
                <div>
                    <h6 className="mb-2 d-flex align-items-center gap-2"><FaTag /> Tags</h6>
                    {product.tags && product.tags.length > 0 ? (
                        <div className="d-flex flex-wrap gap-2">
                            {product.tags.map(tag => (
                                <div key={tag.id} className="tag-chip">
                                    <span>{tag.tag}</span>
                                </div>
                            ))}
                        </div>
                    ) : <p className="text-muted">No tags added yet.</p>}
                </div>
            </Card.Body>

            <Modal show={show} onHide={handleClose} centered size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Edit Attributes</Modal.Title>
                </Modal.Header>
                <Tab.Container defaultActiveKey="categories">
                    <Modal.Body>
                        <Nav variant="pills" className="mb-3">
                            <Nav.Item>
                                <Nav.Link eventKey="categories">Categories</Nav.Link>
                            </Nav.Item>
                            <Nav.Item>
                                <Nav.Link eventKey="tags">Tags</Nav.Link>
                            </Nav.Item>
                        </Nav>
                        <Tab.Content>
                            <Tab.Pane eventKey="categories">
                                <h5>Manage Categories</h5>
                                {product.categories?.length > 0 && (
                                    <div className="mb-3">
                                        <h6>Current Categories</h6>
                                        <div className="d-flex flex-wrap gap-2">
                                            {product.categories.map(category => (
                                                <div key={category.id} className="category-chip">
                                                    <span>{category.name}</span>
                                                    <button
                                                        type="button"
                                                        className="chip-remove"
                                                        onClick={() => handleDeleteCategory(category.id)}
                                                        disabled={deleteCategoryLoading === category.id}
                                                    >
                                                        {deleteCategoryLoading === category.id ? <Spinner animation="border" size="sm" /> : <FaTrash />}
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                <Form.Group>
                                    <Form.Label>Add New Categories</Form.Label>
                                    <div className="border rounded p-3" style={{ maxHeight: "200px", overflowY: "auto" }}>
                                        {allCategories.filter(cat => !product.categories.some(pCat => pCat.id === cat.id)).map(category => (
                                            <Form.Check
                                                key={category.id}
                                                type="checkbox"
                                                id={`category-check-${category.id}`}
                                                label={category.name}
                                                checked={selectedCategories.includes(category.id)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedCategories([...selectedCategories, category.id]);
                                                    } else {
                                                        setSelectedCategories(selectedCategories.filter(id => id !== category.id));
                                                    }
                                                }}
                                            />
                                        ))}
                                    </div>
                                </Form.Group>
                                {categoryError && <Alert variant="danger" className="mt-2">{categoryError}</Alert>}
                                <Button variant="primary" onClick={handleAddCategories} disabled={categoryLoading || selectedCategories.length === 0} className="mt-3">
                                    {categoryLoading ? 'Adding...' : 'Add Selected'}
                                </Button>
                            </Tab.Pane>
                            <Tab.Pane eventKey="tags">
                                <h5>Manage Tags</h5>
                                {product.tags?.length > 0 && (
                                    <div className="mb-3">
                                        <h6>Current Tags</h6>
                                        <div className="d-flex flex-wrap gap-2">
                                            {product.tags.map(tag => (
                                                <div key={tag.id} className="tag-chip">
                                                    <span>{tag.tag}</span>
                                                    <button
                                                        type="button"
                                                        className="chip-remove"
                                                        onClick={() => handleDeleteTag(tag.id)}
                                                        disabled={deleteTagLoading === tag.id}
                                                    >
                                                        {deleteTagLoading === tag.id ? <Spinner animation="border" size="sm" /> : <FaTrash />}
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                <Form.Group>
                                    <Form.Label>Add New Tags</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={3}
                                        placeholder="Enter tags separated by commas..."
                                        value={tagInput}
                                        onChange={(e) => setTagInput(e.target.value)}
                                    />
                                </Form.Group>
                                {tagError && <Alert variant="danger" className="mt-2">{tagError}</Alert>}
                                <Button variant="primary" onClick={handleAddTags} disabled={tagLoading || !tagInput.trim()} className="mt-3">
                                    {tagLoading ? 'Adding...' : 'Add Tags'}
                                </Button>
                            </Tab.Pane>
                        </Tab.Content>
                    </Modal.Body>
                </Tab.Container>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleClose}>
                        Done
                    </Button>
                </Modal.Footer>
            </Modal>
        </Card>
    );
};

export default ProductAttributes;