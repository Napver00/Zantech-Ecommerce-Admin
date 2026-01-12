import React from 'react';
import { Card, Form, Button } from 'react-bootstrap';
import { FaUser, FaPlus, FaInfoCircle } from 'react-icons/fa';
import Select from 'react-select/async';
import { toast } from 'react-hot-toast';
import axiosInstance from '../../../config/axios';

const CustomerDetails = ({
  isGuest,
  setIsGuest,
  formData,
  setFormData,
  validationErrors,
  setValidationErrors,
  shippingAddresses,
  setShowAddAddressModal,
  fetchShippingAddresses
}) => {
  const menuPortalTarget = document.body;

  const loadUsers = async (inputValue) => {
    try {
      const response = await axiosInstance.get('/clints', {
        params: { search: inputValue }
      });
      if (response.data.success) {
        return response.data.data.map(user => ({
          value: user.id,
          label: user.name,
          subLabel: `${user.email || ''} ${user.phone ? `- ${user.phone}` : ''}`.trim(),
          image: user.avatar || null
        }));
      }
      return [];
    } catch (error){
      toast.error(error.response?.data?.message || 'Failed to fetch users');
      return [];
    }
  };

  const handleUserChange = (selectedOption) => {
    if (selectedOption) {
      setFormData(prev => ({
        ...prev,
        user_id: selectedOption.value,
        shipping_id: null,
        user_name: '',
        address: '',
        userphone: ''
      }));
      setIsGuest(false);
      fetchShippingAddresses(selectedOption.value);
    } else {
      setFormData(prev => ({
        ...prev,
        user_id: null,
        shipping_id: null,
        user_name: '',
        address: '',
        userphone: ''
      }));
    }
    setValidationErrors(prev => ({ 
      ...prev, 
      user_id: null,
      shipping_id: null 
    }));
  };

  const handleShippingAddressChange = (e) => {
    const shippingId = e.target.value ? parseInt(e.target.value) : null;
    setFormData(prev => ({ 
      ...prev, 
      shipping_id: shippingId 
    }));
    setValidationErrors(prev => ({ 
      ...prev, 
      shipping_id: null 
    }));
  };

  const formatOptionLabel = ({ label, subLabel, image }) => (
    <div className="d-flex align-items-center gap-2 w-100">
      {image && (
        <div style={{ 
          width: '40px', 
          height: '40px', 
          flexShrink: 0,
          borderRadius: '4px',
          overflow: 'hidden',
          border: '1px solid #dee2e6'
        }}>
          <img 
            src={image} 
            alt={label} 
            style={{ 
              width: '100%', 
              height: '100%', 
              objectFit: 'cover'
            }} 
          />
        </div>
      )}
      <div className="flex-grow-1">
        <div className="fw-medium">{label}</div>
        {subLabel && (
          <div className="small text-muted" style={{ fontSize: '0.875rem' }}>
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
          <FaUser className="me-2" /> Customer Information
        </h5>
        <hr className="mb-4" />
        <Form.Group className="mb-3">
          <Form.Label className="fw-medium">
            Customer
            <Button variant="link" size="sm" className="p-0 ms-2">
              <FaInfoCircle />
            </Button>
          </Form.Label>
          <div className="d-flex gap-2 align-items-center">
            <div style={{ flex: 1 }}>
              <Select
                isClearable
                cacheOptions
                defaultOptions
                loadOptions={loadUsers}
                onChange={handleUserChange}
                placeholder="Search customer by name, email or phone..."
                isDisabled={isGuest}
                formatOptionLabel={formatOptionLabel}
                className={validationErrors.user_id ? 'is-invalid' : ''}
                noOptionsMessage={() => "No customers found"}
                loadingMessage={() => "Searching customers..."}
                classNamePrefix="customer-select"
                menuPortalTarget={menuPortalTarget}
                menuPosition="fixed"
                menuPlacement="auto"
              />
              {validationErrors.user_id && (
                <div className="invalid-feedback d-block">
                  {validationErrors.user_id}
                </div>
              )}
            </div>
            <Form.Check
              type="checkbox"
              label="Guest Customer"
              checked={isGuest}
              onChange={(e) => {
                setIsGuest(e.target.checked);
                if (e.target.checked) {
                  setFormData(prev => ({
                    ...prev,
                    user_id: null,
                    shipping_id: null
                  }));
                }
              }}
            />
          </div>
        </Form.Group>

        {isGuest && (
          <div className="guest-fields">
            <Form.Group className="mb-3">
              <Form.Label className="fw-medium">Guest Name</Form.Label>
              <Form.Control
                type="text"
                value={formData.user_name}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, user_name: e.target.value }));
                  setValidationErrors(prev => ({ ...prev, user_name: null }));
                }}
                isInvalid={!!validationErrors.user_name}
                placeholder="Enter guest name"
                className="modern-input"
              />
              <Form.Control.Feedback type="invalid">
                {validationErrors.user_name}
              </Form.Control.Feedback>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-medium">Guest Phone</Form.Label>
              <Form.Control
                type="text"
                value={formData.userphone}
                onChange={(e) => setFormData(prev => ({ ...prev, userphone: e.target.value }))}
                placeholder="Enter guest phone number"
                className="modern-input"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-medium">Guest Address</Form.Label>
              <Form.Control
                as="textarea"
                value={formData.address}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, address: e.target.value }));
                  setValidationErrors(prev => ({ ...prev, address: null }));
                }}
                isInvalid={!!validationErrors.address}
                placeholder="Enter complete delivery address"
                rows={3}
                className="modern-input"
              />
              <Form.Control.Feedback type="invalid">
                {validationErrors.address}
              </Form.Control.Feedback>
            </Form.Group>
          </div>
        )}

        {!isGuest && formData.user_id && (
          <Form.Group className="mb-3">
            <Form.Label className="fw-medium">Shipping Address</Form.Label>
            <div className="d-flex align-items-center gap-2">
              <Form.Select
                value={formData.shipping_id || ''}
                onChange={handleShippingAddressChange}
                isInvalid={!!validationErrors.shipping_id}
                className="modern-select"
              >
                <option value="">Select shipping address</option>
                {shippingAddresses.map(address => (
                  <option key={address.id} value={address.id}>
                    {address.f_name} {address.l_name} - {address.address}, {address.city}
                  </option>
                ))}
              </Form.Select>
              <Button variant="outline-primary" onClick={() => setShowAddAddressModal(true)}>
                <FaPlus />
              </Button>
            </div>
            <Form.Control.Feedback type="invalid">
              {validationErrors.shipping_id}
            </Form.Control.Feedback>
          </Form.Group>
        )}
      </Card.Body>
    </Card>
  );
};

export default CustomerDetails;