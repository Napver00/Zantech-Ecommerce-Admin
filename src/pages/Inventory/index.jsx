import React, { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { FaBoxOpen, FaTools } from "react-icons/fa";
import axiosInstance from "../../config/axios";
import usePageTitle from "../../hooks/usePageTitle";
import { ListHeader } from "../../components/List/List";
import "../../components/List/List.css";
import "../Customers/CustomerDetail.css";
import "../LandingPage/Landing.css";
import "./Inventory.css";
import ProductStock from "./ProductStock";
import ItemStock from "./ItemStock";

const Inventory = () => {
  usePageTitle("Inventory");
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") === "items" ? "items" : "products";
  const [summary, setSummary] = useState(null);

  const loadSummary = useCallback(() => {
    axiosInstance.get("/inventory/summary").then((res) => setSummary(res.data?.data)).catch(() => {});
  }, []);

  useEffect(() => { loadSummary(); }, [loadSummary]);

  const p = summary?.products;
  const it = summary?.items;

  return (
    <div className="iv-page">
      <ListHeader
        title="Inventory"
        subtitle="What's really in stock. Store products can show customers a different number; equipment and supplies are counted here but never sold."
      />

      {summary && (
        <dl className="cd-stats iv-stats">
          <div className={p.out ? "is-due" : ""}>
            <dt>Out of stock</dt>
            <dd>{p.out}</dd>
            <span className="cd-stat-note">store products</span>
          </div>
          <div>
            <dt>Running low</dt>
            <dd>{p.low}</dd>
            <span className="cd-stat-note">{summary.low_threshold} or fewer left</span>
          </div>
          <div>
            <dt>Units on hand</dt>
            <dd>{p.units.toLocaleString()}</dd>
            <span className="cd-stat-note">across {p.total} products</span>
          </div>
          <div className={it.low + it.out ? "is-due" : ""}>
            <dt>Equipment to restock</dt>
            <dd>{it.low + it.out}</dd>
            <span className="cd-stat-note">of {it.total} items</span>
          </div>
        </dl>
      )}

      <nav className="lp-sections iv-sections" aria-label="Inventory sections">
        <button type="button" className={`lp-section ${tab === "products" ? "is-active" : ""}`} aria-current={tab === "products" ? "page" : undefined}
          onClick={() => setParams({})}>
          <FaBoxOpen aria-hidden="true" />
          <span><strong>Store products</strong><small>Real stock and what customers see</small></span>
        </button>
        <button type="button" className={`lp-section ${tab === "items" ? "is-active" : ""}`} aria-current={tab === "items" ? "page" : undefined}
          onClick={() => setParams({ tab: "items" })}>
          <FaTools aria-hidden="true" />
          <span><strong>Equipment &amp; supplies</strong><small>Kept, not sold</small></span>
        </button>
      </nav>

      {tab === "products" ? <ProductStock summary={summary} onChanged={loadSummary} /> : <ItemStock summary={summary} onChanged={loadSummary} />}
    </div>
  );
};

export default Inventory;
