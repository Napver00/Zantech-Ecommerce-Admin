import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { FaSave } from 'react-icons/fa';
import axiosInstance from '../../config/axios';
import Loading from '../../components/Loading';
import BasicInformation from '../../components/Products/AddProduct/BasicInformation';
import Categorization from '../../components/Products/AddProduct/Categorization';
import ImageUpload from '../../components/Products/AddProduct/ImageUpload';
import BundleOptions from '../../components/Products/AddProduct/BundleOptions';
import { Row, Col } from 'react-bootstrap';
import usePageTitle from '../../hooks/usePageTitle';
import './AddProduct.css';

const AddProduct = () => {
  usePageTitle('Add New Product');
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [isBundle, setIsBundle] = useState(false);
  const [bundleItems, setBundleItems] = useState([
    { item_id: '', bundle_quantity: 1, unit_price: 0, name: '', total: 0 }
  ]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    short_description: '',
    quantity: '',
    price: '',
    discount: '',
    categories: [],
    tags: [],
    images: [],
    is_bundle: 0,
    bundls_item: []
  });
  const [imagePreview, setImagePreview] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [imageError, setImageError] = useState('');
  const editorRef = useRef(null);

  const editorConfig = useMemo(() => ({
    readonly: false,
    placeholder: 'Start typing your product description...',
    height: 400,
    toolbar: true,
    spellcheck: true,
    language: 'en',
    toolbarButtonSize: 'medium',
    buttons: [
      'source', '|',
      'bold', 'italic', 'underline', 'strikethrough', '|',
      'font', 'fontsize', 'brush', 'paragraph', '|',
      'image', 'table', 'link', '|',
      'align', '|',
      'ul', 'ol', '|',
      'symbol', 'fullsize', 'print', 'about'
    ],
    uploader: {
      insertImageAsBase64URI: true
    },
    removeButtons: ['about'],
    showCharsCounter: true,
    showWordsCounter: true,
    showXPathInStatusbar: false
  }), []);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        await Promise.all([fetchCategories(), fetchProducts()]);
      } finally {
        setPageLoading(false);
      }
    };
    
    loadInitialData();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axiosInstance.get('/categories');
      setCategories(response.data.data || []);
    } catch {
      toast.error('Failed to fetch categories');
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await axiosInstance.get('/except-bundles');
      setProducts(response.data.data || []);
    } catch {
      toast.error('Failed to fetch products');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateImage = (file) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif'];
    const maxSize = 4 * 1024 * 1024; // 4MB in bytes

    if (!validTypes.includes(file.type)) {
      return 'Invalid file type. Only JPEG, PNG, JPG, and GIF are allowed.';
    }

    if (file.size > maxSize) {
      return 'File size too large. Maximum size is 4MB.';
    }

    return null;
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setImageError('');
    
    const errors = files.map(file => validateImage(file)).filter(error => error);
    if (errors.length > 0) {
      setImageError(errors[0]);
      return;
    }

    const previews = files.map(file => URL.createObjectURL(file));
    setImagePreview(prev => [...prev, ...previews]);
    
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...files]
    }));
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    setImageError('');

    const files = Array.from(e.dataTransfer.files);
    
    const errors = files.map(file => validateImage(file)).filter(error => error);
    if (errors.length > 0) {
      setImageError(errors[0]);
      return;
    }

    const previews = files.map(file => URL.createObjectURL(file));
    setImagePreview(prev => [...prev, ...previews]);
    
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...files]
    }));
  };

  const removeImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
    
    URL.revokeObjectURL(imagePreview[index]);
    setImagePreview(prev => prev.filter((_, i) => i !== index));
  };

  useEffect(() => {
    return () => {
      imagePreview.forEach(url => URL.revokeObjectURL(url));
    };
  }, [imagePreview]);

  const handleBundleToggle = (e) => {
    const bundleValue = e.target.checked ? 1 : 0;
    setIsBundle(e.target.checked);
    setFormData(prev => ({
      ...prev,
      is_bundle: bundleValue
    }));
  };

  const handleBundleItemChange = (index, field, value) => {
    const updatedBundleItems = [...bundleItems];
    updatedBundleItems[index][field] = value;
    
    if (field === 'item_id' && value) {
      const selectedProduct = products.find(product => product.id.toString() === value);
      if (selectedProduct) {
        updatedBundleItems[index].name = selectedProduct.name;
        updatedBundleItems[index].unit_price = parseFloat(selectedProduct.price) || 0;
      } else {
        updatedBundleItems[index].name = '';
        updatedBundleItems[index].unit_price = 0;
      }
    }
    
    const quantity = field === 'bundle_quantity' ? parseFloat(value) || 0 : parseFloat(updatedBundleItems[index].bundle_quantity) || 0;
    const unitPrice = parseFloat(updatedBundleItems[index].unit_price) || 0;
    updatedBundleItems[index].total = quantity * unitPrice;
    
    setBundleItems(updatedBundleItems);
    
    setFormData(prev => ({
      ...prev,
      bundls_item: updatedBundleItems
    }));
  };

  const addBundleItem = () => {
    setBundleItems([...bundleItems, { item_id: '', bundle_quantity: 1, unit_price: 0, name: '', total: 0 }]);
  };

  const removeBundleItem = (index) => {
    const items = [...bundleItems];
    items.splice(index, 1);
    setBundleItems(items);
    
    setFormData(prev => ({
      ...prev,
      bundls_item: items
    }));
  };

  const removeTag = (index) => {
    const updatedTags = [...selectedTags];
    updatedTags.splice(index, 1);
    setSelectedTags(updatedTags);
    
    setFormData(prev => ({
      ...prev,
      tags: updatedTags.filter(tag => tag.trim() !== '')
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formDataToSend = new FormData();
      
      formDataToSend.append('name', formData.name);
      formDataToSend.append('description', formData.description || '');
      formDataToSend.append('short_description', formData.short_description || '');
      formDataToSend.append('quantity', formData.quantity);
      formDataToSend.append('price', formData.price);
      formDataToSend.append('discount', formData.discount || 0);
      formDataToSend.append('is_bundle', formData.is_bundle);
      
      formData.categories.forEach((category, index) => {
        formDataToSend.append(`categories[${index}]`, category);
      });
      
      const filteredTags = selectedTags.filter(tag => tag.trim() !== '');
      filteredTags.forEach((tag, index) => {
        formDataToSend.append(`tags[${index}]`, tag);
      });
      
      formData.images.forEach((image, index) => {
        formDataToSend.append(`images[${index}]`, image);
      });
      
      if (isBundle && bundleItems.length > 0) {
        bundleItems.forEach((item, index) => {
          if (item.item_id) {
            formDataToSend.append(`bundls_item[${index}][item_id]`, item.item_id);
            formDataToSend.append(`bundls_item[${index}][bundle_quantity]`, item.bundle_quantity);
          }
        });
      }

      await axiosInstance.post('/products', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      toast.success('Product added successfully');
      navigate('/products');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add product');
    } finally {
      setLoading(false);
    }
  };

  const handleEditorChange = (newContent) => {
    setFormData(prev => ({
      ...prev,
      description: newContent
    }));
  };

  if (pageLoading) {
    return <Loading />;
  }

  return (
    <div className="add-product-container">
      <div className="add-product-header">
        <h2>Add New Product</h2>
        <p className="text-muted">Create a new product with details</p>
      </div>

      <form onSubmit={handleSubmit} className="add-product-form">
        <Row>
          <Col lg={7}>
            <BasicInformation
              formData={formData}
              handleInputChange={handleInputChange}
              editorRef={editorRef}
              editorConfig={editorConfig}
              handleEditorChange={handleEditorChange}
            />
          </Col>
          <Col lg={5}>
            <Categorization
              categories={categories}
              formData={formData}
              setFormData={setFormData}
              selectedTags={selectedTags}
              setSelectedTags={setSelectedTags}
              removeTag={removeTag}
            />
            <ImageUpload
              dragActive={dragActive}
              handleDrag={handleDrag}
              handleDrop={handleDrop}
              handleImageChange={handleImageChange}
              imageError={imageError}
              imagePreview={imagePreview}
              removeImage={removeImage}
            />
          </Col>
        </Row>
        
        <BundleOptions
          isBundle={isBundle}
          handleBundleToggle={handleBundleToggle}
          bundleItems={bundleItems}
          products={products}
          handleBundleItemChange={handleBundleItemChange}
          addBundleItem={addBundleItem}
          removeBundleItem={removeBundleItem}
        />

        <div className="form-actions">
          <button
            type="button"
            className="btn btn-light"
            onClick={() => navigate('/products')}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary btn-with-icon"
            disabled={loading}
          >
            {loading ? 'Adding...' : <><FaSave /> Save Product</>}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddProduct;