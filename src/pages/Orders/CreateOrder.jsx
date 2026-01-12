import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Form, Button, Row, Col } from "react-bootstrap";
import { FaArrowLeft } from "react-icons/fa";
import axiosInstance from "../../config/axios";
import { toast } from "react-hot-toast";
import ProgressBar from "../../components/Orders/CreateOrder/ProgressBar";
import CustomerDetails from "../../components/Orders/CreateOrder/CustomerDetails";
import ProductSelection from "../../components/Orders/CreateOrder/ProductSelection";
import PaymentDetails from "../../components/Orders/CreateOrder/PaymentDetails";
import OrderSummary from "../../components/Orders/CreateOrder/OrderSummary";
import AddShippingAddressModal from "../../components/Customers/AddShippingAddressModal";
import "../Categories/Categories.css";
import "../Products/AddProduct.css";
import usePageTitle from "../../hooks/usePageTitle";

const CreateOrder = () => {
  usePageTitle("Create New Order");
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    user_id: null,
    coupon_id: null,
    shipping_id: null,
    shipping_charge: 0,
    product_subtotal: 0,
    total: 0,
    payment_type: 1,
    trxed: "",
    paymentphone: "",
    user_name: "",
    address: "",
    userphone: "",
    products: [],
  });

  const [selectedProducts, setSelectedProducts] = useState([]);
  const [shippingAddresses, setShippingAddresses] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [isGuest, setIsGuest] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [showAddAddressModal, setShowAddAddressModal] = useState(false);

  useEffect(() => {
    fetchCoupons();
  }, []);

  useEffect(() => {
    if (formData.user_id) {
      fetchShippingAddresses(formData.user_id);
    } else {
      setShippingAddresses([]);
    }
  }, [formData.user_id]);

  useEffect(() => {
    let progress = 0;
    if (selectedProducts.length > 0) progress += 25;
    if (formData.user_id || (isGuest && formData.user_name && formData.address))
      progress += 25;
    if (formData.shipping_id || (isGuest && formData.address)) progress += 25;
    if (
      formData.payment_type &&
      (formData.payment_type === 1 ||
        (formData.payment_type === 2 &&
          formData.trxed &&
          formData.paymentphone))
    )
      progress += 25;
    setCurrentStep(Math.ceil(progress / 25));
  }, [formData, isGuest, selectedProducts]);

  useEffect(() => {
    updateTotals();
  }, [selectedProducts]);

  const fetchCoupons = async () => {
    try {
      const response = await axiosInstance.get("/coupons");
      if (response.data.success) {
        setCoupons(response.data.data);
      } else {
        toast.error(response.data.message || "Failed to fetch coupons");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch coupons");
    }
  };

  const fetchShippingAddresses = async (userId) => {
    try {
      const response = await axiosInstance.get(`/shipping-addresses/${userId}`);
      if (response.data.success) {
        setShippingAddresses(response.data.data);
      } else {
        toast.error(
          response.data.message || "Failed to fetch shipping addresses"
        );
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to fetch shipping addresses"
      );
    }
  };

  const updateTotals = () => {
    const subtotal = selectedProducts.reduce(
      (sum, product) => sum + product.price * product.quantity,
      0
    );

    setFormData((prev) => ({
      ...prev,
      product_subtotal: subtotal,
      total: subtotal + (prev.shipping_charge || 0),
    }));
  };

  const validateForm = () => {
    const errors = {};

    if (selectedProducts.length === 0) {
      errors.products = "Please add at least one product";
    }

    if (isGuest) {
      if (!formData.user_name) errors.user_name = "Guest name is required";
      if (!formData.address) errors.address = "Guest address is required";
      if (!formData.userphone) errors.userphone = "Guest phone is required";
    } else {
      if (!formData.user_id) {
        errors.user_id = "Please select a customer";
      }
      if (formData.user_id && !formData.shipping_id) {
        errors.shipping_id = "Please select a shipping address";
      }
    }

    if (formData.payment_type === 2) {
      if (!formData.trxed?.trim()) errors.trxed = "Transaction ID is required";
      if (!formData.paymentphone?.trim())
        errors.paymentphone = "Payment phone is required";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      const orderData = {
        ...formData,
        user_id: isGuest ? null : formData.user_id,
        shipping_id: isGuest ? null : formData.shipping_id,
        products: selectedProducts.map((p) => ({
          product_id: p.product_id,
          quantity: p.quantity,
          price: p.price,
        })),
      };

      const response = await axiosInstance.post(
        "/orders/place-order",
        orderData
      );

      if (response.data.success) {
        toast.success("Order created successfully");
        navigate("/orders");
      } else {
        throw new Error(response.data.message || "Failed to create order");
      }
    } catch (error) {
      const apiError = error.response?.data;
      let errorMessage = "Failed to create order."; // Default message

      if (apiError) {
        // Prioritize the 'errors' field if it's a string
        if (apiError.errors && typeof apiError.errors === "string") {
          errorMessage = apiError.errors;
        }
        // Handle Laravel-style validation object
        else if (apiError.errors && typeof apiError.errors === "object") {
          errorMessage = Object.values(apiError.errors).flat().join(" ");
        }
        // Fallback to the 'message' field
        else if (apiError.message) {
          errorMessage = apiError.message;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleAddressAdded = (newAddress) => {
    setShippingAddresses((prev) => [...prev, newAddress]);
    setFormData((prev) => ({
      ...prev,
      shipping_id: newAddress.id,
    }));
    setShowAddAddressModal(false);
  };

  return (
    <div className="orders-container">
      <Card className="modern-card">
        <Card.Body className="p-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <Button
                variant="link"
                className="p-0 mb-2 text-decoration-none"
                onClick={() => navigate("/orders")}
              >
                <FaArrowLeft className="me-2" /> Back to Orders
              </Button>
              <h2 className="page-title mb-1">Create New Order</h2>
              <p className="text-muted mb-0">Add a new order to the system</p>
            </div>
          </div>

          <ProgressBar currentStep={currentStep} />

          <Form onSubmit={handleSubmit}>
            <Row>
              <Col lg={8}>
                <CustomerDetails
                  isGuest={isGuest}
                  setIsGuest={setIsGuest}
                  formData={formData}
                  setFormData={setFormData}
                  validationErrors={validationErrors}
                  setValidationErrors={setValidationErrors}
                  shippingAddresses={shippingAddresses}
                  setShowAddAddressModal={setShowAddAddressModal}
                  fetchShippingAddresses={fetchShippingAddresses}
                />

                <ProductSelection
                  selectedProducts={selectedProducts}
                  setSelectedProducts={setSelectedProducts}
                  validationErrors={validationErrors}
                  setValidationErrors={setValidationErrors}
                  updateTotals={updateTotals}
                />

                <PaymentDetails
                  formData={formData}
                  setFormData={setFormData}
                  coupons={coupons}
                  validationErrors={validationErrors}
                  setValidationErrors={setValidationErrors}
                />
              </Col>

              <Col lg={4}>
                <OrderSummary
                  formData={formData}
                  selectedProducts={selectedProducts}
                  loading={loading}
                  coupons={coupons}
                />
              </Col>
            </Row>
          </Form>
        </Card.Body>
      </Card>

      <AddShippingAddressModal
        show={showAddAddressModal}
        onHide={() => setShowAddAddressModal(false)}
        userId={formData.user_id}
        onAdd={handleAddressAdded}
      />
    </div>
  );
};

export default CreateOrder;
