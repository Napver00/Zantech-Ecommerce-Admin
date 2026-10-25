// Certificate design, QR code and PDF output.
//
// The page is the ZAN Tech certificate artwork (A4 landscape, 1123 x 794 px at
// 96 dpi) with the text laid over it in the same places as the original PDF.
// The same HTML is used for the on-screen preview, the PDF download and the
// PDF that gets emailed, so all three always match.

import QRCode from "qrcode";

export const MAIN_SITE = "https://zantechbd.com";
export const verifyUrlFor = (code) => `${MAIN_SITE}/certificate/${code}`;

export const PAGE = { width: 1123, height: 794 };

// Certificate kinds share one design; they differ in the heading and the
// suggested wording.
export const TEMPLATES = {
  participation: {
    label: "Participation",
    title: "Participation Certificate",
    intro: "In recognition of their active participation in",
  },
  completion: {
    label: "Completion",
    title: "Certificate of Completion",
    intro: "For successfully completing",
  },
  achievement: {
    label: "Achievement",
    title: "Certificate of Achievement",
    intro: "For outstanding achievement in",
  },
  appreciation: {
    label: "Appreciation",
    title: "Certificate of Appreciation",
    intro: "With sincere appreciation for their valuable contribution to",
  },
  excellence: {
    label: "Excellence",
    title: "Certificate of Excellence",
    intro: "For excellent performance in",
  },
  custom: { label: "Custom", title: "Certificate", intro: "" },
};

export const PROGRAM_TYPES = {
  course: "Course",
  bootcamp: "Bootcamp",
  workshop: "Workshop",
  custom: "Custom",
};

const fmtDay = (d) =>
  d ? new Date(`${String(d).slice(0, 10)}T00:00:00`).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "";

/** "from October 15 to 16, 2026" / "on October 15, 2026" from a course's dates. */
const dateRange = (start, end) => {
  if (!start) return "";
  const s = new Date(`${String(start).slice(0, 10)}T00:00:00`);
  const e = end ? new Date(`${String(end).slice(0, 10)}T00:00:00`) : null;
  if (!e || +s === +e) return `on ${fmtDay(start)}`;
  const month = (d) => d.toLocaleDateString("en-US", { month: "long" });
  if (s.getFullYear() === e.getFullYear() && s.getMonth() === e.getMonth()) {
    return `from ${month(s)} ${s.getDate()} to ${e.getDate()}, ${e.getFullYear()}`;
  }
  return `from ${fmtDay(start)} to ${fmtDay(end)}`;
};

/** Suggested description, written the way the original certificate reads. Admins can edit it. */
export const suggestDescription = ({ template, programType, program, programTitle }) => {
  const t = TEMPLATES[template] || TEMPLATES.participation;
  const title = programTitle || program?.title;
  if (!title || template === "custom") return "";
  const kind = programType === "workshop" ? "workshop" : programType === "bootcamp" ? "bootcamp" : "course";
  const venue = program?.venue ? (/online/i.test(program.venue) ? " held online" : ` held at ${program.venue}`) : "";
  const when = program ? dateRange(program.start_date, program.end_date) : "";
  const extra = program?.certificate_description ? `, ${program.certificate_description.replace(/^[,\s]+|[.\s]+$/g, "")}` : "";
  return `${t.intro} the “${title}” ${kind} under ZAN Tech${venue}${when ? ` ${when}` : ""}${extra}.`;
};

const escapeHtml = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// Long names and texts shrink so they never run into the robot.
const nameSize = (n) => (n.length <= 22 ? 43 : n.length <= 30 ? 36 : n.length <= 40 ? 30 : 25);
const titleSize = (t) => (t.length <= 26 ? 47 : t.length <= 34 ? 40 : 34);
const descSize = (d) => (d.length <= 260 ? 20 : d.length <= 380 ? 18 : d.length <= 520 ? 16 : 14);

// Where each signer's name is centred, by how many signers there are.
const SIGNER_CENTRES = { 1: [900], 2: [591, 900], 3: [470, 705, 940] };

export const qrDataUrl = (code) =>
  QRCode.toDataURL(verifyUrlFor(code || "PREVIEW"), {
    errorCorrectionLevel: "M",
    margin: 0,
    width: 260,
    color: { dark: "#1e2160", light: "#ffffff" },
  });

/**
 * Full HTML page for one certificate.
 * cert: { title, recipient_name, description, issue_date, code, signers: [{name, designation, signature}] }
 */
