import React from 'react';
import { Card, Form, Row, Col } from 'react-bootstrap';
import JoditEditor from 'jodit-react';

const BasicInformation = ({ formData, handleInputChange, editorRef, editorConfig, handleEditorChange }) => {
  return (
    <Card className="border mb-4">
      <Card.Header className="bg-light">
        <h5 className="mb-0">Basic Information</h5>
      </Card.Header>
      <Card.Body>
        <Row>
          <Col md={12}>
            <Form.Group className="mb-3">
              <Form.Label>Product Name</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="form-control-lg"
                placeholder="Enter product name"
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
                value={formData.short_description}
                onChange={handleInputChange}
                placeholder="Enter a brief description..."
              />
            </Form.Group>
          </Col>
          <Col md={12}>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <JoditEditor
                ref={editorRef}
                value={formData.description}
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
                value={formData.price}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                required
                className="form-control-lg"
                placeholder="0.00"
              />
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group className="mb-3">
              <Form.Label>Quantity</Form.Label>
              <Form.Control
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleInputChange}
                min="0"
                required
                className="form-control-lg"
                placeholder="0"
              />
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group className="mb-3">
              <Form.Label>Discount (Flat)</Form.Label>
              <Form.Control
                type="number"
                name="discount"
                value={formData.discount}
                onChange={handleInputChange}
                min="0"
                placeholder="0"
                className="form-control-lg"
              />
            </Form.Group>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
};

export default BasicInformation;