import React, { useState } from "react";
import { Modal, Button, Form, Row, Col, ListGroup } from "react-bootstrap";
import InvoiceDocument from "../InvoiceDocument";
import { toast } from "react-hot-toast";

const CustomInvoiceModal = ({ show, onHide }) => {
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    phone: "",
    address: "",
    deliveryCost: 0,
  });
  const [itemInfo, setItemInfo] = useState({
    name: "",
    quantity: 1,
    price: 0,
  });
  const [itemList, setItemList] = useState([]);

  const handleCustomerInfoChange = (e) => {
    const { name, value } = e.target;
    setCustomerInfo((prev) => ({ ...prev, [name]: value }));
  };

  const handleItemInfoChange = (e) => {
    const { name, value } = e.target;
    setItemInfo((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddItemToList = () => {
    if (!itemInfo.name || itemInfo.quantity <= 0 || itemInfo.price <= 0) {
      toast.error("Please fill in all item fields with valid values.");
      return;
    }
    setItemList((prev) => [
      ...prev,
      { ...itemInfo, total: itemInfo.quantity * itemInfo.price },
    ]);
    setItemInfo({ name: "", quantity: 1, price: 0 }); // Reset item form
  };

  const handleGenerateInvoice = () => {
    if (!customerInfo.name || !customerInfo.phone || !customerInfo.address) {
      toast.error("Please fill in all customer details.");
      return;
    }
    if (itemList.length === 0) {
      toast.error("Please add at least one item to the invoice.");
      return;
    }

    const orderData = {
      order: {
        invoice_code: `CUSTOM-${Date.now()}`,
        created_at: new Date().toISOString(),
        item_subtotal: itemList.reduce((acc, item) => acc + item.total, 0),
        discount: 0,
        total_amount:
          itemList.reduce((acc, item) => acc + item.total, 0) +
          parseFloat(customerInfo.deliveryCost),
        user_name: customerInfo.name,
        user_phone: customerInfo.phone,
        address: customerInfo.address,
      },
      user: {
        name: customerInfo.name,
        phone: customerInfo.phone,
        address: customerInfo.address,
      },
      shipping_address: {
        f_name: customerInfo.name.split(" ")[0],
        l_name: customerInfo.name.split(" ").slice(1).join(" "),
        address: customerInfo.address,
        phone: customerInfo.phone,
      },
      order_items: itemList.map((item) => ({ ...item, is_bundle: 0 })),
      payments: [
        {
          paid_amount: 0,
          due_amount:
            itemList.reduce((acc, item) => acc + item.total, 0) +
            parseFloat(customerInfo.deliveryCost),
        },
      ],
      coupon: null,
    };

    const printWindow = window.open("", "_blank");
    const invoiceContent = InvoiceDocument({ orderData });
    printWindow.document.write(invoiceContent);
    printWindow.document.close();
    printWindow.onload = function () {
      setTimeout(() => {
        printWindow.print();
      }, 500);
    };
  };

  return (
    <Modal show={show} onHide={onHide} size="xl" centered>
      <Modal.Header closeButton>
        <Modal.Title>Create Custom Invoice</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Row>
          <Col md={5}>
            <h5>Customer & Item Details</h5>
            <hr />
            <Form>
              <h6>Customer Information</h6>
              <Form.Group className="mb-3">
                <Form.Label>Customer Name</Form.Label>
                <Form.Control
                  type="text"
                  name="name"
                  value={customerInfo.name}
                  onChange={handleCustomerInfoChange}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Customer Phone</Form.Label>
                <Form.Control
                  type="text"
                  name="phone"
                  value={customerInfo.phone}
                  onChange={handleCustomerInfoChange}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Delivery Address</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  name="address"
                  value={customerInfo.address}
                  onChange={handleCustomerInfoChange}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Delivery Cost</Form.Label>
                <Form.Control
                  type="number"
                  name="deliveryCost"
                  value={customerInfo.deliveryCost}
                  onChange={handleCustomerInfoChange}
                />
              </Form.Group>
              <hr />
              <h6>Item Information</h6>
              <Form.Group className="mb-3">
                <Form.Label>Item Name</Form.Label>
                <Form.Control
                  type="text"
                  name="name"
                  value={itemInfo.name}
                  onChange={handleItemInfoChange}
                />
              </Form.Group>
              <Row>
                <Col>
                  <Form.Group className="mb-3">
                    <Form.Label>Quantity</Form.Label>
                    <Form.Control
                      type="number"
                      name="quantity"
                      value={itemInfo.quantity}
                      onChange={handleItemInfoChange}
                      min="1"
                    />
                  </Form.Group>
                </Col>
                <Col>
                  <Form.Group className="mb-3">
                    <Form.Label>Item Price (per unit)</Form.Label>
                    <Form.Control
                      type="number"
                      name="price"
                      value={itemInfo.price}
                      onChange={handleItemInfoChange}
                      min="0"
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Button variant="primary" onClick={handleAddItemToList}>
                Add to List
              </Button>
            </Form>
          </Col>
          <Col md={7}>
            <h5>Invoice Items</h5>
            <hr />
            <ListGroup>
              {itemList.map((item, index) => (
                <ListGroup.Item key={index}>
                  <Row>
                    <Col>{item.name}</Col>
                    <Col xs="auto">
                      {item.quantity} x ৳{item.price}
                    </Col>
                    <Col xs="auto">৳{item.total.toLocaleString()}</Col>
                  </Row>
                </ListGroup.Item>
              ))}
            </ListGroup>
            <hr />
            <div className="text-end">
              <h5>
                Subtotal: ৳
                {itemList
                  .reduce((acc, item) => acc + item.total, 0)
                  .toLocaleString()}
              </h5>
              <h5>
                Delivery Cost: ৳
                {parseFloat(customerInfo.deliveryCost).toLocaleString()}
              </h5>
              <h4>
                Total: ৳
                {(
                  itemList.reduce((acc, item) => acc + item.total, 0) +
                  parseFloat(customerInfo.deliveryCost)
                ).toLocaleString()}
              </h4>
            </div>
            <div className="text-end mt-3">
              <Button variant="success" onClick={handleGenerateInvoice}>
                Generate Invoice
              </Button>
            </div>
          </Col>
        </Row>
      </Modal.Body>
    </Modal>
  );
};

export default CustomInvoiceModal;
