import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Form, Row, Col } from 'react-bootstrap';
import { FaCloudUploadAlt, FaTimes, FaStar } from 'react-icons/fa';
import JoditEditor from 'jodit-react';
import axiosInstance from '../../config/axios';
import Loading from '../../components/Loading';
import BundleOptions from '../../components/Products/AddProduct/BundleOptions';
import usePageTitle from '../../hooks/usePageTitle';
import {
  EditorPage, EditorSection, SectionNav, SaveBar, Field, TagsField, useUnsavedChanges, showFirstError, editorHtml,
} from '../../components/Editor/Editor';
import './AddProduct.css';

const FORM_ID = 'product-form';
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif'];
const MAX_IMAGE_MB = 4;

const FIELD_SECTION = { name: 'product', short_description: 'product', description: 'product', price: 'pricing', quantity: 'pricing', discount: 'pricing', categories: 'organize', images: 'photos', bundle: 'bundle' };
const ERROR_ORDER = ['name', 'short_description', 'description', 'price', 'discount', 'quantity', 'categories', 'bundle'];

const plainText = (html) => (html || '').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
const taka = (n) => `৳${Number(n).toLocaleString('en-US', { maximumFractionDigits: 2 })}`;

const emptyProduct = () => ({
  name: '',
  short_description: '',
  description: '',
  price: '',
  discount: '',
  quantity: '',
  categories: [],
  tags: '',
  images: [],
  is_bundle: false,
  bundle: [{ product: null, qty: 1 }],
});

