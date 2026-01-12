import React, { useState } from 'react';
import { Card, Table, Form, Badge, Button } from 'react-bootstrap';
import { FaCreditCard, FaSpinner, FaEdit } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import axiosInstance from '../../../config/axios';

const PaymentInformation = ({ payments, refreshOrderData }) => {
  const [updatingPaymentStatus, setUpdatingPaymentStatus] = useState(false);
  const [updatingPaidAmount, setUpdatingPaidAmount] = useState(false);
  const [editingPaidAmount, setEditingPaidAmount] = useState(null);

  const getPaymentType = (type) => {
    const types = {
      "1": "Cash on Delivery",
      "2": "Mobile Banking",
      "3": "Card",
    };
    return types[type] || "Unknown";
  };
  
  const handlePaymentStatusChange = async (paymentId, newStatus) => {
    if (updatingPaymentStatus) return;

    setUpdatingPaymentStatus(true);
    try {
      const response = await axiosInstance.put(`/payments/update-status/${paymentId}`, {
        status: parseInt(newStatus),
      });

      if (response.data.success) {
        toast.success("Payment status updated successfully");
        refreshOrderData();
      } else {
        throw new Error(response.data.message || "Failed to update payment status");
      }
    } catch (error) {
      console.error("Payment status update error:", error);
      toast.error(error.response?.data?.message || "Failed to update payment status");
    } finally {
      setUpdatingPaymentStatus(false);
    }
  };

  const handlePaidAmountChange = async (paymentId, newAmount) => {
    if (updatingPaidAmount || !newAmount || newAmount < 0) return;

    const payment = payments.find((p) => p.payment_id === paymentId);
    if (!payment) return;

    const totalAmount = parseFloat(payment.amount);
    const paidAmount = parseFloat(newAmount);

    if (paidAmount > totalAmount) {
      toast.error("Paid amount cannot exceed total amount");
      return;
    }

    setUpdatingPaidAmount(true);
    try {
      const response = await axiosInstance.put(`/payments/update-paid-amount/${paymentId}`, {
        padi_amount: paidAmount
      });

      if (response.data.success) {
        toast.success("Paid amount updated successfully");
        refreshOrderData();
      } else {
        throw new Error(response.data.message || "Failed to update paid amount");
      }
    } catch (error) {
      console.error("Paid amount update error:", error);
      toast.error(error.response?.data?.message || "Failed to update paid amount");
    } finally {
      setUpdatingPaidAmount(false);
      setEditingPaidAmount(null);
    }
  };

  return (
    <Card className="modern-card mb-4">
      <Card.Header className="bg-light">
        <h5 className="mb-0 d-flex align-items-center">
          <FaCreditCard className="me-2" /> Payment Information
        </h5>
      </Card.Header>
      <Card.Body>
        <div className="table-responsive">
          <Table className="table-hover modern-table align-middle">
            <thead className="bg-light">
              <tr>
                <th>Payment ID</th>
                <th>Status</th>
                <th>Amount</th>
                <th>Paid Amount</th>
                <th>Due Amount</th>
                <th>Payment Type</th>
                <th>Transaction ID</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.payment_id}>
                  <td>{payment.payment_id}</td>
                  <td>
                    <div className="d-flex align-items-center gap-2">
                      <Form.Select
                        value={payment.status}
                        onChange={(e) =>
                          handlePaymentStatusChange(
                            payment.payment_id,
                            e.target.value
                          )
                        }
                        disabled={updatingPaymentStatus}
                        size="sm"
                        style={{ width: "auto" }}
                        className="modern-select"
                      >
                        <option value="0">Unpaid</option>
                        <option value="1">Paid by Cash</option>
                        <option value="3">Paid by Bank</option>
                        <option value="4">Paid by Mobile Bank</option>
                      </Form.Select>
                      {updatingPaymentStatus && (
                        <FaSpinner className="spinner-border spinner-border-sm" />
                      )}
                    </div>
                  </td>
                  <td>৳{parseFloat(payment.amount).toLocaleString()}</td>
                  <td>
                    <div className="d-flex align-items-center gap-2">
                      {editingPaidAmount === payment.payment_id ? (
                        <div className="d-flex align-items-center gap-2">
                          <Form.Control
                            type="number"
                            min="0"
                            step="0.01"
                            defaultValue={payment.paid_amount}
                            onKeyPress={(e) => {
                              if (e.key === "Enter") {
                                handlePaidAmountChange(
                                  payment.payment_id,
                                  e.target.value
                                );
                              }
                            }}
                            onBlur={(e) => {
                              handlePaidAmountChange(
                                payment.payment_id,
                                e.target.value
                              );
                            }}
                            autoFocus
                            size="sm"
                            style={{ width: "120px" }}
                            disabled={updatingPaidAmount}
                            className="modern-input"
                          />
                          {updatingPaidAmount && (
                            <FaSpinner className="spinner-border spinner-border-sm" />
                          )}
                        </div>
                      ) : (
                        <div
                          className="d-flex align-items-center gap-2"
                          onClick={() =>
                            setEditingPaidAmount(payment.payment_id)
                          }
                          style={{ cursor: "pointer" }}
                        >
                          <span className="fw-medium">
                            ৳
                            {parseFloat(
                              payment.paid_amount
                            ).toLocaleString()}
                          </span>
                          <FaEdit size={12} className="text-muted" />
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    ৳{parseFloat(payment.due_amount).toLocaleString()}
                  </td>
                  <td>
                    <Badge
                      bg={
                        payment.payment_type === "1" ? "success" : "info"
                      }
                      className="modern-badge"
                    >
                      {getPaymentType(payment.payment_type)}
                    </Badge>
                  </td>
                  <td>
                    {payment.transaction_id ? (
                      <span className="text-muted">
                        {payment.transaction_id}
                      </span>
                    ) : payment.payment_type === "1" ? (
                      <span className="text-muted">
                        N/A (Cash on Delivery)
                      </span>
                    ) : (
                      <span className="text-muted">Pending</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      </Card.Body>
    </Card>
  );
};

export default PaymentInformation;