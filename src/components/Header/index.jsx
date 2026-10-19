import React, { useEffect, useState, useCallback } from "react";
import { Bell, User, LogOut, Menu, UserCircle, Search, GraduationCap } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Dropdown } from "react-bootstrap";
import { format, formatDistanceToNow } from "date-fns";
import axiosInstance from "../../config/axios";
import logo from "../../assets/zantechLogo.png";
import "./Header.css";

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
};

const Header = ({ onToggleSidebar, onOpenSearch }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unseenCount, setUnseenCount] = useState(0);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  // New course registrations from the website (polled; refreshed when one is reviewed)
  const fetchNotifications = useCallback(async () => {
    if (!localStorage.getItem("token")) return;
    try {
      const res = await axiosInstance.get("/course-registrations/notifications");
      const d = res.data.data || {};
      const unseen = d.unseen_count || 0;
      setUnseenCount(unseen);
      // Let the sidebar show the same count next to "Registrations"
      window.__ztRegistrationCount = unseen;
      window.dispatchEvent(new CustomEvent("registrations:count", { detail: unseen }));
      setNotifications(
        (d.items || []).map((r) => ({
          id: r.id,
          message: `New registration: ${r.student_name} — ${r.course?.title || "Course"}`,
          time: formatDistanceToNow(new Date(r.created_at), { addSuffix: true }),
        }))
      );
    } catch {
      // keep the last known state; the next poll retries
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const id = setInterval(fetchNotifications, 60000);
    window.addEventListener("registrations:changed", fetchNotifications);
    return () => {
      clearInterval(id);
      window.removeEventListener("registrations:changed", fetchNotifications);
    };
  }, [fetchNotifications]);

  const markAllRead = async () => {
    try {
      await axiosInstance.post("/course-registrations/mark-seen");
      fetchNotifications();
    } catch {
      // ignore
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/login");
  };

  const CustomToggle = React.forwardRef(({ children, onClick }, ref) => (
    <div
      ref={ref}
      onClick={(e) => {
        e.preventDefault();
        onClick(e);
      }}
      className="cursor-pointer"
    >
      {children}
    </div>
  ));

  return (
    <header className="header">
      <div className="header-left">
        <button className="mobile-menu-toggle" onClick={onToggleSidebar} aria-label="Toggle menu">
          <Menu size={20} />
        </button>
        <Link to="/dashboard" className="brand-container">
          <img src={logo} alt="ZAN Tech Logo" className="logo" />
          <span className="brand-name">ZAN<span>TECH</span></span>
        </Link>
        <div className="header-page-title">
          <span className="header-greeting">{greeting()}{user?.name ? `, ${user.name.split(" ")[0]}` : ""}</span>
          <span className="header-date">{format(new Date(), "EEEE, d MMM yyyy")}</span>
        </div>
      </div>

      <button className="header-search-trigger" onClick={onOpenSearch} aria-label="Search pages">
        <Search size={16} />
        <span className="header-search-trigger-text">Search pages...</span>
        <span className="header-search-trigger-kbd">Ctrl K</span>
      </button>

      <div className="header-right">
        <button className="action-button header-search-icon-only" onClick={onOpenSearch} aria-label="Search pages">
          <Search size={20} />
        </button>
        {/* Notifications */}
        <Dropdown align="end">
          <Dropdown.Toggle as={CustomToggle}>
            <div className="action-button">
              <Bell size={20} />
              {unseenCount > 0 && (
                <span className="notification-badge">
                  {unseenCount > 99 ? "99+" : unseenCount}
                </span>
              )}
            </div>
          </Dropdown.Toggle>

          <Dropdown.Menu className="mt-2 header-notifications">
            <div className="px-2 py-2 border-bottom d-flex justify-content-between align-items-center gap-2">
              <h6 className="mb-0 fw-semibold">Notifications</h6>
              {unseenCount > 0 && (
                <button type="button" className="btn btn-link btn-sm p-0 text-decoration-none" onClick={markAllRead}>
                  Mark all read
                </button>
              )}
            </div>
            {notifications.length > 0 ? (
              notifications.map((notification) => (
                <Dropdown.Item key={notification.id} as={Link} to={`/course-registrations?id=${notification.id}`}>
                  <div className="d-flex align-items-center gap-2">
                    <GraduationCap size={18} className="text-primary flex-shrink-0" />
                    <div className="flex-grow-1" style={{ whiteSpace: "normal" }}>
                      <p className="notif-text">
                        {notification.message}
                      </p>
                      <small className="text-muted">{notification.time}</small>
                    </div>
                  </div>
                </Dropdown.Item>
              ))
            ) : (
              <div className="text-center py-4">
                <Bell className="mb-2 text-secondary opacity-50" size={24} />
                <p className="mb-0 text-muted small">No new notifications</p>
              </div>
            )}
            <Dropdown.Divider className="my-1" />
            <Dropdown.Item as={Link} to="/course-registrations" className="text-center small">
              View all registrations
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>

        {/* User Profile */}
        <Dropdown align="end">
          <Dropdown.Toggle as={CustomToggle}>
            <div className="user-profile">
              <div className="user-avatar">
                {user?.name ? (
                  user.name.charAt(0).toUpperCase()
                ) : (
                  <User size={18} />
                )}
              </div>
              <div className="user-info">
                <span className="user-name">{user?.name || "Guest"}</span>
                <span className="user-role">{user?.type || "User"}</span>
              </div>
            </div>
          </Dropdown.Toggle>

          <Dropdown.Menu className="mt-2">
            <Dropdown.Header>ACCOUNT</Dropdown.Header>
            <Dropdown.Item as={Link} to="/profile">
              <UserCircle size={16} className="me-2" />
              <span>Profile</span>
            </Dropdown.Item>
            <Dropdown.Divider />
            <Dropdown.Item onClick={handleLogout} className="text-danger">
              <LogOut size={16} className="me-2" />
              <span>Logout</span>
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      </div>
    </header>
  );
};

export default Header;
