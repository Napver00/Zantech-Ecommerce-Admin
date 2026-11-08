import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Alert, Modal, Image, Form, Button, Spinner } from "react-bootstrap";
import { FaExternalLinkAlt, FaTimes, FaTrash } from "react-icons/fa";
import JoditEditor from "jodit-react";
import { toast } from "react-hot-toast";
import axiosInstance from "../../config/axios";
import Loading from "../../components/Loading";
import ProductImages from "../../components/Products/ProductImages";
import usePageTitle from "../../hooks/usePageTitle";
import ProductBundle from "../../components/Products/ProductBundle";
import VariantsEditor from "../../components/Products/VariantsEditor";
import "./Products.css";
import {
  EditorPage, EditorSection, SectionNav, SaveBar, Field, useUnsavedChanges, showFirstError, editorHtml,
} from "../../components/Editor/Editor";

import confirmDialog from "../../utils/confirmDialog";

const DETAIL_SECTION = { name: "details", short_description: "details", description: "details", price: "pricing", discount: "pricing", quantity: "pricing" };
const DETAIL_ORDER = ["name", "short_description", "description", "price", "discount", "quantity"];
const plainText = (html) => (html || "").replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
const taka = (n) => `৳${Number(n).toLocaleString("en-US", { maximumFractionDigits: 2 })}`;

