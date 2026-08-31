import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  FaPlus,
  FaEye,
  FaBan,
  FaSearch,
  FaSpinner,
  FaTimes,
  FaChevronLeft,
  FaChevronRight,
  FaFilePdf,
} from "react-icons/fa";
import { Card, Form, InputGroup, Button, Row, Col, Badge, Pagination } from "react-bootstrap";
import axiosInstance from "../../config/axios";
import CommonTable from "../../components/Common/CommonTable";
import usePageTitle from "../../hooks/usePageTitle";
import CourseInvoiceDocument from "../../components/CourseInvoiceDocument";
import "./CourseInvoices.css";

const STATUS_VARIANT = { due: "warning", partial: "info", paid: "success", void: "secondary" };

const CourseInvoices = () => {
  usePageTitle("Course Invoices");
  const navigate = useNavigate();

  const [invoices, setInvoices] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [search, setSearch] = useState("");
  const [courseId, setCourseId] = useState("");
  const [paymentFor, setPaymentFor] = useState("");
  const [status, setStatus] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    axiosInstance
      .get("/courses")
      .then((res) => setCourses(Array.isArray(res.data.data) ? res.data.data : []))
      .catch(() => {});
  }, []);

  const fetchInvoices = useCallback(
    async (pageNum = 1) => {
      setTableLoading(true);
      try {
        const params = { limit, page: pageNum };
        if (search) params.search = search;
        if (courseId) params.course_id = courseId;
        if (paymentFor) params.payment_for = paymentFor;
        if (status) params.status = status;
        if (startDate) params.start_date = startDate;
        if (endDate) params.end_date = endDate;

        const res = await axiosInstance.get("/course-invoices", { params });
        if (!res.data.success) throw new Error(res.data.message);
        const raw = res.data.data;
        setInvoices(Array.isArray(raw) ? raw : raw ? [raw] : []);
        setPagination(res.data.pagination || null);
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to fetch course invoices");
        setInvoices([]);
      } finally {
        setLoading(false);
        setTableLoading(false);
        setIsSearching(false);
      }
    },
    [search, courseId, paymentFor, status, startDate, endDate, limit]
  );

  // Debounced search text; other filters refetch immediately
  useEffect(() => {
    setIsSearching(true);
    const id = setTimeout(() => {
      setPage(1);
      fetchInvoices(1);
    }, 450);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, courseId, paymentFor, status, startDate, endDate, limit]);

  const handlePageChange = (p) => {
    if (p < 1 || (pagination && p > pagination.total_pages)) return;
    setPage(p);
    fetchInvoices(p);
  };

  const handleLimitChange = (e) => {
    setLimit(parseInt(e.target.value));
  };

  const handleVoid = async (id) => {
    if (
      !window.confirm(
        "Void this invoice? This removes its contribution to revenue reports but keeps it in the database for audit history."
      )
    )
      return;
    try {
      setTableLoading(true);
      await axiosInstance.delete(`/course-invoices/${id}`);
      toast.success("Invoice voided");
      fetchInvoices(page);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to void invoice");
    } finally {
      setTableLoading(false);
    }
  };

  const handlePrint = (invoice) => {
    const printWindow = window.open("", "_blank");
    const content = CourseInvoiceDocument({ invoice });
    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.onload = function () {
      setTimeout(() => printWindow.print(), 500);
    };
  };

  const clearFilters = () => {
    setSearch("");
    setCourseId("");
    setPaymentFor("");
    setStatus("");
    setStartDate("");
    setEndDate("");
  };

  const headers = [
    { key: "invoice_no", label: "Invoice No", render: (row) => <span className="fw-bold">{row.invoice_no || `#${row.id}`}</span> },
    { key: "course", label: "Course", render: (row) => row.course?.title || "—" },
    {
      key: "student",
      label: "Student",
      render: (row) => (
        <div>
          <div>{row.student?.name || row.student_name || "—"}</div>
          {row.student_phone && <div className="small text-muted">{row.student_phone}</div>}
        </div>
      ),
    },
    {
      key: "payment_for",
      label: "For",
      render: (row) => (
        <Badge bg={row.payment_for === "monthly" ? "info" : "secondary"}>
          {row.payment_for === "monthly" ? `Month ${row.month_number}` : "Full"}
        </Badge>
      ),
    },
    { key: "amount", label: "Amount", render: (row) => `৳${Number(row.amount).toLocaleString()}` },
    { key: "discount", label: "Discount", render: (row) => (row.discount ? `৳${Number(row.discount).toLocaleString()}` : "—") },
    { key: "paid_amount", label: "Paid", render: (row) => <span className="text-success">৳{Number(row.paid_amount).toLocaleString()}</span> },
    { key: "due_amount", label: "Due", render: (row) => <span className={Number(row.due_amount) > 0 ? "text-danger" : "text-muted"}>৳{Number(row.due_amount).toLocaleString()}</span> },
    {
      key: "status",
      label: "Status",
      render: (row) => <Badge bg={STATUS_VARIANT[row.status] || "secondary"} style={{ textTransform: "capitalize" }}>{row.status}</Badge>,
    },
    { key: "issue_date", label: "Issue Date", render: (row) => (row.issue_date ? new Date(row.issue_date).toLocaleDateString() : "—") },
  ];

  const renderActions = (invoice) => (
    <div className="d-flex gap-2">
      <Button
        variant="outline-primary"
        size="sm"
        onClick={() => navigate(`/course-invoices/${invoice.id}`)}
        title="View"
      >
        <FaEye />
      </Button>
      <Button
        variant="outline-secondary"
        size="sm"
        onClick={() => handlePrint(invoice)}
        title="Print / PDF"
      >
        <FaFilePdf />
      </Button>
      {invoice.status !== "void" && (
        <Button
          variant="outline-danger"
          size="sm"
          onClick={() => handleVoid(invoice.id)}
          disabled={tableLoading}
          title="Void"
        >
          <FaBan />
        </Button>
      )}
    </div>
  );

  const renderPagination = () => {
    if (!pagination || pagination.total_pages <= 1) return null;
    const items = [];
    const total = pagination.total_pages;
    const current = pagination.current_page;
    const start = Math.max(1, current - 2);
    const end = Math.min(total, start + 4);
    for (let n = start; n <= end; n++) {
      items.push(
        <Pagination.Item key={n} active={n === current} onClick={() => handlePageChange(n)}>
          {n}
        </Pagination.Item>
      );
    }
    return (
      <Pagination className="mb-0 justify-content-end mt-3">
        <Pagination.Prev onClick={() => handlePageChange(current - 1)} disabled={current === 1}>
          <FaChevronLeft size={12} />
        </Pagination.Prev>
        {items}
        <Pagination.Next onClick={() => handlePageChange(current + 1)} disabled={!pagination.has_more_pages}>
          <FaChevronRight size={12} />
        </Pagination.Next>
      </Pagination>
    );
  };

  return (
    <div className="course-invoices-container">
      <Card className="modern-card border-0">
        <Card.Body className="p-4">
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4">
            <div>
              <h4 className="mb-1 fw-bold text-primary">Course Invoices</h4>
              <p className="text-muted small mb-0">
                {loading ? "Loading..." : `${pagination?.total_rows ?? invoices.length} invoice${(pagination?.total_rows ?? invoices.length) !== 1 ? "s" : ""} found`}
              </p>
            </div>
            <Button variant="primary" onClick={() => navigate("/course-invoices/add")}>
              <FaPlus className="me-2" /> New Invoice
            </Button>
          </div>

          <Card className="border filters-card">
            <Card.Body className="py-3">
              <Row className="g-2 align-items-end">
                <Col md={3}>
                  <Form.Label className="small text-muted mb-1">Search</Form.Label>
                  <InputGroup>
                    <InputGroup.Text>{isSearching ? <FaSpinner className="fa-spin" /> : <FaSearch />}</InputGroup.Text>
                    <Form.Control
                      placeholder="Invoice no, student name/phone..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </InputGroup>
                </Col>
                <Col md={3}>
                  <Form.Label className="small text-muted mb-1">Course</Form.Label>
                  <Form.Select value={courseId} onChange={(e) => setCourseId(e.target.value)}>
                    <option value="">All Courses</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </Form.Select>
                </Col>
                <Col md={2}>
                  <Form.Label className="small text-muted mb-1">Type</Form.Label>
                  <Form.Select value={paymentFor} onChange={(e) => setPaymentFor(e.target.value)}>
                    <option value="">All</option>
                    <option value="monthly">Monthly</option>
                    <option value="full">Full</option>
                  </Form.Select>
                </Col>
                <Col md={2}>
                  <Form.Label className="small text-muted mb-1">Status</Form.Label>
                  <Form.Select value={status} onChange={(e) => setStatus(e.target.value)}>
                    <option value="">All</option>
                    <option value="due">Due</option>
                    <option value="partial">Partial</option>
                    <option value="paid">Paid</option>
                    <option value="void">Void</option>
                  </Form.Select>
                </Col>
                <Col md={2}>
                  <Button variant="outline-secondary" className="w-100" onClick={clearFilters}>
                    <FaTimes className="me-1" /> Clear
                  </Button>
                </Col>
              </Row>
              <Row className="g-2 mt-1">
                <Col md={3}>
                  <Form.Label className="small text-muted mb-1">From Date</Form.Label>
                  <Form.Control type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </Col>
                <Col md={3}>
                  <Form.Label className="small text-muted mb-1">To Date</Form.Label>
                  <Form.Control type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </Col>
                <Col md={2}>
                  <Form.Label className="small text-muted mb-1">Per Page</Form.Label>
                  <Form.Select value={limit} onChange={handleLimitChange} className="limit-select">
                    <option value="5">5 per page</option>
                    <option value="10">10 per page</option>
                    <option value="20">20 per page</option>
                    <option value="50">50 per page</option>
                  </Form.Select>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          <CommonTable
            headers={headers}
            data={invoices}
            tableLoading={tableLoading}
            loading={loading}
            renderActions={renderActions}
          />
          {renderPagination()}
        </Card.Body>
      </Card>
    </div>
  );
};

export default CourseInvoices;
