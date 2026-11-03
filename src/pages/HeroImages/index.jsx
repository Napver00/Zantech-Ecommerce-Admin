import React, { useEffect, useRef, useState } from "react";
import { Button, Spinner } from "react-bootstrap";
import { FaCloudUploadAlt, FaExternalLinkAlt, FaTimes, FaTrash, FaExpand } from "react-icons/fa";
import { toast } from "react-hot-toast";
import axiosInstance from "../../config/axios";
import usePageTitle from "../../hooks/usePageTitle";
import confirmDialog from "../../utils/confirmDialog";
import { ListHeader } from "../../components/List/List";
import { shortDate } from "../../components/List/format";
import "../../components/List/List.css";
import "./HeroImages.css";

const STORE = "https://store.zantechbd.com";
const MAX_MB = 2;
const TYPES = ["image/jpeg", "image/png", "image/gif"];

const HeroImages = () => {
  usePageTitle("Store banners");
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [queue, setQueue] = useState([]); // [{ file, url, error }]
  const [uploading, setUploading] = useState(false);
  const [over, setOver] = useState(false);
  const [deleting, setDeleting] = useState({});
  const inputRef = useRef(null);

  const load = async () => {
    try {
      const res = await axiosInstance.get("/hero-images");
      setBanners(res.data?.data || []);
    } catch {
      toast.error("Couldn't load the banners");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const addFiles = (files) => {
    const next = [...files].map((file) => {
      let error = null;
      if (!TYPES.includes(file.type)) error = "Use JPG, PNG or GIF";
      else if (file.size > MAX_MB * 1024 * 1024) error = `Over ${MAX_MB} MB, make it smaller`;
      return { file, url: URL.createObjectURL(file), error };
    });
    setQueue((q) => [...q, ...next]);
  };

  const upload = async () => {
    const ready = queue.filter((q) => !q.error);
    if (!ready.length) return;
    setUploading(true);
    let done = 0;
    for (const item of ready) {
      const fd = new FormData();
      fd.append("image", item.file);
      try {
        await axiosInstance.post("/hero-images", fd, { headers: { "Content-Type": "multipart/form-data" } });
        done += 1;
        setQueue((q) => q.filter((x) => x !== item));
      } catch (err) {
        setQueue((q) => q.map((x) => (x === item ? { ...x, error: err.response?.data?.message || "Upload failed" } : x)));
      }
    }
    setUploading(false);
    if (done) {
      toast.success(`${done} ${done === 1 ? "banner is" : "banners are"} live on the store`);
      load();
    }
  };

  const remove = async (banner, index) => {
    const last = banners.length === 1;
    if (!(await confirmDialog(last
      ? "Delete the only banner? The store's homepage slideshow will be empty."
      : `Delete banner ${index + 1}? It's removed from the store's homepage straight away.`))) return;
    setDeleting((d) => ({ ...d, [banner.id]: true }));
    try {
      await axiosInstance.delete(`/hero-images/${banner.id}`);
      setBanners((list) => list.filter((b) => b.id !== banner.id));
      toast.success("Banner deleted");
    } catch (err) {
      toast.error(err.response?.data?.message || "Couldn't delete it");
    } finally {
      setDeleting((d) => ({ ...d, [banner.id]: false }));
    }
  };

  const readyCount = queue.filter((q) => !q.error).length;

  return (
    <div className="hb-page">
      <ListHeader
        title="Store banners"
        subtitle="The slideshow at the top of the store's homepage. The newest banner shows first."
        actions={
          <a className="btn btn-outline-secondary" href={STORE} target="_blank" rel="noreferrer">
            <FaExternalLinkAlt className="me-2" aria-hidden="true" />View store
          </a>
        }
      />

      <section className="hb-upload" aria-labelledby="hb-upload-title">
        <div
          className={`hb-drop ${over ? "is-over" : ""}`}
          onDragOver={(e) => { e.preventDefault(); setOver(true); }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => { e.preventDefault(); setOver(false); addFiles(e.dataTransfer.files); }}
        >
          <input ref={inputRef} type="file" accept={TYPES.join(",")} multiple className="visually-hidden" id="hb-file"
            onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
          <FaCloudUploadAlt className="hb-drop-icon" aria-hidden="true" />
          <h2 id="hb-upload-title">Add banners</h2>
          <p>Drop images here or <button type="button" className="hb-link" onClick={() => inputRef.current?.click()}>choose files</button>.</p>
          <p className="hb-hint">Wide images work best, about 1600 × 800 (2:1). Keep text and faces in the middle; the edges are cropped on phones. JPG, PNG or GIF, up to {MAX_MB} MB each.</p>
        </div>

        {queue.length > 0 && (
          <div className="hb-queue">
            <ul>
              {queue.map((q, i) => (
                <li key={q.url} className={q.error ? "has-error" : ""}>
                  <div className="hb-frame"><img src={q.url} alt="" /></div>
                  <div className="hb-queue-meta">
                    <span className="text-truncate">{q.file.name}</span>
                    {q.error ? <span className="hb-error">{q.error}</span> : <span className="text-muted">{(q.file.size / 1024 / 1024).toFixed(1)} MB</span>}
                  </div>
                  <button type="button" className="hb-x" onClick={() => setQueue((list) => list.filter((_, k) => k !== i))} disabled={uploading} aria-label={`Remove ${q.file.name}`}>
                    <FaTimes aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
            <div className="hb-queue-actions">
              <Button variant="link" className="ed-discard" onClick={() => setQueue([])} disabled={uploading}>Clear</Button>
              <Button onClick={upload} disabled={uploading || !readyCount}>
                {uploading ? <><Spinner animation="border" size="sm" className="me-2" />Uploading…</> : `Publish ${readyCount} ${readyCount === 1 ? "banner" : "banners"}`}
              </Button>
            </div>
          </div>
        )}
      </section>

      <section aria-labelledby="hb-live-title">
        <h2 id="hb-live-title" className="hb-section-title">
          On the store now {banners.length > 0 && <span className="ls-tab-count">{banners.length}</span>}
        </h2>
        {loading ? (
          <div className="hb-grid" aria-busy="true">
            {[0, 1].map((i) => <div key={i} className="hb-card hb-skeleton" />)}
          </div>
        ) : banners.length ? (
          <ol className="hb-grid">
            {banners.map((b, i) => (
              <li key={b.id} className="hb-card">
                <a className="hb-frame" href={b.path} target="_blank" rel="noreferrer" title="Open full size">
                  <img src={b.path} alt={`Banner ${i + 1}`} loading="lazy" />
                  <span className="hb-order">{i === 0 ? "Shows first" : `Slide ${i + 1}`}</span>
                  <span className="hb-expand" aria-hidden="true"><FaExpand /></span>
                </a>
                <div className="hb-card-foot">
                  <span className="text-muted small">Added {shortDate(b.created_at)}</span>
                  <Button variant="outline-danger" size="sm" onClick={() => remove(b, i)} disabled={!!deleting[b.id]} aria-label={`Delete banner ${i + 1}`}>
                    <FaTrash className="me-1" aria-hidden="true" />Delete
                  </Button>
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <div className="empty-state">
            <p className="empty-state-title">No banners yet</p>
            <p className="empty-state-text">The store's homepage slideshow is empty. Add one above.</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default HeroImages;
