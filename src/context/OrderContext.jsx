import React, { createContext, useContext, useState, useEffect } from 'react';
import axiosInstance from '../config/axios';

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

  const fetchStatusSummary = async () => {
    try {
      const response = await axiosInstance.get('/orders');
      if (response.data.success && response.data.status_summary) {
        setStatusSummary(response.data.status_summary);
      }
    } catch (error) {
      console.error('Error fetching order status summary:', error);
    }
  };

  // Fetch status summary every 30 seconds
  useEffect(() => {
    fetchStatusSummary();
    const interval = setInterval(fetchStatusSummary, 30000);
    return () => clearInterval(interval);
  }, []);

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