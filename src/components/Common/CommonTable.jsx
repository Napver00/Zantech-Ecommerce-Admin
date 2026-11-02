import React from 'react';
import { Table } from 'react-bootstrap';
import TableRow from './TableRow';
import { MdInbox } from 'react-icons/md';
import '../List/List.css';

/**
 * The admin's list table.
 *
 * headers: [{ key, label, render?, align?: 'end' | 'center', width?, nowrap? }]
 * onRowClick(row): makes each row open something (click, Enter or Space).
 * rowLabel(row): what a screen reader announces for a clickable row.
 * While loading with rows already shown, the rows stay and a thin bar runs
 * across the top, so the page doesn't jump or blur on every search keystroke.
 */
const SKELETON_ROWS = 6;

const CommonTable = ({
  headers,
  data,
  tableLoading,
  loading,
  renderActions,
  onRowClick,
  rowLabel,
  emptyTitle = 'Nothing here yet',
  emptyText = 'No records match right now. Try clearing the search or filters.',
  emptyAction = null,
}) => {
  const busy = Boolean(tableLoading || loading);
  const firstLoad = busy && data.length === 0;

  return (
    <div className={`table-container position-relative ${busy && !firstLoad ? 'is-updating' : ''}`} aria-busy={busy}>
      {busy && !firstLoad && <div className="table-updating-bar" role="progressbar" aria-label="Updating" />}

      {firstLoad ? (
        <div className="table-responsive">
          <Table className="align-middle modern-table table-skeleton" aria-hidden="true">
            <thead className="bg-light">
              <tr>
                {headers.map((h) => <th key={h.key}>{h.label}</th>)}
                {renderActions && <th><span className="visually-hidden">Actions</span></th>}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: SKELETON_ROWS }).map((_, i) => (
                <tr key={i}>
                  {headers.map((h) => <td key={h.key}><span className="skeleton-line" /></td>)}
                  {renderActions && <td><span className="skeleton-line is-short" /></td>}
                </tr>
              ))}
            </tbody>
          </Table>
          <p className="visually-hidden" role="status">Loading…</p>
        </div>
      ) : data.length > 0 ? (
        <div className="table-responsive">
          {/* On phones each row becomes a labelled card (see .table-mobile-stack) */}
          <Table hover className={`align-middle modern-table table-mobile-stack ${onRowClick ? 'has-row-links' : ''}`}>
            <thead className="bg-light">
              <tr>
                {headers.map((header) => (
                  <th
                    key={header.key}
                    className={[header.align ? `text-${header.align}` : '', header.nowrap ? 'text-nowrap' : ''].join(' ').trim() || undefined}
                    style={header.width ? { width: header.width } : undefined}
                  >
                    {header.label}
                  </th>
                ))}
                {renderActions && <th className="text-end"><span className="visually-hidden">Actions</span></th>}
              </tr>
            </thead>
            <tbody>
              {data.map((row, index) => (
                <TableRow
                  key={row.id ?? row.order_id ?? index}
                  row={row}
                  index={index}
                  headers={headers}
                  renderActions={renderActions}
                  onRowClick={onRowClick}
                  rowLabel={rowLabel}
                />
              ))}
            </tbody>
          </Table>
        </div>
      ) : (
        <div className="empty-state">
          <span className="empty-state-icon"><MdInbox size={26} /></span>
          <p className="empty-state-title">{emptyTitle}</p>
          <p className="empty-state-text">{emptyText}</p>
          {emptyAction}
        </div>
      )}
    </div>
  );
};

export default CommonTable;
