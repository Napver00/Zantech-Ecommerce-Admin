import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import axiosInstance, { IMAGE_BASE_URL } from '../../config/axios';
import { Card, Button, Row, Col } from 'react-bootstrap';
import Loading from '../../components/Loading';
import usePageTitle from '../../hooks/usePageTitle';
import { FaDownload, FaArrowLeft } from 'react-icons/fa';
import './Career.css';

const ViewApplication = () => {
    const { career_id, application_id } = useParams();
    const navigate = useNavigate();
    const [application, setApplication] = useState(null);
    const [loading, setLoading] = useState(true);

    usePageTitle(application ? `Application from ${application.name}` : 'View Application');

    useEffect(() => {
        const fetchApplication = async () => {
            try {
                const response = await axiosInstance.get(`/careers/forms/${career_id}/${application_id}`);
                if (response.data.success) {
                    setApplication(response.data.data);
                } else {
                    toast.error('Failed to fetch application details.');
                }
            } catch (error) {
                toast.error('An error occurred while fetching the application details.');
            } finally {
                setLoading(false);
            }
        };
        fetchApplication();
    }, [career_id, application_id]);

    if (loading) {
        return <Loading />;
    }

    if (!application) {
        return (
            <div className="categories-container">
                <Card className="modern-card">
                    <Card.Body className="text-center">
                        <p>Application not found.</p>
                        <Button variant="primary" onClick={() => navigate(`/careers/${career_id}/applications`)}>
                            Back to Applications
                        </Button>
                    </Card.Body>
                </Card>
            </div>
        );
    }

    return (
        <div className="categories-container">
            <Card className="modern-card">
                <Card.Header className="bg-light d-flex justify-content-between align-items-center">
                    <h4 className="mb-0">Application from {application.name}</h4>
                    <Button variant="outline-primary" onClick={() => navigate(`/careers/${career_id}/applications`)}>
                        <FaArrowLeft className="me-2" />
                        Back to Applications
                    </Button>
                </Card.Header>
                <Card.Body>
                    <Row>
                        <Col md={4}>
                            <h5>Applicant Details</h5>
                            <p><strong>Name:</strong> {application.name}</p>
                            <p><strong>Email:</strong> {application.email}</p>
                            <p><strong>Phone:</strong> {application.phone}</p>
                            <Button href={`${application.cv_url}`} target="_blank" download>
                                <FaDownload className="me-2" />
                                Download CV
                            </Button>
                        </Col>
                        <Col md={8}>
                            <h5>Cover Letter</h5>
                            <div dangerouslySetInnerHTML={{ __html: application.cover_later }} />
                        </Col>
                    </Row>
                </Card.Body>
            </Card>
        </div>
    );
};

export default ViewApplication;