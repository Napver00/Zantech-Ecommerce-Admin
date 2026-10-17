import React from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Card, Button } from "react-bootstrap";
import { FaWallet } from "react-icons/fa";
import usePageTitle from "../../hooks/usePageTitle";
import RegistrationsPanel from "./RegistrationsPanel";

const CourseRegistrations = () => {
  usePageTitle("Course Registrations");
  const [searchParams] = useSearchParams();
  const openId = searchParams.get("id");

  return (
    <div className="students-container">
      <Card className="modern-card border-0">
        <Card.Body className="p-4">
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4">
            <div>
              <h4 className="mb-1 fw-bold text-primary">Course Registrations</h4>
              <p className="text-muted small mb-0">
                Enrollments submitted from the website. Verify the payment, then approve to enroll the student and create their invoice.
              </p>
            </div>
            <Button as={Link} to="/payment-methods" variant="outline-primary">
              <FaWallet className="me-2" /> Payment Methods
            </Button>
          </div>
          <RegistrationsPanel openId={openId} />
        </Card.Body>
      </Card>
    </div>
  );
};

export default CourseRegistrations;
