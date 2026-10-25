import React, { useEffect, useRef, useState } from "react";
import { buildCertificateHtml, PAGE, qrDataUrl } from "../../utils/certificate";

/**
 * Live, scaled preview of a certificate. It is the exact HTML used for the
 * PDF, shown in an iframe and shrunk to fit the column.
 */
const CertificatePreview = ({ certificate, className = "" }) => {
  const box = useRef(null);
  const [scale, setScale] = useState(0.5);
  const [qr, setQr] = useState("");

  useEffect(() => {
    const el = box.current;
    if (!el) return undefined;
    const fit = () => setScale(el.clientWidth / PAGE.width);
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    let alive = true;
    qrDataUrl(certificate.code).then((url) => alive && setQr(url));
    return () => {
      alive = false;
    };
  }, [certificate.code]);

  return (
    <div
      ref={box}
      className={`position-relative overflow-hidden rounded-3 border bg-white shadow-sm ${className}`}
      style={{ width: "100%", aspectRatio: `${PAGE.width} / ${PAGE.height}` }}
    >
      <iframe
        title="Certificate preview"
        srcDoc={buildCertificateHtml(certificate, { qr })}
        style={{
          width: PAGE.width,
          height: PAGE.height,
          border: 0,
          transform: `scale(${scale})`,
          transformOrigin: "0 0",
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
        }}
      />
    </div>
  );
};

export default CertificatePreview;
