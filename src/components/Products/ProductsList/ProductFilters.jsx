import React from 'react';
import { Row, Col, Form, InputGroup, Button } from 'react-bootstrap';
import { FaSearch, FaSpinner, FaTimes } from 'react-icons/fa';

const ProductFilters = ({ searchParams, handleFilterChange, loading, isSearching, setSearchParams }) => {
  return (
    <div className="filters-section mb-4">
      <Row className="g-3 align-items-center">
        <Col md={4}>
          <Form onSubmit={(e) => e.preventDefault()}>
            <InputGroup className="search-box">
              <InputGroup.Text className="search-icon">
                {isSearching ? (
                  <FaSpinner className="spinner-border spinner-border-sm" />
                ) : (
                  <FaSearch />
                )}
              </InputGroup.Text>
              <Form.Control
                type="text"
                placeholder="Search products..."
                name="search"
                value={searchParams.search}
                onChange={handleFilterChange}
                disabled={loading}
                className={`search-input ${isSearching ? 'searching' : ''}`}
              />
              {searchParams.search && !isSearching && (
                <Button
                  variant="link"
                  className="clear-search"
                  onClick={() => {
                    setSearchParams(prev => ({ ...prev, search: '' }));
                  }}
                  disabled={loading}
                >
                  <FaTimes />
                </Button>
              )}
            </InputGroup>
          </Form>
        </Col>
        <Col md={8} className="d-flex justify-content-end gap-2">
          <Form.Select
            name="limit"
            value={searchParams.limit}
            onChange={handleFilterChange}
            disabled={loading}
            style={{ width: 'auto' }}
            className="limit-select"
          >
            <option value="5">5 per page</option>
            <option value="10">10 per page</option>
            <option value="20">20 per page</option>
            <option value="50">50 per page</option>
          </Form.Select>
        </Col>
      </Row>
    </div>
  );
};

export default ProductFilters;