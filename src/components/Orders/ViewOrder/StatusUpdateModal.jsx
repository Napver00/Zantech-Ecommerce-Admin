import React from 'react';
import { Modal, Button } from 'react-bootstrap';
import { FaSpinner } from 'react-icons/fa';

const StatusUpdateModal = ({ show, handleClose, selectedStatus, orderStatus, updatingStatus, confirmStatusChange }) => {
  const getStatusLabel = (status) => {
    const statusMap = {
      "0": "Processing",
      "1": "Completed",
      "2": "On Hold",
      "3": "Cancelled",
      "4": "Refunded",
    };
    return statusMap[status?.toString()] || "Unknown";
  };
  
  const isStatusTransitionAllowed = (currentStatus, newStatus) => {
    const allowedTransitions = {
      0: ["1", "2", "3"],
      1: ["4"],
      2: ["0", "1", "3"],
      3: [],
      4: [],
    };

    return allowedTransitions[currentStatus]?.includes(newStatus) || false;
  };

  return (
    <Modal show={show} onHide={handleClose} centered className="modern-modal">
      <Modal.Header closeButton className="bg-light">
        <Modal.Title>Confirm Status Change</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>
          Are you sure you want to change the order status from{" "}
          <strong>{getStatusLabel(orderStatus)}</strong> to{" "}
          <strong>{getStatusLabel(selectedStatus)}</strong>?
        </p>
        {!isStatusTransitionAllowed(
          orderStatus?.toString(),
          selectedStatus
        ) && (
          <div className="alert alert-warning">
            This status transition may not be allowed. Please verify
            before proceeding.
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button
          variant="secondary"
          onClick={handleClose}
          className="modern-btn"
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={confirmStatusChange}
          disabled={updatingStatus}
          className="modern-btn"
        >
          {updatingStatus ? (
            <>
              <FaSpinner className="me-2" spin /> Updating...
            </>
          ) : (
            "Confirm Change"
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default StatusUpdateModal;