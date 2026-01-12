import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaSpinner,
  FaDownload,
  FaEdit,
  FaSave,
  FaTimes,
  FaPlus,
  FaTrash,
  FaPencilAlt,
  FaUpload,
  FaEye,
} from "react-icons/fa";
import { toast } from "react-hot-toast";
import axiosInstance from "../../config/axios";
import {
  Card,
  Button,
  Row,
  Col,
  Table,
  Image,
  Form,
  Modal,
} from "react-bootstrap";
import Select from "react-select/async";
import Loading from "../../components/Loading";
import "./Challan.css";
import usePageTitle from '../../hooks/usePageTitle';

const ViewChallan = () => {
  usePageTitle('View Challan Details');
  const { id } = useParams();
  const navigate = useNavigate();
  const [challan, setChallan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [formData, setFormData] = useState({
    Date: "",
    delivery_price: "",
    supplier_id: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [isAddingItems, setIsAddingItems] = useState(false);
  const [addingItemsLoading, setAddingItemsLoading] = useState(false);
  const [showQuantityModal, setShowQuantityModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [updatingQuantity, setUpdatingQuantity] = useState(false);
  const [newQuantity, setNewQuantity] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingItem, setDeletingItem] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [uploadingInvoice, setUploadingInvoice] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showDeleteInvoiceModal, setShowDeleteInvoiceModal] = useState(false);
  const [deletingInvoice, setDeletingInvoice] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  useEffect(() => {
    fetchChallan();
    fetchSuppliers();
  }, [id]);

  const fetchSuppliers = async () => {
    try {
      const response = await axiosInstance.get("/suppliers");
      setSuppliers(response.data.data);
    } catch (err) {
      console.error("Failed to fetch suppliers:", err);
      toast.error(err.response?.data?.message || "Failed to fetch suppliers");
    }
  };

  const fetchChallan = async () => {
    try {
      const response = await axiosInstance.get(`/challans/${id}`);
      if (response.data.success) {
        const challanData = response.data.data;
        setChallan(challanData);
        setFormData({
          Date: challanData.Date,
          delivery_price: challanData.delivery_price,
          supplier_id: challanData.supplier.id,
        });
      } else {
        throw new Error(response.data.message || "Failed to fetch challan");
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to fetch challan details"
      );
      navigate("/challans");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({
      Date: challan.Date,
      delivery_price: challan.delivery_price,
      supplier_id: challan.supplier.id,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const response = await axiosInstance.put(`/challans/${id}`, formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.data.success) {
        toast.success("Challan updated successfully");
        setIsEditing(false);
        fetchChallan();
      } else {
        throw new Error(response.data.message || "Failed to update challan");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update challan");
    } finally {
      setSubmitting(false);
    }
  };

  const loadItems = async (inputValue) => {
    try {
      const response = await axiosInstance.get("/products", {
        params: { search: inputValue },
      });
      return response.data.data.map((item) => ({
        value: item.id,
        label: `${item.name} (${item.quantity} in stock)`,
        buying_price: item.buying_price || 0,
      }));
    } catch (err) {
      console.error("Failed to fetch items:", err);
      toast.error(err.response?.data?.message || "Failed to fetch items");
      return [];
    }
  };

  const handleItemSelect = (selectedOption) => {
    if (selectedOption) {
      setSelectedItems((prev) => [
        ...prev,
        {
          id: selectedOption.value,
          name: selectedOption.label,
          buying_price: selectedOption.buying_price,
          quantity: 1,
        },
      ]);
    }
  };

  const handleItemRemove = (index) => {
    setSelectedItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index, field, value) => {
    setSelectedItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const handleAddItems = async () => {
    if (selectedItems.length === 0) {
      toast.error("Please add at least one item");
      return;
    }

    setAddingItemsLoading(true);
    try {
      const itemsData = {
        item_id: selectedItems.map((item) => item.id),
        buying: selectedItems.map((item) => item.buying_price),
        quantity: selectedItems.map((item) => item.quantity),
      };

      const response = await axiosInstance.post(
        `/challans/add-items/${id}`,
        itemsData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.data.success) {
        toast.success("Items added successfully");
        setSelectedItems([]);
        setIsAddingItems(false);
        fetchChallan(); // Refresh challan data
      } else {
        throw new Error(response.data.message || "Failed to add items");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add items");
    } finally {
      setAddingItemsLoading(false);
    }
  };

  const handleUpdateQuantity = async (e) => {
    e.preventDefault();
    if (!selectedItem) return;

    setUpdatingQuantity(true);
    try {
      const response = await axiosInstance.put(
        `/challans/challan-item/update-quantity/${selectedItem.challan_item_id}`,
        { quantity: parseInt(newQuantity) },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.data.success) {
        toast.success("Quantity updated successfully");
        setShowQuantityModal(false);
        fetchChallan(); // Refresh challan data
      } else {
        throw new Error(response.data.message || "Failed to update quantity");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update quantity");
    } finally {
      setUpdatingQuantity(false);
    }
  };

  const openQuantityModal = (item) => {
    setSelectedItem(item);
    setNewQuantity(item.quantity.toString());
    setShowQuantityModal(true);
  };

  const handleDeleteItem = async () => {
    if (!selectedItem) return;

    setDeletingItem(true);
    try {
      const response = await axiosInstance.delete(
        `/challans/challan-item/delete/${selectedItem.challan_item_id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.data.success) {
        toast.success("Item deleted successfully");
        setShowDeleteModal(false);
        fetchChallan(); // Refresh challan data
      } else {
        throw new Error(response.data.message || "Failed to delete item");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete item");
    } finally {
      setDeletingItem(false);
    }
  };

  const openDeleteModal = (item) => {
    setSelectedItem(item);
    setShowDeleteModal(true);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (2MB = 2 * 1024 * 1024 bytes)
      if (file.size > 2 * 1024 * 1024) {
        toast.error("File size should be less than 2MB");
        e.target.value = null;
        return;
      }

      // Check file type
      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "application/pdf",
      ];
      if (!allowedTypes.includes(file.type)) {
        toast.error(
          "Invalid file type. Please upload JPG, JPEG, PNG, or PDF file"
        );
        e.target.value = null;
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleUploadInvoice = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.error("Please select a file");
      return;
    }

    setUploadingInvoice(true);
    try {
      const formData = new FormData();
      formData.append("invoice", selectedFile);

      const response = await axiosInstance.post(
        `/challans/upload-invoice/${id}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.data.success) {
        toast.success("Invoice uploaded successfully");
        setShowInvoiceModal(false);
        setSelectedFile(null);
        fetchChallan(); // Refresh challan data
      } else {
        throw new Error(response.data.message || "Failed to upload invoice");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to upload invoice");
    } finally {
      setUploadingInvoice(false);
    }
  };

  const handleDeleteInvoice = async () => {
    if (!selectedInvoice) return;

    setDeletingInvoice(true);
    try {
      const response = await axiosInstance.delete(
        `/challans/invoices/${selectedInvoice.id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.data.success) {
        toast.success("Invoice deleted successfully");
        setShowDeleteInvoiceModal(false);
        fetchChallan(); // Refresh challan data
      } else {
        throw new Error(response.data.message || "Failed to delete invoice");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete invoice");
    } finally {
      setDeletingInvoice(false);
    }
  };

  const openDeleteInvoiceModal = (invoice) => {
    setSelectedInvoice(invoice);
    setShowDeleteInvoiceModal(true);
  };

  if (loading) {
    return <Loading />;
  }

  if (!challan) {
    return null;
  }

  return (
    <div className="challan-container">
      <Card className="modern-card">
        <Card.Body className="p-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <Button
                variant="link"
                className="p-0 mb-2 text-decoration-none"
                onClick={() => navigate("/challans")}
              >
                <FaArrowLeft className="me-2" /> Back to Challans
              </Button>
              <h2 className="page-title mb-1">
                {isEditing ? "Edit Challan" : "Challan Details"}
              </h2>
              <p className="text-muted mb-0">
                View and manage challan information
              </p>
            </div>
            {!isEditing && (
              <Button
                variant="primary"
                onClick={handleEdit}
                className="create-challan-btn"
              >
                <FaEdit className="me-2" /> Edit Challan
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
                        <Form.Label>
                          Date <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Control
                          type="date"
                          value={formData.Date}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              Date: e.target.value,
                            }))
                          }
                          required
                          className="form-control-lg"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>
                          Delivery Price (৳){" "}
                          <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Control
                          type="number"
                          min="0"
                          step="0.01"
                          value={formData.delivery_price}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              delivery_price: e.target.value,
                            }))
                          }
                          required
                          className="form-control-lg"
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Form.Group className="mb-3">
                    <Form.Label>
                      Supplier <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Select
                      value={formData.supplier_id}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          supplier_id: e.target.value,
                        }))
                      }
                      required
                      className="form-control-lg"
                    >
                      <option value="">Select Supplier</option>
                      {suppliers.map((supplier) => (
                        <option key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>

                  <div className="alert alert-info">
                    <strong>Total Amount:</strong> ৳
                    {parseFloat(challan.total).toLocaleString()}
                  </div>
                </Card.Body>
              </Card>

              <div className="d-flex justify-content-end gap-2">
                <Button
                  variant="secondary"
                  onClick={handleCancel}
                  disabled={submitting}
                  className="px-4"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={submitting}
                  className="px-4"
                >
                  {submitting ? (
                    <>
                      <FaSpinner className="spinner me-2" /> Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </Form>
          ) : (
            <div className="mt-4">
              <Row className="g-4 mb-4">
                <Col md={6}>
                  <Card className="border h-100">
                    <Card.Header className="bg-light">
                      <h5 className="mb-0">Basic Information</h5>
                    </Card.Header>
                    <Card.Body>
                      <div className="mb-4">
                        <label className="detail-label">Challan ID</label>
                        <div className="detail-value">#{challan.id}</div>
                      </div>
                      <div className="mb-4">
                        <label className="detail-label">Date</label>
                        <div className="detail-value">
                          {new Date(challan.Date).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="mb-4">
                        <label className="detail-label">Created By</label>
                        <div className="detail-value">{challan.user.name}</div>
                      </div>
                      <div className="mb-4">
                        <label className="detail-label">Total products Price</label>
                        <div className="detail-value challan-amount">
                          ৳{parseFloat(challan.totalproductprice).toLocaleString()}
                        </div>
                      </div>
                      <div className="mb-4">
                        <label className="detail-label">Delivery Price</label>
                        <div className="detail-value challan-amount">
                          ৳{parseFloat(challan.delivery_price).toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <label className="detail-label">Total Amount</label>
                        <div className="detail-value challan-amount">
                          ৳{parseFloat(challan.total).toLocaleString()}
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6}>
                  <Card className="border h-100">
                    <Card.Header className="bg-light">
                      <h5 className="mb-0">Supplier Information</h5>
                    </Card.Header>
                    <Card.Body>
                      <div className="mb-4">
                        <label className="detail-label">Name</label>
                        <div className="detail-value">
                          {challan.supplier.name}
                        </div>
                      </div>
                      <div className="mb-4">
                        <label className="detail-label">Phone</label>
                        <div className="detail-value">
                          {challan.supplier.phone}
                        </div>
                      </div>
                      <div>
                        <label className="detail-label">Address</label>
                        <div className="detail-value">
                          {challan.supplier.address}
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              <Card className="border mb-4">
                <Card.Header className="bg-light d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">Items</h5>
                  <Button
                    variant="outline-primary"
                    onClick={() => setIsAddingItems(!isAddingItems)}
                    className="d-flex align-items-center gap-2"
                  >
                    {isAddingItems ? <FaTimes /> : <FaPlus />}
                    {isAddingItems ? "Cancel" : "Add Items"}
                  </Button>
                </Card.Header>
                <Card.Body>
                  {isAddingItems && (
                    <div className="mb-4">
                      <Form.Group className="mb-3">
                        <Form.Label>Add Items</Form.Label>
                        <Select
                          cacheOptions
                          defaultOptions
                          loadOptions={loadItems}
                          onChange={handleItemSelect}
                          placeholder="Search and select items..."
                          noOptionsMessage={() => "No items found"}
                          loadingMessage={() => "Loading items..."}
                          className="form-control-lg"
                        />
                      </Form.Group>

                      {selectedItems.length > 0 && (
                        <div className="mb-3">
                          <h6>Selected Items</h6>
                          <div className="selected-items-list">
                            {selectedItems.map((item, index) => (
                              <div key={index} className="selected-item-card">
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                  <strong>{item.name}</strong>
                                  <Button
                                    variant="link"
                                    className="text-danger p-0"
                                    onClick={() => handleItemRemove(index)}
                                  >
                                    <FaTrash />
                                  </Button>
                                </div>
                                <Row>
                                  <Col md={6}>
                                    <Form.Group>
                                      <Form.Label>Buying Price</Form.Label>
                                      <Form.Control
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={item.buying_price}
                                        onChange={(e) =>
                                          handleItemChange(
                                            index,
                                            "buying_price",
                                            parseFloat(e.target.value)
                                          )
                                        }
                                        required
                                        className="form-control-lg"
                                      />
                                    </Form.Group>
                                  </Col>
                                  <Col md={6}>
                                    <Form.Group>
                                      <Form.Label>Quantity</Form.Label>
                                      <Form.Control
                                        type="number"
                                        min="1"
                                        value={item.quantity}
                                        onChange={(e) =>
                                          handleItemChange(
                                            index,
                                            "quantity",
                                            parseInt(e.target.value)
                                          )
                                        }
                                        required
                                        className="form-control-lg"
                                      />
                                    </Form.Group>
                                  </Col>
                                </Row>
                              </div>
                            ))}
                            <Button
                              variant="primary"
                              onClick={handleAddItems}
                              disabled={addingItemsLoading}
                              className="d-flex align-items-center gap-2 mt-3"
                            >
                              {addingItemsLoading ? (
                                <>
                                  <FaSpinner className="spinner me-2" /> Adding
                                  Items...
                                </>
                              ) : (
                                <>
                                  <FaPlus /> Add Items to Challan
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="table-container">
                    <Table responsive hover className="modern-table">
                      <thead>
                        <tr>
                          <th>Item Name</th>
                          <th>Buying Price</th>
                          <th>Quantity</th>
                          <th>Total</th>
                          <th style={{ width: "150px" }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {challan.items.map((item, index) => (
                          <tr key={index}>
                            <td>{item.item_name}</td>
                            <td>
                              ৳
                              {parseFloat(
                                item.buying_price || 0
                              ).toLocaleString()}
                            </td>
                            <td>{item.quantity}</td>
                            <td>
                              ৳
                              {(
                                parseFloat(item.buying_price) *
                                parseInt(item.quantity)
                              ).toLocaleString()}
                            </td>
                            <td>
                              <div className="d-flex gap-2">
                                <Button
                                  variant="outline-primary"
                                  size="sm"
                                  onClick={() => openQuantityModal(item)}
                                  className="view-btn"
                                >
                                  <FaPencilAlt className="me-1" /> Edit
                                </Button>
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  onClick={() => openDeleteModal(item)}
                                  className="delete-btn"
                                >
                                  <FaTrash />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        <tr className="table-secondary fw-bold">
                          <td colSpan="2">
                            <h5 className="mb-0">Total Items (Types)</h5>
                          </td>
                          <td>
                            <h5 className="mb-0">{challan.items.length}</h5>
                          </td>
                          <td colSpan="2">
                            <h5 className="mb-0 challan-amount">
                              ৳
                              {challan.items
                                .reduce(
                                  (sum, item) =>
                                    sum +
                                    parseFloat(item.buying_price || 0) *
                                      parseInt(item.quantity),
                                  0
                                )
                                .toLocaleString()}
                            </h5>
                          </td>
                        </tr>
                      </tbody>
                    </Table>
                  </div>
                </Card.Body>
              </Card>

              <Card className="border">
                <Card.Header className="bg-light d-flex justify-content-between align-items-center">
                  <div>
                    <h5 className="mb-1">Invoices</h5>
                    <p className="text-muted mb-0">
                      {challan.invoices?.length || 0}{" "}
                      {challan.invoices?.length === 1 ? "Invoice" : "Invoices"}{" "}
                      attached
                    </p>
                  </div>
                  <Button
                    variant="primary"
                    onClick={() => setShowInvoiceModal(true)}
                    className="d-flex align-items-center gap-2 px-4"
                  >
                    <FaUpload /> Upload New Invoice
                  </Button>
                </Card.Header>
                <Card.Body>
                  {challan.invoices && challan.invoices.length > 0 ? (
                    <div className="table-container">
                      <Table responsive hover className="modern-table">
                        <thead>
                          <tr>
                            <th style={{ width: "60px" }}>#</th>
                            <th>Preview</th>
                            <th>File Name</th>
                            <th>Type</th>
                            <th>Upload Date</th>
                            <th style={{ width: "200px" }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {challan.invoices.map((invoice, index) => {
                            const fileName = invoice.path.split("/").pop();
                            const fileType = fileName
                              .split(".")
                              .pop()
                              .toUpperCase();
                            const isPDF = fileType === "PDF";

                            return (
                              <tr key={invoice.id}>
                                <td>{index + 1}</td>
                                <td style={{ width: "120px" }}>
                                  {isPDF ? (
                                    <div className="prove-preview-table">
                                      <FaDownload
                                        size={24}
                                        className="text-primary mb-1"
                                      />
                                      <span>PDF Document</span>
                                    </div>
                                  ) : (
                                    <div className="prove-preview-table">
                                      <img
                                        src={invoice.path}
                                        alt={`Invoice ${index + 1}`}
                                        className="prove-image-table"
                                        onClick={() =>
                                          window.open(invoice.path, "_blank")
                                        }
                                      />
                                    </div>
                                  )}
                                </td>
                                <td>
                                  <div className="d-flex flex-column">
                                    <span className="fw-medium">
                                      {fileName}
                                    </span>
                                    <small className="text-muted">
                                      {(
                                        parseInt(fileName.split(".")[0]) /
                                        1024 /
                                        1024
                                      ).toFixed(2)}{" "}
                                      MB
                                    </small>
                                  </div>
                                </td>
                                <td>
                                  <span
                                    className={`badge ${
                                      isPDF ? "bg-danger" : "bg-primary"
                                    }`}
                                  >
                                    {fileType}
                                  </span>
                                </td>
                                <td>
                                  {new Date(
                                    fileName.split(".")[0]
                                  ).toLocaleDateString()}
                                </td>
                                <td>
                                  <div className="d-flex gap-2">
                                    <Button
                                      variant="outline-primary"
                                      size="sm"
                                      href={invoice.path}
                                      target="_blank"
                                      className="view-btn"
                                    >
                                      <FaEye className="me-1" /> View
                                    </Button>
                                    <Button
                                      variant="outline-danger"
                                      size="sm"
                                      onClick={() =>
                                        openDeleteInvoiceModal(invoice)
                                      }
                                      className="delete-btn"
                                    >
                                      <FaTrash />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-5 bg-light rounded">
                      <FaUpload size={48} className="text-muted mb-3" />
                      <h6 className="mb-2">No Invoices Uploaded</h6>
                      <p className="text-muted mb-3">
                        Upload invoices to keep track of your challan documents
                      </p>
                      <Button
                        variant="primary"
                        onClick={() => setShowInvoiceModal(true)}
                        className="d-flex align-items-center gap-2 mx-auto"
                      >
                        <FaUpload /> Upload Invoice
                      </Button>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </div>
          )}

          {/* Quantity Update Modal */}
          <Modal
            show={showQuantityModal}
            onHide={() => setShowQuantityModal(false)}
            centered
          >
            <Modal.Header closeButton>
              <Modal.Title>Update Item Quantity</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {selectedItem && (
                <Form onSubmit={handleUpdateQuantity}>
                  <div className="mb-3">
                    <strong>Item:</strong> {selectedItem.item_name}
                  </div>
                  <div className="mb-3">
                    <strong>Current Quantity:</strong> {selectedItem.quantity}
                  </div>
                  <Form.Group>
                    <Form.Label>New Quantity</Form.Label>
                    <Form.Control
                      type="number"
                      min="1"
                      value={newQuantity}
                      onChange={(e) => setNewQuantity(e.target.value)}
                      required
                    />
                  </Form.Group>
                  <div className="d-flex justify-content-end gap-2 mt-3">
                    <Button
                      variant="secondary"
                      onClick={() => setShowQuantityModal(false)}
                      disabled={updatingQuantity}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={updatingQuantity}
                      className="d-flex align-items-center gap-2"
                    >
                      {updatingQuantity ? (
                        <>
                          <FaSpinner className="spinner-border spinner-border-sm" />{" "}
                          Updating...
                        </>
                      ) : (
                        <>
                          <FaSave /> Update Quantity
                        </>
                      )}
                    </Button>
                  </div>
                </Form>
              )}
            </Modal.Body>
          </Modal>

          {/* Delete Confirmation Modal */}
          <Modal
            show={showDeleteModal}
            onHide={() => setShowDeleteModal(false)}
            centered
          >
            <Modal.Header closeButton>
              <Modal.Title>Delete Item</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {selectedItem && (
                <>
                  <p>Are you sure you want to delete this item?</p>
                  <div className="alert alert-warning">
                    <strong>Item:</strong> {selectedItem.item_name}
                    <br />
                    <strong>Quantity:</strong> {selectedItem.quantity}
                    <br />
                    <strong>Total:</strong> ৳
                    {(
                      parseFloat(selectedItem.buying_price) *
                      parseInt(selectedItem.quantity)
                    ).toLocaleString()}
                  </div>
                  <p className="text-danger">This action cannot be undone.</p>
                </>
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button
                variant="secondary"
                onClick={() => setShowDeleteModal(false)}
                disabled={deletingItem}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleDeleteItem}
                disabled={deletingItem}
                className="d-flex align-items-center gap-2"
              >
                {deletingItem ? (
                  <>
                    <FaSpinner className="spinner-border spinner-border-sm" />{" "}
                    Deleting...
                  </>
                ) : (
                  <>
                    <FaTrash /> Delete Item
                  </>
                )}
              </Button>
            </Modal.Footer>
          </Modal>

          {/* Invoice Upload Modal */}
          <Modal
            show={showInvoiceModal}
            onHide={() => {
              setShowInvoiceModal(false);
              setSelectedFile(null);
            }}
            centered
          >
            <Modal.Header closeButton>
              <Modal.Title>Upload Invoice</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Form onSubmit={handleUploadInvoice}>
                <Form.Group className="mb-3">
                  <Form.Label>Select Invoice File</Form.Label>
                  <Form.Control
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={handleFileSelect}
                    required
                  />
                  <Form.Text className="text-muted">
                    Supported formats: JPG, JPEG, PNG, PDF. Max file size: 2MB
                  </Form.Text>
                </Form.Group>

                {selectedFile && (
                  <div className="alert alert-info">
                    <strong>Selected file:</strong> {selectedFile.name}
                    <br />
                    <strong>Size:</strong>{" "}
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    <br />
                    <strong>Type:</strong> {selectedFile.type}
                  </div>
                )}

                <div className="d-flex justify-content-end gap-2 mt-3">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setShowInvoiceModal(false);
                      setSelectedFile(null);
                    }}
                    disabled={uploadingInvoice}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={uploadingInvoice || !selectedFile}
                    className="d-flex align-items-center gap-2"
                  >
                    {uploadingInvoice ? (
                      <>
                        <FaSpinner className="spinner-border spinner-border-sm" />{" "}
                        Uploading...
                      </>
                    ) : (
                      <>
                        <FaUpload /> Upload Invoice
                      </>
                    )}
                  </Button>
                </div>
              </Form>
            </Modal.Body>
          </Modal>

          {/* Delete Invoice Confirmation Modal */}
          <Modal
            show={showDeleteInvoiceModal}
            onHide={() => setShowDeleteInvoiceModal(false)}
            centered
          >
            <Modal.Header closeButton>
              <Modal.Title>Delete Invoice</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {selectedInvoice && (
                <>
                  <p>Are you sure you want to delete this invoice?</p>
                  <div className="alert alert-warning">
                    <strong>File:</strong>{" "}
                    {selectedInvoice.path.split("/").pop()}
                  </div>
                  <p className="text-danger">This action cannot be undone.</p>
                </>
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button
                variant="secondary"
                onClick={() => setShowDeleteInvoiceModal(false)}
                disabled={deletingInvoice}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleDeleteInvoice}
                disabled={deletingInvoice}
                className="d-flex align-items-center gap-2"
              >
                {deletingInvoice ? (
                  <>
                    <FaSpinner className="spinner-border spinner-border-sm" />{" "}
                    Deleting...
                  </>
                ) : (
                  <>
                    <FaTrash /> Delete Invoice
                  </>
                )}
              </Button>
            </Modal.Footer>
          </Modal>
        </Card.Body>
      </Card>
    </div>
  );
};

export default ViewChallan;
