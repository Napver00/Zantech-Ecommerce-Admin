import logo from "../assets/zantechInvoiceLogo.png";

const STATUS_LABEL = { due: "Due", partial: "Partially Paid", paid: "Paid", void: "Void" };

const CourseInvoiceDocument = ({ invoice }) => {
  if (!invoice) return null;

  const studentName = invoice.student_name || invoice.student?.name || "N/A";
  const studentPhone = invoice.student_phone || invoice.student?.parent_phone || "N/A";
  const studentSchool = invoice.student?.school_name || "";
  const courseName = invoice.course?.title || "N/A";
  const invoiceGeneratedDate = new Date().toLocaleString();
  const issueDate = invoice.issue_date
    ? new Date(invoice.issue_date).toLocaleDateString()
    : new Date(invoice.created_at || Date.now()).toLocaleDateString();

  const amount = parseFloat(invoice.amount || 0);
  const discount = parseFloat(invoice.discount || 0);
  const paid = parseFloat(invoice.paid_amount || 0);
  const due = parseFloat(invoice.due_amount ?? Math.max(amount - discount - paid, 0));

  const lineItemLabel =
    invoice.payment_for === "monthly"
      ? `${courseName} — Month ${invoice.month_number} Installment`
      : `${courseName} — Full Course Fee`;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Invoice - ${invoice.invoice_no || `INV-${invoice.id}`}</title>
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
        .status-badge { display: inline-block; margin-top: 6px; padding: 4px 14px; border-radius: 999px; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.03em; }
        .status-due { background: #fff3cd; color: #856404; }
        .status-partial { background: #cff4fc; color: #055160; }
        .status-paid { background: #d1e7dd; color: #0f5132; }
        .status-void { background: #e2e3e5; color: #41464b; }

        .address-section { display: flex; justify-content: space-between; margin-bottom: 40px; gap: 30px; }
        .bill-to, .shipping-to { flex: 1; padding: 20px; background-color: #e9ecef; border: 1px solid #dee2e6; border-radius: 5px; }
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

        .note-box { background-color: #f8f9fa; border: 1px solid #dee2e6; border-radius: 5px; padding: 15px 20px; margin-bottom: 30px; font-size: 14px; color: #555; }
        .note-box strong { display: block; margin-bottom: 5px; color: #333; }

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
            <img src="${logo}" alt="ZAN Tech Logo">
            <div>
              <span>ZAN TECH</span>
              <small>Awaken your hidden talent.</small>
            </div>
          </div>
          <div class="header-right">
            <div class="invoice-title">INVOICE</div>
            <div>Invoice #: ${invoice.invoice_no || `INV-${invoice.id}`}</div>
            <div>Issue Date: ${issueDate}</div>
            <div>Invoice Date: ${invoiceGeneratedDate}</div>
            <div class="status-badge status-${invoice.status}">${STATUS_LABEL[invoice.status] || invoice.status}</div>
          </div>
        </div>

        <div class="address-section">
          <div class="bill-to">
            <strong>Student</strong>
            <span>${studentName}</span>
            ${studentSchool ? `<span>${studentSchool}</span>` : ""}
            <span>Guardian Phone: ${studentPhone}</span>
            ${invoice.student_email ? `<span>${invoice.student_email}</span>` : ""}
          </div>

          <div class="shipping-to">
            <strong>Course</strong>
            <span>${courseName}</span>
            <span>${invoice.payment_for === "monthly" ? `Monthly Plan — Month ${invoice.month_number}` : "One-time / Full Payment"}</span>
            ${invoice.payment_method ? `<span>Payment Method: ${invoice.payment_method}</span>` : ""}
            ${invoice.trx_id ? `<span>Transaction ID: ${invoice.trx_id}</span>` : ""}
          </div>
        </div>

        <div class="section-title">Fee Summary</div>
        <table class="items-table">
          <thead>
            <tr>
              <th>DESCRIPTION</th>
              <th class="text-right">AMOUNT</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>${lineItemLabel}</td>
              <td class="text-right">৳${amount.toLocaleString()}</td>
            </tr>
          </tbody>
        </table>

        <table class="totals-table">
          <tr>
            <td class="label">Amount</td>
            <td class="amount">৳${amount.toLocaleString()}</td>
          </tr>
          ${
            discount > 0
              ? `
          <tr>
            <td class="label">Discount</td>
            <td class="amount">-৳${discount.toLocaleString()}</td>
          </tr>`
              : ""
          }
          <tr>
            <td class="label">Paid</td>
            <td class="amount">৳${paid.toLocaleString()}</td>
          </tr>
          <tr>
            <td class="label">Due</td>
            <td class="amount">৳${due.toLocaleString()}</td>
          </tr>
          <tr class="total-row">
            <td class="label">Total Payable</td>
            <td class="amount">৳${Math.max(amount - discount, 0).toLocaleString()}</td>
          </tr>
        </table>

        ${
          invoice.note
            ? `<div class="note-box"><strong>Note</strong>${invoice.note}</div>`
            : ""
        }

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

export default CourseInvoiceDocument;
