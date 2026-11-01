import React from 'react';
import AsyncSelect from 'react-select/async';
import { FaPlus, FaTimes, FaBox } from 'react-icons/fa';
import axiosInstance from '../../../config/axios';

// The products inside a bundle: pick each product and how many.
// items: [{ product: {id, name, price, quantity, image_paths} | null, qty }]

const optionOf = (product) => ({
  value: product.id,
  product,
  label: (
    <div className="product-option">
      <div className="product-option-image-container">
        {product.image_paths?.length ? (
          <img src={product.image_paths[0]} alt="" className="product-option-image" />
        ) : (
          <div className="product-option-image-placeholder"><FaBox size={14} /></div>
        )}
      </div>
      <div className="product-option-details">
        <div className="product-option-name">{product.name}</div>
        <div className="product-option-meta">
          <span className="product-option-price">৳{product.price}</span>
          {product.quantity > 0 ? (
            <span className="product-option-stock in-stock">{product.quantity} in stock</span>
          ) : (
            <span className="product-option-stock out-of-stock">Out of stock</span>
          )}
        </div>
      </div>
    </div>
  ),
});

const selectStyles = {
  control: (base, state) => ({
    ...base,
    minHeight: 42,
    borderColor: state.isFocused ? 'var(--zt-primary)' : 'var(--zt-border)',
    boxShadow: state.isFocused ? '0 0 0 3px var(--zt-primary-soft)' : 'none',
  }),
  menuPortal: (base) => ({ ...base, zIndex: 9999 }),
};

const BundleOptions = ({ items, products, onSelect, onQuantity, onAdd, onRemove }) => {
  const loadOptions = async (inputValue) => {
    if (!inputValue) return products.map(optionOf);
    try {
      const response = await axiosInstance.get('/products', { params: { search: inputValue } });
      return (response.data.data || []).filter((p) => !Number(p.is_bundle)).map(optionOf);
    } catch {
      return [];
    }
  };

  const total = items.reduce((sum, i) => sum + (i.product ? Number(i.product.price) * (Number(i.qty) || 0) : 0), 0);

  return (
    <>
      <div className="bundle-table">
        <div className="bundle-table-header">
          <div className="bundle-header-item product-col">Product</div>
          <div className="bundle-header-item qty-col">How many</div>
          <div className="bundle-header-item price-col">Each</div>
          <div className="bundle-header-item total-col">Total</div>
          <div className="bundle-header-item action-col"><span className="visually-hidden">Remove</span></div>
        </div>

        {items.map((item, index) => {
          const unit = item.product ? Number(item.product.price) : 0;
          return (
            <div key={index} className="bundle-table-row">
              <div className="bundle-cell product-col">
                <AsyncSelect
                  aria-label={`Product ${index + 1}`}
                  cacheOptions
                  defaultOptions={products.map(optionOf)}
                  loadOptions={loadOptions}
                  value={item.product ? optionOf(item.product) : null}
                  onChange={(option) => onSelect(index, option ? option.product : null)}
                  placeholder="Search products…"
                  isClearable
                  noOptionsMessage={() => 'No products found'}
                  menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                  menuPosition="fixed"
                  styles={selectStyles}
                />
              </div>
              <div className="bundle-cell qty-col">
                <input
                  type="number"
                  aria-label={`How many of product ${index + 1}`}
                  value={item.qty}
                  onChange={(e) => onQuantity(index, e.target.value)}
                  className="form-control"
                  min="1"
                />
              </div>
              <div className="bundle-cell price-col">
                <div className="price-display">৳{unit.toLocaleString()}</div>
              </div>
              <div className="bundle-cell total-col">
                <div className="price-display total-price">৳{(unit * (Number(item.qty) || 0)).toLocaleString()}</div>
              </div>
              <div className="bundle-cell action-col">
                <button
                  type="button"
                  className="btn btn-icon btn-outline-danger"
                  onClick={() => onRemove(index)}
                  disabled={items.length === 1}
                  aria-label={`Remove product ${index + 1}`}
                >
                  <FaTimes />
                </button>
              </div>
            </div>
          );
        })}

        <div className="bundle-table-footer">
          <div className="grand-total">
            <span className="grand-total-label">Bought separately</span>
            <span className="grand-total-amount">৳{total.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <button type="button" className="btn btn-outline-primary btn-sm mt-3" onClick={onAdd}>
        <FaPlus className="me-1" /> Add another product
      </button>
    </>
  );
};

export default BundleOptions;
