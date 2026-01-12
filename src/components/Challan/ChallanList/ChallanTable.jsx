import React from 'react';
import { Table, Button } from 'react-bootstrap';
import { FaEye, FaTrash, FaSpinner } from 'react-icons/fa';
import Loading from '../../Loading';

const ChallanTable = ({ challans, tableLoading, loading, handleDeleteChallan, navigate }) => {
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
              {loading ? 'Loading challans...' : 'Updating challans...'}
            </p>
          </div>
        </div>
      )}
      
      {loading && !tableLoading && challans.length === 0 ? (
        <div className="text-center py-5">
          <Loading />
          <p className="text-muted mt-3 mb-0">Loading challans...</p>
        </div>
      ) : challans.length > 0 ? (
        <div className="table-responsive">
          <Table hover className="align-middle modern-table">
            <thead className="bg-light">
              <tr>
                <th>ID</th>
                <th>Date</th>
                <th>Supplier</th>
                <th>Total Items</th>
                <th>Total Amount</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {challans.map((challan) => (
                <tr key={challan.id}>
                  <td data-label="ID">{challan.id}</td>
                  <td data-label="Date">{challan.Date}</td>
                  <td data-label="Supplier">{challan.supplier.name}</td>
                  <td data-label="Total Items">{challan.items_count}</td>
                  <td data-label="Total Amount" className="fw-semibold">
                    ৳{parseFloat(challan.total).toLocaleString()}
                  </td>
                  <td data-label="Actions">
                    <div className="d-flex gap-2">
                      <Button 
                        variant="outline-primary" 
                        size="sm"
                        onClick={() => navigate(`/challans/${challan.id}`)}
                        title="View"
                        disabled={loading}
                        className="view-btn"
                      >
                        <FaEye />
                      </Button>
                      <Button 
                        variant="outline-danger" 
                        size="sm"
                        onClick={() => handleDeleteChallan(challan.id)}
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
          <p className="text-muted mb-0">No challans found</p>
        </div>
      )}
    </div>
  );
};

export default ChallanTable;