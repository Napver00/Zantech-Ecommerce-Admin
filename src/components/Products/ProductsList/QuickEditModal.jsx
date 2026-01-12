import React from 'react';
import { Modal, Form, Button, Row, Col } from 'react-bootstrap';
import { FaPencilAlt, FaSpinner } from 'react-icons/fa';
import Loading from '../../Loading';

const QuickEditModal = ({ show, handleClose, editForm, handleEditFormChange, handleSubmit, editLoading }) => {
  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Quick Edit Product</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {editLoading ? (
            <div className="text-center py-4">
              <Loading />
              <p className="text-muted mt-2 mb-0">Updating product...</p>
            </div>
          ) : (
            <Row className="g-3">
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>Product Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={editForm.name}
                    onChange={handleEditFormChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Price (৳)</Form.Label>
                  <Form.Control
                    type="number"
                    name="price"
                    value={editForm.price}
                    onChange={handleEditFormChange}
                    min="0"
                    step="0.01"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Quantity</Form.Label>
                  <Form.Control
                    type="number"
                    name="quantity"
                    value={editForm.quantity}
                    onChange={handleEditFormChange}
                    min="0"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Discount (%)</Form.Label>
                  <Form.Control
                    type="number"
                    name="discount"
                    value={editForm.discount}
                    onChange={handleEditFormChange}
                    min="0"
                    max="100"
                    placeholder="0"
                  />
                  <Form.Text className="text-muted">
                    Enter 0 if no discount
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="secondary" 
            onClick={handleClose}
            disabled={editLoading}
          >
            Cancel
          </Button>
          <Button 
            variant="primary" 
            type="submit"
            disabled={editLoading}
            className="d-flex align-items-center gap-2"
          >
            {editLoading ? (
              <>
                <FaSpinner className="spinner-border spinner-border-sm" />
                Updating...
              </>
            ) : (
              <>
                <FaPencilAlt className="me-2" /> Update Product
              </>
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default QuickEditModal;