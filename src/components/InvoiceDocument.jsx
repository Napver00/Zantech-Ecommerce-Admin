import React from "react";
import logo from "../assets/zantechInvoiceLogo.png";

const InvoiceDocument = ({ orderData }) => {
  if (!orderData) {
    return null; // Or handle the case where orderData is not available
  }

  const { order, user, shipping_address, order_items, payments, coupon } =
    orderData;

  // Helper functions to get customer information
  const getCustomerName = () => {
    if (user?.name) return user.name;
    if (order.user_name) return order.user_name;
    return "N/A";
  };

  const getCustomerPhone = () => {
    if (user?.phone) return user.phone;
    if (order.user_phone) return order.user_phone;
    return "N/A";
  };

  const getCustomerAddress = () => {
    if (user?.address) return user.address;
    if (order.address) return order.address;
    return "N/A";
  };

  // Get the current date and time (this is the invoice generation date)
  const invoiceGeneratedDate = new Date().toLocaleString();

  // Format the order date as dd-mm-yyyy
  const orderDate = new Date(order.created_at);
  const formattedOrderDate = `${orderDate
    .getDate()
    .toString()
    .padStart(2, "0")}-${(orderDate.getMonth() + 1)
    .toString()
    .padStart(2, "0")}-${orderDate.getFullYear()}`;

  const getPaymentStatusLabel = (status) => {
    const statusMap = {
      0: "Unpaid",
      1: "Paid by Cash",
      2: "Failed",
      3: "Paid by Bank",
      4: "Paid by Mobile Bank",
    };
    return statusMap[status] || "Unknown";
  };

  const getPaymentType = (type) => {
    const types = {
      1: "Cash on Delivery",
      2: "Mobile Banking",
      3: "Card",
    };
    return types[type] || "Unknown";
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Invoice - ${order.invoice_code}</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 40px; background-color: #f8f9fa; color: #333; }
        .container { border: 1px solid #dee2e6; padding: 40px; background-color: #fff; box-shadow: 0 0 20px rgba(0, 0, 0, 0.05); max-width: 800px; margin: 20px auto; border-radius: 8px; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 3px solid #007bff; }
        .header-left img { height: 70px; margin-right: 20px; vertical-align: middle; }
        .header-left > div { display: inline-block; vertical-align: middle; }
        .header-left span { display: block; font-size: 28px; font-weight: 700; color: #333; }
        .header-left small { display: block; font-size: 15px; color: #555; margin-top: 5px; }
        .header-right { text-align: right; }
        .header-right .invoice-title { font-size: 40px; font-weight: 700; color: #007bff; margin-bottom: 10px; }
        .header-right div { font-size: 16px; color: #555; line-height: 1.8; }
        
        .address-section { display: flex; justify-content: space-between; margin-bottom: 40px; gap: 30px; } /* Flex container for addresses */
        .bill-to, .shipping-to { flex: 1; padding: 20px; background-color: #e9ecef; border: 1px solid #dee2e6; border-radius: 5px; } /* Styling for address blocks */
        .bill-to strong, .shipping-to strong { display: block; margin-bottom: 10px; font-size: 18px; color: #333; font-weight: 600; }
        .bill-to span, .shipping-to span { display: block; font-size: 15px; color: #666; line-height: 1.6; }

        .section-title { font-size: 20px; font-weight: 600; margin-bottom: 20px; color: #333; border-bottom: 1px solid #dee2e6; padding-bottom: 8px; }
        .items-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
        .items-table th, .items-table td { border: 1px solid #dee2e6; padding: 15px; text-align: left; }
        .items-table th { background-color: #007bff; color: white; font-weight: 600; font-size: 16px; }
        .items-table td { font-size: 15px; color: #555; }
        .items-table tbody tr:nth-child(even) { background-color: #f8f9fa; }
        .items-table th:first-child { border-top-left-radius: 5px; }
        .items-table th:last-child { border-top-right-radius: 5px; }

        .totals-table { width: 45%; margin-left: auto; border-collapse: collapse; margin-bottom: 30px; border: 1px solid #dee2e6; border-radius: 5px; }
        .totals-table td { padding: 12px; }
        .totals-table .label { font-weight: 600; color: #333; font-size: 15px; }
        .totals-table .amount { text-align: right; color: #555; font-size: 15px; }
        .totals-table tr:nth-child(even) { background-color: #f8f9fa; }
        .totals-table .total-row { background-color: #007bff; color: white; font-weight: 700; font-size: 20px; }
        .totals-table .total-row td { color: white; padding: 15px 12px; }
        
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        
        .thank-you { margin-top: 40px; margin-bottom: 20px; font-size: 20px; font-weight: 600; color: #333; text-align: center; }
        .contact-info { font-size: 14px; color: #666; line-height: 1.8; text-align: center; }
        .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #888; }
        
        @media print {
          body { padding: 0; background-color: #fff; }
          .container { border: none; box-shadow: none; padding: 0; margin: 0; }
          .no-print { display: none; }
          .header { border-bottom: 1px solid #007bff; padding-bottom: 15px; margin-bottom: 30px; }
          .address-section { gap: 15px; margin-bottom: 30px; }
          .bill-to, .shipping-to { background-color: #fff; border: none; padding: 0; }
          .section-title { margin-bottom: 15px; padding-bottom: 5px; }
          .items-table th, .items-table td { padding: 10px; }
          .totals-table { width: 50%; }
          .totals-table td { padding: 8px; }
          .totals-table .total-row td { padding: 10px 8px; }
          .thank-you { margin-top: 30px; margin-bottom: 15px; }
          .contact-info { margin-bottom: 20px; }
          .footer { margin-top: 30px; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="header-left">
            <img src=${logo} alt="ZAN Tech Logo">
            <div>
              <span>ZAN TECH</span>
              <small>Awaken your hidden talent.</small>
            </div>
          </div>
          <div class="header-right">
            <div class="invoice-title">INVOICE</div>
            <div>Invoice #: ${order.invoice_code}</div>
            <div>Order Date: ${formattedOrderDate}</div>
            <div>Invoice Date: ${invoiceGeneratedDate}</div>
          </div>
        </div>

        <div class="address-section">
          <div class="bill-to">
            <strong>Bill To</strong>
            <span>${getCustomerName()}</span>
            <span>${getCustomerAddress()}</span>
            <span>${getCustomerPhone()}</span>
          </div>

          <div class="shipping-to">
            <strong>Shipping Address</strong>
            ${
              shipping_address
                ? `
                <span>${shipping_address.f_name} ${shipping_address.l_name}</span>
                <span>${shipping_address.address}</span>
                <span>${shipping_address.city}</span>
                <span>${shipping_address.zip}</span>
                <span>${shipping_address.phone}</span>
                `
                : `
                <span>${getCustomerName()}</span>
                <span>${getCustomerAddress()}</span>
                <span>${getCustomerPhone()}</span>
                `
            }
          </div>
        </div>

        <div class="section-title">Order Summary</div>
        <table class="items-table">
          <thead>
            <tr>
              <th>ITEM NAME</th>
              <th class="text-right">PRICE</th>
              <th class="text-center">QTY</th>
              <th class="text-right">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            ${order_items
              .map(
                (item) => `
              <tr>
                <td>${item.name}${item.is_bundle === 1 ? " (Bundle)" : ""}</td>
                <td class="text-right">৳${parseFloat(
                  item.price
                ).toLocaleString()}</td>
                <td class="text-center">${item.quantity}</td>
                <td class="text-right">৳${(
                  parseFloat(item.price) * parseInt(item.quantity)
                ).toLocaleString()}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>

        <table class="totals-table">
          <tr>
            <td class="label">Subtotal</td>
            <td class="amount">৳${parseFloat(
              order.item_subtotal
            ).toLocaleString()}</td>
          </tr>
          <tr>
            <td class="label">Delivery Cost</td>
            <td class="amount">৳${parseFloat(
              order.shipping_charge || 0
            ).toLocaleString()}</td>
          </tr>
          ${
            parseFloat(order.discount) > 0
              ? `
            <tr>
              <td class="label">Discount</td>
              <td class="amount">-৳${parseFloat(
                order.discount
              ).toLocaleString()}</td>
            </tr>
          `
              : ""
          }
          <tr>
            <td class="label">PAID</td>
            <td class="amount">৳${parseFloat(
              payments.reduce(
                (sum, payment) => sum + parseFloat(payment.paid_amount),
                0
              )
            ).toLocaleString()}</td>
          </tr>
           <tr>
            <td class="label">Due Amount</td>
            <td class="amount">৳${parseFloat(
              payments.reduce(
                (sum, payment) => sum + parseFloat(payment.due_amount),
                0
              )
            ).toLocaleString()}</td>
          </tr>
          <tr class="total-row">
            <td class="label">Total</td>
            <td class="amount">৳${parseFloat(
              order.total_amount
            ).toLocaleString()}</td>
          </tr>
        </table>

        <div class="thank-you">Thank you and Best Wishes</div>

        <div class="contact-info">
          For questions concerning this invoice, please contact<br/>
          Email Address: zantechbd@gmail.com
          Phone: 01894-634149
        </div>

      </div>
    </body>
    </html>
  `;
};

export default InvoiceDocument;
