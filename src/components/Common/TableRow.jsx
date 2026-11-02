import React from 'react';

// Helper to resolve nested properties using dot notation safely
const resolveValue = (obj, key) => {
  if (!key) return '';
  // If key contains dot, walk the object
  if (key.includes('.')) {
    return key.split('.').reduce((acc, part) => {
      if (acc === null || acc === undefined) return '';
      return acc[part];
    }, obj) ?? '';
  }

  return obj[key] ?? '';
};

// Clicks on buttons, links, inputs or menus inside a row do their own thing,
// not open the row.
const isControl = (target) => target.closest('button, a, input, select, textarea, label, [role="button"], .dropdown-menu');

const TableRow = ({ row, index, headers, renderActions, onRowClick, rowLabel }) => {
  const clickable = typeof onRowClick === 'function';

  const handleClick = (e) => {
    if (!clickable || isControl(e.target)) return;
    if (window.getSelection()?.toString()) return; // selecting text, not opening
    onRowClick(row, e);
  };

  const handleKey = (e) => {
    if (!clickable || e.target !== e.currentTarget) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onRowClick(row, e);
    }
  };

  return (
    <tr
      className={clickable ? 'is-clickable' : undefined}
      onClick={clickable ? handleClick : undefined}
      onKeyDown={clickable ? handleKey : undefined}
      tabIndex={clickable ? 0 : undefined}
      aria-label={clickable && rowLabel ? rowLabel(row) : undefined}
    >
      {headers.map((header) => (
        <td
          key={header.key}
          data-label={header.label}
          className={[header.align ? `text-${header.align}` : '', header.nowrap ? 'text-nowrap' : ''].join(' ').trim() || undefined}
        >
          {header.render ? header.render(row, index) : resolveValue(row, header.key)}
        </td>
      ))}
      {renderActions && (
        <td data-label="Actions" className="action-buttons text-end">
          {renderActions(row)}
        </td>
      )}
    </tr>
  );
};

export default TableRow;
