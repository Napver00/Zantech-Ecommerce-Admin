import React from 'react';
import { Card, Button, Table, Spinner, Modal, Form, Alert } from 'react-bootstrap';
import { FaTag, FaTrash } from 'react-icons/fa';

const ProductTags = ({ product, showTagModal, setShowTagModal, handleAddTags, tagInput, setTagInput, tagError, tagLoading, handleDeleteTag, deleteTagLoading }) => {
    return (
        <Card className="border mb-4">
            <Card.Header className="bg-light d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Tags</h5>
                <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={() => setShowTagModal(true)}
                    className="add-btn"
                >
                    <FaTag className="me-2" /> Add Tags
                </Button>
            </Card.Header>
            <Card.Body>
                {product.tags && product.tags.length > 0 ? (
                    <div className="table-container">
                        <Table hover className="modern-table">
                            <tbody>
                                {product.tags.map(tag => (
                                    <tr key={tag.id}>
                                        <td>{tag.tag}</td>
                                        <td className="text-end">
                                            <Button
                                                variant="outline-danger"
                                                size="sm"
                                                onClick={() => handleDeleteTag(tag.id)}
                                                disabled={deleteTagLoading === tag.id}
                                                className="delete-btn"
                                            >
                                                {deleteTagLoading === tag.id ? (
                                                    <Spinner animation="border" size="sm" />
                                                ) : (
                                                    <FaTrash />
                                                )}
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </div>
                ) : (
                    <div className="text-center py-4 text-muted">No tags added yet</div>
                )}
            </Card.Body>
            <Modal
                show={showTagModal}
                onHide={() => !tagLoading && setShowTagModal(false)}
                centered
            >
                <Modal.Header closeButton>
                    <Modal.Title>Add Product Tags</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form.Group className="mb-3">
                        <Form.Label>Enter Tags</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={3}
                            placeholder="Enter tags separated by commas..."
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                        />
                    </Form.Group>
                    {tagError && (
                        <Alert variant="danger">
                            {tagError}
                        </Alert>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button
                        variant="secondary"
                        onClick={() => setShowTagModal(false)}
                        disabled={tagLoading}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleAddTags}
                        disabled={tagLoading || !tagInput.trim()}
                    >
                        {tagLoading ? 'Adding...' : 'Add Tags'}
                    </Button>
                </Modal.Footer>
            </Modal>
        </Card>
    );
};

export default ProductTags;