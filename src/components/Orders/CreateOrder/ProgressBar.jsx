import React from 'react';
import { ProgressBar as BootstrapProgressBar } from 'react-bootstrap';

const ProgressBar = ({ currentStep }) => {
  return (
    <div className="mb-4">
      <div className="d-flex justify-content-between mb-2">
        <span className="text-muted">Order Progress</span>
        <span className="text-primary">Step {currentStep} of 4</span>
      </div>
      <BootstrapProgressBar now={currentStep * 25} className="mb-2" />
      <div className="d-flex justify-content-between small text-muted">
        <span>Products</span>
        <span>Customer</span>
        <span>Shipping</span>
        <span>Payment</span>
      </div>
    </div>
  );
};

export default ProgressBar;