export const buildCertificateHtml = (cert, { qr, assetBase = window.location.origin } = {}) => {
  const name = (cert.recipient_name || "Recipient Name").trim();
  const title = (cert.title || "Certificate").trim();
  const description = (cert.description || "").trim();
  const signers = (cert.signers || []).filter((s) => s?.name).slice(0, 3);
  const centres = SIGNER_CENTRES[signers.length] || [];
  const code = cert.code || "ZT-XXXX-XXXX";
  const issued = fmtDay(cert.issue_date);
  const a = (f) => `${assetBase}/certificate/${f}`;

  const signerHtml = signers
    .map((s, i) => {
      const left = centres[i] - 120;
      return `
      <div class="signer" style="left:${left}px">
        ${s.signature ? `<img class="sig" src="${s.signature}" alt="" />` : ""}
        <div class="sname">${escapeHtml(s.name)}</div>
        <div class="srole">${escapeHtml(s.designation)}</div>
      </div>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${escapeHtml(title)} - ${escapeHtml(name)}</title>
<style>
  @page { size: A4 landscape; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { width: ${PAGE.width}px; height: ${PAGE.height}px; background: #fff; overflow: hidden; }
  body { font-family: Calibri, Carlito, "Segoe UI", Arial, sans-serif; color: #151515; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .page { position: relative; width: ${PAGE.width}px; height: ${PAGE.height}px; overflow: hidden; }
  .bg { position: absolute; inset: 0; width: 100%; height: 100%; }
  .shadow { position: absolute; left: 735px; top: 528px; width: 316px; height: 83px; }
  .robot { position: absolute; left: 657px; top: 157px; width: 488px; height: 429px; }
  .title { position: absolute; left: 79px; top: 147px; width: 600px; font-size: ${titleSize(title)}px; line-height: 1.15; font-weight: 400; color: #151515; white-space: nowrap; }
  .awarded { position: absolute; left: 81px; top: 243px; width: 205px; height: 46px; line-height: 46px; padding-left: 20px; font-family: Arial, Helvetica, sans-serif; font-weight: 700; font-size: 25px; color: #fff; }
  .name { position: absolute; left: 81px; top: 318px; width: 570px; font-family: Arial, Helvetica, sans-serif; font-weight: 700; font-size: ${nameSize(name)}px; line-height: 1.2; color: #282d78; }
  .desc { position: absolute; left: 81px; top: 430px; width: 570px; font-size: ${descSize(description)}px; line-height: 1.25; color: #151515; }
  .verify { position: absolute; left: 66px; top: 618px; display: flex; align-items: center; gap: 12px; padding: 9px 14px 9px 9px; background: #fff; border: 1px solid #dfe3f3; border-radius: 10px; box-shadow: 0 2px 10px rgba(30,33,96,.08); }
  .verify img { width: 92px; height: 92px; display: block; }
  .verify .lbl { font-family: Arial, Helvetica, sans-serif; font-size: 10px; letter-spacing: .8px; text-transform: uppercase; color: #6b7280; }
  .verify .code { font-family: Consolas, "Courier New", monospace; font-weight: 700; font-size: 17px; color: #1e2160; margin: 2px 0 5px; letter-spacing: .5px; }
  .verify .meta { font-family: Arial, Helvetica, sans-serif; font-size: 11px; color: #374151; line-height: 1.45; }
  .signer { position: absolute; top: 640px; width: 240px; text-align: center; }
  .sig { display: block; height: 52px; max-width: 200px; margin: 0 auto 4px; object-fit: contain; }
  .signer:not(:has(.sig)) { top: 696px; }
  .sname { font-family: Arial, Helvetica, sans-serif; font-weight: 700; font-size: ${signers.length > 2 ? 19 : 22.5}px; line-height: 1.25; color: #151515; white-space: nowrap; }
  .srole { font-size: ${signers.length > 2 ? 18 : 21}px; line-height: 1.35; color: #151515; }
</style></head>
<body><div class="page">
  <img class="bg" src="${a("background.jpg")}" alt="" />
  <img class="shadow" src="${a("robot-shadow.png")}" alt="" />
  <img class="robot" src="${a("robot.png")}" alt="" />
  <div class="title">${escapeHtml(title)}</div>
  <div class="awarded">Awarded to:</div>
  <div class="name">${escapeHtml(name)}</div>
  <div class="desc">${escapeHtml(description)}</div>
  <div class="verify">
    ${qr ? `<img src="${qr}" alt="" />` : ""}
    <div>
      <div class="lbl">Certificate ID</div>
      <div class="code">${escapeHtml(code)}</div>
      <div class="meta">${issued ? `Issued ${escapeHtml(issued)}<br>` : ""}Scan to verify at<br><b>zantechbd.com/certificate</b></div>
    </div>
  </div>
  ${signerHtml}
</div></body></html>`;
};

export const certificateFilename = (cert) =>
  `ZAN-Tech-Certificate-${String(cert.recipient_name || "").trim().replace(/[^\w-]+/g, "_") || "recipient"}-${cert.code || "draft"}.pdf`;

/** HTML with its QR code ready. */
export const certificateHtmlWithQr = async (cert) => buildCertificateHtml(cert, { qr: await qrDataUrl(cert.code) });

// Draws the certificate in a hidden iframe (its own styles stay out of the admin).
const renderInIframe = (html) =>
  new Promise((resolve, reject) => {
    const iframe = document.createElement("iframe");
    iframe.setAttribute("aria-hidden", "true");
    Object.assign(iframe.style, { position: "fixed", left: "-12000px", top: "0", width: `${PAGE.width}px`, height: `${PAGE.height}px`, border: "0" });
    document.body.appendChild(iframe);
    const doc = iframe.contentDocument;
    doc.open();
    doc.write(html);
    doc.close();

    const images = Array.from(doc.images);
    Promise.all(images.map((img) => (img.complete ? Promise.resolve() : new Promise((done) => { img.onload = done; img.onerror = done; }))))
      .then(() => (doc.fonts?.ready || Promise.resolve()))
      .then(() => new Promise((r) => setTimeout(r, 120)))
      .then(() => resolve(iframe))
      .catch((err) => {
        iframe.remove();
        reject(err);
      });
  });

const loadPdfLibs = async () => {
  const [{ default: html2canvas }, mod] = await Promise.all([
    import("html2canvas"),
    import("html2pdf.js/dist/html2pdf.bundle.min.js"),
  ]);
  return { html2canvas, html2pdf: mod.default || mod };
};

const renderCanvas = async (html2canvas, cert) => {
  const iframe = await renderInIframe(await certificateHtmlWithQr(cert));
  try {
    return await html2canvas(iframe.contentDocument.querySelector(".page"), {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      width: PAGE.width,
      height: PAGE.height,
      windowWidth: PAGE.width,
      windowHeight: PAGE.height,
    });
  } finally {
    iframe.remove();
  }
};

const PDF_OPTIONS = {
  margin: 0,
  image: { type: "jpeg", quality: 0.95 },
  jsPDF: { unit: "mm", format: "a4", orientation: "landscape", compress: true },
};

/** One certificate as a PDF blob (A4 landscape, edge to edge). */
export async function createCertificatePdf(cert) {
  const { html2canvas, html2pdf } = await loadPdfLibs();
  const canvas = await renderCanvas(html2canvas, cert);
  return html2pdf().set(PDF_OPTIONS).from(canvas, "canvas").outputPdf("blob");
}

/** Several certificates in one PDF, one per page: handy for printing a whole class. */
export async function createCombinedPdf(certs, onProgress) {
  const { html2canvas, html2pdf } = await loadPdfLibs();
  let pdf = null;
  for (let i = 0; i < certs.length; i++) {
    const canvas = await renderCanvas(html2canvas, certs[i]);
    if (!pdf) {
      pdf = await html2pdf().set(PDF_OPTIONS).from(canvas, "canvas").toPdf().get("pdf");
    } else {
      pdf.addPage("a4", "landscape");
      pdf.addImage(canvas.toDataURL("image/jpeg", 0.95), "JPEG", 0, 0, 297, 210);
    }
    onProgress?.(i + 1, certs.length);
  }
  return pdf.output("blob");
}

/** Opens the browser print dialog for one certificate (prints edge to edge). */
export async function printCertificate(cert) {
  const iframe = await renderInIframe(await certificateHtmlWithQr(cert));
  iframe.contentWindow.focus();
  iframe.contentWindow.print();
  setTimeout(() => iframe.remove(), 60000);
}

/** Image file → compact PNG data URL for a signature (max 600 x 200). */
export const signatureFromFile = (file) =>
  new Promise((resolve, reject) => {
    if (!/^image\/(png|jpe?g|webp)$/.test(file.type)) return reject(new Error("Use a PNG, JPG or WebP image."));
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read the image."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Could not read the image."));
      img.onload = () => {
        const scale = Math.min(1, 600 / img.width, 200 / img.height);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/png"));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
