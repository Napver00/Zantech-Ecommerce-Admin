import React from 'react';
import { Table, Button, Dropdown } from 'react-bootstrap';
import { FaEye, FaEdit, FaTrash, FaPencilAlt, FaChevronDown, FaSpinner } from 'react-icons/fa';
import Loading from '../../Loading';

const ProductTable = ({ products, tableLoading, loading, statusToggleLoading, handleStatusToggle, handleQuickEdit, handleDeleteProduct, navigate }) => {
  return (
    <div className="table-container position-relative">
      {tableLoading && (
        <div 
          className="position-absolute w-100 h-100 d-flex justify-content-center align-items-center"
          style={{
            top: 0,
            left: 0,
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            zIndex: 1000,
            backdropFilter: 'blur(2px)'
          }}
        >
          <div className="text-center">
            <Loading />
            <p className="text-muted mt-2 mb-0">
              {loading ? 'Loading products...' : 'Updating products...'}
            </p>
          </div>
        </div>
      )}
      
      {loading && !tableLoading && products.length === 0 ? (
        <div className="text-center py-5">
          <Loading />
          <p className="text-muted mt-3 mb-0">Loading products...</p>
        </div>
      ) : products.length > 0 ? (
        <div className="table-responsive">
          <Table hover className="align-middle modern-table">
            <thead className="bg-light">
              <tr>
                <th>ID</th>
                <th>Image</th>
                <th>Name</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td data-label="ID">{product.id}</td>
                  <td data-label="Image">
                    {product.image_paths && product.image_paths.length > 0 ? (
                      <img 
                        src={product.image_paths[0]} 
                        alt={product.name}
                        className="product-image"
                      />
                    ) : (
                      <div className="no-image-placeholder">
                        <span>No image</span>
                      </div>
                    )}
                  </td>
                  <td data-label="Name">
                    <div>
                      <h6 className="mb-0">{product.name}</h6>
                    </div>
                  </td>
                  <td data-label="Price">
                    <div>
                      <span className="fw-semibold">৳{parseFloat(product.price).toLocaleString()}</span>
                      {product.discount > 0 && (
                        <span className="ms-2 text-danger">-{parseFloat(product.discount).toFixed(0)}%</span>
                      )}
                    </div>
                  </td>
                  <td data-label="Stock">
                    <span 
                      className={`px-2 py-1 ${product.quantity > 0 ? 'text-success' : 'text-danger'}`}
                    >
                      {product.quantity > 0 ? `${product.quantity} In Stock` : 'Out of Stock'}
                    </span>
                  </td>
                  <td data-label="Status">
                    <span 
                      className={`px-2 py-1 status-badge ${product.status === "1" ? 'text-success' : 'text-secondary'}`}
                      role="button"
                      onClick={() => handleStatusToggle(product.id)}
                      title="Click to toggle status"
                    >
                      {statusToggleLoading[product.id] ? (
                        <FaSpinner className="spinner-border spinner-border-sm" />
                      ) : (
                        product.status === "1" ? 'Active' : 'Inactive'
                      )}
                    </span>
                  </td>
                  <td data-label="Actions">
                    <div className="d-flex gap-2">
                      <Button 
                        variant="outline-primary" 
                        size="sm"
                        onClick={() => navigate(`/products/${product.id}`)}
                        title="View"
                        disabled={loading}
                        className="view-btn"
                      >
                        <FaEye />
                      </Button>
                      <Dropdown>
                        <Dropdown.Toggle 
                          variant="outline-primary" 
                          size="sm"
                          disabled={loading}
                          className="action-dropdown-toggle"
                        >
                          <FaEdit /> Edit <FaChevronDown size={10} />
                        </Dropdown.Toggle>
                        <Dropdown.Menu className="action-dropdown-menu">
                          <Dropdown.Item 
                            onClick={() => handleQuickEdit(product)}
                            className="action-dropdown-item"
                          >
                            <FaPencilAlt className="me-2" /> Quick Edit
                          </Dropdown.Item>
                          <Dropdown.Item 
                            onClick={() => navigate(`/products/${product.id}`)}
                            className="action-dropdown-item"
                          >
                            <FaEdit className="me-2" /> Full Edit
                          </Dropdown.Item>
                        </Dropdown.Menu>
                      </Dropdown>
                      <Button 
                        variant="outline-danger" 
                        size="sm"
                        onClick={() => handleDeleteProduct(product.id)}
                        title="Delete"
                        disabled={loading}
                        className="delete-btn"
                      >
                        {loading ? <FaSpinner className="spinner-border spinner-border-sm" /> : <FaTrash />}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      ) : (
        <div className="text-center py-5">
          <p className="text-muted mb-0">No products found</p>
        </div>
      )}
    </div>
  );
};

export default ProductTable;