/** Several photos: drop or pick, reorder by making one the main photo, remove. */
const PhotoPicker = ({ images, onAdd, onRemove, onMakeMain, error }) => {
  const inputRef = useRef(null);
  const [over, setOver] = useState(false);
  const previews = useMemo(() => images.map((f) => URL.createObjectURL(f)), [images]);
  useEffect(() => () => previews.forEach((u) => URL.revokeObjectURL(u)), [previews]);

  return (
    <>
      <div
        className={`ed-drop ${over ? 'is-over' : ''}`}
        style={{ aspectRatio: 'auto' }}
        onDragOver={(e) => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); onAdd(Array.from(e.dataTransfer.files)); }}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={IMAGE_TYPES.join(',')}
          className="visually-hidden"
          onChange={(e) => { onAdd(Array.from(e.target.files)); e.target.value = ''; }}
        />
        <button type="button" className="ed-drop-empty" onClick={() => inputRef.current?.click()}>
          <FaCloudUploadAlt aria-hidden="true" />
          <strong>Drop photos here or choose files</strong>
          <small>JPG, PNG or GIF, up to {MAX_IMAGE_MB} MB each. You can add several at once.</small>
        </button>
      </div>
      {error && <p className="ed-error">{error}</p>}

      {previews.length > 0 && (
        <ul className="pp-grid" aria-label="Photos to upload">
          {previews.map((src, i) => (
            <li key={src} className={`pp-item ${i === 0 ? 'is-main' : ''}`}>
              <img src={src} alt={`Photo ${i + 1}`} />
              {i === 0 ? (
                <span className="pp-main"><FaStar aria-hidden="true" /> Main photo</span>
              ) : (
                <button type="button" className="pp-make-main" onClick={() => onMakeMain(i)}>Make main</button>
              )}
              <button type="button" className="pp-remove" onClick={() => onRemove(i)} aria-label={`Remove photo ${i + 1}`}>
                <FaTimes />
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
};

/** Every category as a tap-to-select chip, with a filter when there are many. */
const CategoryPicker = ({ categories, selected, onToggle }) => {
  const [filter, setFilter] = useState('');
  const shown = categories.filter((c) => c.name.toLowerCase().includes(filter.trim().toLowerCase()));

  return (
    <>
      {categories.length > 12 && (
        <Form.Control
          className="mb-2"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter categories…"
          aria-label="Filter categories"
        />
      )}
      <div className="cat-chips" role="group" aria-label="Categories">
        {shown.map((c) => {
          const on = selected.includes(String(c.id));
          return (
            <button key={c.id} type="button" className={`cat-chip ${on ? 'is-on' : ''}`} aria-pressed={on} onClick={() => onToggle(String(c.id))}>
              {c.name}
            </button>
          );
        })}
        {shown.length === 0 && <span className="ed-hint">No categories match “{filter}”.</span>}
      </div>
    </>
  );
};

const AddProduct = () => {
  usePageTitle('New Product');
  const navigate = useNavigate();
  const editorRef = useRef(null);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyProduct);
  const [errors, setErrors] = useState({});
  const [imageError, setImageError] = useState('');
  const { dirty, markSaved } = useUnsavedChanges(form, !pageLoading);

  useEffect(() => {
    Promise.all([
      axiosInstance.get('/categories').then((r) => setCategories(r.data.data || [])).catch(() => toast.error("Couldn't load categories")),
      axiosInstance.get('/except-bundles').then((r) => setProducts(r.data.data || [])).catch(() => setProducts([])),
    ]).finally(() => setPageLoading(false));
  }, []);

  const editorConfig = useMemo(() => ({
    readonly: false,
    placeholder: 'What it is, what it does, what comes in the box, specs…',
    height: 360,
    uploader: { insertImageAsBase64URI: true },
    showXPathInStatusbar: false,
  }), []);

  const set = (name, value) => {
    setForm((f) => ({ ...f, [name]: value }));
    const section = name === 'bundle' || name === 'is_bundle' ? 'bundle' : name;
    if (errors[section]) setErrors((e) => { const n = { ...e }; delete n[section]; return n; });
  };
  const onInput = (e) => set(e.target.name, e.target.value);

  // ── photos ────────────────────────────────────────────────────────────────
  const addImages = (files) => {
    const bad = files.find((f) => !IMAGE_TYPES.includes(f.type) || f.size > MAX_IMAGE_MB * 1024 * 1024);
    if (bad) {
      setImageError(!IMAGE_TYPES.includes(bad.type)
        ? `“${bad.name}” isn't a JPG, PNG or GIF.`
        : `“${bad.name}” is larger than ${MAX_IMAGE_MB} MB.`);
      return;
    }
    setImageError('');
    set('images', [...form.images, ...files]);
  };
  const removeImage = (i) => set('images', form.images.filter((_, k) => k !== i));
  const makeMain = (i) => set('images', [form.images[i], ...form.images.filter((_, k) => k !== i)]);

  // ── bundle ────────────────────────────────────────────────────────────────
  const setBundleRow = (i, patch) => set('bundle', form.bundle.map((row, k) => (k === i ? { ...row, ...patch } : row)));

  // ── price summary ─────────────────────────────────────────────────────────
  const price = Number(form.price) || 0;
  const discount = Number(form.discount) || 0;
  const pays = Math.max(0, price - discount);

  const validate = (f) => {
    const e = {};
    if (!f.name.trim()) e.name = 'Give the product a name.';
    if (!f.short_description.trim()) e.short_description = 'Write a line or two about the product.';
    if (!plainText(f.description)) e.description = 'Describe the product: what it does, specs, what is in the box.';
    if (f.price === '' || Number(f.price) < 0) e.price = 'Enter the price.';
    if (Number(f.discount) > Number(f.price)) e.discount = "The discount can't be more than the price.";
    if (f.quantity === '' || Number(f.quantity) < 0 || !Number.isInteger(Number(f.quantity))) e.quantity = 'Enter how many you have in stock (a whole number).';
    if (!f.categories.length) e.categories = 'Pick at least one category so customers can find it.';
    if (f.is_bundle && !f.bundle.some((r) => r.product)) e.bundle = 'Pick the products that come in this bundle.';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const latest = editorHtml(editorRef);
    const current = typeof latest === 'string' ? { ...form, description: latest } : form;
    const found = validate(current);
    setErrors(found);
    if (Object.keys(found).length) {
      showFirstError(found, ERROR_ORDER);
      return;
    }

    const fd = new FormData();
    fd.append('name', current.name.trim());
    fd.append('description', current.description || '');
    fd.append('short_description', current.short_description || '');
    fd.append('quantity', current.quantity);
    fd.append('price', current.price);
    fd.append('discount', current.discount || 0);
    fd.append('is_bundle', current.is_bundle ? 1 : 0);
    current.categories.forEach((id, i) => fd.append(`categories[${i}]`, id));
    current.tags.split(',').map((t) => t.trim()).filter(Boolean).forEach((t, i) => fd.append(`tags[${i}]`, t));
    current.images.forEach((img, i) => fd.append(`images[${i}]`, img));
    if (current.is_bundle) {
      current.bundle.filter((r) => r.product).forEach((r, i) => {
        fd.append(`bundls_item[${i}][item_id]`, r.product.id);
        fd.append(`bundls_item[${i}][bundle_quantity]`, r.qty || 1);
      });
    }

    setSaving(true);
    try {
      const res = await axiosInstance.post('/products', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      markSaved();
      toast.success('Product added');
      const id = res.data?.data?.id;
      navigate(id ? `/products/${id}` : '/products', { replace: true });
    } catch (err) {
      const apiErrors = err.response?.data?.errors;
      if (apiErrors && typeof apiErrors === 'object') {
        const mapped = Object.fromEntries(Object.entries(apiErrors).map(([k, v]) => [k.split('.')[0].replace('bundls_item', 'bundle'), Array.isArray(v) ? v[0] : String(v)]));
        setErrors(mapped);
        showFirstError(mapped, ERROR_ORDER);
      }
      toast.error(err.response?.data?.message || "Couldn't add the product. Check the form and try again.");
    } finally {
      setSaving(false);
    }
  };

  if (pageLoading) return <Loading />;

  const errorSections = new Set(Object.keys(errors).map((k) => FIELD_SECTION[k]).filter(Boolean));
  const has = (ok) => (ok ? 'done' : 'empty');
  const sections = [
    { id: 'product', label: 'Product', state: has(form.name.trim() && form.short_description.trim() && plainText(form.description)) },
    { id: 'pricing', label: 'Price & stock', state: has(form.price !== '' && form.quantity !== '') },
    { id: 'photos', label: 'Photos', state: has(form.images.length) },
    { id: 'organize', label: 'Categories & tags', state: has(form.categories.length) },
    { id: 'bundle', label: 'Bundle', state: form.is_bundle ? has(form.bundle.some((r) => r.product)) : 'done' },
  ].map((s) => (errorSections.has(s.id) ? { ...s, state: 'error' } : s));

  return (
    <EditorPage
      title="New product"
      meta={<span>Fields marked * are needed. Photos, tags and bundle items can be added now or later.</span>}
      nav={<SectionNav sections={sections} />}
      footer={
        <SaveBar
          formId={FORM_ID}
          dirty={dirty}
          saving={saving}
          errorCount={Object.keys(errors).length}
          onShowErrors={() => showFirstError(errors, ERROR_ORDER)}
          saveLabel="Add product"
          savingLabel="Adding…"
          cleanText="New product, nothing entered yet"
          dirtyText="New product, not saved yet"
        />
      }
    >
      <form id={FORM_ID} onSubmit={handleSubmit} noValidate>
        <EditorSection id="product" title="Product" help="What customers see on the product page.">
          <Field name="name" label="Name" required error={errors.name} labelFor="p-name">
            <Form.Control id="p-name" name="name" value={form.name} onChange={onInput} placeholder="e.g. Arduino Uno R3 (Original)" />
          </Field>
          <Field name="short_description" label="Short summary" required labelFor="p-short" error={errors.short_description}
            help="One or two lines shown next to the price.">
            <Form.Control id="p-short" as="textarea" rows={2} name="short_description" value={form.short_description} onChange={onInput} />
          </Field>
          <Field name="description" label="Full description" required error={errors.description}>
            <JoditEditor ref={editorRef} value={form.description} config={editorConfig} onBlur={(v) => set('description', v)} />
          </Field>
        </EditorSection>

        <EditorSection id="pricing" title="Price & stock">
          <div className="ed-grid">
            <Field name="price" label="Price" required error={errors.price} labelFor="p-price">
              <div className="ed-money"><span>৳</span>
                <Form.Control id="p-price" type="number" min="0" step="0.01" name="price" value={form.price} onChange={onInput} placeholder="0" />
              </div>
            </Field>
            <Field name="discount" label="Discount" error={errors.discount} labelFor="p-discount" help="Taka off the price. Leave empty for none.">
              <div className="ed-money"><span>৳</span>
                <Form.Control id="p-discount" type="number" min="0" step="0.01" name="discount" value={form.discount} onChange={onInput} placeholder="0" />
              </div>
            </Field>
            <Field name="quantity" label="In stock" required error={errors.quantity} labelFor="p-qty">
              <Form.Control id="p-qty" type="number" min="0" step="1" name="quantity" value={form.quantity} onChange={onInput} placeholder="0" />
            </Field>
          </div>
          {form.price !== '' && (
            <div className="ed-summary" aria-live="polite">
              <span>Customers pay</span>
              {discount > 0 && <s>{taka(price)}</s>}
              <strong>{taka(pays)}</strong>
              {discount > 0 && price > 0 && <span>they save {Math.round((discount / price) * 100)}%</span>}
              {form.quantity !== '' && Number(form.quantity) === 0 && <span>· shows as out of stock</span>}
            </div>
          )}
        </EditorSection>

        <EditorSection id="photos" title="Photos" optional count={form.images.length || null}
          help="The main photo is shown in lists and search. Square photos on a white background look best.">
          <PhotoPicker images={form.images} onAdd={addImages} onRemove={removeImage} onMakeMain={makeMain} error={imageError} />
        </EditorSection>

        <EditorSection id="organize" title="Categories & tags" help="Where the product is listed in the store, and extra words people might search for.">
          <Field name="categories" label="Categories" required error={errors.categories}
            help={form.categories.length ? `${form.categories.length} selected` : 'Tap to select. Pick all that fit.'}>
            <CategoryPicker
              categories={categories}
              selected={form.categories}
              onToggle={(id) => set('categories', form.categories.includes(id) ? form.categories.filter((x) => x !== id) : [...form.categories, id])}
            />
          </Field>
          <Field name="tags" label="Tags" help="Separate with commas.">
            <TagsField value={form.tags} onChange={(v) => set('tags', v)} placeholder="e.g. arduino, microcontroller, uno" />
          </Field>
        </EditorSection>

        <EditorSection id="bundle" title="Bundle" optional help="A bundle is a kit sold as one product, made of other products you sell.">
          <Form.Check
            type="switch"
            id="p-bundle"
            label="This product is a bundle of other products"
            checked={form.is_bundle}
            onChange={(e) => set('is_bundle', e.target.checked)}
          />
          {form.is_bundle && (
            <Row className="mt-3">
              <Col>
                <div data-field="bundle" className={errors.bundle ? 'ed-field has-error' : ''}>
                  <BundleOptions
                    items={form.bundle}
                    products={products}
                    onSelect={(i, product) => setBundleRow(i, { product })}
                    onQuantity={(i, qty) => setBundleRow(i, { qty })}
                    onAdd={() => set('bundle', [...form.bundle, { product: null, qty: 1 }])}
                    onRemove={(i) => set('bundle', form.bundle.filter((_, k) => k !== i))}
                  />
                  {errors.bundle && <p className="ed-error">{errors.bundle}</p>}
                </div>
              </Col>
            </Row>
          )}
        </EditorSection>
      </form>
    </EditorPage>
  );
};

export default AddProduct;
