import React, { useState } from 'react';
import { Card, Table, Form, Button, Row, Col } from 'react-bootstrap';
import { FaShoppingCart, FaPlus, FaTimes, FaSpinner, FaEdit, FaTrash } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import axiosInstance from '../../../config/axios';
import Select from 'react-select/async';

const OrderItems = ({ orderItems, orderId, refreshOrderData }) => {
  const [updatingQuantity, setUpdatingQuantity] = useState(false);
  const [removingItem, setRemovingItem] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [quantityInput, setQuantityInput] = useState("");
  const [isAddingItems, setIsAddingItems] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [addingItemsLoading, setAddingItemsLoading] = useState(false);

  const handleRemoveItem = async (productId) => {
    if (removingItem) return;

    if (!window.confirm("Are you sure you want to remove this item from the order?")) {
      return;
    }

    setRemovingItem(true);
    try {
      const response = await axiosInstance.delete(`/orders/products/${orderId}/remove/${productId}`);

      if (response.data.success) {
        toast.success("Item removed successfully");
        refreshOrderData();
      } else {
        throw new Error(response.data.message || "Failed to remove item");
      }
    } catch (error) {
      console.error("Remove item error:", error);
      toast.error(error.response?.data?.message || "Failed to remove item");
    } finally {
      setRemovingItem(false);
    }
  };

  const handleUpdateQuantity = async (productId, newQuantity) => {
    if (updatingQuantity || !newQuantity || newQuantity < 1) return;

    setUpdatingQuantity(true);
    try {
      const response = await axiosInstance.put(`/orders/products/${orderId}/update-quantity/${productId}`, {
        quantity: parseInt(newQuantity),
      });

      if (response.data.success) {
        toast.success("Quantity updated successfully");
        setEditingItem(null);
        refreshOrderData();
      } else {
        throw new Error(response.data.message || "Failed to update quantity");
      }
    } catch (error) {
      console.error("Update quantity error:", error);
      toast.error(error.response?.data?.message || "Failed to update quantity");
    } finally {
      setUpdatingQuantity(false);
    }
  };

  const startEditingQuantity = (item) => {
    setEditingItem(item.product_id);
    setQuantityInput(item.quantity.toString());
  };

  const handleItemSelect = (selectedOption) => {
    if (!selectedOption) return;

    if (
      selectedItems.some((item) => item.product_id === selectedOption.value)
    ) {
      toast.error("This item is already selected");
      return;
    }

    setSelectedItems((prev) => [
      ...prev,
      {
        product_id: selectedOption.value,
        name: selectedOption.label,
        price: selectedOption.price,
        image: selectedOption.image,
        quantity: 1,
      },
    ]);
  };

  const handleItemRemove = (index) => {
    setSelectedItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddItems = async () => {
    if (selectedItems.length === 0) {
      toast.error("Please select at least one item");
      return;
    }

    setAddingItemsLoading(true);
    try {
      for (const item of selectedItems) {
        const response = await axiosInstance.post(`/orders/add-product/${orderId}`, {
          product_id: item.product_id,
          quantity: item.quantity,
        });

        if (!response.data.success) {
          throw new Error(response.data.message || "Failed to add item");
        }
      }

      toast.success("Items added successfully");
      setSelectedItems([]);
      setIsAddingItems(false);
      await refreshOrderData();
    } catch (error) {
      console.error("Error adding items:", error);
      toast.error(error.response?.data?.message || "Failed to add items");
    } finally {
      setAddingItemsLoading(false);
    }
  };

  const loadProducts = async (inputValue) => {
    try {
      const response = await axiosInstance.get('/products', {
        params: {
          search: inputValue,
          limit: 10
        }
      });

      if (response.data.success) {
        return response.data.data.map(product => ({
          value: product.id,
          label: product.name,
          price: product.price,
          image: product.image_paths?.[0],
          quantity: product.quantity
        }));
      }
      return [];
    } catch (error) {
      console.error('Error loading products:', error);
      toast.error('Failed to load products');
      return [];
    }
  };

  return (
    <Card className="modern-card">
      <Card.Header className="bg-light">
        <div className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0 d-flex align-items-center">
            <FaShoppingCart className="me-2" /> Order Items
          </h5>
          <Button
            variant="outline-primary"
            onClick={() => setIsAddingItems(!isAddingItems)}
            className="d-flex align-items-center gap-2 modern-btn"
          >
            {isAddingItems ? <FaTimes /> : <FaPlus />}
            {isAddingItems ? "Cancel" : "Add Items"}
          </Button>
        </div>
      </Card.Header>
      <Card.Body>
        {isAddingItems && (
          <div className="mb-4">
            <Form.Group className="mb-3">
              <Form.Label className="fw-medium">Add Items</Form.Label>
              <Select
                cacheOptions
                defaultOptions
                loadOptions={loadProducts}
                onChange={handleItemSelect}
                placeholder="Search and select items..."
                noOptionsMessage={() => "No items found"}
                loadingMessage={() => "Loading items..."}
                formatOptionLabel={(option) => (
                  <div className="d-flex align-items-center">
                    {option.image && (
                      <img
                        src={option.image}
                        alt={option.label}
                        style={{
                          width: "30px",
                          height: "30px",
                          objectFit: "cover",
                          marginRight: "10px",
                          borderRadius: "4px"
                        }}
                      />
                    )}
                    <div>
                      <div className="fw-medium">{option.label}</div>
                      <small className="text-muted">
                        Price: ৳{parseFloat(option.price).toLocaleString()} |
                        Available: {option.quantity}
                      </small>
                    </div>
                  </div>
                )}
                classNamePrefix="product-select"
                menuPortalTarget={document.body}
                menuPosition="fixed"
                menuPlacement="auto"
              />
            </Form.Group>

            {selectedItems.length > 0 && (
              <div className="mb-3">
                <h6 className="fw-medium mb-3">Selected Items</h6>
                {selectedItems.map((item, index) => (
                  <div key={index} className="border rounded p-3 mb-2">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <div className="d-flex align-items-center">
                        {item.image && (
                          <img
                            src={item.image}
                            alt={item.name}
                            style={{
                              width: "40px",
                              height: "40px",
                              objectFit: "cover",
                              marginRight: "10px",
                              borderRadius: "4px"
                            }}
                          />
                        )}
                        <div>
                          <div className="fw-medium">{item.name}</div>
                          <div className="text-muted">
                            Price: ৳
                            {parseFloat(item.price).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="link"
                        className="text-danger p-0"
                        onClick={() => handleItemRemove(index)}
                      >
                        <FaTrash />
                      </Button>
                    </div>
                    <Row>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="fw-medium">Quantity</Form.Label>
                          <Form.Control
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => {
                              const newItems = [...selectedItems];
                              newItems[index].quantity = parseInt(
                                e.target.value
                              );
                              setSelectedItems(newItems);
                            }}
                            required
                            className="modern-input"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Label className="fw-medium">Subtotal</Form.Label>
                        <div className="form-control bg-light">
                          ৳
                          {(
                            parseFloat(item.price) * item.quantity
                          ).toLocaleString()}
                        </div>
                      </Col>
                    </Row>
                  </div>
                ))}
                <Button
                  variant="primary"
                  onClick={handleAddItems}
                  disabled={addingItemsLoading}
                  className="d-flex align-items-center gap-2 modern-btn"
                >
                  {addingItemsLoading ? (
                    <>
                      <FaSpinner className="spinner-border spinner-border-sm" />{" "}
                      Adding Items...
                    </>
                  ) : (
                    <>
                      <FaPlus /> Add Items to Order
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}

        <div className="table-responsive">
          <Table className="table-hover modern-table align-middle">
            <thead className="bg-light">
              <tr>
                <th>Product</th>
                <th>Price</th>
                <th>Quantity</th>
                <th>Subtotal</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orderItems.map((item) => (
                <tr key={item.product_id}>
                  <td>
                    <div className="d-flex align-items-center">
                      {item.image && (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="rounded me-3"
                          style={{
                            width: "50px",
                            height: "50px",
                            objectFit: "cover",
                          }}
                        />
                      )}
                      <div>
                        <div className="fw-medium mb-1">{item.name}</div>
                        {item.is_bundle === 1 && (
                          <small className="text-muted">
                            Bundle Product
                          </small>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>৳{parseFloat(item.price).toLocaleString()}</td>
                  <td>
                    {editingItem === item.product_id ? (
                      <div className="d-flex align-items-center gap-2">
                        <Form.Control
                          type="number"
                          min="1"
                          value={quantityInput}
                          onChange={(e) =>
                            setQuantityInput(e.target.value)
                          }
                          style={{ width: "80px" }}
                          disabled={updatingQuantity}
                          className="modern-input"
                        />
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() =>
                            handleUpdateQuantity(
                              item.product_id,
                              quantityInput
                            )
                          }
                          disabled={updatingQuantity}
                          className="modern-btn"
                        >
                          {updatingQuantity ? (
                            <FaSpinner className="spin" />
                          ) : (
                            "Save"
                          )}
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setEditingItem(null);
                            setQuantityInput("");
                          }}
                          disabled={updatingQuantity}
                          className="modern-btn"
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <div className="d-flex align-items-center gap-2">
                        <span className="fw-medium">{item.quantity}</span>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => startEditingQuantity(item)}
                          disabled={updatingQuantity || removingItem}
                          className="modern-btn"
                        >
                          <FaEdit />
                        </Button>
                      </div>
                    )}
                  </td>
                  <td className="fw-medium">
                    ৳
                    {(
                      parseFloat(item.price) * parseInt(item.quantity)
                    ).toLocaleString()}
                  </td>
                  <td>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => handleRemoveItem(item.product_id)}
                      disabled={updatingQuantity || removingItem}
                      className="modern-btn"
                    >
                      {removingItem ? (
                        <FaSpinner className="spin" />
                      ) : (
                        <FaTrash />
                      )}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      </Card.Body>
    </Card>
  );
};

export default OrderItems;