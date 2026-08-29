import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { MdSearch, MdClose, MdSubdirectoryArrowLeft } from "react-icons/md";
import { FLAT_NAV_ITEMS } from "../../config/navigation";
import "./CommandPalette.css";

const CommandPalette = ({ show, onClose }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return FLAT_NAV_ITEMS;
    return FLAT_NAV_ITEMS.filter(
      (item) => item.label.toLowerCase().includes(q) || item.group.toLowerCase().includes(q)
    );
  }, [query]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query, show]);

  useEffect(() => {
    if (show) {
      setQuery("");
      // Let the overlay mount before focusing
      const id = setTimeout(() => inputRef.current?.focus(), 30);
      return () => clearTimeout(id);
    }
  }, [show]);

  const go = useCallback(
    (path) => {
      navigate(path);
      onClose();
    },
    [navigate, onClose]
  );

  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      onClose();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (results[activeIndex]) go(results[activeIndex].path);
    }
  };

  if (!show) return null;

  return (
    <div className="command-palette-overlay" onMouseDown={onClose}>
      <div className="command-palette" onMouseDown={(e) => e.stopPropagation()}>
        <div className="command-palette-input-row">
          <MdSearch size={20} className="command-palette-search-icon" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Jump to a page... (Products, Course Invoices, Reports, ...)"
            aria-label="Search all pages"
          />
          <button className="command-palette-close" onClick={onClose} aria-label="Close">
            <MdClose size={18} />
          </button>
        </div>
        <div className="command-palette-results">
          {results.length === 0 ? (
            <div className="command-palette-empty">No pages match "{query}"</div>
          ) : (
            results.map((item, i) => (
              <button
                key={item.path + item.label}
                className={`command-palette-item ${i === activeIndex ? "active" : ""}`}
                onMouseEnter={() => setActiveIndex(i)}
                onClick={() => go(item.path)}
              >
                <span className="command-palette-item-icon">{item.icon && <item.icon size={18} />}</span>
                <span className="command-palette-item-text">
                  <span className="command-palette-item-label">{item.label}</span>
                  <span className="command-palette-item-group">{item.group}</span>
                </span>
                {i === activeIndex && <MdSubdirectoryArrowLeft size={16} className="command-palette-item-enter" />}
              </button>
            ))
          )}
        </div>
        <div className="command-palette-footer">
          <span><kbd>↑</kbd><kbd>↓</kbd> navigate</span>
          <span><kbd>Enter</kbd> select</span>
          <span><kbd>Esc</kbd> close</span>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
