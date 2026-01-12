import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaSpinner, FaTimes, FaPlus } from "react-icons/fa";
import { toast } from "react-hot-toast";
import axiosInstance from "../../config/axios";
import { Card, Form, Button, Row, Col, ListGroup } from "react-bootstrap";
import Select from 'react-select/async';
import "./Challen.css";
import usePageTitle from '../../hooks/usePageTitle';

const AddChallan = () => {
  usePageTitle('Add New Challan');
  const navigate = useNavigate();
  const [selectedItems, setSelectedItems] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [formData, setFormData] = useState({
    Date: new Date().toISOString().split('T')[0],
    supplier_id: "",
    delivery_price: "",
    invoice: null
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const response = await axiosInstance.get("/suppliers");
      setSuppliers(response.data.data);
    } catch (err) {
      console.error("Failed to fetch suppliers:", err);
      toast.error(err.response?.data?.message || "Failed to fetch suppliers");
    }
  };

  const loadItems = async (inputValue) => {
    try {
      const response = await axiosInstance.get("/products", {
        params: { search: inputValue }
      });
      return response.data.data.map(item => ({
        value: item.id,
        label: `${item.name} (${item.quantity} in stock)`,
        buying_price: item.buying_price || 0
      }));
    } catch (err) {
      console.error("Failed to fetch items:", err);
      toast.error(err.response?.data?.message || "Failed to fetch items");
      return [];
    }
  };

  const handleItemSelect = (selectedOption) => {
    if (selectedOption) {
      setSelectedItems(prev => [...prev, {
        id: selectedOption.value,
        name: selectedOption.label,
        buying_price: selectedOption.buying_price,
        quantity: 1
      }]);
    }
  };

  const handleItemRemove = (index) => {
    setSelectedItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index, field, value) => {
    setSelectedItems(prev => prev.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) { // 4MB limit
        toast.error("File size should be less than 4MB");
        return;
      }
      if (!['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/svg+xml'].includes(file.type)) {
        toast.error("Invalid file type. Please upload an image file");
        return;
      }
      setFormData(prev => ({ ...prev, invoice: file }));
    }
  };

  const calculateTotal = () => {
    const itemsTotal = selectedItems.reduce((sum, item) => 
      sum + (item.buying_price * item.quantity), 0
    );
    return itemsTotal + (parseFloat(formData.delivery_price) || 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedItems.length === 0) {
      toast.error("Please add at least one item");
      return;
    }

    setSubmitting(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('Date', formData.Date);
      formDataToSend.append('supplier_id', formData.supplier_id);
      formDataToSend.append('delivery_price', formData.delivery_price);
      formDataToSend.append('invoice', formData.invoice);

      selectedItems.forEach((item, index) => {
        formDataToSend.append(`item_id[${index}]`, item.id);
        formDataToSend.append(`buying[${index}]`, item.buying_price);
        formDataToSend.append(`quantity[${index}]`, item.quantity);
      });

      const response = await axiosInstance.post("/challans", formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        toast.success("Challan created successfully");
        navigate('/challans');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to create challan";
      toast.error(errorMessage);
      if (error.response?.data?.errors) {
        Object.values(error.response.data.errors).forEach(err => {
          toast.error(err[0]);
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="challen-container">
      <Card className="modern-card">
        <Card.Body className="p-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div className="d-flex align-items-center gap-3">
              <Button
                variant="outline-secondary"
                onClick={() => navigate('/challans')}
                className="back-btn"
              >
                <FaArrowLeft className="me-2" /> Back
              </Button>
              <div>
                <h2 className="page-title mb-1">Add New Challan</h2>
                <p className="text-muted mb-0">Create a new challan entry</p>
              </div>
            </div>
          </div>

          <Form onSubmit={handleSubmit} className="modern-form">
            <div className="form-section mb-4">
              <h5 className="section-title mb-3">Basic Information</h5>
              <Row className="g-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Date</Form.Label>
                    <Form.Control
                      type="date"
                      value={formData.Date}
                      onChange={(e) => setFormData(prev => ({ ...prev, Date: e.target.value }))}
                      required
                      className="form-control-modern"
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Supplier</Form.Label>
                    <Form.Select
                      value={formData.supplier_id}
                      onChange={(e) => setFormData(prev => ({ ...prev, supplier_id: e.target.value }))}
                      required
                      className="form-select-modern"
                    >
                      <option value="">Select Supplier</option>
                      {suppliers.map(supplier => (
                        <option key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
            </div>

            <div className="form-section mb-4">
              <h5 className="section-title mb-3">Items</h5>
              <Form.Group className="mb-3">
                <Select
                  cacheOptions
                  defaultOptions
                  loadOptions={loadItems}
                  onChange={handleItemSelect}
                  placeholder="Search and select items..."
                  noOptionsMessage={() => "No items found"}
                  loadingMessage={() => "Loading items..."}
                  className="react-select-modern"
                  classNamePrefix="select"
                />
              </Form.Group>

              {selectedItems.length > 0 && (
                <ListGroup className="items-list mb-3">
                  {selectedItems.map((item, index) => (
                    <ListGroup.Item key={index} className="item-card">
                      <div className="d-flex align-items-center gap-3">
                        <div className="flex-grow-1">
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <h6 className="item-name mb-0">{item.name}</h6>
                            <Button
                              variant="link"
                              className="remove-item-btn p-0"
                              onClick={() => handleItemRemove(index)}
                            >
                              <FaTimes />
                            </Button>
                          </div>
                          <Row className="g-3">
                            <Col md={6}>
                              <Form.Group>
                                <Form.Label>Buying Price</Form.Label>
                                <Form.Control
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={item.buying_price}
                                  onChange={(e) => handleItemChange(index, 'buying_price', parseFloat(e.target.value))}
                                  required
                                  className="form-control-modern"
                                />
                              </Form.Group>
                            </Col>
                            <Col md={6}>
                              <Form.Group>
                                <Form.Label>Quantity</Form.Label>
                                <Form.Control
                                  type="number"
                                  min="1"
                                  value={item.quantity}
                                  onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value))}
                                  required
                                  className="form-control-modern"
                                />
                              </Form.Group>
                            </Col>
                          </Row>
                        </div>
                      </div>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              )}
            </div>

            <div className="form-section mb-4">
              <h5 className="section-title mb-3">Additional Information</h5>
              <Row className="g-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Delivery Price</Form.Label>
                    <Form.Control
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.delivery_price}
                      onChange={(e) => setFormData(prev => ({ ...prev, delivery_price: e.target.value }))}
                      required
                      className="form-control-modern"
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Invoice Image</Form.Label>
                    <Form.Control
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      required
                      className="form-control-modern"
                    />
                    <Form.Text className="text-muted">
                      Max file size: 4MB. Supported formats: JPEG, PNG, JPG, GIF, SVG
                    </Form.Text>
                  </Form.Group>
                </Col>
              </Row>
            </div>

            <div className="total-section mb-4">
              <div className="total-card">
                <h5 className="total-label">Total Amount</h5>
                <h3 className="total-amount">৳{calculateTotal().toLocaleString()}</h3>
              </div>
            </div>

            <div className="form-actions">
              <Button
                variant="secondary"
                onClick={() => navigate('/challans')}
                disabled={submitting}
                className="cancel-btn"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={submitting || selectedItems.length === 0}
                className="submit-btn"
              >
                {submitting ? (
                  <>
                    <FaSpinner className="spinner me-2" />
                    Creating...
                  </>
                ) : (
                  <>
                    <FaPlus className="me-2" />
                    Create Challan
                  </>
                )}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
};

export default AddChallan; 