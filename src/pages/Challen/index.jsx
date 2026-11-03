import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FaPlus, FaChevronRight, FaTimes } from "react-icons/fa";
import { toast } from "react-hot-toast";
import { Button } from "react-bootstrap";
import axiosInstance from "../../config/axios";
import usePageTitle from "../../hooks/usePageTitle";
import CommonTable from "../../components/Common/CommonTable";
import { ListHeader, ListCard, ListToolbar, SearchBox, ResultCount, Pager } from "../../components/List/List";
import { taka, shortDate } from "../../components/List/format";
import "../../components/List/List.css";

const Challans = () => {
  usePageTitle("Challans");
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [params] = useSearchParams();
  const [search, setSearch] = useState(() => params.get("search") || "");
  const [query, setQuery] = useState(() => (params.get("search") || "").trim());
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [pagination, setPagination] = useState({ total_rows: 0, total_pages: 1 });

  // Wait for a pause in typing before searching.
  useEffect(() => {
    const t = setTimeout(() => {
      setQuery(search.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/challans", {
        params: { page, limit, ...(query && { search: query }), ...(from && { start_date: from }), ...(to && { end_date: to }) },
      });
      setRows(res.data?.data || []);
      setPagination(res.data?.pagination || { total_rows: 0, total_pages: 1 });
    } catch (err) {
      toast.error(err.response?.data?.message || "Couldn't load challans");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [page, limit, query, from, to]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = !!(query || from || to);

  const headers = [
    {
      key: "id",
      label: "Challan",
      render: (row) => (
        <>
          <span className="ls-cell-main">#{row.id}</span>
          <span className="ls-cell-sub">{shortDate(row.Date)}</span>
        </>
      ),
    },
    {
      key: "supplier",
      label: "Supplier",
      render: (row) =>
        row.supplier ? (
          <>
            <span className="d-block">{row.supplier.name}</span>
            {row.supplier.phone && <span className="ls-cell-sub">{row.supplier.phone}</span>}
          </>
        ) : (
          <span className="text-muted">No supplier</span>
        ),
    },
    {
      key: "items_count",
      label: "Products",
      nowrap: true,
      render: (row) => (row.items_count != null ? `${row.items_count} ${Number(row.items_count) === 1 ? "line" : "lines"}` : "—"),
    },
    {
      key: "total",
      label: "Total",
      align: "end",
      nowrap: true,
      render: (row) => (
        <>
          <span className="ls-money d-block">{taka(row.total)}</span>
          {Number(row.delivery_price) > 0 && <span className="ls-cell-sub">incl. {taka(row.delivery_price)} delivery</span>}
        </>
      ),
    },
  ];

  const addNew = () => navigate("/challans/add");

  return (
    <div className="challans-page">
      <ListHeader
        title="Challans"
        subtitle="Stock bought from suppliers. Saving a challan adds the products to stock and books the cost as an expense."
        actions={<Button onClick={addNew}><FaPlus className="me-2" aria-hidden="true" />New challan</Button>}
      />

      <ListCard>
        <ListToolbar end={<ResultCount page={page} perPage={limit} total={pagination.total_rows || 0} noun="challans" />}>
          <SearchBox value={search} onChange={setSearch} placeholder="Supplier, phone or challan number" busy={loading && !!query} />
          <div className="ls-dates" role="group" aria-label="Challan date">
            <span>From</span>
            <input type="date" value={from} max={to || undefined} onChange={(e) => { setFrom(e.target.value); setPage(1); }} aria-label="From date" />
            <span>to</span>
            <input type="date" value={to} min={from || undefined} onChange={(e) => { setTo(e.target.value); setPage(1); }} aria-label="To date" />
            {(from || to) && (
              <button type="button" onClick={() => { setFrom(""); setTo(""); setPage(1); }} aria-label="Clear dates"><FaTimes /></button>
            )}
          </div>
        </ListToolbar>

        <CommonTable
          headers={headers}
          data={rows}
          tableLoading={loading}
          loading={loading}
          renderActions={() => <FaChevronRight className="text-muted" aria-hidden="true" />}
          onRowClick={(row) => navigate(`/challans/${row.id}`)}
          rowLabel={(row) => `Open challan #${row.id}${row.supplier ? ` from ${row.supplier.name}` : ""}`}
          emptyTitle={filtered ? "No challans match" : "No challans yet"}
          emptyText={filtered ? "Try another supplier or clear the dates." : "Record stock you buy from suppliers to keep stock and costs right."}
          emptyAction={!filtered && <Button size="sm" onClick={addNew}><FaPlus className="me-1" aria-hidden="true" /> New challan</Button>}
        />

        <Pager
          page={page}
          lastPage={pagination.total_pages || 1}
          onPage={setPage}
          perPage={limit}
          onPerPage={(n) => { setLimit(n); setPage(1); }}
        />
      </ListCard>
    </div>
  );
};

export default Challans;
