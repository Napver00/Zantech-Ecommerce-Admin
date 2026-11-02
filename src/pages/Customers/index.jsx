import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPlus, FaChevronRight } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import axiosInstance from '../../config/axios';
import { Form, Button, Modal, Row, Col } from 'react-bootstrap';
import Loading from '../../components/Loading';
import './Customers.css';
import usePageTitle from '../../hooks/usePageTitle';
import CommonTable from '../../components/Common/CommonTable';
import { ListHeader, ListCard, ListToolbar, SearchBox, ResultCount, Pager, Pill } from '../../components/List/List';
import { taka } from '../../components/List/format';

const Customers = () => {
  usePageTitle('Customers');
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    address: "",
  });
  const [searchParams, setSearchParams] = useState({
    search: "",
    page: 1,
    limit: 10,
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

  useEffect(() => {
    fetchCustomers();
  }, [searchParams.page, searchParams.limit]);

  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    const timeoutId = setTimeout(() => {
      setIsSearching(true);
      fetchCustomers(1);
    }, 500);

    setSearchTimeout(timeoutId);

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.search]);

  const fetchCustomers = async (page = searchParams.page) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: searchParams.limit,
        ...(searchParams.search && { search: searchParams.search }),
      };

      const response = await axiosInstance.get("/clints", { params });
      const result = response.data;

      if (!result.success) {
        throw new Error(result.message || "Failed to fetch customers");
      }

      setCustomers(result.data);
      setPagination(
        result.pagination || {
          total_rows: result.data.length,
          current_page: page,
          per_page: searchParams.limit,
          total_pages: Math.ceil(result.data.length / searchParams.limit),
          has_more_pages: result.data.length > page * searchParams.limit,
        }
      );
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch customers");
      setCustomers([]);
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  };

  const handlePageChange = (page) => {
    setSearchParams((prev) => ({
      ...prev,
      page,
    }));
  };

  const handleLimitChange = (e) => {
    const limit = parseInt(e.target.value);
    setSearchParams((prev) => ({
      ...prev,
      limit,
      page: 1,
    }));
  };

  const openAddModal = () => {
    setFormData({ name: "", email: "", phone: "", password: "", address: "" });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setFormData({ name: "", email: "", phone: "", password: "", address: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axiosInstance.post("/users/register", formData);
      if (response.data.success) {
        toast.success(response.data.message || "Customer added successfully");
        closeModal();
        fetchCustomers(1);
      } else {
        throw new Error(response.data.message || "Failed to add customer");
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message ||
        error.response?.data?.errors ?
          Object.values(error.response.data.errors).flat().join(', ') :
          error.message ||
          "Failed to add customer";

      toast.error(errorMessage);

      if (error.response?.status === 422 || error.response?.status === 400) {
        return;
      }

      closeModal();
    }
  };

  const headers = [
    {
      key: 'name',
      label: 'Customer',
      render: (row) => (
        <>
          <span className="ls-cell-main">{row.name}</span>
          <span className="ls-cell-sub">#{row.id}</span>
        </>
      ),
    },
    {
      key: 'phone',
      label: 'Contact',
      render: (row) => (
        <>
          <span className="d-block">{row.phone || '—'}</span>
          <span className="ls-cell-sub text-truncate d-block" style={{ maxWidth: 260 }} title={row.email}>{row.email}</span>
        </>
      ),
    },
    {
      key: 'order_summary.total_spend',
      label: 'Spent',
      align: 'end',
      nowrap: true,
      render: (row) => <span className="ls-money">{taka(row.order_summary?.total_spend)}</span>,
    },
    {
      key: 'payment_summary.due_amount',
      label: 'Owes',
      align: 'end',
      nowrap: true,
      render: (row) =>
        Number(row.payment_summary?.due_amount) > 0
          ? <Pill tone="bad">{taka(row.payment_summary.due_amount)} due</Pill>
          : <span className="ls-cell-sub">Nothing due</span>,
    },
  ];

  const renderActions = () => <FaChevronRight className="text-muted" aria-hidden="true" />;

  if (loading && !customers.length && !searchParams.search) {
    return <Loading />;
  }

  return (
    <div className="customers-container">
      <ListHeader
        title="Customers"
        subtitle="People with a store account. Open one to see their orders and payments."
        actions={<Button onClick={openAddModal}><FaPlus className="me-2" aria-hidden="true" />New customer</Button>}
      />

      <ListCard>
        <ListToolbar end={<ResultCount page={pagination.current_page} perPage={searchParams.limit} total={pagination.total_rows} noun="customers" />}>
          <SearchBox
            value={searchParams.search}
            onChange={(v) => setSearchParams((prev) => ({ ...prev, search: v, page: 1 }))}
            placeholder="Search by name, email or phone"
            busy={isSearching}
          />
        </ListToolbar>

        <CommonTable
          headers={headers}
          data={customers}
          tableLoading={loading}
          loading={loading}
          renderActions={renderActions}
          onRowClick={(row) => navigate(`/customers/${row.id}`)}
          rowLabel={(row) => `Open ${row.name}`}
          emptyTitle={searchParams.search ? 'No customers match' : 'No customers yet'}
          emptyText={searchParams.search ? `Nothing matches “${searchParams.search}”.` : 'Customers appear here when they sign up or you add one.'}
        />

        <Pager
          page={pagination.current_page}
          lastPage={pagination.total_pages}
          onPage={handlePageChange}
          perPage={searchParams.limit}
          onPerPage={(n) => handleLimitChange({ target: { value: n } })}
        />
      </ListCard>

      <Modal show={showModal} onHide={closeModal} centered>
        <Form onSubmit={handleSubmit}>
          <Modal.Header closeButton>
            <Modal.Title as="h2" className="h5 mb-0">New customer</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Group className="mb-3" controlId="cust-name">
              <Form.Label>Full name</Form.Label>
              <Form.Control
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                autoFocus
              />
            </Form.Group>
            <Row className="g-3 mb-3">
              <Col sm={6}>
                <Form.Group controlId="cust-phone">
                  <Form.Label>Phone</Form.Label>
                  <Form.Control
                    type="tel"
                    inputMode="numeric"
                    placeholder="01XXXXXXXXX"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 11) })}
                    required
                    pattern="[0-9]{11}"
                    title="11 digits, for example 01712345678"
                  />
                </Form.Group>
              </Col>
              <Col sm={6}>
                <Form.Group controlId="cust-email">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3" controlId="cust-password">
              <Form.Label>Password</Form.Label>
              <Form.Control
                type="password"
                autoComplete="new-password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                minLength={8}
              />
              <Form.Text>At least 8 characters. Share it with the customer so they can sign in.</Form.Text>
            </Form.Group>
            <Form.Group controlId="cust-address">
              <Form.Label>Address <span className="text-muted fw-normal">(optional)</span></Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" onClick={closeModal}>Cancel</Button>
            <Button type="submit">Add customer</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default Customers;
