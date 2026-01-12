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

const TableRow = ({ row, headers, renderActions }) => {
  return (
    <tr>
      {headers.map((header) => (
        <td key={header.key} data-label={header.label}>
          {header.render ? header.render(row) : resolveValue(row, header.key)}
        </td>
      ))}
      {renderActions && (
        <td data-label="Actions" className="action-buttons">
          {renderActions(row)}
        </td>
      )}
    </tr>
  );
};

export default TableRow;