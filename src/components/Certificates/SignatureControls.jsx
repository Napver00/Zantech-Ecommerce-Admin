import React from "react";
import { FaArrowDown, FaArrowLeft, FaArrowRight, FaArrowUp, FaUndo } from "react-icons/fa";
import { SIG_LIMITS, sigLayout } from "../../utils/certificate";
import "./CertificatePreview.css";

const NUDGE = 4; // certificate pixels per click

/** Size slider, nudge arrows and a reset for one signature (pairs with dragging it on the preview). */
const SignatureControls = ({ value, onChange, idPrefix }) => {
  const layout = sigLayout(value);
  const set = (patch) => onChange(sigLayout({ ...layout, ...patch }));
  const moved = layout.sig_x !== 0 || layout.sig_y !== 0 || layout.sig_size !== 100;

  return (
    <div className="sig-controls">
      <label className="sig-size" htmlFor={`${idPrefix}-size`}>
        <span>Signature size</span>
        <input
          id={`${idPrefix}-size`}
          type="range"
          min={SIG_LIMITS.size[0]}
          max={SIG_LIMITS.size[1]}
          step={5}
          value={layout.sig_size}
          onChange={(e) => set({ sig_size: Number(e.target.value) })}
        />
        <output>{layout.sig_size}%</output>
      </label>
      <div className="sig-nudge" role="group" aria-label="Move the signature">
        <button type="button" onClick={() => set({ sig_x: layout.sig_x - NUDGE })} aria-label="Move left" title="Move left"><FaArrowLeft /></button>
        <button type="button" onClick={() => set({ sig_y: layout.sig_y - NUDGE })} aria-label="Move up" title="Move up"><FaArrowUp /></button>
        <button type="button" onClick={() => set({ sig_y: layout.sig_y + NUDGE })} aria-label="Move down" title="Move down"><FaArrowDown /></button>
        <button type="button" onClick={() => set({ sig_x: layout.sig_x + NUDGE })} aria-label="Move right" title="Move right"><FaArrowRight /></button>
        <button
          type="button"
          className="sig-reset"
          onClick={() => onChange(sigLayout())}
          disabled={!moved}
          title="Back to the normal size and place"
        >
          <FaUndo aria-hidden="true" /> Reset
        </button>
      </div>
    </div>
  );
};

export default SignatureControls;
