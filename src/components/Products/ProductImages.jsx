import React from 'react';
import { Card, Button, Spinner, Modal, Form, Alert, Image } from 'react-bootstrap';
import { FaPencilAlt, FaTrash, FaPlus } from 'react-icons/fa';

const ProductImages = ({ 
    product, 
    showImageModal, 
    setShowImageModal, 
    handleImageUpload, 
    selectedFiles, 
    handleImageSelect, 
    imageError, 
    imageUploadLoading, 
    handleDeleteImage, 
    deleteImageLoading, 
    setShowImagePreview, 
    setSelectedImage 
}) => {
    return (
        <Card className="border mb-4">
            <Card.Header className="bg-light">
                <h5 className="mb-0">Product Images</h5>
            </Card.Header>
            <Card.Body>
                <div className="image-grid-container">
                    {product.images && product.images.map((image, index) => (
                        <div key={image.id} className="image-grid-item">
                            <Image
                                src={image.path}
                                alt={`${product.name} - ${index + 1}`}
                                fluid
                                className="product-image-thumb"
                                onClick={() => {
                                    setSelectedImage(index);
                                    setShowImagePreview(true);
                                }}
                            />
                            <div className="image-overlay">
                                <Button
                                    variant="danger"
                                    size="sm"
                                    className="delete-image-btn"
                                    onClick={() => handleDeleteImage(image.id)}
                                    disabled={deleteImageLoading === image.id}
                                >
                                    {deleteImageLoading === image.id ? <Spinner size="sm" /> : <FaTrash />}
                                </Button>
                            </div>
                        </div>
                    ))}
                    <div className="image-grid-item add-image-card" onClick={() => setShowImageModal(true)}>
                        <div className="add-image-content">
                            <FaPlus size={24} />
                            <span>Add Image</span>
                        </div>
                    </div>
                </div>
            </Card.Body>
            <Modal
                show={showImageModal}
                onHide={() => !imageUploadLoading && setShowImageModal(false)}
                centered
            >
                <Modal.Header closeButton>
                    <Modal.Title>Add Product Images</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {imageUploadLoading ? (
                        <div className="text-center py-4">
                            <Spinner animation="border" />
                            <p className="text-muted mt-2 mb-0">Uploading images...</p>
                        </div>
                    ) : (
                        <>
                            <Form.Group className="mb-3">
                                <Form.Label>Select Images</Form.Label>
                                <Form.Control
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    onChange={handleImageSelect}
                                    className="mb-2"
                                />
                                <Form.Text className="text-muted">
                                    You can select multiple images (max 4MB each).
                                </Form.Text>
                            </Form.Group>
                            {selectedFiles.length > 0 && (
                                <div className="mt-3">
                                    <h6>Selected Files:</h6>
                                    <ul className="list-unstyled">
                                        {selectedFiles.map((file, index) => (
                                            <li key={index} className="text-muted">
                                                {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            {imageError && (
                                <Alert variant="danger" className="mt-3">
                                    {imageError}
                                </Alert>
                            )}
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button
                        variant="secondary"
                        onClick={() => setShowImageModal(false)}
                        disabled={imageUploadLoading}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleImageUpload}
                        disabled={imageUploadLoading || selectedFiles.length === 0}
                    >
                        {imageUploadLoading ? 'Uploading...' : 'Upload Images'}
                    </Button>
                </Modal.Footer>
            </Modal>
        </Card>
    );
};

export default ProductImages;