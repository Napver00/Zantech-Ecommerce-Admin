import React, { useCallback, useEffect, useRef, useState } from "react";
import { buildCertificateHtml, PAGE, qrDataUrl, SIG_BASE, SIG_LIMITS, sigLayout } from "../../utils/certificate";
import "./CertificatePreview.css";

const clamp = (v, [lo, hi]) => Math.min(hi, Math.max(lo, Math.round(v)));

// Applies a size / move to the signature image inside the preview while dragging,
// so it follows the pointer without redrawing the whole certificate.
const styleSignature = (img, { sig_size: size, sig_x: x, sig_y: y }) => {
  const h = (SIG_BASE.height * size) / 100;
  img.style.height = `${h}px`;
  img.style.maxWidth = `${(SIG_BASE.width * size) / 100}px`;
  img.style.marginTop = `${SIG_BASE.height - h}px`;
  img.style.transform = `translate(${x}px, ${y}px)`;
};

/**
 * Live, scaled preview of a certificate. It is the exact HTML used for the
 * PDF, shown in an iframe and shrunk to fit the column.
 *
 * With onSignatureChange(index, { sig_size, sig_x, sig_y }) each signature can be
 * dragged to move it, resized from its corner, or nudged with the arrow keys
 * (+ and − change the size).
 */
const CertificatePreview = ({ certificate, className = "", onSignatureChange }) => {
  const box = useRef(null);
  const frame = useRef(null);
  const drag = useRef(null);
  const [scale, setScale] = useState(0.5);
  const [qr, setQr] = useState("");
  const [boxes, setBoxes] = useState([]);
  const [active, setActive] = useState(null);
  const editable = typeof onSignatureChange === "function";
  const signers = (certificate.signers || []).filter((s) => s?.name).slice(0, 3);

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

  // Where each signature sits on the page (certificate pixels).
  const measure = useCallback(() => {
    const doc = frame.current?.contentDocument;
    if (!editable || !doc) return;
    setBoxes(
      [...doc.querySelectorAll("img.sig")].map((img) => {
        const r = img.getBoundingClientRect();
        return { i: Number(img.dataset.signer), left: r.left, top: r.top, width: r.width, height: r.height };
      })
    );
  }, [editable]);

  const onFrameLoad = () => {
    const doc = frame.current?.contentDocument;
    if (!doc) return;
    measure();
    doc.querySelectorAll("img.sig").forEach((img) => img.addEventListener("load", measure));
  };

  const imgFor = (i) => frame.current?.contentDocument?.querySelector(`img.sig[data-signer="${i}"]`);

  const startDrag = (e, i, mode) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    drag.current = { i, mode, x: e.clientX, y: e.clientY, start: sigLayout(signers[i]), width: boxes.find((b) => b.i === i)?.width || SIG_BASE.width };
    setActive(i);
  };

  const onPointerMove = (e) => {
    const d = drag.current;
    if (!d) return;
    const dx = (e.clientX - d.x) / scale;
    const dy = (e.clientY - d.y) / scale;
    const next =
      d.mode === "move"
        ? { ...d.start, sig_x: clamp(d.start.sig_x + dx, SIG_LIMITS.x), sig_y: clamp(d.start.sig_y + dy, SIG_LIMITS.y) }
        : // The corner grip is top-right: dragging up or right makes it bigger.
          { ...d.start, sig_size: clamp((d.start.sig_size * (d.width + Math.max(dx, -dy))) / d.width, SIG_LIMITS.size) };
    d.last = next;
    const img = imgFor(d.i);
    if (img) styleSignature(img, next);
    measure();
  };

  const endDrag = () => {
    const d = drag.current;
    drag.current = null;
    if (d?.last) onSignatureChange(d.i, d.last);
  };

  const onKeyDown = (e, i) => {
    const cur = sigLayout(signers[i]);
    const step = e.shiftKey ? 10 : 2;
    const moves = {
      ArrowLeft: { sig_x: cur.sig_x - step },
      ArrowRight: { sig_x: cur.sig_x + step },
      ArrowUp: { sig_y: cur.sig_y - step },
      ArrowDown: { sig_y: cur.sig_y + step },
      "+": { sig_size: cur.sig_size + 5 },
      "=": { sig_size: cur.sig_size + 5 },
      "-": { sig_size: cur.sig_size - 5 },
    };
    if (!moves[e.key]) return;
    e.preventDefault();
    onSignatureChange(i, sigLayout({ ...cur, ...moves[e.key] }));
  };

  return (
    <div
      ref={box}
      className={`position-relative overflow-hidden rounded-3 border bg-white shadow-sm ${className}`}
      style={{ width: "100%", aspectRatio: `${PAGE.width} / ${PAGE.height}` }}
    >
      <iframe
        ref={frame}
        title="Certificate preview"
        srcDoc={buildCertificateHtml(certificate, { qr })}
        onLoad={onFrameLoad}
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
      {editable &&
        boxes.map((b) => (
          <div
            key={b.i}
            role="button"
            tabIndex={0}
            className={`cp-sig ${active === b.i ? "is-active" : ""}`}
            style={{ left: b.left * scale, top: b.top * scale, width: Math.max(24, b.width * scale), height: Math.max(16, b.height * scale) }}
            aria-label={`Signature of ${signers[b.i]?.name || "signer"}. Drag to move, arrow keys to nudge, plus and minus to resize.`}
            title="Drag to move · corner to resize · arrow keys to nudge"
            onPointerDown={(e) => startDrag(e, b.i, "move")}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            onFocus={() => setActive(b.i)}
            onBlur={() => setActive((a) => (a === b.i ? null : a))}
            onKeyDown={(e) => onKeyDown(e, b.i)}
          >
            <span
              className="cp-sig-grip"
              aria-hidden="true"
              onPointerDown={(e) => startDrag(e, b.i, "resize")}
              onPointerMove={onPointerMove}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
            />
          </div>
        ))}
    </div>
  );
};

export default CertificatePreview;
