import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Form, Row, Col, Table } from 'react-bootstrap';
import { FaArrowLeft, FaPlus, FaTrash } from 'react-icons/fa';
import InvoiceDocument from '../../components/InvoiceDocument';
import { toast } from 'react-hot-toast';
import './CustomInvoice.css';
import usePageTitle from '../../hooks/usePageTitle';

const CustomInvoice = () => {
    usePageTitle('Create Custom Invoice');
    const navigate = useNavigate();
    const [customerInfo, setCustomerInfo] = useState({
        name: '',
        phone: '',
        address: '',
        deliveryCost: 0,
    });
    const [itemInfo, setItemInfo] = useState({
        name: '',
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
            toast.error('Please fill in all item fields with valid values.');
            return;
        }
        setItemList((prev) => [...prev, { ...itemInfo, total: itemInfo.quantity * itemInfo.price }]);
        setItemInfo({ name: '', quantity: 1, price: 0 });
    };
    
    const handleRemoveItem = (index) => {
        setItemList(prev => prev.filter((_, i) => i !== index));
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
            toast.error('Please fill in all customer details.');
            return;
        }
        if (itemList.length === 0) {
            toast.error('Please add at least one item to the invoice.');
            return;
        }

        const subtotal = itemList.reduce((acc, item) => acc + item.total, 0);
        const deliveryCost = parseFloat(customerInfo.deliveryCost) || 0;
        const totalAmount = subtotal + deliveryCost;

        const orderData = {
            order: {
                invoice_code: `CUSTOM-${Date.now()}`,
                created_at: new Date().toISOString(),
                item_subtotal: subtotal,
                shipping_charge: deliveryCost,
                discount: 0,
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
                f_name: customerInfo.name.split(' ')[0] || '',
                l_name: customerInfo.name.split(' ').slice(1).join(' '),
                address: customerInfo.address,
                phone: customerInfo.phone,
                city: '',
                zip: ''
            },
            order_items: itemList.map(item => ({ ...item, is_bundle: 0 })),
            payments: [{
                paid_amount: 0,
                due_amount: totalAmount
            }],
            coupon: null
        };

        const printWindow = window.open('', '_blank');
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
    const totalAmount = subtotal + deliveryCost;

    return (
        <div className="custom-invoice-container">
            <Card className="modern-card">
                <Card.Body className="p-4">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <div>
                            <Button
                                variant="link"
                                className="p-0 mb-2 text-decoration-none"
                                onClick={() => navigate('/orders')}
                            >
                                <FaArrowLeft className="me-2" /> Back to Orders
                            </Button>
                            <h2 className="page-title mb-1">Create Custom Invoice</h2>
                        </div>
                    </div>

                    <Row>
                        <Col lg={5}>
                            <Card className="mb-4">
                                <Card.Header>
                                    <h5 className="mb-0">Customer & Item Details</h5>
                                </Card.Header>
                                <Card.Body>
                                    <h6>Customer Information</h6>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Customer Name</Form.Label>
                                        <Form.Control type="text" name="name" value={customerInfo.name} onChange={handleCustomerInfoChange} />
                                    </Form.Group>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Customer Phone</Form.Label>
                                        <Form.Control type="text" name="phone" value={customerInfo.phone} onChange={handleCustomerInfoChange} />
                                    </Form.Group>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Delivery Address</Form.Label>
                                        <Form.Control as="textarea" rows={2} name="address" value={customerInfo.address} onChange={handleCustomerInfoChange} />
                                    </Form.Group>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Delivery Cost (৳)</Form.Label>
                                        <Form.Control type="number" name="deliveryCost" value={customerInfo.deliveryCost} onChange={handleCustomerInfoChange} min="0"/>
                                    </Form.Group>
                                    <hr />
                                    <h6>Add Item</h6>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Item Name</Form.Label>
                                        <Form.Control type="text" name="name" value={itemInfo.name} onChange={handleItemInfoChange} />
                                    </Form.Group>
                                    <Row>
                                        <Col>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Quantity</Form.Label>
                                                <Form.Control type="number" name="quantity" value={itemInfo.quantity} onChange={handleItemInfoChange} min="1"/>
                                            </Form.Group>
                                        </Col>
                                        <Col>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Price (per unit)</Form.Label>
                                                <Form.Control type="number" name="price" value={itemInfo.price} onChange={handleItemInfoChange} min="0"/>
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                    <Button variant="primary" onClick={handleAddItemToList} className="w-100">
                                        <FaPlus className="me-2" /> Add to List
                                    </Button>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col lg={7}>
                            <Card>
                                <Card.Header>
                                    <h5 className="mb-0">Invoice Preview</h5>
                                </Card.Header>
                                <Card.Body>
                                    {itemList.length === 0 ? (
                                        <div className="text-center text-muted py-5">
                                            <p>Items added will appear here.</p>
                                        </div>
                                    ) : (
                                        <Table striped hover responsive>
                                            <thead>
                                                <tr>
                                                    <th>Item Name</th>
                                                    <th className="text-center" style={{width: '120px'}}>Quantity</th>
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
                                                                onChange={(e) => handleQuantityChange(index, e.target.value)}
                                                                min="1"
                                                                style={{ width: '80px', margin: 'auto' }}
                                                            />
                                                        </td>
                                                        <td className="text-end">৳{item.price.toLocaleString()}</td>
                                                        <td className="text-end">৳{item.total.toLocaleString()}</td>
                                                        <td className="text-center">
                                                            <Button variant="outline-danger" size="sm" onClick={() => handleRemoveItem(index)}>
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
                                        <div className="summary-item total">
                                            <span>Total:</span>
                                            <span>৳{totalAmount.toLocaleString()}</span>
                                        </div>
                                    </div>
                                    <div className="text-end mt-4">
                                        <Button variant="success" onClick={handleGenerateInvoice} disabled={itemList.length === 0}>
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