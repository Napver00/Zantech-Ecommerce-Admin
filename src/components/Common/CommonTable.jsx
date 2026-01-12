import React from 'react';
import { Table } from 'react-bootstrap';
import Loading from '../Loading';
import TableRow from './TableRow';

const CommonTable = ({ headers, data, tableLoading, loading, renderActions }) => {
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
            backdropFilter: 'blur(2px)',
          }}
        >
          <div className="text-center">
            <Loading />
            <p className="text-muted mt-2 mb-0">
              {loading ? 'Loading...' : 'Updating...'}
            </p>
          </div>
        </div>
      )}

      {loading && !tableLoading && data.length === 0 ? (
        <div className="text-center py-5">
          <Loading />
          <p className="text-muted mt-3 mb-0">Loading data...</p>
        </div>
      ) : data.length > 0 ? (
        <div className="table-responsive">
          <Table hover className="align-middle modern-table">
            <thead className="bg-light">
              <tr>
                {headers.map((header) => (
                  <th key={header.key}>{header.label}</th>
                ))}
                {renderActions && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <TableRow key={row.id} row={row} headers={headers} renderActions={renderActions} />
              ))}
            </tbody>
          </Table>
        </div>
      ) : (
        <div className="text-center py-5">
          <p className="text-muted mb-0">No data found</p>
        </div>
      )}
    </div>
  );
};

export default CommonTable;