import React, { useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { FaSpinner, FaTimes, FaEnvelope } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import axiosInstance from '../../../config/axios';

const EmailModal = ({ show, handleClose, orderId }) => {
  const [emailInput, setEmailInput] = useState("");
  const [sendingEmails, setSendingEmails] = useState(false);
  const [emailList, setEmailList] = useState([]);

  const handleAddEmail = () => {
    const email = emailInput.trim();
    if (!email) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    if (emailList.includes(email)) {
      toast.error("This email is already added");
      return;
    }

    setEmailList((prev) => [...prev, email]);
    setEmailInput("");
  };

  const handleRemoveEmail = (emailToRemove) => {
    setEmailList((prev) => prev.filter((email) => email !== emailToRemove));
  };

  const handleSendEmails = async () => {
    if (emailList.length === 0) {
      toast.error("Please add at least one email address");
      return;
    }

    setSendingEmails(true);
    try {
      const response = await axiosInstance.post(`/orders/sendOrderEmails/${orderId}`, {
        emails: emailList,
      });

      if (response.data.success) {
        toast.success("Order details sent successfully");
        handleClose();
        setEmailList([]);
      } else {
        throw new Error(response.data.message || "Failed to send emails");
      }
    } catch (error) {
      console.error("Error sending emails:", error);
      toast.error(error.response?.data?.message || "Failed to send order details");
    } finally {
      setSendingEmails(false);
    }
  };

  return (
    <Modal
      show={show}
      onHide={handleClose}
      centered
      className="modern-modal"
    >
      <Modal.Header closeButton className="bg-light">
        <Modal.Title>Send Order Details</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form.Group className="mb-3">
          <Form.Label className="fw-medium">Email Addresses</Form.Label>
          <div className="d-flex gap-2 mb-2">
            <Form.Control
              type="email"
              placeholder="Enter email address"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddEmail();
                }
              }}
              className="modern-input"
            />
            <Button variant="outline-primary" onClick={handleAddEmail}>
              Add
            </Button>
          </div>
          {emailList.length > 0 && (
            <div className="border rounded p-2">
              {emailList.map((email, index) => (
                <div
                  key={index}
                  className="d-flex justify-content-between align-items-center mb-1"
                >
                  <span>{email}</span>
                  <Button
                    variant="link"
                    className="text-danger p-0"
                    onClick={() => handleRemoveEmail(email)}
                  >
                    <FaTimes />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Form.Group>
      </Modal.Body>
      <Modal.Footer>
        <Button
          variant="secondary"
          onClick={() => {
            handleClose();
            setEmailList([]);
          }}
          className="modern-btn"
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleSendEmails}
          disabled={sendingEmails || emailList.length === 0}
          className="d-flex align-items-center gap-2 modern-btn"
        >
          {sendingEmails ? (
            <>
              <FaSpinner className="spinner-border spinner-border-sm" />{" "}
              Sending...
            </>
          ) : (
            <>
              <FaEnvelope /> Send Emails
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default EmailModal;