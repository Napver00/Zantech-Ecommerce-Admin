import React from 'react';
import { Table } from 'react-bootstrap';
import Loading from '../Loading';
import TableRow from './TableRow';
import { MdInbox } from 'react-icons/md';

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
          {/* On phones each row becomes a labelled card (see .table-mobile-stack) */}
          <Table hover className="align-middle modern-table table-mobile-stack">
            <thead className="bg-light">
              <tr>
                {headers.map((header) => (
                  <th key={header.key}>{header.label}</th>
                ))}
                {renderActions && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {data.map((row, index) => (
                <TableRow key={row.id ?? index} row={row} index={index} headers={headers} renderActions={renderActions} />
              ))}
            </tbody>
          </Table>
        </div>
      ) : (
        <div className="empty-state">
          <span className="empty-state-icon"><MdInbox size={26} /></span>
          <p className="empty-state-title">Nothing to show yet</p>
          <p className="empty-state-text">No records match right now. Try clearing the search or filters.</p>
        </div>
      )}
    </div>
  );
};

export default CommonTable;