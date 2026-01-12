import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Alert, Modal, Image, Row, Col } from "react-bootstrap";
import { toast } from "react-hot-toast";
import axiosInstance from "../../config/axios";
import Loading from "../../components/Loading";
import ProductHeader from "../../components/Products/ProductHeader";
import ProductInformation from "../../components/Products/ProductInformation";
import ProductImages from "../../components/Products/ProductImages";
import ProductAttributes from "../../components/Products/ProductAttributes";
import usePageTitle from "../../hooks/usePageTitle";
import ProductBundle from "../../components/Products/ProductBundle";
import "./Products.css";

const ViewProduct = () => {
  usePageTitle("Product Details");
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageUploadLoading, setImageUploadLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [imageError, setImageError] = useState(null);
  const [deleteImageLoading, setDeleteImageLoading] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    short_description: "",
    quantity: "",
    price: "",
    discount: "0",
  });
  const [editLoading, setEditLoading] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [tagError, setTagError] = useState(null);
  const [tagLoading, setTagLoading] = useState(false);
  const [deleteTagLoading, setDeleteTagLoading] = useState(null);
  const [showAttributesModal, setShowAttributesModal] = useState(false);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [deleteCategoryLoading, setDeleteCategoryLoading] = useState(null);
  const [allCategories, setAllCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [categoryError, setCategoryError] = useState(null);
  const [deleteBundleLoading, setDeleteBundleLoading] = useState(null);
  const [bundleLoading, setBundleLoading] = useState(false);
  const [bundleError, setBundleError] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [bundleQuantity, setBundleQuantity] = useState({});
  const [updateQuantityLoading, setUpdateQuantityLoading] = useState(null);
  const [editingQuantity, setEditingQuantity] = useState({});
  const [statusLoading, setStatusLoading] = useState(false);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [bundleToggleLoading, setBundleToggleLoading] = useState(false);
  const editorRef = useRef(null);

  const editorConfig = useMemo(
    () => ({
      readonly: false,
      placeholder: "Start typing your product description...",
      height: 400,
    }),
    []
  );

  const fetchProduct = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/products/${id}`);
      if (response.data.success) {
        const data = response.data.data;

        // Make sure price and discount are numbers
        const price = parseFloat(data.price) || 0;
        const discount = parseFloat(data.discount) || 0;

        // calculate discounted price & percentage
        const discountedPrice = price - discount;
        const discountPercentage = price > 0 ? (discount / price) * 100 : 0;

        setProduct(data);
        setEditForm({
          name: data.name || "",
          description: data.description || "",
          short_description: data.short_description || "",
          quantity: data.quantity || "",
          price: price,
          discount: discount,
          discountedPrice: discountedPrice.toFixed(2),
          discountPercentage: discountPercentage.toFixed(0),
        });
        setError(null);
      } else {
        throw new Error(response.data.message || "Failed to fetch product");
      }
    } catch (err) {
      setError(err.message || "Failed to fetch product");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  const handleDelete = useCallback(async () => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await axiosInstance.delete(`/products/delete/${id}`);
        toast.success("Product deleted successfully");
        navigate("/products");
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to delete product");
      }
    }
  }, [id, navigate]);

  const handleToggleStatus = useCallback(async () => {
    setStatusLoading(true);
    try {
      await axiosInstance.post(`/products/toggle-status/${id}`);
      setProduct((prev) => ({
        ...prev,
        status: prev.status === "1" ? "0" : "1",
      }));
      toast.success(
        `Product ${
          product.status === "1" ? "deactivated" : "activated"
        } successfully`
      );
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to toggle status");
    } finally {
      setStatusLoading(false);
    }
  }, [id, product]);

  const handleQuickEditSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setEditLoading(true);
      try {
        await axiosInstance.put(`/products/update/${id}`, editForm);
        setProduct((prev) => ({ ...prev, ...editForm }));
        toast.success("Product updated successfully");
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to update product");
      } finally {
        setEditLoading(false);
      }
    },
    [id, editForm]
  );

  const handleImageSelect = useCallback((e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(files);
    setImageError(null);
  }, []);

  const handleImageUpload = useCallback(async () => {
    if (selectedFiles.length === 0) {
      setImageError("Please select at least one image");
      return;
    }
    setImageUploadLoading(true);
    const formData = new FormData();
    selectedFiles.forEach((file, index) =>
      formData.append(`images[${index}]`, file)
    );
    try {
      await axiosInstance.post(`/products/add-images/${id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      await fetchProduct();
      setShowImageModal(false);
      setSelectedFiles([]);
      toast.success("Images uploaded successfully");
    } catch (err) {
      setImageError(err.response?.data?.message || "Failed to upload images");
    } finally {
      setImageUploadLoading(false);
    }
  }, [id, selectedFiles, fetchProduct]);

  const handleDeleteImage = useCallback(
    async (imageId) => {
      if (!window.confirm("Are you sure you want to delete this image?"))
        return;
      setDeleteImageLoading(imageId);
      try {
        await axiosInstance.delete(`/products/remove-image/${id}`, {
          data: { image_id: imageId },
        });
        await fetchProduct();
        toast.success("Image deleted successfully");
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to delete image");
      } finally {
        setDeleteImageLoading(null);
      }
    },
    [id, fetchProduct]
  );

  const handleAddTags = useCallback(async () => {
    if (!tagInput.trim()) {
      setTagError("Please enter at least one tag");
      return;
    }
    setTagLoading(true);
    const tags = tagInput
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
    try {
      await axiosInstance.post(`/products/add-tags/${id}`, { tags });
      await fetchProduct();
      setTagInput("");
      toast.success("Tags added successfully");
    } catch (err) {
      setTagError(err.response?.data?.message || "Failed to add tags");
    } finally {
      setTagLoading(false);
    }
  }, [id, tagInput, fetchProduct]);

  const handleDeleteTag = useCallback(
    async (tagId) => {
      if (!window.confirm("Are you sure you want to delete this tag?")) return;
      setDeleteTagLoading(tagId);
      try {
        await axiosInstance.delete(`/products/remove-tags/${id}`, {
          data: { tag_ids: [tagId] },
        });
        await fetchProduct();
        toast.success("Tag deleted successfully");
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to delete tag");
      } finally {
        setDeleteTagLoading(null);
      }
    },
    [id, fetchProduct]
  );

  const fetchAllCategories = useCallback(async () => {
    try {
      const response = await axiosInstance.get("/categories");
      setAllCategories(response.data.data);
    } catch (err) {
      toast.error("Failed to fetch categories");
    }
  }, []);

  useEffect(() => {
    if (showAttributesModal) {
      fetchAllCategories();
    }
  }, [showAttributesModal, fetchAllCategories]);

  const handleAddCategories = useCallback(async () => {
    if (selectedCategories.length === 0) {
      setCategoryError("Please select at least one category");
      return;
    }
    setCategoryLoading(true);
    try {
      await axiosInstance.post(`/products/add-categories/${id}`, {
        category_id: selectedCategories,
      });
      await fetchProduct();
      setSelectedCategories([]);
      toast.success("Categories added successfully");
    } catch (err) {
      setCategoryError(
        err.response?.data?.message || "Failed to add categories"
      );
    } finally {
      setCategoryLoading(false);
    }
  }, [id, selectedCategories, fetchProduct]);

  const handleDeleteCategory = useCallback(
    async (categoryId) => {
      if (!window.confirm("Are you sure you want to remove this category?"))
        return;
      setDeleteCategoryLoading(categoryId);
      try {
        await axiosInstance.delete(`/products/remove-categories/${id}`, {
          data: { category_id: [categoryId] },
        });
        await fetchProduct();
        toast.success("Category removed successfully");
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to remove category");
      } finally {
        setDeleteCategoryLoading(null);
      }
    },
    [id, fetchProduct]
  );

  const handleDeleteBundleItem = useCallback(
    async (bundleId) => {
      if (
        !window.confirm(
          "Are you sure you want to remove this item from the bundle?"
        )
      )
        return;
      setDeleteBundleLoading(bundleId);
      try {
        await axiosInstance.delete(`/products/bundles/delete/${bundleId}`);
        await fetchProduct();
        toast.success("Bundle item removed successfully");
      } catch (err) {
        toast.error(
          err.response?.data?.message || "Failed to delete bundle item"
        );
      } finally {
        setDeleteBundleLoading(null);
      }
    },
    [fetchProduct]
  );

  const loadProductOptions = useCallback(async (inputValue) => {
    if (!inputValue) return [];
    try {
      const response = await axiosInstance.get(
        `/except-bundles?search=${inputValue}`
      );
      return response.data.data.map((product) => ({
        value: product.id,
        label: product.name,
        stock: product.quantity,
        price: product.price,
        image: product.image_paths[0] || null,
      }));
    } catch {
      return [];
    }
  }, []);

  const handleSelectProduct = useCallback(
    (option) => {
      if (option && !selectedItems.some((item) => item.id === option.value)) {
        setSelectedItems([
          ...selectedItems,
          {
            id: option.value,
            name: option.label,
            stock: option.stock,
            image: option.image,
          },
        ]);
        setBundleQuantity((prev) => ({ ...prev, [option.value]: 1 }));
      }
    },
    [selectedItems]
  );

  const handleAddToBundle = useCallback(async () => {
    if (selectedItems.length === 0) {
      setBundleError("Please select at least one item");
      return;
    }
    setBundleLoading(true);
    try {
      const items = selectedItems.map((item) => ({
        item_id: item.id,
        bundle_quantity: parseInt(bundleQuantity[item.id]),
      }));
      await axiosInstance.post(`/products/bundles/${id}`, { items });
      await fetchProduct();
      setSelectedItems([]);
      setBundleQuantity({});
      toast.success("Bundle items added successfully");
    } catch (err) {
      setBundleError(
        err.response?.data?.message || "Failed to add bundle items"
      );
    } finally {
      setBundleLoading(false);
    }
  }, [id, selectedItems, bundleQuantity, fetchProduct]);

  const handleUpdateBundleQuantity = useCallback(
    async (bundleId, newQuantity) => {
      if (!newQuantity || newQuantity < 1) {
        toast.error("Please enter a valid quantity");
        return;
      }
      setUpdateQuantityLoading(bundleId);
      try {
        await axiosInstance.post(
          `/products/bundles/update-quantity/${bundleId}`,
          { quantity: parseInt(newQuantity) }
        );
        await fetchProduct();
        setEditingQuantity({});
        toast.success("Bundle quantity updated successfully");
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to update quantity");
      } finally {
        setUpdateQuantityLoading(null);
      }
    },
    [fetchProduct]
  );

  const handleBundleToggle = useCallback(async () => {
    setBundleToggleLoading(true);
    try {
      await axiosInstance.post(`/products/bundles/toggle-bundle/${id}`, {
        is_bundle: product.is_bundle === 1 ? 0 : 1,
      });
      setProduct((prev) => ({
        ...prev,
        is_bundle: prev.is_bundle === 1 ? 0 : 1,
      }));
      toast.success(
        `Product ${
          product.is_bundle === 1 ? "unmarked" : "marked"
        } as bundle successfully`
      );
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Failed to toggle bundle status"
      );
    } finally {
      setBundleToggleLoading(false);
    }
  }, [id, product]);

  if (loading) return <Loading />;
  if (error) return <Alert variant="danger">{error}</Alert>;
  if (!product) return null;

  return (
    <div className="products-container">
      <ProductHeader
        product={product}
        handleDelete={handleDelete}
        handleToggleStatus={handleToggleStatus}
        statusLoading={statusLoading}
      />
      <div className="mt-4">
        <Row>
          <Col lg={7}>
            <ProductInformation
              editForm={editForm}
              handleEditFormChange={(e) =>
                setEditForm((prev) => ({
                  ...prev,
                  [e.target.name]: e.target.value,
                }))
              }
              handleEditorChange={(newContent) =>
                setEditForm((prev) => ({ ...prev, description: newContent }))
              }
              handleQuickEditSubmit={handleQuickEditSubmit}
              editLoading={editLoading}
              editorConfig={editorConfig}
              editorRef={editorRef}
            />
          </Col>
          <Col lg={5}>
            <ProductImages
              product={product}
              showImageModal={showImageModal}
              setShowImageModal={setShowImageModal}
              handleImageUpload={handleImageUpload}
              selectedFiles={selectedFiles}
              handleImageSelect={handleImageSelect}
              imageError={imageError}
              imageUploadLoading={imageUploadLoading}
              handleDeleteImage={handleDeleteImage}
              deleteImageLoading={deleteImageLoading}
              setShowImagePreview={setShowImagePreview}
              setSelectedImage={setSelectedImage}
            />
            <ProductAttributes
              product={product}
              show={showAttributesModal}
              handleClose={() => setShowAttributesModal(false)}
              handleShow={() => setShowAttributesModal(true)}
              allCategories={allCategories}
              selectedCategories={selectedCategories}
              setSelectedCategories={setSelectedCategories}
              categoryLoading={categoryLoading}
              handleAddCategories={handleAddCategories}
              handleDeleteCategory={handleDeleteCategory}
              deleteCategoryLoading={deleteCategoryLoading}
              categoryError={categoryError}
              tagInput={tagInput}
              setTagInput={setTagInput}
              tagLoading={tagLoading}
              handleAddTags={handleAddTags}
              handleDeleteTag={handleDeleteTag}
              deleteTagLoading={deleteTagLoading}
              tagError={tagError}
            />
          </Col>
        </Row>
        <Row>
          <Col>
            <ProductBundle
              product={product}
              handleBundleToggle={handleBundleToggle}
              bundleToggleLoading={bundleToggleLoading}
              handleAddToBundle={handleAddToBundle}
              bundleLoading={bundleLoading}
              selectedItems={selectedItems}
              handleRemoveSelectedItem={(itemId) =>
                setSelectedItems((prev) =>
                  prev.filter((item) => item.id !== itemId)
                )
              }
              bundleQuantity={bundleQuantity}
              setBundleQuantity={setBundleQuantity}
              loadProductOptions={loadProductOptions}
              handleSelectProduct={handleSelectProduct}
              handleDeleteBundleItem={handleDeleteBundleItem}
              deleteBundleLoading={deleteBundleLoading}
              handleUpdateBundleQuantity={handleUpdateBundleQuantity}
              updateQuantityLoading={updateQuantityLoading}
              editingQuantity={editingQuantity}
              setEditingQuantity={setEditingQuantity}
            />
          </Col>
        </Row>
      </div>
      <Modal
        show={showImagePreview}
        onHide={() => setShowImagePreview(false)}
        centered
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Image Preview</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center p-0">
          {product.images && product.images.length > 0 && (
            <Image
              src={product.images[selectedImage]?.path}
              alt={product.name}
              fluid
              className="rounded"
              style={{ maxHeight: "70vh", objectFit: "contain" }}
            />
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default ViewProduct;
