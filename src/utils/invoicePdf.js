// Turns the printable invoice HTML (InvoiceDocument / CourseInvoiceDocument)
// into a PDF in the browser, and shares it to WhatsApp or the email API.

// Renders the invoice in a hidden iframe so its own <style> can't leak into the admin.
const renderInIframe = (html) =>
  new Promise((resolve, reject) => {
    const iframe = document.createElement("iframe");
    iframe.setAttribute("aria-hidden", "true");
    Object.assign(iframe.style, {
      position: "fixed",
      left: "-10000px",
      top: "0",
      width: "820px",
      height: "1200px",
      border: "0",
    });
    document.body.appendChild(iframe);

    const doc = iframe.contentDocument;
    doc.open();
    doc.write(html);
    doc.close();

    // Drop the on-screen page padding/backdrop (what @media print does) so the
    // invoice fills the A4 page instead of spilling onto a second one.
    const pdfStyle = doc.createElement("style");
    pdfStyle.textContent = `
      html, body { background: #fff !important; }
      body { padding: 12px !important; margin: 0 !important; }
      body > .container, body > .invoice, body > div:first-child {
        margin: 0 auto !important; box-shadow: none !important;
      }
    `;
    doc.head.appendChild(pdfStyle);

    const images = Array.from(doc.images);
    const ready = Promise.all(
      images.map((img) =>
        img.complete
          ? Promise.resolve()
          : new Promise((done) => {
              img.onload = done;
              img.onerror = done;
            })
      )
    );
    // Fonts/images settle, then give layout one more frame.
    ready
      .then(() => new Promise((r) => setTimeout(r, 150)))
      .then(() => resolve(iframe))
      .catch((err) => {
        iframe.remove();
        reject(err);
      });
  });

export const invoicePdfFilename = (invoiceNo) =>
  `ZAN-Tech-${String(invoiceNo || "invoice").replace(/[^\w-]+/g, "_")}.pdf`;

export async function createInvoicePdf(html) {
  // The self-contained bundle (jsPDF inside) avoids jsPDF's optional canvg/dompurify deps.
  const [{ default: html2canvas }, mod] = await Promise.all([
    import("html2canvas"),
    import("html2pdf.js/dist/html2pdf.bundle.min.js"),
  ]);
  const html2pdf = mod.default || mod;
  const iframe = await renderInIframe(html);
  try {
    // Capture inside the iframe so the invoice's own <style> applies (html2pdf
    // would copy the markup into the admin page and lose it), then let html2pdf
    // lay the image out on A4 pages.
    const body = iframe.contentDocument.body;
    const canvas = await html2canvas(body, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      windowWidth: 820,
      width: body.scrollWidth,
      height: body.scrollHeight,
    });
    // A4 is 210×297mm. If the invoice is only a little taller than one page,
    // narrow it (wider side margins) so it fits on a single page; long invoices
    // with many items still flow onto more pages at full width.
    const usableHeight = 297 - 6 - 8;
    const fullWidth = 210 - 6 - 6;
    const ratio = canvas.height / canvas.width;
    let side = 6;
    if (ratio * fullWidth > usableHeight && ratio * fullWidth <= usableHeight * 1.45) {
      // 1mm spare so rounding doesn't push a blank second page.
      side = (210 - (usableHeight - 1) / ratio) / 2;
    }

    return await html2pdf()
      .set({
        margin: [6, side, 8, side],
        image: { type: "jpeg", quality: 0.95 },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      })
      .from(canvas, "canvas")
      .outputPdf("blob");
  } finally {
    iframe.remove();
  }
}

export const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
};

// Bangladeshi numbers → wa.me format (8801XXXXXXXXX); empty when unknown.
export const whatsappNumber = (phone) => {
  const digits = String(phone || "").replace(/\D/g, "").replace(/^880?/, "");
  return digits.length >= 10 ? `880${digits.replace(/^0/, "")}` : "";
};

/**
 * Sends the PDF to WhatsApp. Where the browser can share files (phones,
 * Chrome on Windows/Android) WhatsApp gets the PDF attached directly;
 * otherwise the PDF is downloaded and the chat opens with the message ready.
 * Returns "shared" | "downloaded" | "cancelled".
 */
export async function shareInvoiceOnWhatsApp({ blob, filename, text, phone }) {
  const file = new File([blob], filename, { type: "application/pdf" });

  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: filename, text });
      return "shared";
    } catch (err) {
      if (err?.name === "AbortError") return "cancelled";
      // Fall through to download + chat link.
    }
  }

  downloadBlob(blob, filename);
  const number = whatsappNumber(phone);
  window.open(`https://wa.me/${number}?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  return "downloaded";
}

export async function emailInvoicePdf(axiosInstance, endpoint, { blob, filename, email, message }) {
  const form = new FormData();
  form.append("pdf", new File([blob], filename, { type: "application/pdf" }));
  if (email) form.append("email", email);
  if (message) form.append("message", message);
  const res = await axiosInstance.post(endpoint, form, { headers: { "Content-Type": "multipart/form-data" } });
  return res.data;
}
