import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaSpinner,
  FaEnvelope,
  FaFileInvoice,
} from "react-icons/fa";
import { toast } from "react-hot-toast";
import axiosInstance from "../../config/axios";
import { Card, Button, Form, Row, Col, Badge } from "react-bootstrap";
import Loading from "../../components/Loading";
import "../Categories/Categories.css";
import OrderInformation from "../../components/Orders/ViewOrder/OrderInformation";
import CustomerInformation from "../../components/Orders/ViewOrder/CustomerInformation";
import PaymentInformation from "../../components/Orders/ViewOrder/PaymentInformation";
import OrderItems from "../../components/Orders/ViewOrder/OrderItems";
import StatusUpdateModal from "../../components/Orders/ViewOrder/StatusUpdateModal";
import EmailModal from "../../components/Orders/ViewOrder/EmailModal";
import InvoiceDocument from "../../components/InvoiceDocument";
import EditShippingAddressModal from "../../components/Orders/EditShippingAddressModal";
import usePageTitle from "../../hooks/usePageTitle";

const ViewOrder = () => {
  usePageTitle("View Order Details");
  const { id } = useParams();
  const navigate = useNavigate();
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [generatingInvoice, setGeneratingInvoice] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showEditAddressModal, setShowEditAddressModal] = useState(false);

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    try {
      const response = await axiosInstance.get(`/orders/${id}`);
      if (response.data.success) {
        setOrderData(response.data.data);
      } else {
        throw new Error(response.data.message || "Failed to fetch order");
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to fetch order details"
      );
      navigate("/orders");
    } finally {
      setLoading(false);
    }
  };

  const refreshOrderData = async () => {
    setIsRefreshing(true);
    try {
      await fetchOrder();
      toast.success("Order data refreshed");
    } catch (error) {
      console.error("Refresh error:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (updatingStatus) return;

    if (newStatus === orderData?.order?.status?.toString()) {
      return;
    }

    setSelectedStatus(newStatus);
    setShowStatusModal(true);
  };

  const confirmStatusChange = async () => {
    if (!selectedStatus) return;

    setUpdatingStatus(true);
    try {
      const response = await axiosInstance.put(`/orders/update-status/${id}`, {
        status: parseInt(selectedStatus),
      });

      if (response.data.success) {
        setOrderData((prev) => ({
          ...prev,
          order: {
            ...prev.order,
            status: response.data.data.new_status.toString(),
            status_change_desc: response.data.data.status_change_desc,
          },
        }));
        toast.success(
          response.data.message || "Order status updated successfully"
        );
        refreshOrderData();
      } else {
        throw new Error(response.data.message || "Failed to update status");
      }
    } catch (error) {
      console.error("Status update error:", error);
      toast.error(
        error.response?.data?.message || "Failed to update order status"
      );
    } finally {
      setUpdatingStatus(false);
      setShowStatusModal(false);
      setSelectedStatus(null);
    }
  };

  const handleGenerateInvoice = () => {
    if (generatingInvoice || !orderData) return;

    setGeneratingInvoice(true);
    try {
      const printWindow = window.open("", "_blank");

      const invoiceContent = InvoiceDocument({ orderData });

      printWindow.document.write(invoiceContent);
      printWindow.document.close();

      printWindow.onload = function () {
        setTimeout(() => {
          printWindow.print();
        }, 500);
      };

      toast.success("Invoice generated successfully");
    } catch (error) {
      console.error("Invoice generation error:", error);
      toast.error("Failed to generate invoice");
    } finally {
      setGeneratingInvoice(false);
    }
  };

  const handleAddressUpdated = (updatedData) => {
    refreshOrderData();
  };

  if (loading) {
    return <Loading />;
  }

  if (!orderData) {
    return (
      <div className="categories-container">
        <Card>
          <Card.Body>
            <div className="text-center">
              <h3>Order not found</h3>
              <Button variant="primary" onClick={() => navigate(-1)}>
                <FaArrowLeft className="me-2" /> Back to Orders
              </Button>
            </div>
          </Card.Body>
        </Card>
      </div>
    );
  }

  const { order, user, shipping_address, coupon, order_items, payments } =
    orderData;

  return (
    <div className="orders-container">
      <EditShippingAddressModal
        show={showEditAddressModal}
        onHide={() => setShowEditAddressModal(false)}
        orderData={orderData}
        onUpdate={handleAddressUpdated}
      />

      <div className="landing-header mb-4 d-flex justify-content-between align-items-center">
        <div>
          <Button
            variant="link"
            className="p-0 mb-2 text-decoration-none text-muted small"
            onClick={() => navigate(-1)}
          >
            <FaArrowLeft className="me-2" /> Back to Orders
          </Button>
          <h2 className="mb-1 text-dark fw-bold">Order Details #{order.id}</h2>
          <p className="text-muted lead fs-6 mb-0">
            View and manage order information
          </p>
        </div>
        <div className="d-flex gap-2">
          <Button
            variant="white"
            onClick={refreshOrderData}
            disabled={isRefreshing}
            className="d-flex align-items-center gap-2 shadow-sm border"
          >
            {isRefreshing ? (
              <FaSpinner className="spinner-border spinner-border-sm" />
            ) : (
              <FaSpinner />
            )}
            <span className="d-none d-md-inline">Refresh</span>
          </Button>
          <Button
            variant="white"
            onClick={handleGenerateInvoice}
            disabled={generatingInvoice}
            className="d-flex align-items-center gap-2 shadow-sm border"
          >
            {generatingInvoice ? (
              <FaSpinner className="spinner-border spinner-border-sm" />
            ) : (
              <FaFileInvoice />
            )}
            <span className="d-none d-md-inline">Invoice</span>
          </Button>
          <Button
            variant="white"
            onClick={() => setShowEmailModal(true)}
            className="d-flex align-items-center gap-2 shadow-sm border"
          >
            <FaEnvelope />
            <span className="d-none d-md-inline">Email</span>
          </Button>
          <Form.Select
            value={orderData?.order?.status?.toString() || "0"}
            onChange={(e) => handleStatusChange(e.target.value)}
            disabled={updatingStatus}
            style={{ width: "auto", minWidth: "140px" }}
            className="shadow-sm border-0 bg-white"
          >
            <option value="0">Processing</option>
            <option value="1">Completed</option>
            <option value="2">On Hold</option>
            <option value="3">Cancelled</option>
            <option value="4">Refunded</option>
          </Form.Select>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-12">
          <Card className="modern-card border-0">
            <Card.Body className="p-4">
              <EmailModal
                show={showEmailModal}
                handleClose={() => setShowEmailModal(false)}
                orderId={id}
              />

              <StatusUpdateModal
                show={showStatusModal}
                handleClose={() => setShowStatusModal(false)}
                selectedStatus={selectedStatus}
                orderStatus={orderData?.order?.status}
                updatingStatus={updatingStatus}
                confirmStatusChange={confirmStatusChange}
              />

              <Row className="g-4 mb-4">
                <Col md={6}>
                  <div className="h-100 p-3 bg-light rounded-3 border">
                    <OrderInformation order={order} coupon={coupon} />
                  </div>
                </Col>
                <Col md={6}>
                  <div className="h-100 p-3 bg-light rounded-3 border">
                    <CustomerInformation
                      user={user}
                      shipping_address={shipping_address}
                      order={order}
                      setShowEditAddressModal={setShowEditAddressModal}
                    />
                  </div>
                </Col>
              </Row>

              <div className="mb-4">
                <PaymentInformation
                  payments={payments}
                  refreshOrderData={refreshOrderData}
                />
              </div>

              <OrderItems
                orderItems={order_items}
                orderId={id}
                refreshOrderData={refreshOrderData}
              />

              {coupon && (
                <div className="mt-4 p-3 bg-success bg-opacity-10 border border-success rounded-3 d-flex align-items-center">
                  <Badge bg="success" className="me-3 px-3 py-2 rounded-pill">
                    {coupon.code}
                  </Badge>
                  <div>
                    <span className="fw-bold text-success d-block">
                      Coupon Applied
                    </span>
                    <span className="small text-muted">
                      Discount Amount: ৳
                      {parseFloat(coupon.amount).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
            </Card.Body>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ViewOrder;
