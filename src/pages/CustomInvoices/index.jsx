import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "react-bootstrap";
import { FaPlus, FaChevronRight } from "react-icons/fa";
import { toast } from "react-hot-toast";
import axiosInstance from "../../config/axios";
import usePageTitle from "../../hooks/usePageTitle";
import CommonTable from "../../components/Common/CommonTable";
import { ListHeader, ListCard, ListToolbar, SearchBox, FilterTabs, ResultCount, Pager, Pill } from "../../components/List/List";
import { taka, shortDate } from "../../components/List/format";
import { STATUS } from "./ViewCustomInvoice";
import "../../components/List/List.css";

const CustomInvoices = () => {
  usePageTitle("Custom invoices");
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [pagination, setPagination] = useState({ total: 0, last_page: 1 });

  useEffect(() => {
    const t = setTimeout(() => { setQuery(search.trim()); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/custom-invoices", { params: { page, limit, ...(query && { search: query }), ...(status && { status }) } });
      setRows(res.data?.data || []);
      setSummary(res.data?.summary || null);
      setPagination(res.data?.pagination || { total: 0, last_page: 1 });
    } catch {
      toast.error("Couldn't load invoices");
    } finally {
      setLoading(false);
    }
  }, [page, limit, query, status]);

  useEffect(() => { load(); }, [load]);

  const c = summary?.counts || {};
  const all = Object.values(c).reduce((a, b) => a + b, 0);
  const tabs = [
    { value: "", label: "All", count: summary ? all : null },
    ...["due", "partial", "paid", "void"].map((s) => ({ value: s, label: STATUS[s].label, count: summary ? c[s] || 0 : null })),
  ];
  const today = new Date().toISOString().slice(0, 10);

  const headers = [
    {
      key: "invoice_no",
      label: "Invoice",
      render: (row) => (
        <>
          <span className="ls-cell-main">{row.title}</span>
          <span className="ls-cell-sub">{row.invoice_no}{row.project_name ? ` · ${row.project_name}` : ""}</span>
        </>
      ),
    },
    {
      key: "client_name",
      label: "Client",
      render: (row) => (
        <>
          <span className="d-block">{row.client_name}</span>
          {row.client_phone && <span className="ls-cell-sub">{row.client_phone}</span>}
        </>
      ),
    },
    { key: "issue_date", label: "Issued", nowrap: true, render: (row) => shortDate(row.issue_date) },
    {
      key: "status",
      label: "Status",
      render: (row) => {
        const overdue = ["due", "partial"].includes(row.status) && row.due_date && String(row.due_date).slice(0, 10) < today;
        const s = STATUS[row.status] || STATUS.due;
        return <Pill tone={overdue ? "bad" : s.tone}>{overdue ? "Overdue" : s.label}</Pill>;
      },
    },
    {
      key: "total",
      label: "Total",
      align: "end",
      nowrap: true,
      render: (row) => (
        <>
          <span className="ls-money d-block">{taka(row.total)}</span>
          {Number(row.due_amount) > 0 && row.status !== "void" && <span className="ls-cell-sub text-danger">{taka(row.due_amount)} due</span>}
        </>
      ),
    },
  ];

  const newButton = <Button onClick={() => navigate("/custom-invoices/new")}><FaPlus className="me-2" aria-hidden="true" />New invoice</Button>;

  return (
    <div className="cvl-page">
      <ListHeader
        title="Custom invoices"
        subtitle={`R&D projects, equipment, software and services. Payments and advances go to Income in the account site.${summary?.outstanding ? ` ${taka(summary.outstanding)} is waiting to be paid.` : ""}`}
        actions={newButton}
      />
      <ListCard>
        <FilterTabs label="Status" value={status} onChange={(v) => { setStatus(v); setPage(1); }} tabs={tabs} />
        <ListToolbar end={<ResultCount page={page} perPage={limit} total={pagination.total || 0} noun="invoices" />}>
          <SearchBox value={search} onChange={setSearch} placeholder="Invoice number, title, project or client" busy={loading && !!query} />
        </ListToolbar>
        <CommonTable
          headers={headers}
          data={rows}
          tableLoading={loading}
          loading={loading}
          renderActions={() => <FaChevronRight className="text-muted" aria-hidden="true" />}
          onRowClick={(row) => navigate(`/custom-invoices/${row.id}`)}
          rowLabel={(row) => `Open ${row.invoice_no}`}
          emptyTitle={query || status ? "No invoices match" : "No custom invoices yet"}
          emptyText={query || status ? "Try another search or tab." : "Create one for an R&D project or any work that isn't a store order."}
          emptyAction={!query && !status && newButton}
        />
        <Pager page={page} lastPage={pagination.last_page || 1} onPage={setPage} perPage={limit} onPerPage={(n) => { setLimit(n); setPage(1); }} />
      </ListCard>
    </div>
  );
};

export default CustomInvoices;
