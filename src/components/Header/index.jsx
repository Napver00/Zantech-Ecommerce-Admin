import React, { useEffect, useState, useRef } from 'react';
import { FaUserCircle, FaSignOutAlt, FaUser, FaBell } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import { Dropdown, Badge } from 'react-bootstrap';
import logo from '../../assets/zantechLogo.png';

const styles = `
  .hover-bg-light:hover {
    background-color: rgba(0, 0, 0, 0.05);
  }
`;

const styleSheet = document.createElement("style");
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);

const Header = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/login');
  };

  const CustomToggle = React.forwardRef(({ children, onClick }, ref) => (
    <div
      ref={ref}
      onClick={(e) => {
        e.preventDefault();
        onClick(e);
      }}
      className="d-flex align-items-center gap-2 cursor-pointer"
      style={{ cursor: 'pointer' }}
    >
      {children}
    </div>
  ));

  return (
    <header className="border-bottom bg-white shadow-sm py-2 sticky-top">
      <div className="container-fluid px-4">
        <div className="d-flex justify-content-between align-items-center h-100">
          {/* Logo and Brand */}
          <Link to="/dashboard" className="d-flex align-items-center text-decoration-none">
            <img src={logo} alt="Zantech Logo" className="logo" style={{ height: '40px', objectFit: 'contain' }} />
            <span className="ms-3 fw-bold text-primary fs-4" style={{ letterSpacing: '0.5px' }}>Zantech</span>
          </Link>

          {/* Right Side Items */}
          <div className="d-flex align-items-center gap-4">
            {/* Notifications */}
            <Dropdown align="end">
              <Dropdown.Toggle as={CustomToggle}>
                <div className="position-relative p-2 rounded-circle hover-bg-light" style={{ transition: 'background-color 0.2s' }}>
                  <FaBell className="fs-5 text-secondary" />
                  {notifications.length > 0 && (
                    <Badge 
                      bg="danger" 
                      pill 
                      className="position-absolute top-0 start-100 translate-middle"
                      style={{ fontSize: '0.65rem', padding: '0.25em 0.5em' }}
                    >
                      {notifications.length}
                    </Badge>
                  )}
                </div>
              </Dropdown.Toggle>

              <Dropdown.Menu className="shadow-lg border-0 rounded-3 mt-2" style={{ minWidth: '280px' }}>
                <div className="px-3 py-2 border-bottom">
                  <h6 className="mb-0 fw-semibold">Notifications</h6>
                </div>
                {notifications.length > 0 ? (
                  notifications.map((notification, index) => (
                    <Dropdown.Item key={index} className="py-2 px-3 hover-bg-light">
                      <div className="d-flex align-items-center gap-2">
                        <div className="flex-grow-1">
                          <p className="mb-0 small">{notification.message}</p>
                          <small className="text-muted">{notification.time}</small>
                        </div>
                      </div>
                    </Dropdown.Item>
                  ))
                ) : (
                  <Dropdown.Item className="text-center text-muted py-4">
                    <FaBell className="fs-4 mb-2 text-secondary opacity-50" />
                    <p className="mb-0">No new notifications</p>
                  </Dropdown.Item>
                )}
              </Dropdown.Menu>
            </Dropdown>

            {/* User Profile */}
            <Dropdown align="end">
              <Dropdown.Toggle as={CustomToggle}>
                <div className="d-flex align-items-center gap-2 p-2 rounded-3 hover-bg-light" style={{ transition: 'background-color 0.2s' }}>
                  <div className="rounded-circle bg-light p-2">
                    <FaUserCircle className="fs-4 text-primary" />
                  </div>
                  <div className="d-none d-md-block text-start">
                    <h6 className="mb-0 fw-semibold text-dark">{user?.name || 'Guest'}</h6>
                    <small className="text-muted" style={{ fontSize: '0.8rem' }}>{user?.type || 'User'}</small>
                  </div>
                </div>
              </Dropdown.Toggle>

              <Dropdown.Menu className="shadow-lg border-0 rounded-3 mt-2" style={{ minWidth: '220px' }}>
                <Dropdown.Item as={Link} to="/profile" className="py-2 px-3 hover-bg-light">
                  <div className="d-flex align-items-center gap-2">
                    <FaUser className="text-primary" />
                    <span className="fw-medium">Profile</span>
                  </div>
                </Dropdown.Item>
                <Dropdown.Divider className="my-1" />
                <Dropdown.Item onClick={handleLogout} className="py-2 px-3 hover-bg-light text-danger">
                  <div className="d-flex align-items-center gap-2">
                    <FaSignOutAlt />
                    <span className="fw-medium">Logout</span>
                  </div>
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