const ViewProduct = () => {

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
  const [reorderImagesLoading, setReorderImagesLoading] = useState(false);
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
  const [allCategories, setAllCategories] = useState([]);
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

        setProduct({
          ...data,
          is_bundle: Number(data.is_bundle) === 1 ? 1 : 0,
        });
        setEditForm({
          name: data.name || "",
          description: data.description || "",
          short_description: data.short_description || "",
          quantity: data.quantity ?? "",
          price: price,
          discount: discount,
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
    if (await confirmDialog("Are you sure you want to delete this product?")) {
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
      if (!await confirmDialog("Are you sure you want to delete this image?"))
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

  const handleReorderImages = useCallback(
    async (orderedImageIds) => {
      // Optimistic update so the drag feels immediate; re-synced from the
      // server response (or reverted) right after.
      setProduct((prev) => {
        if (!prev?.images) return prev;
        const byId = new Map(prev.images.map((img) => [img.id, img]));
        return {
          ...prev,
          images: orderedImageIds.map((imgId) => byId.get(imgId)).filter(Boolean),
        };
      });
      setReorderImagesLoading(true);
      try {
        await axiosInstance.post(`/products/reorder-images/${id}`, {
          image_ids: orderedImageIds,
        });
        toast.success("Image order updated");
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to reorder images");
        await fetchProduct();
      } finally {
        setReorderImagesLoading(false);
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
      if (!await confirmDialog("Are you sure you want to delete this tag?")) return;
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
    } catch {
      toast.error("Couldn't load categories");
    }
  }, []);

  useEffect(() => {
    fetchAllCategories();
  }, [fetchAllCategories]);

  const handleDeleteBundleItem = useCallback(
    async (bundleId) => {
      if (
        !await confirmDialog(
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

  // ── Text, price and stock: saved together with the save bar ───────────────
  const [errors, setErrors] = useState({});
  const { dirty, markSaved } = useUnsavedChanges(editForm, !loading && !!product);
  const variants = product?.variants || [];
  const hasVariants = variants.length > 0;
  // Saving variants changes the product's price and stock; reload and treat that as saved.
  const [variantSaves, setVariantSaves] = useState(0);
  useEffect(() => {
    if (variantSaves) markSaved();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variantSaves]);
  usePageTitle(product?.name ? `${product.name} · Product` : "Product");

  const setField = (name, value) => {
    setEditForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((e) => { const n = { ...e }; delete n[name]; return n; });
  };
  const onInput = (e) => setField(e.target.name, e.target.value);

  const saveDetails = async (e) => {
    e.preventDefault();
    const latest = editorHtml(editorRef);
    const current = latest !== undefined ? { ...editForm, description: latest } : editForm;
    const found = {};
    if (!String(current.name).trim()) found.name = "Give the product a name.";
    if (!String(current.short_description).trim()) found.short_description = "Write a line or two about the product.";
    if (!plainText(current.description)) found.description = "Describe the product: what it does, specs, what is in the box.";
    if (!hasVariants) {
      if (current.price === "" || Number(current.price) < 0) found.price = "Enter the price.";
      if (Number(current.discount) > Number(current.price)) found.discount = "The discount can't be more than the price.";
      if (current.quantity === "" || Number(current.quantity) < 0) found.quantity = "Enter how many you have in stock.";
    }
    setErrors(found);
    if (Object.keys(found).length) {
      showFirstError(found, DETAIL_ORDER);
      return;
    }
    setEditLoading(true);
    try {
      await axiosInstance.put(`/products/update/${id}`, { ...current, discount: current.discount || 0 });
      setEditForm(current);
      setProduct((prev) => ({ ...prev, ...current }));
      markSaved();
      toast.success("Changes saved");
    } catch (err) {
      toast.error(err.response?.data?.message || "Couldn't save the product. Try again.");
    } finally {
      setEditLoading(false);
    }
  };

  const discard = async () => {
    if (!(await confirmDialog("Discard your unsaved changes?"))) return;
    fetchProduct();
    setErrors({});
  };

  // ── Categories and tags: each change saves straight away ──────────────────
  const [busyCategory, setBusyCategory] = useState(null);
  const toggleCategory = async (category, on) => {
    setBusyCategory(category.id);
    try {
      if (on) {
        await axiosInstance.delete(`/products/remove-categories/${id}`, { data: { category_id: [category.id] } });
      } else {
        await axiosInstance.post(`/products/add-categories/${id}`, { category_id: [category.id] });
      }
      await fetchProduct();
      toast.success(on ? `Removed from ${category.name}` : `Added to ${category.name}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Couldn't change the category");
    } finally {
      setBusyCategory(null);
    }
  };

  if (loading && !product) return <Loading />;
  if (error) return <Alert variant="danger">{error}</Alert>;
  if (!product) return null;

  const isActive = String(product.status) === "1";
  const price = Number(editForm.price) || 0;
  const discount = Number(editForm.discount) || 0;
  const pays = Math.max(0, price - discount);
  const stock = Number(product.quantity) || 0;
  const productCategoryIds = new Set((product.categories || []).map((c) => c.id));
  const storeUrl = product.slug ? `https://store.zantechbd.com/product/${product.slug}` : null;

  const errorSections = new Set(Object.keys(errors).map((k) => DETAIL_SECTION[k]));
  const has = (ok) => (ok ? "done" : "empty");
  const sections = [
    { id: "details", label: "Product", state: has(editForm.name && editForm.short_description) },
    { id: "pricing", label: "Price & stock", state: "done" },
    { id: "photos", label: "Photos", state: has(product.images?.length) },
    ...(product.is_bundle === 1 ? [] : [{ id: "variants", label: "Variants", state: hasVariants ? "done" : "empty" }]),
    { id: "organize", label: "Categories & tags", state: has(product.categories?.length) },
    { id: "bundle", label: "Bundle", state: product.is_bundle === 1 ? has(product.bundle_items?.length || product.bundles?.length) : "done" },
  ].map((s) => (errorSections.has(s.id) ? { ...s, state: "error" } : s));

  return (
    <EditorPage
      title={product.name}
      meta={
        <>
          <span className={`ed-status ${isActive ? "is-live" : "is-off"}`}>{isActive ? "In the store" : "Hidden from store"}</span>
          <span>{hasVariants ? "from " : ""}{taka(Number(product.price) - (Number(product.discount) || 0))}</span>
          <span className={stock === 0 ? "text-danger fw-semibold" : stock <= 5 ? "text-warning fw-semibold" : ""}>
            {stock === 0 ? "Out of stock" : `${stock} in stock`}
          </span>
          {hasVariants && <span>{variants.length} variants</span>}
          {product.is_bundle === 1 && <span>Bundle</span>}
        </>
      }
      actions={
        <>
          <div className="pd-status">
            <Form.Check
              type="switch"
              id="product-active"
              label={isActive ? "Shown in store" : "Hidden from store"}
              checked={isActive}
              onChange={handleToggleStatus}
              disabled={statusLoading}
            />
          </div>
          {storeUrl && (
            <a className="btn btn-outline-secondary" href={storeUrl} target="_blank" rel="noreferrer">
              <FaExternalLinkAlt className="me-2" aria-hidden="true" />View in store
            </a>
          )}
        </>
      }
      nav={<SectionNav sections={sections} />}
      footer={
        <SaveBar
          formId="product-details-form"
          dirty={dirty}
          saving={editLoading}
          errorCount={Object.keys(errors).length}
          onShowErrors={() => showFirstError(errors, DETAIL_ORDER)}
          onDiscard={discard}
          cleanText="All changes saved"
        />
      }
    >
      <form id="product-details-form" onSubmit={saveDetails} noValidate>
        <EditorSection id="details" title="Product" help="What customers see on the product page.">
          <Field name="name" label="Name" required error={errors.name} labelFor="pd-name">
            <Form.Control id="pd-name" name="name" value={editForm.name} onChange={onInput} />
          </Field>
          <Field name="short_description" label="Short summary" required error={errors.short_description} labelFor="pd-short"
            help="One or two lines shown next to the price.">
            <Form.Control id="pd-short" as="textarea" rows={2} name="short_description" value={editForm.short_description} onChange={onInput} />
          </Field>
          <Field name="description" label="Full description" required error={errors.description}>
            <JoditEditor ref={editorRef} value={editForm.description} config={editorConfig} onBlur={(v) => setField("description", v)} />
          </Field>
        </EditorSection>

        <EditorSection id="pricing" title="Price & stock">
          {hasVariants ? (
            <div className="pd-variant-note">
              Price and stock come from the <a href="#variants">{variants.length} variants</a> below: the store shows <strong>from {taka(pays)}</strong>, with <strong>{stock}</strong> in stock in total.
            </div>
          ) : (<>
          <div className="ed-grid">
            <Field name="price" label="Price" required error={errors.price} labelFor="pd-price">
              <div className="ed-money"><span>৳</span>
                <Form.Control id="pd-price" type="number" min="0" step="0.01" name="price" value={editForm.price} onChange={onInput} />
              </div>
            </Field>
            <Field name="discount" label="Discount" error={errors.discount} labelFor="pd-discount" help="Taka off the price.">
              <div className="ed-money"><span>৳</span>
                <Form.Control id="pd-discount" type="number" min="0" step="0.01" name="discount" value={editForm.discount} onChange={onInput} />
              </div>
            </Field>
            <Field name="quantity" label="In stock" required error={errors.quantity} labelFor="pd-qty">
              <Form.Control id="pd-qty" type="number" min="0" step="1" name="quantity" value={editForm.quantity} onChange={onInput} />
            </Field>
          </div>
          <div className="ed-summary" aria-live="polite">
            <span>Customers pay</span>
            {discount > 0 && <s>{taka(price)}</s>}
            <strong>{taka(pays)}</strong>
            {discount > 0 && price > 0 && <span>they save {Math.round((discount / price) * 100)}%</span>}
          </div>
          </>)}
        </EditorSection>
      </form>

      <EditorSection id="photos" title="Photos" count={product.images?.length || null}
        help="Changes here save straight away. Drag to reorder; the first photo is the main one.">
        <div className="ed-embed">
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
            handleReorderImages={handleReorderImages}
            reorderImagesLoading={reorderImagesLoading}
          />
        </div>
      </EditorSection>

      {product.is_bundle !== 1 && (
        <EditorSection id="variants" title="Variants" count={variants.length || null} optional
          help="One product in several versions, e.g. a JST connector in 1 pin, 2 pin and 3 pin, each with its own price, stock and photo. Saved with its own button.">
          <VariantsEditor product={product} onSaved={async () => { await fetchProduct(); setVariantSaves((n) => n + 1); }} />
        </EditorSection>
      )}

      <EditorSection id="organize" title="Categories & tags" help="Changes here save straight away.">
        <div className="ed-field">
          <span className="ed-label">Categories</span>
          <div className="cat-chips" role="group" aria-label="Categories">
            {allCategories.map((c) => {
              const on = productCategoryIds.has(c.id);
              return (
                <button key={c.id} type="button" className={`cat-chip ${on ? "is-on" : ""}`} aria-pressed={on}
                  disabled={busyCategory === c.id} onClick={() => toggleCategory(c, on)}>
                  {busyCategory === c.id ? <Spinner animation="border" size="sm" /> : c.name}
                </button>
              );
            })}
          </div>
          <p className="ed-hint">
            {productCategoryIds.size
              ? `Listed in ${productCategoryIds.size} ${productCategoryIds.size === 1 ? "category" : "categories"}. Tap to add or remove.`
              : "Not in any category yet, so customers can't find it by browsing."}
          </p>
        </div>

        <div className="ed-field">
          <label className="ed-label" htmlFor="pd-tags">Tags</label>
          {product.tags?.length > 0 && (
            <div className="ed-tags mb-2">
              {product.tags.map((t) => (
                <span key={t.id} className="ed-tag pd-tag">
                  {t.tag}
                  <button type="button" aria-label={`Remove tag ${t.tag}`} disabled={deleteTagLoading === t.id} onClick={() => handleDeleteTag(t.id)}>
                    <FaTimes />
                  </button>
                </span>
              ))}
            </div>
          )}
          <div className="d-flex gap-2">
            <Form.Control
              id="pd-tags"
              value={tagInput}
              onChange={(e) => { setTagInput(e.target.value); setTagError(null); }}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddTags(); } }}
              placeholder="Add tags, separated by commas"
            />
            <Button variant="outline-primary" onClick={handleAddTags} disabled={tagLoading || !tagInput.trim()}>
              {tagLoading ? "Adding…" : "Add"}
            </Button>
          </div>
          {tagError && <p className="ed-error">{tagError}</p>}
        </div>
      </EditorSection>

      <EditorSection id="bundle" title="Bundle" optional
        help="A bundle is a kit sold as one product, made of other products you sell. Changes here save straight away.">
        <div className="ed-embed">
          <ProductBundle
            product={product}
            handleBundleToggle={handleBundleToggle}
            bundleToggleLoading={bundleToggleLoading}
            handleAddToBundle={handleAddToBundle}
            bundleLoading={bundleLoading}
            selectedItems={selectedItems}
            handleRemoveSelectedItem={(itemId) => setSelectedItems((prev) => prev.filter((item) => item.id !== itemId))}
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
          {bundleError && <p className="ed-error">{bundleError}</p>}
        </div>
      </EditorSection>

      <EditorSection id="delete" title="Delete product"
        help="Removes the product from the store and the admin. Past orders keep their records. This can't be undone.">
        <Button variant="outline-danger" onClick={handleDelete}>
          <FaTrash className="me-2" aria-hidden="true" />Delete this product
        </Button>
      </EditorSection>

      <Modal show={showImagePreview} onHide={() => setShowImagePreview(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Photo</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center p-0">
          {product.images?.length > 0 && (
            <Image src={product.images[selectedImage]?.path} alt={product.name} fluid className="rounded"
              style={{ maxHeight: "70vh", objectFit: "contain" }} />
          )}
        </Modal.Body>
      </Modal>
    </EditorPage>
  );
};

export default ViewProduct;
