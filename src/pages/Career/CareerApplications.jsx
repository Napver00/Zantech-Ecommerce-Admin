import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import axiosInstance from '../../config/axios';
import { Card, Button } from 'react-bootstrap';
import Loading from '../../components/Loading';
import usePageTitle from '../../hooks/usePageTitle';
import CommonTable from '../../components/Common/CommonTable';

const CareerApplications = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [applications, setApplications] = useState([]);
    const [careerTitle, setCareerTitle] = useState('');
    const [loading, setLoading] = useState(true);

    usePageTitle(careerTitle ? `Applications for ${careerTitle}` : 'Career Applications');

    useEffect(() => {
        const fetchApplications = async () => {
            try {
                const response = await axiosInstance.get(`/careers/forms/${id}`);
                if (response.data.success) {
                    setApplications(response.data.data.submissions);
                    if (response.data.data.submissions.length > 0) {
                        setCareerTitle(response.data.data.submissions[0].career_title);
                    }
                } else {
                    toast.error('Failed to fetch applications.');
                }
            } catch (error) {
                toast.error('An error occurred while fetching applications.');
            } finally {
                setLoading(false);
            }
        };
        fetchApplications();
    }, [id]);

    const formatDate = (dateString) => {
        const options = {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        };
        return new Date(dateString).toLocaleString('en-US', options).replace(',', ' at');
    };

    const headers = [
        { key: 'id', label: 'ID' },
        { 
            key: 'name', 
            label: 'Name',
            render: (row) => (
                <Link to={`/careers/${row.career_id}/applications/${row.id}`}>{row.name}</Link>
            )
        },
        { key: 'email', label: 'Email' },
        { key: 'phone', label: 'Phone' },
        { key: 'created_at', label: 'Applied At', render: (row) => formatDate(row.created_at) },
    ];

    if (loading) {
        return <Loading />;
    }

    return (
        <div className="categories-container">
            <Card className="modern-card">
                <Card.Header className="bg-light d-flex justify-content-between align-items-center">
                    <h4 className="mb-0">Applications for {careerTitle}</h4>
                    <Button variant="outline-primary" onClick={() => navigate('/careers')}>
                        Back to Careers
                    </Button>
                </Card.Header>
                <Card.Body>
                    <CommonTable
                        headers={headers}
                        data={applications}
                        tableLoading={loading}
                        loading={loading}
                    />
                </Card.Body>
            </Card>
        </div>
    );
};

export default CareerApplications;