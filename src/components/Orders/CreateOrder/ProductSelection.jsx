import React from "react";
import { Card, Form, Table, Button } from "react-bootstrap";
import { FaShoppingCart, FaTrash, FaInfoCircle } from "react-icons/fa";
import Select from "react-select/async";
import { toast } from "react-hot-toast";
import axiosInstance from "../../../config/axios";

const ProductSelection = ({
  selectedProducts,
  setSelectedProducts,
  validationErrors,
  setValidationErrors,
  updateTotals,
}) => {
  const menuPortalTarget = document.body;

  const loadProducts = async (inputValue) => {
    try {
      const response = await axiosInstance.get("/products", {
        params: { search: inputValue },
      });
      if (response.data.success) {
        return response.data.data.map((product) => ({
          value: product.id,
          label: product.name,
          subLabel: product.discountedPrice
            ? `৳${product.discountedPrice.toLocaleString()} (Reg: ৳${
                product.price ? product.price.toLocaleString() : 0
              })`
            : `৳${product.price ? product.price.toLocaleString() : 0}`,
          price: product.discountedPrice || product.price, // Use discounted price if available
          originalPrice: product.price, // Keep original price for reference
          discountedPrice: product.discountedPrice,
          image: product.image || (product.images && product.images[0]), // Handle both image (single) and images (array) structure
          stock: product.stock || 0,
        }));
      }
      return [];
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch products");
      return [];
    }
  };

  const handleProductSelect = (selectedOption) => {
    if (!selectedOption) return;

    const existingProduct = selectedProducts.find(
      (p) => p.product_id === selectedOption.value
    );
    if (existingProduct) {
      setSelectedProducts((prev) =>
        prev.map((p) =>
          p.product_id === selectedOption.value
            ? { ...p, quantity: p.quantity + 1 }
            : p
        )
      );
    } else {
      setSelectedProducts((prev) => [
        ...prev,
        {
          product_id: selectedOption.value,
          quantity: 1,
          name: selectedOption.label,
          price: selectedOption.price,
          originalPrice: selectedOption.originalPrice,
          discountedPrice: selectedOption.discountedPrice,
          image: selectedOption.image,
        },
      ]);
    }
    updateTotals();
    setValidationErrors((prev) => ({ ...prev, products: null }));
  };

  const updateProductQuantity = (productId, quantity) => {
    if (quantity < 1) return;
    setSelectedProducts((prev) =>
      prev.map((p) => (p.product_id === productId ? { ...p, quantity } : p))
    );
    updateTotals();
  };

  const removeProduct = (productId) => {
    setSelectedProducts((prev) =>
      prev.filter((p) => p.product_id !== productId)
    );
    updateTotals();
  };

  const formatOptionLabel = ({ label, subLabel, image }) => (
    <div className="d-flex align-items-center gap-2 w-100">
      {image && (
        <div
          style={{
            width: "40px",
            height: "40px",
            flexShrink: 0,
            borderRadius: "4px",
            overflow: "hidden",
            border: "1px solid #dee2e6",
          }}
        >
          <img
            src={image}
            alt={label}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        </div>
      )}
      <div className="flex-grow-1">
        <div className="fw-medium">{label}</div>
        {subLabel && (
          <div className="small text-muted" style={{ fontSize: "0.875rem" }}>
            {subLabel}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <Card className="modern-card mb-4">
      <Card.Body>
        <h5 className="mb-3 d-flex align-items-center">
          <FaShoppingCart className="me-2" /> Products
        </h5>
        <hr className="mb-4" />
        <Form.Group className="mb-4">
          <Form.Label className="fw-medium">
            Add Products
            <Button variant="link" size="sm" className="p-0 ms-2">
              <FaInfoCircle />
            </Button>
          </Form.Label>
          <Select
            isClearable
            cacheOptions
            defaultOptions
            loadOptions={loadProducts}
            onChange={handleProductSelect}
            placeholder="Search products by name..."
            formatOptionLabel={formatOptionLabel}
            noOptionsMessage={() => "No products found"}
            loadingMessage={() => "Searching products..."}
            classNamePrefix="product-select"
            menuPortalTarget={menuPortalTarget}
            menuPosition="fixed"
            menuPlacement="auto"
          />
          {validationErrors.products && (
            <div className="invalid-feedback d-block">
              {validationErrors.products}
            </div>
          )}
        </Form.Group>

        {selectedProducts.length > 0 && (
          <div className="table-responsive">
            <Table className="table-hover modern-table align-middle">
              <thead className="bg-light">
                <tr>
                  <th style={{ width: "40%" }}>Product</th>
                  <th>Price</th>
                  <th style={{ width: "120px" }}>Quantity</th>
                  <th>Total</th>
                  <th style={{ width: "80px" }}></th>
                </tr>
              </thead>
              <tbody>
                {selectedProducts.map((product) => (
                  <tr key={product.product_id}>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        {product.image && (
                          <img
                            src={product.image}
                            alt={product.name}
                            style={{
                              width: "40px",
                              height: "40px",
                              objectFit: "cover",
                              borderRadius: "4px",
                            }}
                          />
                        )}
                        <div>
                          <div className="fw-medium">{product.name}</div>
                          <div className="text-muted small">
                            {product.discountedPrice ? (
                              <>
                                <span className="text-danger me-2">
                                  ৳{product.discountedPrice}
                                </span>
                                <span className="text-decoration-line-through">
                                  ৳{product.originalPrice}
                                </span>
                              </>
                            ) : (
                              <span>৳{product.price}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      {product.discountedPrice ? (
                        <div className="d-flex flex-column">
                          <span className="text-danger fw-medium">
                            ৳{product.discountedPrice}
                          </span>
                          <span className="text-muted text-decoration-line-through small">
                            ৳{product.originalPrice}
                          </span>
                        </div>
                      ) : (
                        <span>৳{product.price}</span>
                      )}
                    </td>
                    <td>
                      <Form.Control
                        type="number"
                        min="1"
                        value={product.quantity}
                        onChange={(e) =>
                          updateProductQuantity(
                            product.product_id,
                            parseInt(e.target.value)
                          )
                        }
                        className="text-center modern-input"
                      />
                    </td>
                    <td className="fw-medium">
                      ৳{product.price * product.quantity}
                    </td>
                    <td>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => removeProduct(product.product_id)}
                        className="w-100"
                      >
                        <FaTrash />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default ProductSelection;
