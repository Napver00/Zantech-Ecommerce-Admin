import React from 'react';
import { Card, Button } from 'react-bootstrap';
import { FaSpinner } from 'react-icons/fa';

const OrderSummary = ({ formData, selectedProducts, loading, coupons }) => {
  return (
    <Card className="mb-4 sticky-top" style={{ top: '20px' }}>
      <Card.Header className="bg-light">
        <h5 className="mb-0">Order Summary</h5>
      </Card.Header>
      <Card.Body>
        <div className="mb-3">
          <div className="d-flex justify-content-between mb-2">
            <span>Products ({selectedProducts.length})</span>
            <span>৳{formData.product_subtotal.toLocaleString()}</span>
          </div>
          <div className="d-flex justify-content-between mb-2">
            <span>Shipping</span>
            <span>৳{formData.shipping_charge.toLocaleString()}</span>
          </div>
          {formData.coupon_id && coupons && (
            <div className="d-flex justify-content-between mb-2 text-success">
              <span>Coupon Discount</span>
              <span>-৳{(coupons.find(c => c.id === formData.coupon_id)?.amount || 0).toLocaleString()}</span>
            </div>
          )}
          <hr />
          <div className="d-flex justify-content-between fw-bold">
            <span>Total</span>
            <span>৳{formData.total.toLocaleString()}</span>
          </div>
        </div>
        <Button
          type="submit"
          variant="primary"
          className="w-100"
          disabled={loading || selectedProducts.length === 0}
        >
          {loading ? (
            <>
              <FaSpinner className="spinner" /> Creating Order...
            </>
          ) : (
            'Create Order'
          )}
        </Button>
      </Card.Body>
    </Card>
  );
};

export default OrderSummary;