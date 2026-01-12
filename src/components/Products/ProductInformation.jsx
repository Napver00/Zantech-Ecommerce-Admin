import React from "react";
import { Card, Form, Row, Col, Button, Spinner } from "react-bootstrap";
import JoditEditor from "jodit-react";

const ProductInformation = ({
  editForm,
  handleEditFormChange,
  handleEditorChange,
  handleQuickEditSubmit,
  editLoading,
  editorConfig,
  editorRef,
}) => {
  return (
    <Card className="border mb-4">
      <Card.Header className="bg-light">
        <h5 className="mb-0">Basic Information</h5>
      </Card.Header>
      <Card.Body>
        <Form onSubmit={handleQuickEditSubmit}>
          {editLoading ? (
            <div className="text-center py-4">
              <Spinner animation="border" />
              <p className="text-muted mt-2 mb-0">Updating product...</p>
            </div>
          ) : (
            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>Product Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={editForm.name}
                    onChange={handleEditFormChange}
                    required
                    className="form-control-lg"
                  />
                </Form.Group>
              </Col>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>Short Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={4}
                    name="short_description"
                    value={editForm.short_description}
                    onChange={handleEditFormChange}
                    placeholder="Enter a brief description..."
                  />
                </Form.Group>
              </Col>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>Description</Form.Label>
                  <JoditEditor
                    ref={editorRef}
                    value={editForm.description}
                    config={editorConfig}
                    tabIndex={1}
                    onBlur={handleEditorChange}
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
                    className="form-control-lg"
                  />
                </Form.Group>

                {/* Show discounted price */}
                <Form.Group className="mb-2">
                  <Form.Label>Discounted Price (৳)</Form.Label>
                  <Form.Control
                    type="text"
                    value={editForm.discountedPrice ?? "0"}
                    readOnly
                    plaintext
                    className="fw-bold text-success"
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
                    className="form-control-lg"
                  />
                </Form.Group>
                {/* Show discount percentage */}
                <Form.Group className="mb-2">
                  <Form.Label>Discount Percentage (%)</Form.Label>
                  <Form.Control
                    type="text"
                    value={editForm.discountPercentage ?? "0"}
                    readOnly
                    plaintext
                    className="fw-bold text-primary"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Discount (Flat)</Form.Label>
                  <Form.Control
                    type="number"
                    name="discount"
                    value={editForm.discount || "0"}
                    onChange={handleEditFormChange}
                    min="0"
                    placeholder="0"
                    className="form-control-lg"
                  />
                </Form.Group>
              </Col>
              <Col md={12} className="text-end">
                <Button
                  variant="primary"
                  type="submit"
                  className="update-btn"
                  disabled={editLoading}
                >
                  {editLoading ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      Updating...
                    </>
                  ) : (
                    "Update Product"
                  )}
                </Button>
              </Col>
            </Row>
          )}
        </Form>
      </Card.Body>
    </Card>
  );
};

export default ProductInformation;
