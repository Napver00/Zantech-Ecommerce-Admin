import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { Button, Modal } from "react-bootstrap";
import { FaExclamationTriangle, FaQuestionCircle, FaTrashAlt } from "react-icons/fa";

/*
 * A styled replacement for window.confirm():
 *
 *   if (!(await confirmDialog("Delete this coupon?"))) return;
 *   await confirmDialog({ title, message, confirmLabel, cancelLabel, tone: "danger" | "warning" | "primary" })
 *
 * Resolves true when confirmed, false when cancelled or dismissed.
 * Plain strings are turned into a short title + explanation, and the button
 * and colour are picked from the wording ("Delete…" → red "Delete" button).
 */

const VERBS = [
  ["delete", "Delete", "danger"],
  ["remove", "Remove", "danger"],
  ["void", "Void", "danger"],
  ["reject", "Reject", "danger"],
  ["unenroll", "Unenroll", "danger"],
  ["revoke", "Revoke", "danger"],
  ["email", "Send", "primary"],
  ["send", "Send", "primary"],
];

const capitalise = (s) => s.charAt(0).toUpperCase() + s.slice(1);

const fromText = (text) => {
  let message = String(text || "").trim();
  // "Are you sure you want to delete this X?" → "Delete this X?"
  message = message.replace(/^are you sure (?:you want )?to\s+/i, "");
  message = capitalise(message);

  // First sentence becomes the title, the rest the explanation.
  const match = message.match(/^(.+?[?.!])(\s+[\s\S]+)?$/);
  const title = match ? match[1] : message;
  const body = match?.[2]?.trim() || "";

  const lower = title.toLowerCase();
  const verb = VERBS.find(([word]) => lower.includes(word));
  return {
    title,
    message: body || (verb?.[2] === "danger" ? "This can't be undone." : ""),
    confirmLabel: verb?.[1] || "Yes, continue",
    tone: verb?.[2] || "primary",
  };
};

const TONE = {
  danger: { icon: FaTrashAlt, variant: "danger", ring: "confirm-dialog-icon danger" },
  warning: { icon: FaExclamationTriangle, variant: "warning", ring: "confirm-dialog-icon warning" },
  primary: { icon: FaQuestionCircle, variant: "primary", ring: "confirm-dialog-icon primary" },
};

const ConfirmDialog = ({ options, onClose }) => {
  const [show, setShow] = useState(true);
  const result = useRef(false);
  const confirmRef = useRef(null);
  const tone = TONE[options.tone] || TONE.primary;
  const Icon = tone.icon;

  const close = (value) => {
    result.current = value;
    setShow(false);
  };

  useEffect(() => {
    // Danger actions focus Cancel, so a stray Enter never deletes anything.
    if (options.tone !== "danger") confirmRef.current?.focus();
  }, [options.tone]);

  return (
    <Modal
      show={show}
      onHide={() => close(false)}
      onExited={() => onClose(result.current)}
      centered
      size="sm"
      className="confirm-dialog"
      backdropClassName="confirm-dialog-backdrop"
      aria-labelledby="confirm-dialog-title"
    >
      <Modal.Body className="text-center">
        <span className={tone.ring}>
          <Icon />
        </span>
        <h5 id="confirm-dialog-title" className="confirm-dialog-title">{options.title}</h5>
        {options.message && <p className="confirm-dialog-message">{options.message}</p>}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="light" className="border" onClick={() => close(false)} autoFocus={options.tone === "danger"}>
          {options.cancelLabel || "Cancel"}
        </Button>
        <Button ref={confirmRef} variant={tone.variant} onClick={() => close(true)}>
          {options.confirmLabel}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export function confirmDialog(input) {
  const options = typeof input === "string" ? fromText(input) : { ...fromText(input.title || ""), ...input };
  return new Promise((resolve) => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    const root = createRoot(host);
    const done = (value) => {
      resolve(value);
      setTimeout(() => {
        root.unmount();
        host.remove();
      });
    };
    root.render(<ConfirmDialog options={options} onClose={done} />);
  });
}

export default confirmDialog;
