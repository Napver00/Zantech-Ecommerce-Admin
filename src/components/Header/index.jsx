import React, { useEffect, useState } from "react";
import { Bell, User, LogOut, Menu, UserCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Dropdown } from "react-bootstrap";
import logo from "../../assets/zantechLogo.png";
import "./Header.css";

const Header = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

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
        <button className="mobile-menu-toggle">
          <Menu size={20} />
        </button>
        <Link to="/dashboard" className="brand-container">
          <img src={logo} alt="Zantech Logo" className="logo" />
          <span className="brand-name">Zantech</span>
        </Link>
      </div>

      <div className="header-right">
        {/* Notifications */}
        <Dropdown align="end">
          <Dropdown.Toggle as={CustomToggle}>
            <div className="action-button">
              <Bell size={20} />
              {notifications.length > 0 && (
                <span className="notification-badge">
                  {notifications.length}
                </span>
              )}
            </div>
          </Dropdown.Toggle>

          <Dropdown.Menu className="mt-2" style={{ minWidth: "300px" }}>
            <div className="px-3 py-2 border-bottom border-secondary border-opacity-10">
              <h6 className="mb-0 fw-semibold">Notifications</h6>
            </div>
            {notifications.length > 0 ? (
              notifications.map((notification, index) => (
                <Dropdown.Item key={index}>
                  <div className="d-flex align-items-center gap-2">
                    <div className="flex-grow-1">
                      <p className="mb-0 small text-white">
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
