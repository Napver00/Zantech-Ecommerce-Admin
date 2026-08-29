import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { FaPlus, FaEdit, FaTrash, FaSearch, FaSpinner, FaTimes, FaEye } from "react-icons/fa";
import { toast } from "react-hot-toast";
import { Card, Form, InputGroup, Button, Row, Col, Modal, Badge } from "react-bootstrap";
import axiosInstance from "../../config/axios";
import Loading from "../../components/Loading";
import CommonTable from "../../components/Common/CommonTable";
import usePageTitle from "../../hooks/usePageTitle";

const emptyForm = { name: "", school_name: "", parent_phone: "" };

const Students = () => {
  usePageTitle("Students");
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchStudents = useCallback(async (searchVal = "") => {
    setTableLoading(true);
    try {
      const params = {};
      if (searchVal) params.search = searchVal;
      const res = await axiosInstance.get("/students", { params });
      if (!res.data.success) throw new Error(res.data.message);
      const raw = res.data.data;
      setStudents(Array.isArray(raw) ? raw : raw ? [raw] : []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to fetch students");
      setStudents([]);
    } finally {
      setPageLoading(false);
      setTableLoading(false);
      setIsSearching(false);
    }
  }, []);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  useEffect(() => {
    setIsSearching(true);
    const id = setTimeout(() => fetchStudents(search), 450);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const openAddModal = () => {
    setModalMode("add");
    setSelectedStudent(null);
    setFormData(emptyForm);
    setShowModal(true);
  };

  const openEditModal = (student) => {
    setModalMode("edit");
    setSelectedStudent(student);
    setFormData({
      name: student.name || "",
      school_name: student.school_name || "",
      parent_phone: student.parent_phone || "",
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setFormData(emptyForm);
    setSelectedStudent(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return toast.error("Name is required");
    if (!formData.parent_phone.trim()) return toast.error("Parent's phone is required");
    setSaving(true);
    try {
      if (modalMode === "add") {
        await axiosInstance.post("/students", formData);
        toast.success("Student added successfully");
      } else {
        await axiosInstance.put(`/students/${selectedStudent.id}`, formData);
        toast.success("Student updated successfully");
      }
      closeModal();
      fetchStudents(search);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save student");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this student? Their enrollments will be removed, but any invoices already issued to them are kept for audit history.")) return;
    try {
      setTableLoading(true);
      await axiosInstance.delete(`/students/${id}`);
      toast.success("Student deleted");
      fetchStudents(search);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete student");
    } finally {
      setTableLoading(false);
    }
  };

  const headers = [
    { key: "id", label: "ID" },
    {
      key: "name",
      label: "Name",
      render: (row) => (
        <Button variant="link" className="p-0 text-decoration-none fw-medium" onClick={() => navigate(`/students/${row.id}`)}>
          {row.name}
        </Button>
      ),
    },
    { key: "school_name", label: "School", render: (row) => row.school_name || "—" },
    { key: "parent_phone", label: "Parent's Phone" },
    {
      key: "courses",
      label: "Enrolled Courses",
      render: (row) =>
        row.courses?.length ? (
          <div className="d-flex flex-wrap gap-1">
            {row.courses.map((c) => (
              <Badge key={c.id} bg="info" className="fw-normal">{c.title}</Badge>
            ))}
          </div>
        ) : (
          <span className="text-muted">Not enrolled</span>
        ),
    },
  ];

  const renderActions = (student) => (
    <div className="d-flex gap-2">
      <Button variant="outline-secondary" size="sm" onClick={() => navigate(`/students/${student.id}`)} title="View">
        <FaEye />
      </Button>
      <Button variant="outline-primary" size="sm" onClick={() => openEditModal(student)} title="Edit">
        <FaEdit />
      </Button>
      <Button variant="outline-danger" size="sm" onClick={() => handleDelete(student.id)} disabled={tableLoading} title="Delete">
        <FaTrash />
      </Button>
    </div>
  );

  if (pageLoading) return <Loading />;

  return (
    <div className="students-container">
      <Card className="modern-card border-0">
        <Card.Body className="p-4">
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4">
            <div>
              <h4 className="mb-1 fw-bold text-primary">Students</h4>
              <p className="text-muted small mb-0">
                {tableLoading ? "Loading..." : `${students.length} student${students.length !== 1 ? "s" : ""} found`}
              </p>
            </div>
            <Button variant="primary" onClick={openAddModal}>
              <FaPlus className="me-2" /> Add Student
            </Button>
          </div>

          <Row className="mb-4">
            <Col md={4}>
              <InputGroup>
                <InputGroup.Text>{isSearching ? <FaSpinner className="fa-spin" /> : <FaSearch />}</InputGroup.Text>
                <Form.Control
                  placeholder="Search by name, phone or school..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {search && (
                  <Button variant="outline-secondary" onClick={() => setSearch("")}>
                    <FaTimes />
                  </Button>
                )}
              </InputGroup>
            </Col>
          </Row>

          <CommonTable
            headers={headers}
            data={students}
            tableLoading={tableLoading}
            loading={tableLoading}
            renderActions={renderActions}
          />

          <Modal show={showModal} onHide={closeModal} centered>
            <Modal.Header closeButton>
              <Modal.Title>{modalMode === "add" ? "Add New Student" : "Edit Student"}</Modal.Title>
            </Modal.Header>
            <Form onSubmit={handleSubmit}>
              <Modal.Body>
                <Form.Group className="mb-3">
                  <Form.Label>Name <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    value={formData.name}
                    onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                    placeholder="Student's full name"
                    required
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>School</Form.Label>
                  <Form.Control
                    value={formData.school_name}
                    onChange={(e) => setFormData((p) => ({ ...p, school_name: e.target.value }))}
                    placeholder="School name"
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Parent's Phone <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    value={formData.parent_phone}
                    onChange={(e) => setFormData((p) => ({ ...p, parent_phone: e.target.value }))}
                    placeholder="01xxxxxxxxx"
                    required
                  />
                </Form.Group>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="secondary" onClick={closeModal}>Cancel</Button>
                <Button type="submit" variant="primary" disabled={saving}>
                  {saving ? "Saving..." : modalMode === "add" ? "Add Student" : "Update Student"}
                </Button>
              </Modal.Footer>
            </Form>
          </Modal>
        </Card.Body>
      </Card>
    </div>
  );
};

export default Students;
