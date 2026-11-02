import React, { useState, useEffect } from "react";
import { FaPlus } from "react-icons/fa";
import { toast } from "react-hot-toast";
import axiosInstance from "../../config/axios";
import { Form, Button, Modal } from "react-bootstrap";
import Select from "react-select/async";
import Loading from "../../components/Loading";
import "./Ratings.css";
import usePageTitle from '../../hooks/usePageTitle';
import CommonTable from "../../components/Common/CommonTable";
import { ListHeader, ListCard, ListToolbar, FilterTabs, ResultCount, Pager } from "../../components/List/List";
import { timeAgo } from "../../components/List/format";

const Ratings = () => {
  usePageTitle('Reviews');
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    star: "",
    reating: "",
    product_id: "",
  });
  const [searchParams, setSearchParams] = useState({
    page: 1,
    limit: 10,
    status: "",
    star: "",
  });
  const [pagination, setPagination] = useState({
    total_rows: 0,
    current_page: 1,
    per_page: 10,
    total_pages: 1,
    has_more_pages: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusToggleLoading, setStatusToggleLoading] = useState({});

  useEffect(() => {
    fetchRatings();
  }, [searchParams.page, searchParams.limit, searchParams.status, searchParams.star]);

  const fetchRatings = async (page = searchParams.page) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: searchParams.limit,
        ...(searchParams.status && { status: searchParams.status }),
        ...(searchParams.star && { star: searchParams.star }),
      };

      const response = await axiosInstance.get("/ratings", { params });
      if (response.data.success) {
        setRatings(response.data.data);
        if (response.data.pagination) {
          setPagination(response.data.pagination);
        }
      } else {
        throw new Error(response.data.message || "Failed to fetch ratings");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch ratings");
      setRatings([]);
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async (inputValue) => {
    try {
      const response = await axiosInstance.get("/products", {
        params: { search: inputValue },
      });
      return response.data.data.map((product) => ({
        value: product.id,
        label: `${product.name} (৳${product.price})`,
        image: product.image_paths && product.image_paths.length > 0 ? product.image_paths[0] : null,
      }));
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch products");
      return [];
    }
  };

  const handleAddRating = async (e) => {
    e.preventDefault();
    if (!formData.product_id || !formData.star) {
      toast.error("Please select a product and rating");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await axiosInstance.post("/ratings", formData);
      if (response.data.success) {
        setShowModal(false);
        setFormData({ star: "", reating: "", product_id: "" });
        await fetchRatings(1);
        toast.success("Rating added successfully");
      } else {
        throw new Error(response.data.message || "Failed to add rating");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add rating");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (id) => {
    setStatusToggleLoading((prev) => ({ ...prev, [id]: true }));
    try {
      const response = await axiosInstance.patch(`/ratings/toggle-status/${id}`);
      if (response.data.success) {
        setRatings((prevRatings) =>
          prevRatings.map((rating) =>
            rating.id === id ? { ...rating, status: response.data.data.status } : rating
          )
        );
        toast.success("Rating status updated successfully");
      } else {
        throw new Error(response.data.message || "Failed to update rating status");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update rating status");
    } finally {
      setStatusToggleLoading((prev) => ({ ...prev, [id]: false }));
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setSearchParams(prev => ({
      ...prev,
      [name]: value,
      page: 1
    }));
  };

  const handlePageChange = (page) => {
    setSearchParams((prev) => ({
      ...prev,
      page,
    }));
  };

  const Stars = ({ n }) => (
    <span className="rating-stars" aria-label={`${n} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} aria-hidden="true" className={i <= n ? 'is-on' : ''}>★</span>
      ))}
    </span>
  );

  const headers = [
    {
      key: 'reating',
      label: 'Review',
      render: (row) => (
        <>
          <Stars n={Number(row.star)} />
          <span className="rating-text" title={row.reating || ''}>
            {row.reating || <span className="text-muted fst-italic">No written review</span>}
          </span>
        </>
      ),
    },
    {
      key: 'product',
      label: 'Product',
      render: (row) =>
        row.product ? (
          <div className="ls-with-thumb">
            {row.product.image
              ? <img src={row.product.image} alt="" className="ls-thumb" loading="lazy" />
              : <span className="ls-thumb is-empty">No photo</span>}
            <span className="ls-cell-main text-truncate d-block" style={{ maxWidth: 220 }} title={row.product.name}>{row.product.name}</span>
          </div>
        ) : <span className="text-muted">Deleted product</span>,
    },
    {
      key: 'user',
      label: 'By',
      render: (row) => (
        <>
          <span className="d-block">{row.user?.name || 'Admin'}</span>
          {row.created_at && <span className="ls-cell-sub">{timeAgo(row.created_at)}</span>}
        </>
      ),
    },
    {
      key: 'status',
      label: 'Shown',
      render: (row) => (
        <Form.Check
          type="switch"
          id={`rating-shown-${row.id}`}
          checked={row.status === "1"}
          disabled={!!statusToggleLoading[row.id]}
          onChange={() => handleToggleStatus(row.id)}
          aria-label="Show this review on the product page"
        />
      ),
    },
  ];

  const openAdd = () => {
    setFormData({ star: "", reating: "", product_id: "" });
    setShowModal(true);
  };

  if (loading && ratings.length === 0 && !searchParams.status && !searchParams.star) {
    return <Loading />;
  }

  return (
    <div className="ratings-page">
      <ListHeader
        title="Reviews"
        subtitle="Star ratings customers leave on products. Switch one off to hide it from the store."
        actions={<Button onClick={openAdd}><FaPlus className="me-2" aria-hidden="true" />Add review</Button>}
      />

      <ListCard>
        <FilterTabs
          label="Filter reviews by visibility"
          value={searchParams.status}
          onChange={(v) => handleFilterChange({ target: { name: 'status', value: v } })}
          tabs={[
            { value: '', label: 'All' },
            { value: '1', label: 'Shown' },
            { value: '0', label: 'Hidden' },
          ]}
        />
        <ListToolbar end={<ResultCount page={pagination.current_page} perPage={searchParams.limit} total={pagination.total_rows} noun="reviews" />}>
          <Form.Select
            name="star"
            value={searchParams.star}
            onChange={handleFilterChange}
            aria-label="Filter by stars"
            style={{ maxWidth: 180 }}
          >
            <option value="">Any rating</option>
            {[5, 4, 3, 2, 1].map((s) => (
              <option key={s} value={s}>{'★'.repeat(s)} {s} star{s > 1 ? 's' : ''}</option>
            ))}
          </Form.Select>
        </ListToolbar>

        <CommonTable
          headers={headers}
          data={ratings}
          tableLoading={loading}
          loading={loading}
          emptyTitle={searchParams.status || searchParams.star ? 'No reviews match' : 'No reviews yet'}
          emptyText={searchParams.status || searchParams.star ? 'Try a different filter.' : 'Reviews show up here once customers rate a product.'}
        />

        <Pager
          page={pagination.current_page}
          lastPage={pagination.total_pages}
          onPage={handlePageChange}
          perPage={searchParams.limit}
          onPerPage={(n) => setSearchParams((prev) => ({ ...prev, limit: n, page: 1 }))}
        />
      </ListCard>

      <Modal show={showModal} onHide={() => !isSubmitting && setShowModal(false)} centered>
        <Form onSubmit={handleAddRating}>
          <Modal.Header closeButton>
            <Modal.Title as="h2" className="h5 mb-0">Add review</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label htmlFor="rating-product">Product</Form.Label>
              <Select
                inputId="rating-product"
                cacheOptions
                defaultOptions
                loadOptions={loadProducts}
                onChange={(o) => setFormData({ ...formData, product_id: o ? o.value : "" })}
                placeholder="Type to find a product"
              />
            </Form.Group>
            <fieldset className="mb-3">
              <legend className="form-label fs-6">Rating</legend>
              <div className="star-picker" role="radiogroup" aria-label="Rating">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    role="radio"
                    aria-checked={Number(formData.star) === s}
                    aria-label={`${s} star${s > 1 ? 's' : ''}`}
                    className={s <= Number(formData.star) ? 'is-on' : ''}
                    onClick={() => setFormData({ ...formData, star: String(s) })}
                  >
                    ★
                  </button>
                ))}
                <span className="ms-2 text-muted small">
                  {formData.star ? `${formData.star} of 5` : 'Pick a rating'}
                </span>
              </div>
            </fieldset>
            <Form.Group controlId="rating-text">
              <Form.Label>Review <span className="text-muted fw-normal">(optional)</span></Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={formData.reating}
                onChange={(e) => setFormData({ ...formData, reating: e.target.value })}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" onClick={() => setShowModal(false)} disabled={isSubmitting}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Adding…" : "Add review"}</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default Ratings;
