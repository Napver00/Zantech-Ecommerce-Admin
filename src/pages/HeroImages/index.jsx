import React, { useState, useEffect } from 'react';
import { FaPlus, FaTrash, FaSpinner, FaTimes, FaSearch } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import axiosInstance from '../../config/axios';
import { Card, Form, Button, Modal, InputGroup, Pagination, Row, Col } from 'react-bootstrap';
import Loading from '../../components/Loading';
import './HeroImages.css';
import usePageTitle from '../../hooks/usePageTitle';
import CommonTable from '../../components/Common/CommonTable';

const HeroImages = () => {
  usePageTitle('Manage Hero Images');
  const [heroImages, setHeroImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [searchParams, setSearchParams] = useState({
    search: '',
    page: 1,
    limit: 10
  });
  const [pagination, setPagination] = useState({
    total: 0,
    current_page: 1,
    per_page: 10,
    last_page: 1,
    from: 0,
    to: 0
  });
  const [isSearching, setIsSearching] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState(null);

  useEffect(() => {
    fetchHeroImages();
  }, [searchParams.page, searchParams.limit]);

  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    const timeoutId = setTimeout(() => {
      if (searchParams.search !== '') {
        setIsSearching(true);
        fetchHeroImages(1);
      }
    }, 500);

    setSearchTimeout(timeoutId);

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [searchParams.search]);

  const fetchHeroImages = async (page = searchParams.page) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: searchParams.limit,
        search: searchParams.search
      };

      const response = await axiosInstance.get('/hero-images', { params });
      if (response.data.success) {
        setHeroImages(response.data.data);
        setPagination(response.data.pagination || {
          total: response.data.data.length,
          current_page: page,
          per_page: searchParams.limit,
          last_page: Math.ceil(response.data.data.length / searchParams.limit),
          from: (page - 1) * searchParams.limit + 1,
          to: Math.min(page * searchParams.limit, response.data.data.length)
        });
      } else {
        throw new Error(response.data.message || 'Failed to fetch hero images');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch hero images');
      setHeroImages([]);
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  };

  const handleSearch = (e) => {
    setSearchParams(prev => ({
      ...prev,
      search: e.target.value,
      page: 1
    }));
  };

  const handleLimitChange = (e) => {
    const limit = parseInt(e.target.value);
    setSearchParams(prev => ({
      ...prev,
      limit,
      page: 1
    }));
  };

  const handlePageChange = (page) => {
    setSearchParams(prev => ({
      ...prev,
      page
    }));
  };

  const renderPagination = () => {
    const items = [];
    const { current_page, last_page } = pagination;
    const maxPages = 5;
    let startPage = Math.max(1, current_page - Math.floor(maxPages / 2));
    let endPage = Math.min(last_page, startPage + maxPages - 1);

    if (endPage - startPage + 1 < maxPages) {
        startPage = Math.max(1, endPage - maxPages + 1);
    }

    items.push(<Pagination.Prev key="prev" onClick={() => handlePageChange(current_page - 1)} disabled={current_page === 1}/>);
    if (startPage > 1) {
        items.push(<Pagination.Item key={1} onClick={() => handlePageChange(1)}>1</Pagination.Item>);
        if (startPage > 2) {
            items.push(<Pagination.Ellipsis key="ellipsis1" disabled/>);
        }
    }
    for (let number = startPage; number <= endPage; number++) {
        items.push(<Pagination.Item key={number} active={number === current_page} onClick={() => handlePageChange(number)}>{number}</Pagination.Item>);
    }
    if (endPage < last_page) {
        if (endPage < last_page - 1) {
            items.push(<Pagination.Ellipsis key="ellipsis2" disabled/>);
        }
        items.push(<Pagination.Item key={last_page} onClick={() => handlePageChange(last_page)}>{last_page}</Pagination.Item>);
    }
    items.push(<Pagination.Next key="next" onClick={() => handlePageChange(current_page + 1)} disabled={current_page === last_page}/>);

    return items;
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) { // 4MB limit
        toast.error('File size should be less than 4MB');
        return;
      }
      if (!['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/svg+xml'].includes(file.type)) {
        toast.error('Invalid file type. Please upload an image file');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.error('Please select an image to upload');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', selectedFile);

      const response = await axiosInstance.post('/hero-images', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        toast.success('Hero image uploaded successfully');
        setShowAddModal(false);
        setSelectedFile(null);
        fetchHeroImages(1);
      } else {
        throw new Error(response.data.message || 'Failed to upload hero image');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to upload hero image');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this hero image?')) {
      try {
        const response = await axiosInstance.delete(`/hero-images/${id}`);
        if (response.data.success) {
          toast.success('Hero image deleted successfully');
          setHeroImages(heroImages.filter(img => img.id !== id));
        } else {
          throw new Error(response.data.message || 'Failed to delete hero image');
        }
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to delete hero image');
      }
    }
  };

  const handleImageClick = (image) => {
    setSelectedImage(image);
    setShowPreviewModal(true);
  };

  const headers = [
    { key: 'id', label: 'ID', render: (row) => `#${row.id}` },
    {
      key: 'path',
      label: 'Image',
      render: (row) => (
        <img
          src={row.path}
          alt={`Hero Image ${row.id}`}
          className="rounded img-thumbnail cursor-pointer"
          style={{ width: '200px', height: '100px', objectFit: 'cover' }}
          onClick={() => handleImageClick(row)}
        />
      ),
    },
    { key: 'created_at', label: 'Created At', render: (row) => new Date(row.created_at).toLocaleString() },
  ];

  const renderActions = (image) => (
    <Button
      variant="outline-danger"
      size="sm"
      onClick={() => handleDelete(image.id)}
      disabled={loading}
      className="delete-btn"
    >
      <FaTrash className="me-1" /> Delete
    </Button>
  );

  if (loading && heroImages.length === 0) {
    return <Loading />;
  }

  return (
    <div className="hero-images-container">
      <Card className="modern-card">
        <Card.Body className="p-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h2 className="page-title mb-1">Hero Section Images</h2>
              <p className="text-muted mb-0">Manage and organize your hero section images</p>
            </div>
            <Button
              variant="primary"
              onClick={() => setShowAddModal(true)}
              className="create-image-btn"
            >
              <FaPlus className="me-2" /> Add Hero Image
            </Button>
          </div>

          <div className="filters-section mb-4">
            <Row className="g-3">
              <Col md={3}>
                <Form.Select
                  value={searchParams.limit}
                  onChange={handleLimitChange}
                  className="limit-select"
                >
                  <option value="5">5 per page</option>
                  <option value="10">10 per page</option>
                  <option value="20">20 per page</option>
                  <option value="50">50 per page</option>
                </Form.Select>
              </Col>
            </Row>
          </div>

          <CommonTable
            headers={headers}
            data={heroImages}
            tableLoading={loading}
            loading={loading}
            renderActions={renderActions}
          />
          
          {pagination.last_page > 1 && (
            <div className="pagination-container mt-4">
              <Pagination className="modern-pagination">
                {renderPagination()}
              </Pagination>
            </div>
          )}
        </Card.Body>
      </Card>

      <Modal
        show={showAddModal}
        onHide={() => setShowAddModal(false)}
        centered
        className="modern-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>Add Hero Image</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleUpload}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Select Image</Form.Label>
              <Form.Control
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                required
                className="modern-file-input"
              />
              <Form.Text className="text-muted">
                Maximum file size: 4MB. Supported formats: JPG, PNG, GIF, SVG
              </Form.Text>
            </Form.Group>
            {selectedFile && (
              <div className="mt-3">
                <p className="mb-2">Preview:</p>
                <img
                  src={URL.createObjectURL(selectedFile)}
                  alt="Preview"
                  className="rounded img-thumbnail"
                  style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'contain' }}
                />
              </div>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => setShowAddModal(false)}
              className="cancel-btn"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={!selectedFile || uploading}
              className="upload-btn"
            >
              {uploading ? (
                <>
                  <FaSpinner className="spinner me-2" />
                  Uploading...
                </>
              ) : (
                'Upload Image'
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <Modal
        show={showPreviewModal}
        onHide={() => setShowPreviewModal(false)}
        centered
        size="lg"
        className="modern-modal image-preview-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>Image Preview</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center p-0">
          {selectedImage && (
            <img
              src={selectedImage.path}
              alt={`Hero Image ${selectedImage.id}`}
              style={{
                maxWidth: '100%',
                maxHeight: '80vh',
                objectFit: 'contain'
              }}
            />
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowPreviewModal(false)}
            className="close-btn"
          >
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default HeroImages;