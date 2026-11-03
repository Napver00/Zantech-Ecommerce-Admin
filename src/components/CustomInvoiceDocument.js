import logo from "../assets/zantechInvoiceLogo.png";

// Printable custom (R&D) invoice, in the same look as the course invoice.

const STATUS_LABEL = { due: "Due", partial: "Partly paid", paid: "Paid", void: "Void" };
export const LINE_TYPE_LABEL = { equipment: "Equipment", software: "Software", service: "Service", other: "Other" };

const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const tk = (n) => `৳${Number(n || 0).toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
const day = (d) => (d ? new Date(`${String(d).slice(0, 10)}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "");
const nl = (s) => esc(s).replace(/\n/g, "<br/>");

const CustomInvoiceDocument = (invoice) => {
  const items = invoice.items || [];
  const payments = invoice.payments || [];
  const discount = Number(invoice.discount_amount || 0);
  const extra = Number(invoice.extra_amount || 0);

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Invoice ${esc(invoice.invoice_no)}</title>
<style>
  body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 40px; background: #f8f9fa; color: #333; }
  .container { border: 1px solid #dee2e6; padding: 40px; background: #fff; max-width: 820px; margin: 20px auto; border-radius: 8px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; padding-bottom: 20px; border-bottom: 3px solid #007bff; }
  .brand img { height: 70px; margin-right: 16px; vertical-align: middle; }
  .brand > div { display: inline-block; vertical-align: middle; }
  .brand span { display: block; font-size: 28px; font-weight: 700; }
  .brand small { display: block; font-size: 15px; color: #555; margin-top: 4px; }
  .meta { text-align: right; font-size: 15px; color: #555; line-height: 1.7; }
  .meta .title { font-size: 38px; font-weight: 700; color: #007bff; line-height: 1.1; margin-bottom: 8px; }
  .status { display: inline-block; margin-top: 6px; padding: 4px 14px; border-radius: 999px; font-size: 13px; font-weight: 700; text-transform: uppercase; }
  .status-due { background: #fff3cd; color: #856404; } .status-partial { background: #cff4fc; color: #055160; }
  .status-paid { background: #d1e7dd; color: #0f5132; } .status-void { background: #e2e3e5; color: #41464b; }
  .parties { display: flex; gap: 24px; margin-bottom: 28px; }
  .party { flex: 1; padding: 18px; background: #e9ecef; border: 1px solid #dee2e6; border-radius: 5px; font-size: 15px; line-height: 1.6; color: #555; }
  .party strong { display: block; margin-bottom: 6px; font-size: 17px; color: #333; }
  .project { font-size: 18px; font-weight: 600; margin: 0 0 14px; }
  table.items { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
  .items th, .items td { border: 1px solid #dee2e6; padding: 11px 12px; text-align: left; font-size: 14px; vertical-align: top; }
  .items th { background: #007bff; color: #fff; font-weight: 600; }
  .items tbody tr:nth-child(even) { background: #f8f9fa; }
  .items .num { text-align: right; white-space: nowrap; }
  .items .type { font-size: 11px; font-weight: 700; text-transform: uppercase; color: #6c757d; letter-spacing: .03em; }
  .items .desc { display: block; font-size: 13px; color: #6c757d; margin-top: 3px; }
  table.totals { width: 48%; margin-left: auto; border-collapse: collapse; margin-bottom: 24px; border: 1px solid #dee2e6; }
  .totals td { padding: 10px 12px; font-size: 15px; }
  .totals td:last-child { text-align: right; }
  .totals .grand td { background: #007bff; color: #fff; font-weight: 700; font-size: 19px; }
  .totals .due td { font-weight: 700; color: #b02a37; }
  .payments { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 14px; }
  .payments th, .payments td { border-bottom: 1px solid #dee2e6; padding: 8px 6px; text-align: left; }
  .payments td:last-child, .payments th:last-child { text-align: right; }
  h3 { font-size: 16px; margin: 0 0 10px; }
  .box { background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 5px; padding: 14px 18px; margin-bottom: 18px; font-size: 14px; color: #555; }
  .box strong { display: block; margin-bottom: 4px; color: #333; }
  .thanks { margin-top: 34px; font-size: 19px; font-weight: 600; text-align: center; }
  .contact { font-size: 14px; color: #666; line-height: 1.8; text-align: center; }
  @media print { body { padding: 0; background: #fff; } .container { border: none; padding: 0; margin: 0; } .party { background: #fff; } }
</style></head>
<body><div class="container">
  <div class="header">
    <div class="brand"><img src="${logo}" alt="ZAN Tech"><div><span>ZAN TECH</span><small>Awaken your hidden talent.</small></div></div>
    <div class="meta">
      <div class="title">INVOICE</div>
      <div>Invoice #: ${esc(invoice.invoice_no)}</div>
      <div>Issued: ${day(invoice.issue_date)}</div>
      ${invoice.due_date ? `<div>Due by: ${day(invoice.due_date)}</div>` : ""}
      <div class="status status-${esc(invoice.status)}">${STATUS_LABEL[invoice.status] || esc(invoice.status)}</div>
    </div>
  </div>

  <div class="parties">
    <div class="party"><strong>Bill to</strong>
      ${esc(invoice.client_name)}<br/>
      ${invoice.client_phone ? `${esc(invoice.client_phone)}<br/>` : ""}
      ${invoice.client_email ? `${esc(invoice.client_email)}<br/>` : ""}
      ${invoice.client_address ? esc(invoice.client_address) : ""}
    </div>
    <div class="party"><strong>From</strong>
      ZAN Tech<br/>zantechbd@gmail.com<br/>01894-634149
    </div>
  </div>

  <p class="project">${esc(invoice.title)}${invoice.project_name ? ` <span style="color:#6c757d;font-weight:400">· ${esc(invoice.project_name)}</span>` : ""}</p>

  <table class="items">
    <thead><tr><th style="width:38px">#</th><th>Item</th><th class="num">Qty</th><th class="num">Unit price</th><th class="num">Amount</th></tr></thead>
    <tbody>
      ${items.map((l, i) => `<tr>
        <td>${i + 1}</td>
        <td><span class="type">${LINE_TYPE_LABEL[l.type] || esc(l.type)}</span><br/>${esc(l.name)}${l.description ? `<span class="desc">${nl(l.description)}</span>` : ""}</td>
        <td class="num">${Number(l.quantity).toLocaleString()}</td>
        <td class="num">${tk(l.unit_price)}</td>
        <td class="num">${tk(Number(l.quantity) * Number(l.unit_price))}</td>
      </tr>`).join("")}
    </tbody>
  </table>

  <table class="totals">
    <tr><td>Subtotal</td><td>${tk(invoice.subtotal)}</td></tr>
    ${discount > 0 ? `<tr><td>Discount${invoice.discount_type === "percent" ? ` (${Number(invoice.discount_value)}%)` : ""}</td><td>−${tk(discount)}</td></tr>` : ""}
    ${extra > 0 ? `<tr><td>${esc(invoice.extra_label || "Other charges")}</td><td>${tk(extra)}</td></tr>` : ""}
    <tr class="grand"><td>Total</td><td>${tk(invoice.total)}</td></tr>
    ${Number(invoice.paid_amount) > 0 ? `<tr><td>Paid</td><td>${tk(invoice.paid_amount)}</td></tr>` : ""}
    <tr class="due"><td>Balance due</td><td>${tk(invoice.due_amount)}</td></tr>
  </table>

  ${payments.length ? `<h3>Payments received</h3>
  <table class="payments">
    <thead><tr><th>Date</th><th>Method</th><th>Reference</th><th>Amount</th></tr></thead>
    <tbody>${payments.map((p) => `<tr><td>${day(p.paid_on)}</td><td>${esc(p.method || "—")}</td><td>${esc(p.trx_id || p.note || "")}</td><td>${tk(p.amount)}</td></tr>`).join("")}</tbody>
  </table>` : ""}

  ${invoice.note ? `<div class="box"><strong>Note</strong>${nl(invoice.note)}</div>` : ""}
  ${invoice.terms ? `<div class="box"><strong>Terms</strong>${nl(invoice.terms)}</div>` : ""}

  <div class="thanks">Thank you for working with ZAN Tech</div>
  <div class="contact">Questions about this invoice? zantechbd@gmail.com · 01894-634149</div>
</div></body></html>`;
};

/** Opens the print dialog for a saved custom invoice. Returns false if pop-ups are blocked. */
export const printCustomInvoice = (invoice) => {
  const win = window.open("", "_blank");
  if (!win) return false;
  win.document.write(CustomInvoiceDocument(invoice));
  win.document.close();
  win.onload = () => setTimeout(() => win.print(), 300);
  return true;
};

export default CustomInvoiceDocument;
