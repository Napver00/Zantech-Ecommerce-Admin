import React, { useState, useEffect } from "react";
import {
  Form,
  Button,
  Row,
  Col,
  Card,
  Spinner,
  ListGroup,
  InputGroup,
} from "react-bootstrap";
import { toast } from "react-hot-toast";
import axiosInstance from "../../config/axios";
import {
  FaBuilding,
  FaBullhorn,
  FaEnvelope,
  FaFacebook,
  FaGlobe,
  FaInfoCircle,
  FaInstagram,
  FaLinkedin,
  FaLocationArrow,
  FaPhone,
  FaTiktok,
  FaYoutube,
} from "react-icons/fa";
import usePageTitle from "../../hooks/usePageTitle";

const SocialIcon = ({ platform }) => {
  switch (platform.toLowerCase()) {
    case "facebook":
      return <FaFacebook />;
    case "linkedin":
      return <FaLinkedin />;
    case "instagram":
      return <FaInstagram />;
    case "youtube":
      return <FaYoutube />;
    case "tiktok":
      return <FaTiktok />;
    default:
      return <FaGlobe />;
  }
};

const CompanyInfo = () => {
  usePageTitle("Company Information");
  const [companyInfo, setCompanyInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    fetchCompanyInfo();
  }, []);

  const fetchCompanyInfo = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get("/company");
      if (response.data.success) {
        setCompanyInfo(response.data.data);
        setFormData(response.data.data);
      } else {
        toast.error("Failed to fetch company info.");
      }
    } catch (error) {
      toast.error("An error occurred while fetching company info.");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axiosInstance.put("/company/1", formData);
      if (response.data.success) {
        toast.success("Company info updated successfully!");
        setIsEditing(false);
        fetchCompanyInfo();
      } else {
        toast.error("Failed to update company info.");
      }
    } catch (error) {
      toast.error("An error occurred while updating company info.");
    } finally {
      setLoading(false);
    }
  };

  if (loading && !companyInfo) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: "400px" }}
      >
        <div className="text-center">
          <Spinner animation="border" variant="primary" className="mb-2" />
          <p className="text-muted">Loading company details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="tab-content-container">
      <Card className="modern-card border-0">
        <Card.Header className="d-flex justify-content-between align-items-center bg-white border-bottom-0 pb-0 pt-4 px-4">
          <div>
            <h4 className="mb-1 text-primary fw-bold">
              {isEditing
                ? "Edit Company Profile"
                : companyInfo?.name || "Company Information"}
            </h4>
            <p className="text-muted small mb-0">
              Manage your company's public details and contact info
            </p>
          </div>
          {!isEditing && (
            <Button
              variant="primary"
              className="px-4 shadow-sm"
              onClick={() => setIsEditing(true)}
            >
              <FaBullhorn className="me-2" /> Edit Details
            </Button>
          )}
        </Card.Header>
        <Card.Body className="p-4">
          {isEditing ? (
            <Form onSubmit={handleUpdate}>
              <Row>
                <Col lg={6} className="mb-4">
                  <div className="p-3 bg-light rounded-3 h-100">
                    <div className="section-title">
                      <FaBullhorn /> Hero Section
                    </div>
                    <Form.Group className="mb-3">
                      <Form.Label className="small text-muted fw-bold">
                        HERO TITLE
                      </Form.Label>
                      <Form.Control
                        type="text"
                        name="hero_title"
                        value={formData.hero_title}
                        onChange={handleInputChange}
                        placeholder="e.g. Innovating for the Future"
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label className="small text-muted fw-bold">
                        HERO SUBTITLE
                      </Form.Label>
                      <Form.Control
                        type="text"
                        name="hero_subtitle"
                        value={formData.hero_subtitle}
                        onChange={handleInputChange}
                        placeholder="Brief catchy tagline"
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label className="small text-muted fw-bold">
                        HERO DESCRIPTION
                      </Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={4}
                        name="hero_description"
                        value={formData.hero_description}
                        onChange={handleInputChange}
                        style={{ resize: "none" }}
                      />
                    </Form.Group>
                  </div>
                </Col>

                <Col lg={6} className="mb-4">
                  <div className="p-3 bg-light rounded-3 h-100">
                    <div className="section-title">
                      <FaInfoCircle /> About Section
                    </div>
                    <Form.Group className="mb-3">
                      <Form.Label className="small text-muted fw-bold">
                        ABOUT TITLE
                      </Form.Label>
                      <Form.Control
                        type="text"
                        name="about_title"
                        value={formData.about_title}
                        onChange={handleInputChange}
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label className="small text-muted fw-bold">
                        PRIMARY DESCRIPTION
                      </Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        name="about_description1"
                        value={formData.about_description1}
                        onChange={handleInputChange}
                        style={{ resize: "none" }}
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label className="small text-muted fw-bold">
                        SECONDARY DESCRIPTION
                      </Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        name="about_description2"
                        value={formData.about_description2}
                        onChange={handleInputChange}
                        style={{ resize: "none" }}
                      />
                    </Form.Group>
                  </div>
                </Col>

                <Col lg={12} className="mb-4">
                  <div className="p-3 bg-light rounded-3">
                    <div className="section-title">
                      <FaBuilding /> Company Details & Contact
                    </div>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label className="small text-muted fw-bold">
                            COMPANY NAME
                          </Form.Label>
                          <Form.Control
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                          />
                        </Form.Group>
                        <Form.Group className="mb-3">
                          <Form.Label className="small text-muted fw-bold">
                            EMAIL ADDRESS
                          </Form.Label>
                          <Form.Control
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label className="small text-muted fw-bold">
                            PHONE NUMBER
                          </Form.Label>
                          <Form.Control
                            type="text"
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                          />
                        </Form.Group>
                        <Form.Group className="mb-3">
                          <Form.Label className="small text-muted fw-bold">
                            LOCATION
                          </Form.Label>
                          <Form.Control
                            type="text"
                            name="location"
                            value={formData.location}
                            onChange={handleInputChange}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={12}>
                        <Form.Group className="mb-0">
                          <Form.Label className="small text-muted fw-bold">
                            FOOTER TEXT
                          </Form.Label>
                          <Form.Control
                            as="textarea"
                            rows={2}
                            name="footer_text"
                            value={formData.footer_text}
                            onChange={handleInputChange}
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                  </div>
                </Col>
              </Row>

              <div className="d-flex justify-content-end gap-2 mt-3 pt-3 border-top">
                <Button
                  variant="light"
                  className="px-4"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  disabled={loading}
                  className="px-5 shadow-sm"
                >
                  {loading ? (
                    <Spinner as="span" animation="border" size="sm" />
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </Form>
          ) : (
            companyInfo && (
              <>
                <Row className="g-4">
                  <Col lg={7}>
                    <section className="mb-5">
                      <div className="section-title">
                        <FaBullhorn /> Hero Information
                      </div>
                      <div className="ps-2 border-start border-3 border-primary ms-1">
                        <h5 className="fw-bold mb-2">
                          {companyInfo.hero_title}
                        </h5>
                        <h6 className="text-primary mb-3">
                          {companyInfo.hero_subtitle}
                        </h6>
                        <p className="text-secondary">
                          {companyInfo.hero_description}
                        </p>
                      </div>
                    </section>

                    <section className="mb-4">
                      <div className="section-title">
                        <FaInfoCircle /> About Us
                      </div>
                      <div className="bg-light p-4 rounded-3">
                        <h6 className="fw-bold mb-3">
                          {companyInfo.about_title}
                        </h6>
                        <p className="text-secondary mb-3">
                          {companyInfo.about_description1}
                        </p>
                        <p className="text-secondary mb-0">
                          {companyInfo.about_description2}
                        </p>
                      </div>
                    </section>
                  </Col>

                  <Col lg={5}>
                    <section className="mb-4">
                      <div className="section-title">
                        <FaBuilding /> Contact Details
                      </div>
                      <Card className="border-0 shadow-sm bg-light">
                        <Card.Body>
                          <div className="d-flex align-items-center mb-3">
                            <div className="bg-white p-2 rounded-circle shadow-sm me-3 text-primary">
                              <FaEnvelope />
                            </div>
                            <div>
                              <small className="text-muted d-block">
                                Email
                              </small>
                              <span className="fw-medium">
                                {companyInfo.email}
                              </span>
                            </div>
                          </div>
                          <div className="d-flex align-items-center mb-3">
                            <div className="bg-white p-2 rounded-circle shadow-sm me-3 text-primary">
                              <FaPhone />
                            </div>
                            <div>
                              <small className="text-muted d-block">
                                Phone
                              </small>
                              <span className="fw-medium">
                                {companyInfo.phone}
                              </span>
                            </div>
                          </div>
                          <div className="d-flex align-items-center">
                            <div className="bg-white p-2 rounded-circle shadow-sm me-3 text-primary">
                              <FaLocationArrow />
                            </div>
                            <div>
                              <small className="text-muted d-block">
                                Location
                              </small>
                              <span className="fw-medium">
                                {companyInfo.location}
                              </span>
                            </div>
                          </div>
                        </Card.Body>
                      </Card>
                    </section>

                    <section className="mb-4">
                      <div className="section-title">
                        <FaGlobe /> Social Media
                      </div>
                      <ListGroup variant="flush" className="bg-transparent">
                        {companyInfo.social_links.map((link) => (
                          <ListGroup.Item
                            key={link.id}
                            className="social-list-item d-flex align-items-center bg-transparent px-2 py-2 mb-2 rounded border-0"
                          >
                            <div className="text-primary fs-5 me-3">
                              <SocialIcon platform={link.platform} />
                            </div>
                            <a
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-decoration-none text-dark fw-medium stretched-link"
                            >
                              {link.platform}
                            </a>
                            <FaGlobe className="ms-auto text-muted opacity-25" />
                          </ListGroup.Item>
                        ))}
                      </ListGroup>
                    </section>
                  </Col>
                </Row>

                <hr className="my-4 opacity-10" />

                <section>
                  <div className="d-flex align-items-center text-muted">
                    <small className="fw-bold me-2">FOOTER TEXT:</small>
                    <small>{companyInfo.footer_text}</small>
                  </div>
                </section>
              </>
            )
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default CompanyInfo;
