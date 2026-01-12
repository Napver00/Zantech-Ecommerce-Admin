import React, { useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { FaSave } from 'react-icons/fa';
import axiosInstance from '../../config/axios';
import Loading from '../../components/Loading';
import { Row, Col, Card, Form, Button } from 'react-bootstrap';
import JoditEditor from 'jodit-react';
import usePageTitle from '../../hooks/usePageTitle';
import './Career.css';

const AddCareer = () => {
  usePageTitle('Add New Career');
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    job_title: '',
    description: '',
    vacancy: '',
    job_type: 'Full Time',
    salary: '',
    deadline: '',
    department: '',
    responsibilities: '',
  });
  const editorRef = useRef(null);

  const editorConfig = useMemo(() => ({
    readonly: false,
    placeholder: 'Start typing the responsibilities...',
    height: 400,
  }), []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEditorChange = (newContent) => {
    setFormData(prev => ({
      ...prev,
      responsibilities: newContent
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axiosInstance.post('/careers', formData);
      toast.success('Career added successfully');
      navigate('/careers');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add career');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-career-container">
      <div className="add-career-header">
        <h2>Add New Career</h2>
        <p className="text-muted">Create a new career posting</p>
      </div>

      <form onSubmit={handleSubmit} className="add-career-form">
        <Row>
          <Col lg={12}>
            <Card className="border mb-4">
              <Card.Header className="bg-light">
                <h5 className="mb-0">Job Details</h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Job Title</Form.Label>
                      <Form.Control
                        type="text"
                        name="job_title"
                        value={formData.job_title}
                        onChange={handleInputChange}
                        required
                        placeholder="Enter job title"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Department</Form.Label>
                      <Form.Control
                        type="text"
                        name="department"
                        value={formData.department}
                        onChange={handleInputChange}
                        placeholder="Enter department"
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Form.Group className="mb-3">
                  <Form.Label>Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Enter a brief job description..."
                  />
                </Form.Group>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Vacancy</Form.Label>
                      <Form.Control
                        type="number"
                        name="vacancy"
                        value={formData.vacancy}
                        onChange={handleInputChange}
                        min="1"
                        placeholder="Number of open positions"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Job Type</Form.Label>
                      <Form.Select name="job_type" value={formData.job_type} onChange={handleInputChange}>
                        <option value="Full Time">Full Time</option>
                        <option value="Part Time">Part Time</option>
                        <option value="Contract">Contract</option>
                        <option value="Internship">Internship</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Salary</Form.Label>
                      <Form.Control
                        type="text"
                        name="salary"
                        value={formData.salary}
                        onChange={handleInputChange}
                        placeholder="e.g., 50,000 - 70,000 BDT"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Application Deadline</Form.Label>
                      <Form.Control
                        type="date"
                        name="deadline"
                        value={formData.deadline}
                        onChange={handleInputChange}
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Form.Group className="mb-3">
                  <Form.Label>Responsibilities</Form.Label>
                  <JoditEditor
                    ref={editorRef}
                    value={formData.responsibilities}
                    config={editorConfig}
                    tabIndex={1}
                    onBlur={handleEditorChange}
                  />
                </Form.Group>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <div className="form-actions">
          <button
            type="button"
            className="btn btn-light"
            onClick={() => navigate('/careers')}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary btn-with-icon"
            disabled={loading}
          >
            {loading ? 'Adding...' : <><FaSave /> Save Career</>}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddCareer;