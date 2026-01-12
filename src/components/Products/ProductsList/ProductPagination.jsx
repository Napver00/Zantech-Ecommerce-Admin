import React from 'react';
import { Pagination } from 'react-bootstrap';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import Loading from '../../Loading';

const ProductPagination = ({ pagination, tableLoading, handlePageChange }) => {
  const renderPaginationItems = () => {
    const items = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, pagination.currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(pagination.totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    items.push(
      <Pagination.Prev 
        key="prev" 
        onClick={() => handlePageChange(pagination.currentPage - 1)}
        disabled={pagination.currentPage === 1}
      >
        <FaChevronLeft size={12} />
      </Pagination.Prev>
    );

    if (startPage > 1) {
      items.push(
        <Pagination.Item key={1} onClick={() => handlePageChange(1)}>
          1
        </Pagination.Item>
      );
      if (startPage > 2) {
        items.push(<Pagination.Ellipsis key="ellipsis1" disabled />);
      }
    }

    for (let number = startPage; number <= endPage; number++) {
      items.push(
        <Pagination.Item 
          key={number} 
          active={number === pagination.currentPage}
          onClick={() => handlePageChange(number)}
        >
          {number}
        </Pagination.Item>
      );
    }

    if (endPage < pagination.totalPages) {
      if (endPage < pagination.totalPages - 1) {
        items.push(<Pagination.Ellipsis key="ellipsis2" disabled />);
      }
      items.push(
        <Pagination.Item 
          key={pagination.totalPages} 
          onClick={() => handlePageChange(pagination.totalPages)}
        >
          {pagination.totalPages}
        </Pagination.Item>
      );
    }

    items.push(
      <Pagination.Next 
        key="next" 
        onClick={() => handlePageChange(pagination.currentPage + 1)}
        disabled={!pagination.hasMorePages}
      >
        <FaChevronRight size={12} />
      </Pagination.Next>
    );

    return items;
  };
  
  return (
    pagination.totalPages > 1 && (
      <div className="pagination-container mt-4 position-relative">
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
              <p className="text-muted mt-2 mb-0">Changing page...</p>
            </div>
          </div>
        )}
        <Pagination className="mb-0 modern-pagination">
          {renderPaginationItems()}
        </Pagination>
      </div>
    )
  );
};

export default ProductPagination;