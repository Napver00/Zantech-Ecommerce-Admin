import React, { createContext, useContext, useState, useEffect } from 'react';
import axiosInstance from '../config/axios';
import { canUse } from '../config/access';
import useRole from '../hooks/useRole';

const OrderContext = createContext();

export const useOrderContext = () => {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrderContext must be used within an OrderProvider');
  }
  return context;
};

export const OrderProvider = ({ children }) => {
  const [statusSummary, setStatusSummary] = useState({
    processing: 0,
    completed: 0,
    on_hold: 0,
    cancelled: 0,
    refunded: 0
  });

  const role = useRole();
  const canSeeOrders = canUse(role, 'store');

  const fetchStatusSummary = async () => {
    const token = localStorage.getItem('token');
    if (!token || !canSeeOrders) return;

    try {
      // One row is enough: the counts come back with any page.
      const response = await axiosInstance.get('/orders', { params: { page: 1, limit: 1 } });
      if (response.data.success && response.data.status_summary) {
        setStatusSummary(response.data.status_summary);
      }
    } catch (error) {
      if (error.response?.status !== 401) {
        console.error('Error fetching order status summary:', error);
      }
    }
  };

  // Fetch status summary every 30 seconds (store roles only)
  useEffect(() => {
    if (!canSeeOrders) return undefined;
    fetchStatusSummary();
    const interval = setInterval(fetchStatusSummary, 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canSeeOrders]);

  const value = {
    statusSummary,
    fetchStatusSummary
  };

  return (
    <OrderContext.Provider value={value}>
      {children}
    </OrderContext.Provider>
  );
};

export default OrderContext; 