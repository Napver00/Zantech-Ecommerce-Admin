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
                ...(searchParams.search && { search: searchParams.search }),
                ...(searchParams.date && { date: searchParams.date }),
                ...(searchParams.startDate && { start_date: searchParams.startDate }),
                ...(searchParams.endDate && { end_date: searchParams.endDate }),
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

    const handleExactDateChange = (e) => {
        setSearchParams(prev => ({ ...prev, date: e.target.value || null, startDate: null, endDate: null, page: 1 }));
    };

    const handleDateRangeChange = (e, type) => {
        const value = e.target.value || null;

        if (type === 'startDate' && value && searchParams.endDate && value > searchParams.endDate) {
            toast.error('Start date cannot be after end date');
            return;
        }

        if (type === 'endDate' && value && searchParams.startDate && value < searchParams.startDate) {
            toast.error('End date cannot be before start date');
            return;
        }

        setSearchParams(prev => ({ ...prev, [type]: value, date: null, page: 1 }));
    };

    const clearDateFilters = () => {
        setSearchParams(prev => ({ ...prev, date: null, startDate: null, endDate: null, page: 1 }));
    };

    const renderPagination = () => {
        const items = [];
        const { current_page, total_pages } = pagination;
        const maxPages = 5;
        let startPage = Math.max(1, current_page - Math.floor(maxPages / 2));
        let endPage = Math.min(total_pages, startPage + maxPages - 1);

        if (endPage - startPage + 1 < maxPages) {
            startPage = Math.max(1, endPage - maxPages + 1);
        }

        items.push(
            <Pagination.Prev key="prev" onClick={() => handlePageChange(current_page - 1)} disabled={current_page === 1} />
        );

        if (startPage > 1) {
            items.push(<Pagination.Item key={1} onClick={() => handlePageChange(1)}>1</Pagination.Item>);
            if (startPage > 2) {
                items.push(<Pagination.Ellipsis key="ellipsis1" disabled />);
            }
        }

        for (let number = startPage; number <= endPage; number++) {
            items.push(
                <Pagination.Item key={number} active={number === current_page} onClick={() => handlePageChange(number)}>
                    {number}
                </Pagination.Item>
            );
        }

        if (endPage < total_pages) {
            if (endPage < total_pages - 1) {
                items.push(<Pagination.Ellipsis key="ellipsis2" disabled />);
            }
            items.push(<Pagination.Item key={total_pages} onClick={() => handlePageChange(total_pages)}>{total_pages}</Pagination.Item>);
        }

        items.push(
            <Pagination.Next key="next" onClick={() => handlePageChange(current_page + 1)} disabled={current_page === total_pages} />
        );

        return items;
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
                            <Col md={3}>
                                <InputGroup className="search-box">
                                    <InputGroup.Text>
                                        {isSearching ? <FaSpinner className="spinner" /> : <FaSearch />}
                                    </InputGroup.Text>
                                    <Form.Control
                                        type="text"
                                        placeholder="Search by item name..."
                                        value={searchParams.search}
                                        onChange={handleSearch}
                                    />
                                    {searchParams.search && (
                                        <Button
                                            variant="link"
                                            className="clear-search"
                                            onClick={() => {
                                                setSearchParams(prev => ({ ...prev, search: '' }));
                                                fetchBuyingPriceItems(1);
                                            }}
                                        >
                                            <FaTimes />
                                        </Button>
                                    )}
                                </InputGroup>
                            </Col>
                            <Col md={2}>
                                <InputGroup>
                                    <InputGroup.Text><FaCalendarAlt /></InputGroup.Text>
                                    <Form.Control
                                        type="date"
                                        value={searchParams.date || ''}
                                        onChange={handleExactDateChange}
                                        max={new Date().toISOString().split('T')[0]}
                                        placeholder="Exact date"
                                    />
                                </InputGroup>
                            </Col>
                            <Col md={3}>
                                <InputGroup>
                                    <InputGroup.Text><FaCalendarAlt /></InputGroup.Text>
                                    <Form.Control
                                        type="date"
                                        value={searchParams.startDate || ''}
                                        onChange={(e) => handleDateRangeChange(e, 'startDate')}
                                        max={searchParams.endDate || new Date().toISOString().split('T')[0]}
                                        placeholder="Start date"
                                    />
                                    <Form.Control
                                        type="date"
                                        value={searchParams.endDate || ''}
                                        onChange={(e) => handleDateRangeChange(e, 'endDate')}
                                        min={searchParams.startDate || undefined}
                                        max={new Date().toISOString().split('T')[0]}
                                        placeholder="End date"
                                    />
                                </InputGroup>
                            </Col>
                            <Col md={2}>
                                <Form.Select value={searchParams.limit} onChange={handleLimitChange}>
                                    <option value="5">5 per page</option>
                                    <option value="10">10 per page</option>
                                    <option value="20">20 per page</option>
                                    <option value="50">50 per page</option>
                                </Form.Select>
                            </Col>
                            <Col md={2}>
                                {(searchParams.date || searchParams.startDate || searchParams.endDate) && (
                                    <Button variant="outline-secondary" className="w-100" onClick={clearDateFilters}>
                                        <FaTimes className="me-2" /> Clear Dates
                                    </Button>
                                )}
                            </Col>
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
                    {pagination.total_pages > 1 && (
                        <div className="pagination-container mt-4">
                            <Pagination className="modern-pagination">
                                {renderPagination()}
                            </Pagination>
                        </div>
                    )}
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