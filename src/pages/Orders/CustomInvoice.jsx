import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  Button,
  Form,
  Row,
  Col,
  Table,
  InputGroup,
} from "react-bootstrap";
import {
  FaArrowLeft,
  FaPlus,
  FaTrash,
  FaBox,
  FaUserTie,
  FaUser,
  FaPhone,
  FaMapMarkerAlt,
  FaTruck,
  FaTag,
  FaClock,
  FaMoneyBill,
} from "react-icons/fa";
import InvoiceDocument from "../../components/InvoiceDocument";
import { toast } from "react-hot-toast";
import "./CustomInvoice.css";
import usePageTitle from "../../hooks/usePageTitle";

const CustomInvoice = () => {
  usePageTitle("Create Custom Invoice");
  const navigate = useNavigate();
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
    type: "product", // 'product' or 'consultancy'
  });
  const [discount, setDiscount] = useState({
    type: "percentage", // 'percentage' or 'flat'
    value: 0,
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
    setItemInfo({ name: "", quantity: 1, price: 0, type: "product" });
  };

  const handleRemoveItem = (index) => {
    setItemList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleQuantityChange = (index, newQuantity) => {
    const updatedList = [...itemList];
    const item = updatedList[index];
    const quantity = parseInt(newQuantity, 10);

    if (quantity > 0) {
      item.quantity = quantity;
      item.total = item.price * quantity;
      setItemList(updatedList);
    }
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

    const subtotal = itemList.reduce((acc, item) => acc + item.total, 0);
    const deliveryCost = parseFloat(customerInfo.deliveryCost) || 0;

    let discountAmount = 0;
    if (discount.type === "percentage") {
      discountAmount = (subtotal * discount.value) / 100;
    } else {
      discountAmount = parseFloat(discount.value) || 0;
    }

    const totalAmount = subtotal + deliveryCost - discountAmount;

    const orderData = {
      order: {
        invoice_code: `CUSTOM-${Date.now()}`,
        created_at: new Date().toISOString(),
        item_subtotal: subtotal,
        shipping_charge: deliveryCost,
        discount: discountAmount,
        total_amount: totalAmount,
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
        f_name: customerInfo.name.split(" ")[0] || "",
        l_name: customerInfo.name.split(" ").slice(1).join(" "),
        address: customerInfo.address,
        phone: customerInfo.phone,
        city: "",
        zip: "",
      },
      order_items: itemList.map((item) => ({ ...item, is_bundle: 0 })),
      payments: [
        {
          paid_amount: 0,
          due_amount: totalAmount,
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

  const subtotal = itemList.reduce((acc, item) => acc + item.total, 0);
  const deliveryCost = parseFloat(customerInfo.deliveryCost) || 0;

  let discountAmount = 0;
  if (discount.type === "percentage") {
    discountAmount = (subtotal * discount.value) / 100;
  } else {
    discountAmount = parseFloat(discount.value) || 0;
  }

  const totalAmount = subtotal + deliveryCost - discountAmount;

  return (
    <div className="custom-invoice-container">
      <Card className="modern-card">
        <Card.Body className="p-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <Button
                variant="link"
                className="text-muted p-0 mb-2 text-decoration-none d-flex align-items-center"
                onClick={() => navigate("/orders")}
              >
                <FaArrowLeft className="me-2" /> Back to Orders
              </Button>
              <h2 className="fw-bold text-dark">Create Custom Invoice</h2>
            </div>
          </div>

          <Row>
            <Col lg={5} md={12} className="mb-4 mb-lg-0">
              <Card className="modern-card h-100">
                <div className="card-header-custom">
                  <h5 className="mb-0">Customer & Item Details</h5>
                </div>
                <Card.Body className="p-4">
                  <span className="section-label">Customer Information</span>
                  <Row className="g-3">
                    <Col md={6}>
                      <InputGroup className="mb-3">
                        <InputGroup.Text>
                          <FaUser />
                        </InputGroup.Text>
                        <Form.Control
                          type="text"
                          name="name"
                          placeholder="Customer Name"
                          value={customerInfo.name}
                          onChange={handleCustomerInfoChange}
                        />
                      </InputGroup>
                    </Col>
                    <Col md={6}>
                      <InputGroup className="mb-3">
                        <InputGroup.Text>
                          <FaPhone />
                        </InputGroup.Text>
                        <Form.Control
                          type="text"
                          name="phone"
                          placeholder="Customer Phone"
                          value={customerInfo.phone}
                          onChange={handleCustomerInfoChange}
                        />
                      </InputGroup>
                    </Col>
                    <Col md={12}>
                      <InputGroup className="mb-3">
                        <InputGroup.Text>
                          <FaMapMarkerAlt />
                        </InputGroup.Text>
                        <Form.Control
                          as="textarea"
                          name="address"
                          placeholder="Delivery Address"
                          style={{ height: "80px", paddingTop: "10px" }}
                          value={customerInfo.address}
                          onChange={handleCustomerInfoChange}
                        />
                      </InputGroup>
                    </Col>
                    <Col md={12}>
                      <label className="small text-muted mb-1 ms-1">
                        Delivery Cost
                      </label>
                      <InputGroup className="mb-3">
                        <InputGroup.Text>৳</InputGroup.Text>
                        <Form.Control
                          type="number"
                          name="deliveryCost"
                          placeholder="0"
                          value={customerInfo.deliveryCost}
                          onChange={handleCustomerInfoChange}
                          min="0"
                        />
                      </InputGroup>
                    </Col>
                  </Row>

                  <hr className="my-4 text-muted opacity-25" />

                  <span className="section-label">Add New Item</span>

                  {/* Custom Item Type Selector */}
                  <div className="item-type-selector">
                    <div
                      className={`type-option ${itemInfo.type === "product" || !itemInfo.type ? "active" : ""}`}
                      onClick={() =>
                        setItemInfo((prev) => ({ ...prev, type: "product" }))
                      }
                    >
                      <FaBox /> Product
                    </div>
                    <div
                      className={`type-option ${itemInfo.type === "consultancy" ? "active" : ""}`}
                      onClick={() =>
                        setItemInfo((prev) => ({
                          ...prev,
                          type: "consultancy",
                        }))
                      }
                    >
                      <FaUserTie /> Consultancy Service
                    </div>
                  </div>

                  <InputGroup className="mb-3">
                    <InputGroup.Text>
                      <FaTag />
                    </InputGroup.Text>
                    <Form.Control
                      type="text"
                      name="name"
                      placeholder={
                        itemInfo.type === "consultancy"
                          ? "Service Name / Description"
                          : "Product Name"
                      }
                      value={itemInfo.name}
                      onChange={handleItemInfoChange}
                    />
                  </InputGroup>

                  <Row className="g-3">
                    <Col xs={6}>
                      <label className="small text-muted mb-1 ms-1">
                        {itemInfo.type === "consultancy" ? "Hours" : "Quantity"}
                      </label>
                      <InputGroup className="mb-3">
                        <InputGroup.Text>
                          {itemInfo.type === "consultancy" ? (
                            <FaClock />
                          ) : (
                            <FaBox />
                          )}
                        </InputGroup.Text>
                        <Form.Control
                          type="number"
                          name="quantity"
                          placeholder="1"
                          value={itemInfo.quantity}
                          onChange={handleItemInfoChange}
                          min="1"
                        />
                      </InputGroup>
                    </Col>
                    <Col xs={6}>
                      <label className="small text-muted mb-1 ms-1">
                        {itemInfo.type === "consultancy"
                          ? "Rate/Hour"
                          : "Unit Price"}
                      </label>
                      <InputGroup className="mb-3">
                        <InputGroup.Text>৳</InputGroup.Text>
                        <Form.Control
                          type="number"
                          name="price"
                          placeholder="0"
                          value={itemInfo.price}
                          onChange={handleItemInfoChange}
                          min="0"
                        />
                      </InputGroup>
                    </Col>
                  </Row>

                  <Button
                    onClick={handleAddItemToList}
                    className="w-100 mt-2 btn-primary-custom"
                  >
                    <FaPlus className="me-2" /> Add Item to List
                  </Button>
                </Card.Body>
              </Card>
            </Col>
            <Col lg={7} md={12}>
              <Card className="modern-card h-100">
                <div className="card-header-custom">
                  <h5 className="mb-0">Invoice Preview</h5>
                </div>
                <Card.Body className="p-4">
                  {itemList.length === 0 ? (
                    <div className="text-center text-muted py-5">
                      <p>Items added will appear here.</p>
                    </div>
                  ) : (
                    <Table striped hover responsive>
                      <thead>
                        <tr>
                          <th>Item Name</th>
                          <th
                            className="text-center"
                            style={{ width: "120px" }}
                          >
                            Quantity
                          </th>
                          <th className="text-end">Price</th>
                          <th className="text-end">Total</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {itemList.map((item, index) => (
                          <tr key={index}>
                            <td>{item.name}</td>
                            <td className="text-center">
                              <Form.Control
                                type="number"
                                value={item.quantity}
                                onChange={(e) =>
                                  handleQuantityChange(index, e.target.value)
                                }
                                min="1"
                                style={{ width: "80px", margin: "auto" }}
                              />
                            </td>
                            <td className="text-end">
                              ৳{item.price.toLocaleString()}
                            </td>
                            <td className="text-end">
                              ৳{item.total.toLocaleString()}
                            </td>
                            <td className="text-center">
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => handleRemoveItem(index)}
                              >
                                <FaTrash />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  )}
                  <hr />
                  <div className="invoice-summary">
                    <div className="summary-item">
                      <span>Subtotal:</span>
                      <span>৳{subtotal.toLocaleString()}</span>
                    </div>
                    <div className="summary-item">
                      <span>Delivery Cost:</span>
                      <span>৳{deliveryCost.toLocaleString()}</span>
                    </div>
                    <div className="summary-item align-items-center">
                      <span>Discount:</span>
                      <div
                        className="d-flex text-end justify-content-end align-items-center gap-2"
                        style={{ maxWidth: "250px" }}
                      >
                        <Form.Select
                          size="sm"
                          value={discount.type}
                          onChange={(e) =>
                            setDiscount((prev) => ({
                              ...prev,
                              type: e.target.value,
                            }))
                          }
                          style={{ width: "100px" }}
                        >
                          <option value="percentage">%</option>
                          <option value="flat">Flat</option>
                        </Form.Select>
                        <Form.Control
                          type="number"
                          size="sm"
                          value={discount.value}
                          onChange={(e) =>
                            setDiscount((prev) => ({
                              ...prev,
                              value: parseFloat(e.target.value) || 0,
                            }))
                          }
                          style={{ width: "80px" }}
                          min="0"
                        />
                      </div>
                    </div>
                    <div className="summary-item text-danger">
                      <span></span>
                      <span>- ৳{discountAmount.toLocaleString()}</span>
                    </div>
                    <div className="summary-item total">
                      <span>Total:</span>
                      <span>৳{totalAmount.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="text-end mt-4">
                    <Button
                      variant="success"
                      onClick={handleGenerateInvoice}
                      disabled={itemList.length === 0}
                    >
                      Generate Invoice
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Card.Body>
      </Card>
    </div>
  );
};

export default CustomInvoice;
