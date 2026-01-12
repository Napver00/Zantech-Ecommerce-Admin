import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaArrowLeft, FaPlus, FaEdit } from "react-icons/fa";
import { toast } from "react-hot-toast";
import axiosInstance from "../../config/axios";
import { Card, Button, Row, Col, Table } from "react-bootstrap";
import Loading from "../../components/Loading";
import AddShippingAddressModal from "../../components/Customers/AddShippingAddressModal";
import EditShippingAddressModal from "../../components/Customers/EditShippingAddressModal";
import "./Customers.css";
import usePageTitle from '../../hooks/usePageTitle';

const ViewCustomer = () => {
  usePageTitle('View Customer Details');
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddAddressModal, setShowAddAddressModal] = useState(false);
  const [showEditAddressModal, setShowEditAddressModal] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(null);

  useEffect(() => {
    fetchCustomerDetails();
  }, [id]);

  const fetchCustomerDetails = async () => {
    try {
      const response = await axiosInstance.get(`/clints/all-info/${id}`);
      if (response.data.success) {
        setCustomer(response.data.data[0]);
      } else {
        throw new Error(
          response.data.message || "Failed to fetch customer details"
        );
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to fetch customer details"
      );
      navigate("/customers");
    } finally {
      setLoading(false);
    }
  };

  const handleAddressAdded = (newAddress) => {
    setCustomer((prevCustomer) => ({
      ...prevCustomer,
      shipping_addresses: [...prevCustomer.shipping_addresses, newAddress],
    }));
  };

  const handleAddressUpdated = (updatedAddress) => {
    setCustomer((prevCustomer) => ({
      ...prevCustomer,
      shipping_addresses: prevCustomer.shipping_addresses.map((address) =>
        address.id === updatedAddress.id ? updatedAddress : address
      ),
    }));
  };

  const handleEditClick = (address) => {
    setSelectedAddress(address);
    setShowEditAddressModal(true);
  };

  if (loading) {
    return <Loading />;
  }

  if (!customer) {
    return (
      <div className="customers-container">
        <div className="alert alert-danger">Customer not found</div>
      </div>
    );
  }

  const { user, shipping_addresses, order_summary, payment_summary } = customer;

  return (
    <div className="customers-container">
      <Card className="modern-card">
        <Card.Body className="p-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <Button
                variant="link"
                className="p-0 mb-2 text-decoration-none"
                onClick={() => navigate("/customers")}
              >
                <FaArrowLeft className="me-2" /> Back to Customers
              </Button>
              <h2 className="page-title mb-1">Customer Details</h2>
              <p className="text-muted mb-0">
                View and manage customer information
              </p>
            </div>
          </div>

          <div className="mt-4">
            <Card className="border mb-4">
              <Card.Header className="bg-light">
                <h5 className="mb-0">Basic Information</h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <div className="mb-4">
                      <label className="detail-label">ID</label>
                      <div className="detail-value">#{user.id}</div>
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="mb-4">
                      <label className="detail-label">Member Since</label>
                      <div className="detail-value">
                        {new Date(user.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </Col>
                </Row>
                <Row>
                  <Col md={6}>
                    <div className="mb-4">
                      <label className="detail-label">Name</label>
                      <div className="detail-value">{user.name}</div>
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="mb-4">
                      <label className="detail-label">Email</label>
                      <div className="detail-value">{user.email}</div>
                    </div>
                  </Col>
                </Row>
                <Row>
                  <Col md={6}>
                    <div className="mb-4">
                      <label className="detail-label">Phone</label>
                      <div className="detail-value">{user.phone}</div>
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="mb-4">
                      <label className="detail-label">Address</label>
                      <div className="detail-value">
                        {user.address || "N/A"}
                      </div>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            <Card className="border mb-4">
              <Card.Header className="bg-light">
                <h5 className="mb-0">Order Summary</h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={4}>
                    <div className="mb-4">
                      <label className="detail-label">Total Orders</label>
                      <div className="detail-value">
                        {order_summary.total_orders}
                      </div>
                    </div>
                  </Col>
                  <Col md={4}>
                    <div className="mb-4">
                      <label className="detail-label">Total Spend</label>
                      <div className="detail-value expense-amount">
                        ৳{order_summary.total_spend.toLocaleString()}
                      </div>
                    </div>
                  </Col>
                  <Col md={4}>
                    <div className="mb-4">
                      <label className="detail-label">Due Amount</label>
                      <div
                        className={`detail-value ${
                          payment_summary.due_amount > 0
                            ? "text-danger"
                            : "text-success"
                        }`}
                      >
                        ৳{payment_summary.due_amount.toLocaleString()}
                      </div>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            <Card className="border">
              <Card.Header className="bg-light d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Shipping Addresses</h5>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setShowAddAddressModal(true)}
                >
                  <FaPlus className="me-2" /> Add New Address
                </Button>
              </Card.Header>
              <Card.Body>
                {shipping_addresses.length > 0 ? (
                  <div className="row g-3">
                    {shipping_addresses.map((address, index) => (
                      <div key={index} className="col-md-6">
                        <Card className="address-card h-100">
                          <Card.Body className="p-4">
                            <div className="address-header mb-3 d-flex justify-content-between align-items-center">
                              <h6 className="mb-0 text-primary">
                                Address #{index + 1}
                              </h6>
                              <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => handleEditClick(address)}
                              >
                                <FaEdit />
                              </Button>
                            </div>
                            <div className="address-details">
                              <div className="mb-3">
                                <label className="detail-label">
                                  Street Address
                                </label>
                                <div className="detail-value">
                                  {address.address}
                                </div>
                              </div>
                              <div className="row g-3">
                                <div className="col-6">
                                  <div className="mb-3">
                                    <label className="detail-label">City</label>
                                    <div className="detail-value">
                                      {address.city}
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="row g-3">
                                <div className="col-6">
                                  <div className="mb-3">
                                    <label className="detail-label">
                                      Postal Code
                                    </label>
                                    <div className="detail-value">
                                      {address.zip}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </Card.Body>
                        </Card>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-muted p-3 bg-light rounded">
                    No shipping addresses found
                  </div>
                )}
              </Card.Body>
            </Card>
          </div>
        </Card.Body>
      </Card>

      <AddShippingAddressModal
        show={showAddAddressModal}
        onHide={() => setShowAddAddressModal(false)}
        userId={user.id}
        onAdd={handleAddressAdded}
      />

      {selectedAddress && (
        <EditShippingAddressModal
          show={showEditAddressModal}
          onHide={() => setShowEditAddressModal(false)}
          address={selectedAddress}
          onUpdate={handleAddressUpdated}
        />
      )}
    </div>
  );
};

export default ViewCustomer;
