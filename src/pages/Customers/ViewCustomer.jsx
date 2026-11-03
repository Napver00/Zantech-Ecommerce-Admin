import React, { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaArrowLeft, FaPlus, FaPen, FaPhoneAlt, FaEnvelope, FaMapMarkerAlt, FaChevronRight } from "react-icons/fa";
import { toast } from "react-hot-toast";
import { Button } from "react-bootstrap";
import axiosInstance from "../../config/axios";
import Loading from "../../components/Loading";
import AddShippingAddressModal from "../../components/Customers/AddShippingAddressModal";
import EditShippingAddressModal from "../../components/Customers/EditShippingAddressModal";
import CommonTable from "../../components/Common/CommonTable";
import { FilterTabs, Pager, Pill } from "../../components/List/List";
import { taka, shortDate, timeAgo, fullDate } from "../../components/List/format";
import { ORDER_STATUSES, orderStatusOf } from "../../components/List/orderStatus";
import "../../components/List/List.css";
import "../../components/Editor/Editor.css";
import "./CustomerDetail.css";
import usePageTitle from "../../hooks/usePageTitle";

const ORDERS_PER_PAGE = 10;

const ViewCustomer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState(null);

  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [orderStatus, setOrderStatus] = useState("");
  const [orderPage, setOrderPage] = useState(1);
  const [orderPages, setOrderPages] = useState(1);
  const [orderCounts, setOrderCounts] = useState(null);

  usePageTitle(customer?.user?.name || "Customer");

  useEffect(() => {
    (async () => {
      try {
        const res = await axiosInstance.get(`/clints/all-info/${id}`);
        if (!res.data.success) throw new Error(res.data.message);
        setCustomer(res.data.data[0]);
      } catch (err) {
        toast.error(err.response?.data?.message || "Couldn't load this customer");
        navigate("/customers");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, navigate]);

  const loadOrders = useCallback(async () => {
    setOrdersLoading(true);
    try {
      const res = await axiosInstance.get("/orders", {
        params: { user_id: id, page: orderPage, limit: ORDERS_PER_PAGE, ...(orderStatus !== "" && { status: orderStatus }) },
      });
      setOrders(res.data?.data || []);
      setOrderPages(res.data?.pagination?.total_pages || res.data?.pagination?.last_page || 1);
      if (res.data?.status_summary) setOrderCounts(res.data.status_summary);
    } catch {
      setOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  }, [id, orderPage, orderStatus]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  if (loading) return <Loading />;
  if (!customer) return null;

  const { user, shipping_addresses: addresses = [], order_summary: orderSummary = {}, payment_summary: paymentSummary = {} } = customer;
  const due = Number(paymentSummary.due_amount) || 0;
  const totalOrders = orderCounts
    ? ORDER_STATUSES.reduce((n, s) => n + (Number(orderCounts[s.key]) || 0), 0)
    : Number(orderSummary.total_orders) || 0;
  const initials = (user.name || "?").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  const tabs = [
    { value: "", label: "All", count: orderCounts ? totalOrders : null },
    ...ORDER_STATUSES.filter((s) => !orderCounts || Number(orderCounts[s.key]) > 0).map((s) => ({
      value: s.value,
      label: s.label,
      count: orderCounts ? orderCounts[s.key] : null,
    })),
  ];

  const headers = [
    {
      key: "invoice_code",
      label: "Order",
      render: (row) => (
        <>
          <span className="ls-cell-main">{row.invoice_code}</span>
          <span className="ls-cell-sub" title={fullDate(row.order_placed_date_time)}>{timeAgo(row.order_placed_date_time)}</span>
        </>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (row) => {
        const s = orderStatusOf(row.status);
        return <Pill tone={s.tone}>{s.label}</Pill>;
      },
    },
    {
      key: "total_amount",
      label: "Total",
      align: "end",
      nowrap: true,
      render: (row) => (
        <>
          <span className="ls-money d-block">{taka(row.total_amount)}</span>
          {Number(row.due_amount) > 0 ? (
            <span className="ls-cell-sub text-danger">{taka(row.due_amount)} due</span>
          ) : (
            <span className="ls-cell-sub">Paid</span>
          )}
        </>
      ),
    },
  ];

  return (
    <div className="cd-page">
      <button type="button" className="ed-back cd-back" onClick={() => navigate("/customers")}>
        <FaArrowLeft aria-hidden="true" /> Customers
      </button>

      <header className="cd-head">
        <span className="cd-avatar" aria-hidden="true">{initials}</span>
        <div className="cd-head-text">
          <h1>{user.name}</h1>
          <p>Customer #{user.id} · joined {shortDate(user.created_at)}</p>
        </div>
        <div className="cd-head-actions">
          {user.phone && (
            <a className="btn btn-outline-secondary" href={`tel:${user.phone}`}>
              <FaPhoneAlt className="me-2" aria-hidden="true" />Call
            </a>
          )}
          <Button onClick={() => navigate(`/orders/create?customer=${user.id}`)}>
            <FaPlus className="me-2" aria-hidden="true" />New order
          </Button>
        </div>
      </header>

      <dl className="cd-stats">
        <div>
          <dt>Orders</dt>
          <dd>{totalOrders.toLocaleString()}</dd>
        </div>
        <div>
          <dt>Spent</dt>
          <dd>{taka(orderSummary.total_spend)}</dd>
          <span className="cd-stat-note">Completed orders</span>
        </div>
        <div className={due > 0 ? "is-due" : ""}>
          <dt>Owes</dt>
          <dd>{due > 0 ? taka(due) : "Nothing"}</dd>
          {due > 0 && <span className="cd-stat-note">Across unpaid orders</span>}
        </div>
      </dl>

      <div className="cd-body">
        <section className="cd-card cd-orders" aria-labelledby="cd-orders-title">
          <div className="cd-card-head">
            <h2 id="cd-orders-title">Orders</h2>
          </div>
          {(totalOrders > 0 || orderStatus !== "") && (
            <FilterTabs
              label="Filter this customer's orders"
              value={orderStatus}
              onChange={(v) => {
                setOrderStatus(v);
                setOrderPage(1);
              }}
              tabs={tabs}
            />
          )}
          <CommonTable
            headers={headers}
            data={orders}
            tableLoading={ordersLoading}
            loading={ordersLoading}
            renderActions={() => <FaChevronRight className="text-muted" aria-hidden="true" />}
            onRowClick={(row) => navigate(`/orders/${row.order_id}`)}
            rowLabel={(row) => `Open order ${row.invoice_code}`}
            emptyTitle={orderStatus !== "" ? "No orders with this status" : "No orders yet"}
            emptyText={orderStatus !== "" ? "Pick another tab to see the rest." : "Orders placed on the store or from the admin show up here."}
            emptyAction={
              orderStatus === "" && (
                <Button size="sm" onClick={() => navigate(`/orders/create?customer=${user.id}`)}>
                  <FaPlus className="me-1" aria-hidden="true" /> New order
                </Button>
              )
            }
          />
          <Pager page={orderPage} lastPage={orderPages} onPage={setOrderPage} />
        </section>

        <aside className="cd-side">
          <section className="cd-card" aria-labelledby="cd-contact-title">
            <div className="cd-card-head">
              <h2 id="cd-contact-title">Contact</h2>
            </div>
            <ul className="cd-contact">
              <li>
                <FaPhoneAlt aria-hidden="true" />
                {user.phone ? <a href={`tel:${user.phone}`}>{user.phone}</a> : <span className="text-muted">No phone</span>}
              </li>
              <li>
                <FaEnvelope aria-hidden="true" />
                {user.email ? <a href={`mailto:${user.email}`}>{user.email}</a> : <span className="text-muted">No email</span>}
              </li>
              {user.address && (
                <li>
                  <FaMapMarkerAlt aria-hidden="true" />
                  <span>{user.address}</span>
                </li>
              )}
            </ul>
          </section>

          <section className="cd-card" aria-labelledby="cd-addr-title">
            <div className="cd-card-head">
              <h2 id="cd-addr-title">
                Delivery addresses {addresses.length > 0 && <span className="ed-count">{addresses.length}</span>}
              </h2>
              <Button size="sm" variant="outline-primary" onClick={() => setShowAdd(true)}>
                <FaPlus className="me-1" aria-hidden="true" />Add
              </Button>
            </div>
            {addresses.length ? (
              <ul className="cd-addresses">
                {addresses.map((a) => (
                  <li key={a.id}>
                    <div>
                      <strong className="d-block">{[a.f_name, a.l_name].filter(Boolean).join(" ") || user.name}</strong>
                      <span className="d-block">{a.address}</span>
                      <span className="d-block text-muted">{[a.city, a.zip].filter(Boolean).join(" ")}</span>
                      {a.phone && <span className="d-block text-muted">{a.phone}</span>}
                    </div>
                    <button type="button" className="cd-icon-btn" onClick={() => setEditing(a)} aria-label="Edit this address" title="Edit">
                      <FaPen aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="cd-empty">No saved address. Add one so orders from the admin can be delivered.</p>
            )}
          </section>
        </aside>
      </div>

      <AddShippingAddressModal
        show={showAdd}
        onHide={() => setShowAdd(false)}
        userId={user.id}
        onAdd={(a) => setCustomer((c) => ({ ...c, shipping_addresses: [...(c.shipping_addresses || []), a] }))}
      />
      {editing && (
        <EditShippingAddressModal
          show
          onHide={() => setEditing(null)}
          address={editing}
          onUpdate={(a) => {
            setCustomer((c) => ({ ...c, shipping_addresses: c.shipping_addresses.map((x) => (x.id === a.id ? a : x)) }));
            setEditing(null);
          }}
        />
      )}
    </div>
  );
};

export default ViewCustomer;
