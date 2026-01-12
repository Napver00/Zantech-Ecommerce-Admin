import React from 'react';
import { Card, Form, Row, Col } from 'react-bootstrap';
import { FaCreditCard } from 'react-icons/fa';

const PaymentDetails = ({
  formData,
  setFormData,
  coupons,
  validationErrors,
  setValidationErrors
}) => {
  return (
    <Card className="modern-card mb-4">
      <Card.Body>
        <h5 className="mb-3 d-flex align-items-center">
          <FaCreditCard className="me-2" /> Payment Information
        </h5>
        <hr className="mb-4" />
        <Row>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label className="fw-medium">Coupon</Form.Label>
              <Form.Select
                value={formData.coupon_id || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, coupon_id: e.target.value ? parseInt(e.target.value) : null }))}
                className="modern-select"
              >
                <option value="">Select coupon</option>
                {coupons.map(coupon => (
                  <option key={coupon.id} value={coupon.id}>
                    {coupon.code} - {coupon.amount} off
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="fw-medium">Shipping Charge</Form.Label>
              <Form.Control
                type="number"
                min="0"
                value={formData.shipping_charge}
                onChange={(e) => {
                  const charge = parseFloat(e.target.value) || 0;
                  setFormData(prev => ({
                    ...prev,
                    shipping_charge: charge,
                    total: prev.product_subtotal + charge
                  }));
                }}
                placeholder="Enter shipping charge"
                className="modern-input"
              />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label className="fw-medium">Payment Method</Form.Label>
              <Form.Select
                value={formData.payment_type}
                onChange={(e) => setFormData(prev => ({ ...prev, payment_type: parseInt(e.target.value) }))}
                className="modern-select"
              >
                <option value={1}>Cash on Delivery</option>
                <option value={2}>Mobile Banking (Bkash)</option>
              </Form.Select>
            </Form.Group>

            {formData.payment_type === 2 && (
              <>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-medium">Transaction ID</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.trxed}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, trxed: e.target.value }));
                      setValidationErrors(prev => ({ ...prev, trxed: null }));
                    }}
                    isInvalid={!!validationErrors.trxed}
                    placeholder="Enter Bkash transaction ID"
                    className="modern-input"
                  />
                  <Form.Control.Feedback type="invalid">
                    {validationErrors.trxed}
                  </Form.Control.Feedback>
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-medium">Payment Phone</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.paymentphone}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, paymentphone: e.target.value }));
                      setValidationErrors(prev => ({ ...prev, paymentphone: null }));
                    }}
                    isInvalid={!!validationErrors.paymentphone}
                    placeholder="Enter Bkash payment phone number"
                    className="modern-input"
                  />
                  <Form.Control.Feedback type="invalid">
                    {validationErrors.paymentphone}
                  </Form.Control.Feedback>
                </Form.Group>
              </>
            )}
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
};

export default PaymentDetails;