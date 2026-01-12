import React from 'react';
import { Card, Button, Table, Spinner, Form, InputGroup, Image } from 'react-bootstrap';
import { FaBoxes, FaPlus, FaTrash, FaPencilAlt, FaSearch } from 'react-icons/fa';
import AsyncSelect from 'react-select/async';

const ProductBundle = ({ product, handleBundleToggle, bundleToggleLoading, handleAddToBundle, bundleLoading, selectedItems, handleRemoveSelectedItem, bundleQuantity, setBundleQuantity, loadProductOptions, handleSelectProduct, handleDeleteBundleItem, deleteBundleLoading, handleUpdateBundleQuantity, updateQuantityLoading, editingQuantity, setEditingQuantity }) => {
    return (
        <Card className="border">
            <Card.Header className="bg-light d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Bundle Products</h5>
                <Form.Check
                    type="switch"
                    id="bundle-switch"
                    label={product.is_bundle === 1 ? 'Bundle Active' : 'Set as Bundle'}
                    checked={product.is_bundle === 1}
                    onChange={handleBundleToggle}
                    disabled={bundleToggleLoading}
                />
            </Card.Header>
            {product.is_bundle === 1 && (
                <Card.Body>
                    <div className="mb-4">
                        <h6 className="mb-3">Add Items to Bundle</h6>
                        <AsyncSelect
                            cacheOptions
                            loadOptions={loadProductOptions}
                            onChange={handleSelectProduct}
                            placeholder="Search for products to add..."
                            formatOptionLabel={(option) => (
                                <div className="d-flex align-items-center">
                                    <Image src={option.image} rounded width="40" height="40" className="me-3" />
                                    <div>
                                        <div>{option.label}</div>
                                        <small className="text-muted">Price: ৳{option.price} - Stock: {option.stock}</small>
                                    </div>
                                </div>
                            )}
                        />
                    </div>

                    {selectedItems.length > 0 && (
                        <div className="mb-4">
                            <h6 className="mb-3">Selected Items</h6>
                            <Table striped bordered hover responsive>
                                <thead>
                                    <tr>
                                        <th>Product</th>
                                        <th>Quantity</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedItems.map(item => (
                                        <tr key={item.id}>
                                            <td>{item.name}</td>
                                            <td>
                                                <Form.Control
                                                    type="number"
                                                    size="sm"
                                                    min="1"
                                                    value={bundleQuantity[item.id] || ''}
                                                    onChange={(e) =>
                                                        setBundleQuantity({
                                                            ...bundleQuantity,
                                                            [item.id]: e.target.value,
                                                        })
                                                    }
                                                />
                                            </td>
                                            <td>
                                                <Button
                                                    variant="outline-danger"
                                                    size="sm"
                                                    onClick={() => handleRemoveSelectedItem(item.id)}
                                                >
                                                    <FaTrash />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                            <Button
                                variant="primary"
                                onClick={handleAddToBundle}
                                disabled={bundleLoading}
                            >
                                {bundleLoading ? 'Adding...' : 'Add to Bundle'}
                            </Button>
                        </div>
                    )}

                    {product.bundle_items && product.bundle_items.length > 0 ? (
                        <div>
                            <h5 className="mb-3">Bundle Items</h5>
                            <div className="border rounded">
                                {/* Fixed Header */}
                                <div className="p-2 bg-light border-bottom">
                                    <div className="d-flex">
                                        <div style={{ width: '10%' }} className="fw-bold px-2">Image</div>
                                        <div style={{ width: '35%' }} className="fw-bold px-2">Product Name</div>
                                        <div style={{ width: '15%' }} className="fw-bold px-2">Price</div>
                                        <div style={{ width: '15%' }} className="fw-bold px-2">Quantity</div>
                                        <div style={{ width: '15%' }} className="fw-bold px-2">Total</div>
                                        <div style={{ width: '10%' }} className="fw-bold px-2">Actions</div>
                                    </div>
                                </div>

                                {/* Scrollable Body */}
                                <div style={{ maxHeight: product.bundle_items.length > 6 ? '400px' : 'none', overflowY: product.bundle_items.length > 6 ? 'auto' : 'visible' }}>
                                    {product.bundle_items.map((item, index) => (
                                        <div key={item.bundle_id} className={`d-flex align-items-center p-2 ${index % 2 !== 0 ? 'bg-light' : ''}`}>
                                            <div style={{ width: '10%' }} className="px-2">
                                                <Image src={item.image} rounded width="50" height="50" />
                                            </div>
                                            <div style={{ width: '35%', wordBreak: 'break-word' }} className="px-2">{item.name}</div>
                                            <div style={{ width: '15%' }} className="px-2">৳{item.price}</div>
                                            <div style={{ width: '15%' }} className="px-2">
                                                {editingQuantity[item.bundle_id] ? (
                                                    <InputGroup size="sm">
                                                        <Form.Control
                                                            type="number"
                                                            min="1"
                                                            value={editingQuantity[item.bundle_id]}
                                                            onChange={(e) => setEditingQuantity({
                                                                ...editingQuantity,
                                                                [item.bundle_id]: e.target.value
                                                            })}
                                                        />
                                                        <Button
                                                            variant="success"
                                                            onClick={() => handleUpdateBundleQuantity(item.bundle_id, editingQuantity[item.bundle_id])}
                                                            disabled={updateQuantityLoading === item.bundle_id}
                                                        >
                                                            {updateQuantityLoading === item.bundle_id ? <Spinner size="sm" /> : 'Save'}
                                                        </Button>
                                                    </InputGroup>
                                                ) : (
                                                    <div className="d-flex align-items-center">
                                                        <span>{item.bundle_quantity}</span>
                                                        <Button
                                                            variant="link"
                                                            size="sm"
                                                            onClick={() => setEditingQuantity({
                                                                ...editingQuantity,
                                                                [item.bundle_id]: item.bundle_quantity
                                                            })}
                                                        >
                                                            <FaPencilAlt />
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                            <div style={{ width: '15%' }} className="px-2">৳{item.price * item.bundle_quantity}</div>
                                            <div style={{ width: '10%' }} className="px-2">
                                                <Button
                                                    variant="outline-danger"
                                                    size="sm"
                                                    onClick={() => handleDeleteBundleItem(item.bundle_id)}
                                                    disabled={deleteBundleLoading === item.bundle_id}
                                                >
                                                    {deleteBundleLoading === item.bundle_id ? <Spinner size="sm" /> : <FaTrash />}
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                
                                {/* Fixed Footer */}
                                <div className="p-2 bg-light border-top">
                                    <div className="d-flex">
                                        <div style={{ width: '75%' }} className="text-end fw-bold px-2">Bundle Total:</div>
                                        <div style={{ width: '25%' }} className="fw-bold px-2">
                                            ৳{product.bundle_items.reduce((acc, item) => acc + (parseFloat(item.price) * parseInt(item.bundle_quantity)), 0).toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-4 text-muted">No items in this bundle yet</div>
                    )}
                </Card.Body>
            )}
        </Card>
    );
};

export default ProductBundle;
