import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, Button, Row, Col, Form, Table } from "react-bootstrap";
import { FaArrowLeft, FaEye, FaDownload, FaEdit, FaSpinner, FaUpload, FaTimes } from "react-icons/fa";
import { toast } from "react-hot-toast";
import axiosInstance from "../../config/axios";
import Loading from "../../components/Loading";
import "./Expenses.css";
import usePageTitle from '../../hooks/usePageTitle';

const ViewExpense = () => {
  usePageTitle('View Expense Details');
  const { id } = useParams();
  const navigate = useNavigate();
  const [expense, setExpense] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    date: "",
    title: "",
    amount: "",
    description: "",
    proves: []
  });
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [existingProves, setExistingProves] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchExpense();
  }, [id]);

  const fetchExpense = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(`/expenses/${id}`);
      if (response.data.success) {
        setExpense(response.data.data);
        setFormData({
          date: response.data.data.date,
          title: response.data.data.title,
          amount: response.data.data.amount,
          description: response.data.data.description || "",
          proves: []
        });
        setExistingProves(response.data.data.proves || []);
        setSelectedFiles([]);
      } else {
        throw new Error(response.data.message || "Failed to fetch expense");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch expense");
      navigate("/expenses");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(file => {
      if (file.size > 3 * 1024 * 1024) {
        toast.error(`${file.name} is too large. Max size is 3MB`);
        return false;
      }
      if (!['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'].includes(file.type)) {
        toast.error(`${file.name} has invalid file type. Please upload JPG, PNG, or PDF files`);
        return false;
      }
      return true;
    });
    setSelectedFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingProve = async (proveId) => {
    if (window.confirm("Are you sure you want to remove this document?")) {
      try {
        // Make API call to delete the prove
        const response = await axiosInstance.delete(`/expenses/prove/${proveId}`);

        if (response.data.success) {
          toast.success("Document removed successfully");
          // Update state to remove the prove from the list
          setExistingProves(prev => prev.filter(p => p.id !== proveId));
        } else {
          throw new Error(response.data.message || "Failed to remove document");
        }
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to remove document");
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('_method', 'PUT');
      formDataToSend.append('date', formData.date);
      formDataToSend.append('title', formData.title);
      formDataToSend.append('amount', formData.amount);
      formDataToSend.append('description', formData.description);

      selectedFiles.forEach((file) => {
        formDataToSend.append(`proves[]`, file);
      });

      existingProves.forEach((prove) => {
        formDataToSend.append('existing_proves[]', prove.id);
      });

      const response = await axiosInstance.post(`/expenses/${id}`, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        toast.success("Expense updated successfully");
        setIsEditing(false);
        fetchExpense();
      } else {
        throw new Error(response.data.message || "Failed to update expense");
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to update expense";
      toast.error(errorMessage);
      if (error.response?.data?.errors) {
        Object.values(error.response.data.errors).forEach(err => { console.error(err); toast.error(err[0]); });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    if (expense) {
      setFormData({
        date: expense.date,
        title: expense.title,
        amount: expense.amount,
        description: expense.description || "",
        proves: []
      });
      setExistingProves(expense.proves || []);
      setSelectedFiles([]);
    }
  };

  if (loading) {
    return <Loading />;
  }

  if (!expense) {
    return null;
  }

  return (
    <div className="expenses-container">
      <Card className="modern-card">
        <Card.Body className="p-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <Button
                variant="link"
                className="p-0 mb-2 text-decoration-none"
                onClick={() => navigate('/expenses')}
              >
                <FaArrowLeft className="me-2" /> Back to Expenses
              </Button>
              <h2 className="page-title mb-1">{isEditing ? "Edit Expense" : "Expense Details"}</h2>
              <p className="text-muted mb-0">View and manage expense information</p>
            </div>
            {!isEditing && (
              <Button
                variant="primary"
                onClick={() => setIsEditing(true)}
                className="create-expense-btn"
              >
                <FaEdit className="me-2" /> Edit Expense
              </Button>
            )}
          </div>

          {isEditing ? (
            <Form onSubmit={handleSubmit} className="mt-4">
              <Card className="border mb-4">
                <Card.Header className="bg-light">
                  <h5 className="mb-0">Basic Information</h5>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Date <span className="text-danger">*</span></Form.Label>
                        <Form.Control
                          type="date"
                          name="date"
                          value={formData.date}
                          onChange={handleInputChange}
                          required
                          className="form-control-lg"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Amount (৳) <span className="text-danger">*</span></Form.Label>
                        <Form.Control
                          type="number"
                          name="amount"
                          min="0"
                          step="0.01"
                          value={formData.amount}
                          onChange={handleInputChange}
                          required
                          className="form-control-lg"
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Form.Group className="mb-3">
                    <Form.Label>Title <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      required
                      className="form-control-lg"
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Description</Form.Label>
                    <Form.Control
                      as="textarea"
                      name="description"
                      rows={4}
                      value={formData.description}
                      onChange={handleInputChange}
                      className="form-control-lg"
                    />
                  </Form.Group>
                </Card.Body>
              </Card>

              <Card className="border mb-4">
                <Card.Header className="bg-light">
                  <h5 className="mb-0">Proof Documents</h5>
                </Card.Header>
                <Card.Body>
                  <div className="file-upload-container mb-4">
                    <input
                      type="file"
                      id="prove-files"
                      accept=".jpg,.jpeg,.png,.pdf"
                      onChange={handleFileChange}
                      multiple
                      className="d-none"
                    />
                    <label htmlFor="prove-files" className="file-upload-label">
                      <FaUpload className="me-2" /> Choose Files
                    </label>
                    <div className="file-upload-text mt-2">
                      {selectedFiles.length > 0
                        ? `${selectedFiles.length} file(s) selected`
                        : "No new files chosen"}
                    </div>
                    <Form.Text className="text-muted">
                      Max file size: 3MB per file. Allowed formats: JPG, PNG, PDF
                    </Form.Text>
                  </div>

                  {selectedFiles.length > 0 && (
                    <div className="selected-files mb-4">
                      <h6 className="mb-3">New Files</h6>
                      <div className="selected-files-list">
                        {selectedFiles.map((file, index) => (
                          <div key={index} className="selected-file-item">
                            <span className="file-name">{file.name}</span>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => removeFile(index)}
                              className="remove-file-btn"
                            >
                              <FaTimes />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {existingProves.length > 0 && (
                    <div className="existing-proves">
                      <h6 className="mb-3">Existing Documents</h6>
                      <div className="table-container">
                        <Table responsive hover className="modern-table">
                          <thead>
                            <tr>
                              <th style={{ width: '100px' }}>Preview</th>
                              <th>File Name</th>
                              <th style={{ width: '150px' }}>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {existingProves.map((prove) => (
                              <tr key={prove.id}>
                                <td className="text-center">
                                  <div className="prove-preview-table">
                                    {prove.url.match(/\.(jpg|jpeg|png)$/i) ? (
                                      <img 
                                        src={prove.url} 
                                        alt="Proof" 
                                        className="prove-image-table"
                                        onClick={() => window.open(prove.url, '_blank')}
                                      />
                                    ) : (
                                      <div className="prove-file-table">
                                        <FaDownload size={24} />
                                        <span>PDF Document</span>
                                      </div>
                                    )}
                                  </div>
                                </td>
                                <td className="align-middle">
                                  {prove.url.split('/').pop()}
                                </td>
                                <td className="align-middle">
                                  <div className="d-flex gap-2 justify-content-center">
                                    <Button
                                      variant="outline-primary"
                                      size="sm"
                                      href={prove.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="view-btn"
                                    >
                                      <FaEye className="me-1" /> View
                                    </Button>
                                    <Button
                                      variant="outline-danger"
                                      size="sm"
                                      onClick={() => removeExistingProve(prove.id)}
                                      className="delete-btn"
                                    >
                                      <FaTimes />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      </div>
                    </div>
                  )}
                </Card.Body>
              </Card>

              <div className="d-flex justify-content-end gap-2">
                <Button 
                  variant="secondary" 
                  onClick={handleCancelEdit}
                  className="px-4"
                >
                  Cancel
                </Button>
                <Button 
                  variant="primary" 
                  type="submit" 
                  disabled={submitting}
                  className="px-4"
                >
                  {submitting ? (
                    <>
                      <FaSpinner className="spinner me-2" /> Updating...
                    </>
                  ) : (
                    "Update Expense"
                  )}
                </Button>
              </div>
            </Form>
          ) : (
            <div className="mt-4">
              <Card className="border mb-4">
                <Card.Header className="bg-light">
                  <h5 className="mb-0">Basic Information</h5>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={6}>
                      <div className="mb-4">
                        <label className="detail-label">ID</label>
                        <div className="detail-value">#{expense.id}</div>
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className="mb-4">
                        <label className="detail-label">Date</label>
                        <div className="detail-value">
                          {new Date(expense.date).toLocaleDateString()}
                        </div>
                      </div>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={6}>
                      <div className="mb-4">
                        <label className="detail-label">Title</label>
                        <div className="detail-value">{expense.title}</div>
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className="mb-4">
                        <label className="detail-label">Amount</label>
                        <div className="detail-value expense-amount">
                          ৳{parseFloat(expense.amount).toLocaleString()}
                        </div>
                      </div>
                    </Col>
                  </Row>

                  <div className="mb-4">
                    <label className="detail-label">Description</label>
                    <div className="detail-value">
                      {expense.description || "No description provided"}
                    </div>
                  </div>
                </Card.Body>
              </Card>

              {expense.proves && expense.proves.length > 0 && (
                <Card className="border">
                  <Card.Header className="bg-light">
                    <h5 className="mb-0">Proof Documents</h5>
                  </Card.Header>
                  <Card.Body>
                    <div className="table-container">
                      <Table responsive hover className="modern-table">
                        <thead>
                          <tr>
                            <th style={{ width: '100px' }}>Preview</th>
                            <th>File Name</th>
                            <th style={{ width: '150px' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {expense.proves.map((prove) => (
                            <tr key={prove.id}>
                              <td className="text-center">
                                <div className="prove-preview-table">
                                  {prove.url.match(/\.(jpg|jpeg|png)$/i) ? (
                                    <img 
                                      src={prove.url} 
                                      alt="Proof" 
                                      className="prove-image-table"
                                      onClick={() => window.open(prove.url, '_blank')}
                                    />
                                  ) : (
                                    <div className="prove-file-table">
                                      <FaDownload size={24} />
                                      <span>PDF Document</span>
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="align-middle">
                                {prove.url.split('/').pop()}
                              </td>
                              <td className="align-middle">
                                <div className="d-flex gap-2 justify-content-center">
                                  <Button
                                    variant="outline-primary"
                                    size="sm"
                                    href={prove.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="view-btn"
                                  >
                                    <FaEye className="me-1" /> View
                                  </Button>
                                  <Button
                                    variant="outline-secondary"
                                    size="sm"
                                    href={prove.url}
                                    download
                                    className="download-btn"
                                  >
                                    <FaDownload className="me-1" /> Download
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  </Card.Body>
                </Card>
              )}
            </div>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default ViewExpense;
