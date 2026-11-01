import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaEnvelope,
  FaFileInvoice,
  FaPhoneAlt,
  FaSyncAlt,
} from "react-icons/fa";
import { toast } from "react-hot-toast";
import axiosInstance from "../../config/axios";
import { Card, Button } from "react-bootstrap";
import Loading from "../../components/Loading";
import "../Categories/Categories.css";
import PaymentInformation from "../../components/Orders/ViewOrder/PaymentInformation";
import OrderItems from "../../components/Orders/ViewOrder/OrderItems";
import StatusUpdateModal from "../../components/Orders/ViewOrder/StatusUpdateModal";
import EmailModal from "../../components/Orders/ViewOrder/EmailModal";
import InvoiceDocument from "../../components/InvoiceDocument";
import InvoiceShareActions from "../../components/InvoiceShareActions";
import EditShippingAddressModal from "../../components/Orders/EditShippingAddressModal";
import usePageTitle from "../../hooks/usePageTitle";
import { EditorPage, EditorSection } from "../../components/Editor/Editor";

const ORDER_STATUSES = [
  { value: "0", label: "Processing", tone: "work" },
  { value: "2", label: "On hold", tone: "work" },
  { value: "1", label: "Completed", tone: "good" },
  { value: "3", label: "Cancelled", tone: "bad" },
  { value: "4", label: "Refunded", tone: "bad" },
];

const tk = (n) => `৳${Number(n || 0).toLocaleString()}`;

// Message that goes with the invoice PDF on WhatsApp.
const orderWhatsAppText = (orderData) => {
  const { order, user, order_items = [], payments = [] } = orderData || {};
  if (!order) return "";
  const payment = payments[0];
  const items = order_items.map(
    (i) => `• ${i.product_name || i.name || "Item"} × ${i.quantity}`
  );
  return [
    `Dear ${user?.name || order.user_name || "Customer"},`,
    "",
    `Your ZAN Tech invoice ${order.invoice_code} is attached.`,
    "",
    ...items,
    "",
    `Total: ${tk(order.total_amount)}`,
    ...(payment ? [`Paid: ${tk(payment.paid_amount)}`, `Due: ${tk(payment.due_amount)}`] : []),
    "",
    "Thank you for shopping with ZAN Tech.",
  ].join("\n");
};

