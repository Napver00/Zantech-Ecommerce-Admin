import React from 'react';
import { Card, Form, Button } from 'react-bootstrap';
import AsyncSelect from 'react-select/async';
import { FaBoxes, FaPlus, FaTimes, FaSearch, FaSpinner, FaBox } from 'react-icons/fa';
import axiosInstance from '../../../config/axios';

const BundleOptions = ({ isBundle, handleBundleToggle, bundleItems, products, handleBundleItemChange, addBundleItem, removeBundleItem }) => {

  const formatProductOption = (product) => ({
    value: product.id,
    label: (
      <div className="product-option">
        <div className="product-option-image-container">
          {product.image_paths && product.image_paths.length > 0 ? (
            <img 
              src={product.image_paths[0]} 
              alt={product.name}
              className="product-option-image"
            />
          ) : (
            <div className="product-option-image-placeholder">
              <FaBox size={14} />
            </div>
          )}
        </div>
        <div className="product-option-details">
          <div className="product-option-name">{product.name}</div>
          <div className="product-option-meta">
            <span className="product-option-price">৳{product.price}</span>
            {product.quantity > 0 ? (
              <span className="product-option-stock in-stock">In Stock: {product.quantity}</span>
            ) : (
              <span className="product-option-stock out-of-stock">Out of Stock</span>
            )}
          </div>
          {product.short_description && (
            <div className="product-option-description">{product.short_description}</div>
          )}
        </div>
      </div>
    ),
    product: product
  });

  const loadProductOptions = async (inputValue, callback) => {
    if (!inputValue) {
      callback([]);
      return;
    }
    try {
      const response = await axiosInstance.get('/products', { params: { search: inputValue } });
      const productsData = response.data.data || [];
      callback(productsData.map(formatProductOption));
    } catch {
      callback([]);
    }
  };
    
  return (
    <Card className="border mb-4">
      <Card.Header className="bg-light bundle-header">
        <div className="bundle-toggle">
          <h5 className="mb-0">Bundle Options</h5>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={isBundle}
              onChange={handleBundleToggle}
            />
            <span className="toggle-slider"></span>
            <span className="toggle-label">{isBundle ? 'This is a bundle' : 'Not a bundle'}</span>
          </label>
        </div>
      </Card.Header>
      
      {isBundle && (
        <Card.Body>
          <p className="info-text">Add products to include in this bundle</p>
          
          <div className="bundle-table">
            <div className="bundle-table-header">
              <div className="bundle-header-item product-col">Product</div>
              <div className="bundle-header-item qty-col">Quantity</div>
              <div className="bundle-header-item price-col">Unit Price</div>
              <div className="bundle-header-item total-col">Total</div>
              <div className="bundle-header-item action-col"></div>
            </div>
            
            {bundleItems.map((item, index) => (
              <div key={index} className="bundle-table-row">
                <div className="bundle-cell product-col">
                  <AsyncSelect
                    cacheOptions
                    defaultOptions={products.map(formatProductOption)}
                    loadOptions={loadProductOptions}
                    value={item.item_id ? formatProductOption(products.find(p => p.id === parseInt(item.item_id))) : null}
                    onChange={(option) => {
                      if (option) {
                        handleBundleItemChange(index, 'item_id', option.value);
                        handleBundleItemChange(index, 'unit_price', option.product.price);
                      } else {
                        handleBundleItemChange(index, 'item_id', '');
                        handleBundleItemChange(index, 'unit_price', 0);
                      }
                    }}
                    placeholder="Type to search products..."
                    isClearable
                    isSearchable
                    className="product-select"
                    classNamePrefix="product-select"
                    required={isBundle}
                    noOptionsMessage={() => (
                      <div className="no-options-message">
                        <FaSearch className="no-options-icon" />
                        <p>No products found</p>
                        <small>Try different keywords or check your spelling</small>
                      </div>
                    )}
                    loadingMessage={() => (
                      <div className="loading-message">
                        <FaSpinner className="fa-spin" />
                        <span>Searching products...</span>
                      </div>
                    )}
                    menuPortalTarget={typeof window !== 'undefined' ? document.body : null}
                    menuPosition="fixed"
                    menuShouldBlockScroll={true}
                    styles={{
                      control: (base, state) => ({
                        ...base,
                        minHeight: '42px',
                        borderColor: state.isFocused ? '#3b82f6' : '#e2e8f0',
                        boxShadow: state.isFocused ? '0 0 0 1px #3b82f6' : 'none',
                        '&:hover': {
                          borderColor: state.isFocused ? '#3b82f6' : '#cbd5e1'
                        },
                        backgroundColor: state.isDisabled ? '#f1f5f9' : 'white',
                        cursor: state.isDisabled ? 'not-allowed' : 'text'
                      }),
                      input: (base) => ({
                        ...base,
                        margin: 0,
                        padding: 0,
                        color: '#1e293b'
                      }),
                      placeholder: (base) => ({
                        ...base,
                        color: '#94a3b8'
                      }),
                      singleValue: (base) => ({
                        ...base,
                        color: '#1e293b'
                      }),
                      menu: (base) => ({
                        ...base,
                        marginTop: '4px',
                        backgroundColor: 'white',
                        borderRadius: '6px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                        zIndex: 9999,
                        overflow: 'hidden'
                      }),
                      menuList: (base) => ({
                        ...base,
                        padding: '4px',
                        maxHeight: '300px'
                      }),
                      option: (base, state) => ({
                        ...base,
                        backgroundColor: state.isFocused ? '#f1f5f9' : 'white',
                        color: '#1e293b',
                        cursor: 'pointer',
                        padding: '8px 12px',
                        borderRadius: '4px',
                        '&:active': {
                          backgroundColor: '#e2e8f0'
                        }
                      }),
                      dropdownIndicator: (base) => ({
                        ...base,
                        padding: '0 8px',
                        color: '#64748b',
                        '&:hover': {
                          color: '#3b82f6'
                        }
                      }),
                      clearIndicator: (base) => ({
                        ...base,
                        padding: '0 8px',
                        color: '#64748b',
                        '&:hover': {
                          color: '#ef4444'
                        }
                      }),
                      loadingIndicator: (base) => ({
                        ...base,
                        color: '#64748b'
                      }),
                      noOptionsMessage: (base) => ({
                        ...base,
                        padding: '16px',
                        textAlign: 'center'
                      }),
                      loadingMessage: (base) => ({
                        ...base,
                        padding: '16px',
                        textAlign: 'center'
                      }),
                      menuPortal: base => ({ ...base, zIndex: 9999 })
                    }}
                    components={{
                      DropdownIndicator: () => (
                        <div className="select-dropdown-icon">
                          <FaSearch />
                        </div>
                      ),
                      LoadingIndicator: () => (
                        <div className="select-loading-icon">
                          <FaSpinner className="fa-spin" />
                        </div>
                      ),
                      ClearIndicator: () => (
                        <div className="select-clear-icon">
                          <FaTimes />
                        </div>
                      )
                    }}
                  />
                </div>
                
                <div className="bundle-cell qty-col">
                  <input
                    type="number"
                    id={`quantity-${index}`}
                    value={item.bundle_quantity}
                    onChange={(e) => handleBundleItemChange(index, 'bundle_quantity', e.target.value)}
                    className="form-control"
                    min="1"
                    required={isBundle}
                  />
                </div>
                
                <div className="bundle-cell price-col">
                  <div className="price-display">
                    <span className="price-icon">৳</span>
                    {item.unit_price.toFixed(2)}
                  </div>
                </div>
                
                <div className="bundle-cell total-col">
                  <div className="price-display total-price">
                    <span className="price-icon">৳</span>
                    {item.total.toFixed(2)}
                  </div>
                </div>
                
                <div className="bundle-cell action-col">
                  <button
                    type="button"
                    className="btn btn-icon btn-danger"
                    onClick={() => removeBundleItem(index)}
                    disabled={bundleItems.length === 1}
                    title="Remove item"
                  >
                    <FaTimes />
                  </button>
                </div>
              </div>
            ))}
            
            <div className="bundle-table-footer">
              <div className="grand-total">
                <span className="grand-total-label">Bundle Total:</span>
                <span className="grand-total-amount">
                  <span className="price-icon">৳</span>
                  {bundleItems.reduce((sum, item) => sum + (item.total || 0), 0).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
          
          <button
            type="button"
            className="btn btn-outline btn-sm add-bundle-btn"
            onClick={addBundleItem}
          >
            <FaPlus /> Add Another Item
          </button>
        </Card.Body>
      )}
    </Card>
  );
};

export default BundleOptions;