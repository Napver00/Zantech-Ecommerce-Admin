import React, { useState, useEffect } from 'react';
import { FaSearch, FaSpinner, FaTimes, FaCalendarAlt } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import axiosInstance from '../../config/axios';
import { Card, Form, InputGroup, Button, Pagination, Row, Col, Table, Modal } from 'react-bootstrap';
import Loading from '../../components/Loading';
import usePageTitle from '../../hooks/usePageTitle';

const ProductBuyingPrice = () => {
    usePageTitle('Product Buying Prices');
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchParams, setSearchParams] = useState({
        search: '',
        page: 1,
        limit: 10,
        date: null,
        startDate: null,
        endDate: null,
    });
    const [pagination, setPagination] = useState({
        total_rows: 0,
        current_page: 1,
        per_page: 10,
        total_pages: 1,
        has_more_pages: false,
    });
    const [searchTimeout, setSearchTimeout] = useState(null);
    const [isSearching, setIsSearching] = useState(false);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [selectedItemHistory, setSelectedItemHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);

    useEffect(() => {
        fetchBuyingPriceItems();
    }, [searchParams.page, searchParams.limit, searchParams.date, searchParams.startDate, searchParams.endDate]);

    useEffect(() => {
        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }

        const timeoutId = setTimeout(() => {
            if (searchParams.search !== '') {
                setIsSearching(true);
                fetchBuyingPriceItems(1);
            }
        }, 500);

        setSearchTimeout(timeoutId);

        return () => {
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
        };
    }, [searchParams.search]);

    const fetchBuyingPriceItems = async (page = searchParams.page) => {
        setLoading(true);
        try {
            const params = {
                page,
                limit: searchParams.limit,
                search: searchParams.search,
                date: searchParams.date,
                start_date: searchParams.startDate,
                end_date: searchParams.endDate,
            };

            const response = await axiosInstance.get('/buying-price-items', { params });
            if (response.data.success) {
                setItems(response.data.data);
                setPagination(response.data.pagination);
            } else {
                toast.error('Failed to fetch buying price items');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'An error occurred');
        } finally {
            setLoading(false);
            setIsSearching(false);
        }
    };

    const fetchItemHistory = async (itemId) => {
        setHistoryLoading(true);
        setShowHistoryModal(true);
        try {
            const response = await axiosInstance.get(`/item-buying-history/${itemId}`);
            if (response.data.success) {
                setSelectedItemHistory(response.data.data);
            } else {
                toast.error('Failed to fetch item history');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'An error occurred');
        } finally {
            setHistoryLoading(false);
        }
    };

    const handleSearch = (e) => {
        setSearchParams(prev => ({ ...prev, search: e.target.value, page: 1 }));
    };

    const handlePageChange = (page) => {
        setSearchParams(prev => ({ ...prev, page }));
    };

    const handleLimitChange = (e) => {
        setSearchParams(prev => ({ ...prev, limit: parseInt(e.target.value), page: 1 }));
    };

    const handleDateChange = (e, type) => {
        const { value } = e.target;
        setSearchParams(prev => ({ ...prev, [type]: value, page: 1 }));
    };
    
    const renderPagination = () => {
        // ... (pagination logic from other components)
    };

    if (loading && items.length === 0) {
        return <Loading />;
    }

    return (
        <div className="orders-container">
            <Card className="modern-card">
                <Card.Body className="p-4">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <div>
                            <h2 className="page-title mb-1">Product Buying Prices</h2>
                            <p className="text-muted mb-0">Latest buying prices from challans</p>
                        </div>
                    </div>

                    <div className="filters-section mb-4">
                        <Row className="g-3">
                            <Col md={4}>
                                <InputGroup className="search-box">
                                    <InputGroup.Text><FaSearch /></InputGroup.Text>
                                    <Form.Control
                                        type="text"
                                        placeholder="Search by item name..."
                                        value={searchParams.search}
                                        onChange={handleSearch}
                                    />
                                    {searchParams.search && (
                                        <Button variant="link" className="clear-search" onClick={() => setSearchParams(prev => ({ ...prev, search: '' }))}>
                                            <FaTimes />
                                        </Button>
                                    )}
                                </InputGroup>
                            </Col>
                            {/* ... (date filters if needed) */}
                        </Row>
                    </div>

                    <div className="table-container">
                        <Table striped bordered hover responsive className="modern-table">
                            <thead>
                                <tr>
                                    <th>Item ID</th>
                                    <th>Item Name</th>
                                    <th>Buying Price</th>
                                    <th>Last Updated</th>
                                    <th>Supplier</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map(item => (
                                    <tr key={item.item_id}>
                                        <td>{item.item_id}</td>
                                        <td>
                                            <Button variant="link" onClick={() => fetchItemHistory(item.item_id)}>
                                                {item.item_name}
                                            </Button>
                                        </td>
                                        <td>৳{item.buying_price.toLocaleString()}</td>
                                        <td>{new Date(item.created_at).toLocaleString()}</td>
                                        <td>{item.supplier_name}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </div>
                    {/* ... (pagination component) */}
                </Card.Body>
            </Card>

            <Modal show={showHistoryModal} onHide={() => setShowHistoryModal(false)} dialogClassName="modal-90w" centered>
                <Modal.Header closeButton>
                    <Modal.Title>Buying History for {selectedItemHistory[0]?.item_name}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {historyLoading ? (
                        <div className="text-center">
                            <FaSpinner className="spinner" />
                            <p>Loading history...</p>
                        </div>
                    ) : (
                        <Table striped bordered hover responsive>
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Supplier</th>
                                    <th>Quantity</th>
                                    <th>Buying Price</th>
                                    <th>Challan ID</th>
                                </tr>
                            </thead>
                            <tbody>
                                {selectedItemHistory.map((historyItem, index) => (
                                    <tr key={index}>
                                        <td>{new Date(historyItem.challan_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                                        <td>{historyItem.supplier_name}</td>
                                        <td>{historyItem.quantity}</td>
                                        <td>৳{historyItem.buying_price.toLocaleString()}</td>
                                        <td>{historyItem.challan_id}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowHistoryModal(false)}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default ProductBuyingPrice;