const ViewOrder = () => {
  const { id } = useParams();
  usePageTitle(`Order #${id}`);
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
        return true;
      } else {
        throw new Error(response.data.message || "Failed to fetch order");
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to fetch order details"
      );
      navigate("/orders");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const refreshOrderData = async () => {
    setIsRefreshing(true);
    try {
      const success = await fetchOrder();
      if (success) toast.success("Order data refreshed");
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

  const handleAddressUpdated = () => {
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

  const status = ORDER_STATUSES.find((s) => s.value === String(order.status)) || ORDER_STATUSES[0];
  const payment = payments?.[0];
  const due = payment ? Number(payment.due_amount) || 0 : 0;
  const itemCount = (order_items || []).reduce((n, i) => n + (Number(i.quantity) || 0), 0);
  const customerName = user?.name || order.user_name || "Customer";
  const customerPhone = user?.phone || order.user_phone || shipping_address?.phone || "";
  const placedAt = new Date(order.created_at).toLocaleString("en-GB", {
    day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit",
  });

  const sidebar = (
    <div className="ed-nav-wrap">
      <div className="ed-rail-card">
        <h3>Order status</h3>
        <div className="od-status-list" role="radiogroup" aria-label="Order status">
          {ORDER_STATUSES.map((s) => (
            <button
              key={s.value}
              type="button"
              role="radio"
              aria-checked={s.value === status.value}
              className={`od-status-btn is-${s.tone} ${s.value === status.value ? "is-current" : ""}`}
              disabled={updatingStatus}
              onClick={() => handleStatusChange(s.value)}
            >
              <span className="od-status-dot" aria-hidden="true" />
              {s.label}
            </button>
          ))}
        </div>
        {typeof order.status_change_desc === "string" && order.status_change_desc.trim() && order.status_change_desc !== "0" && (
          <p className="ed-hint mb-0 mt-2">{order.status_change_desc}</p>
        )}
      </div>

      <div className="ed-rail-card">
        <h3>Customer</h3>
        <p className="od-name">{customerName}</p>
        {customerPhone && <a className="od-line" href={`tel:${customerPhone}`}><FaPhoneAlt aria-hidden="true" />{customerPhone}</a>}
        {user?.email && <a className="od-line" href={`mailto:${user.email}`}><FaEnvelope aria-hidden="true" />{user.email}</a>}
      </div>

      <div className="ed-rail-card">
        <div className="od-card-head">
          <h3>Deliver to</h3>
          <Button variant="link" size="sm" className="p-0" onClick={() => setShowEditAddressModal(true)}>Edit</Button>
        </div>
        {shipping_address ? (
          <address className="od-address">
            <strong>{shipping_address.f_name} {shipping_address.l_name}</strong><br />
            {shipping_address.address}<br />
            {[shipping_address.city, shipping_address.zip].filter(Boolean).join(" ")}<br />
            {shipping_address.phone && <a href={`tel:${shipping_address.phone}`}>{shipping_address.phone}</a>}
          </address>
        ) : (
          <address className="od-address">{user?.address || order.address || "No address given"}</address>
        )}
      </div>

      <div className="ed-rail-card">
        <h3>Summary</h3>
        <dl>
          <dt>Items ({itemCount})</dt><dd>{tk(order.item_subtotal)}</dd>
          <dt>Delivery</dt><dd>{tk(order.shipping_charge)}</dd>
          {Number(order.discount) > 0 && (<><dt>Discount{coupon ? ` (${coupon.code})` : ""}</dt><dd className="text-danger">−{tk(order.discount)}</dd></>)}
          <dt className="od-total">Total</dt><dd className="od-total">{tk(order.total_amount)}</dd>
          {payment && (<><dt>Paid</dt><dd>{tk(payment.paid_amount)}</dd></>)}
          {payment && (<><dt>Due</dt><dd className={due > 0 ? "text-danger" : "text-success"}>{due > 0 ? tk(due) : "Nothing due"}</dd></>)}
        </dl>
      </div>
    </div>
  );

  return (
    <EditorPage
      wide
      railFirst
      title={`Order ${order.invoice_code || `#${order.id}`}`}
      meta={
        <>
          <span className={`ed-status ${status.tone === "good" ? "is-live" : status.tone === "bad" ? "is-off" : "is-warn"}`}>{status.label}</span>
          <span>{placedAt}</span>
          <span>{itemCount} {itemCount === 1 ? "item" : "items"} · {tk(order.total_amount)}</span>
          {payment && (due > 0
            ? <span className="text-danger fw-semibold">{tk(due)} due</span>
            : <span className="text-success fw-semibold">Paid in full</span>)}
        </>
      }
      actions={
        <>
          <Button variant="outline-secondary" onClick={handleGenerateInvoice} disabled={generatingInvoice}>
            <FaFileInvoice className="me-2" aria-hidden="true" />Print invoice
          </Button>
          <InvoiceShareActions
            buildHtml={() => InvoiceDocument({ orderData })}
            invoiceNo={order.invoice_code}
            emailEndpoint={`/orders/${order.id}/email-invoice`}
            defaultEmail={user?.email || ""}
            phone={customerPhone}
            customerName={user?.name || order.user_name || ""}
            whatsappText={orderWhatsAppText(orderData)}
          />
          <Button variant="outline-secondary" onClick={() => setShowEmailModal(true)} title="Send the order details email">
            <FaEnvelope className="me-2" aria-hidden="true" />Order email
          </Button>
          <Button variant="link" className="text-muted" onClick={refreshOrderData} disabled={isRefreshing} aria-label="Reload order">
            <FaSyncAlt className={isRefreshing ? "fa-spin" : ""} aria-hidden="true" />
          </Button>
        </>
      }
      nav={sidebar}
    >
      <EditShippingAddressModal
        show={showEditAddressModal}
        onHide={() => setShowEditAddressModal(false)}
        orderData={orderData}
        onUpdate={handleAddressUpdated}
      />
      <EmailModal show={showEmailModal} handleClose={() => setShowEmailModal(false)} orderId={id} />
      <StatusUpdateModal
        show={showStatusModal}
        handleClose={() => setShowStatusModal(false)}
        selectedStatus={selectedStatus}
        orderStatus={orderData?.order?.status}
        updatingStatus={updatingStatus}
        confirmStatusChange={confirmStatusChange}
      />

      <EditorSection id="items" title="Items" count={itemCount} help="What the customer ordered. Changing items updates the total.">
        <div className="ed-embed">
          <OrderItems orderItems={order_items} orderId={id} refreshOrderData={refreshOrderData} />
        </div>
      </EditorSection>

      <EditorSection id="payment" title="Payment" help="Mark the payment when the money arrives, and record part payments.">
        <div className="ed-embed">
          <PaymentInformation payments={payments} refreshOrderData={refreshOrderData} />
        </div>
      </EditorSection>
    </EditorPage>
  );
};

export default ViewOrder;
