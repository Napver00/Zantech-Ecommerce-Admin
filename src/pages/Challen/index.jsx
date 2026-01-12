import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPlus, FaSpinner, FaEye, FaTrash } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import axiosInstance from '../../config/axios';
import { Card, Button } from 'react-bootstrap';
import Loading from '../../components/Loading';
import ChallanFilters from '../../components/Challan/ChallanList/ChallanFilters';
import ChallanPagination from '../../components/Challan/ChallanList/ChallanPagination';
import CommonTable from '../../components/Common/CommonTable';
import './Challan.css';
import usePageTitle from '../../hooks/usePageTitle';

const Challan = () => {
  usePageTitle('Manage Challans');
  const [challans, setChallans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    perPage: 10,
    totalPages: 1,
    totalRows: 0,
    hasMorePages: false
  });
  const [searchParams, setSearchParams] = useState({
    search: '',
    limit: 10,
  });
  const [searchTimeout, setSearchTimeout] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        await fetchChallans();
      } finally {
        setPageLoading(false);
      }
    };
    
    loadInitialData();
  }, []);

  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    const timeoutId = setTimeout(() => {
      setIsSearching(true);
      fetchChallans(1);
    }, 500);

    setSearchTimeout(timeoutId);

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [searchParams.search, searchParams.limit]);

  const fetchChallans = async (page = pagination.currentPage) => {
    setLoading(true);
    setTableLoading(true);
    try {
      const params = {
        page,
        limit: searchParams.limit,
        ...(searchParams.search && { search: searchParams.search })
      };

      const response = await axiosInstance.get('/challans', { params });
      const result = response.data;

      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch challans');
      }
      
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setChallans(result.data);
      setPagination({
        currentPage: result.pagination.current_page,
        perPage: result.pagination.per_page,
        totalPages: result.pagination.total_pages,
        totalRows: result.pagination.total_rows,
        hasMorePages: result.pagination.has_more_pages
      });
    } catch (err) {
      console.error('Error fetching challans:', err);
      toast.error(err.response?.data?.message || 'Failed to fetch challans');
    } finally {
      setLoading(false);
      setTableLoading(false);
      setIsSearching(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setSearchParams(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDeleteChallan = async (id) => {
    if (window.confirm('Are you sure you want to delete this challan?')) {
      try {
        setTableLoading(true);
        const response = await axiosInstance.delete(`/challans/${id}`);
        
        if (!response.data.success) {
          throw new Error(response.data.message || 'Failed to delete challan');
        }

        await new Promise(resolve => setTimeout(resolve, 300));
        
        toast.success('Challan deleted successfully');
        
        if (challans.length === 1 && pagination.currentPage > 1) {
          fetchChallans(pagination.currentPage - 1);
        } else {
          fetchChallans(pagination.currentPage);
        }
      } catch (err) {
        console.error('Error deleting challan:', err);
        toast.error(err.response?.data?.message || 'Failed to delete challan');
      } finally {
        setTableLoading(false);
      }
    }
  };

  const handlePageChange = (page) => {
    fetchChallans(page);
  };

  const headers = [
    { key: 'id', label: 'ID' },
    { key: 'Date', label: 'Date' },
    { key: 'supplier.name', label: 'Supplier' },
    { key: 'total', label: 'Total Amount', render: (row) => `৳${parseFloat(row.total).toLocaleString()}` },
  ];

  const renderActions = (challan) => (
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
  );

  if (pageLoading) {
    return <Loading />;
  }

  return (
    <div className="challan-container">
      <Card className="modern-card">
        <Card.Body className="p-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h2 className="page-title mb-1">Challans</h2>
              {loading && tableLoading ? (
                <div className="d-flex align-items-center">
                  <FaSpinner className="spinner-border spinner-border-sm me-2" />
                  <p className="page-subtitle mb-0">Loading challans...</p>
                </div>
              ) : (
                <p className="page-subtitle mb-0">
                  Showing {challans.length} of {pagination.totalRows} challans
                </p>
              )}
            </div>
            <Button 
              variant="primary" 
              onClick={() => navigate('/challans/add')}
              disabled={loading}
              className="create-challan-btn"
            >
              <FaPlus className="me-2" /> Create Challan
            </Button>
          </div>

          <ChallanFilters
            searchParams={searchParams}
            handleFilterChange={handleFilterChange}
            loading={loading}
            isSearching={isSearching}
            setSearchParams={setSearchParams}
          />

          <CommonTable
            headers={headers}
            data={challans}
            tableLoading={tableLoading}
            loading={loading}
            renderActions={renderActions}
          />

          <ChallanPagination
            pagination={pagination}
            tableLoading={tableLoading}
            handlePageChange={handlePageChange}
          />
        </Card.Body>
      </Card>
    </div>
  );
};

export default Challan;