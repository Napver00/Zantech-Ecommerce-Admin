import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { Eye, EyeOff, Loader2, ArrowRight, ShoppingBag, GraduationCap, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";
import logo from "../../assets/zantechLogo.png";
import { authService } from "../../services/api";
import "./Login.css";
import usePageTitle from "../../hooks/usePageTitle";

const HIGHLIGHTS = [
  { icon: ShoppingBag, text: "Store orders, products & stock" },
  { icon: GraduationCap, text: "Courses, bootcamps & registrations" },
  { icon: BarChart3, text: "Sales, expenses & reports" },
];

const Login = () => {
  usePageTitle("Login to Your Account");
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email.trim() || !formData.password.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);

    try {
      const response = await authService.login(formData);

      localStorage.setItem("user", JSON.stringify(response.data.user));
      localStorage.setItem("token", response.data.token);

      toast.success("Login successful!");
      navigate("/dashboard");
    } catch (error) {
      toast.error(error.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* Brand panel */}
      <aside className="login-brand">
        <div className="login-brand-top">
          <img src={logo} alt="" className="login-brand-logo" />
          <div>
            <div className="login-brand-name">ZAN<span>TECH</span></div>
            <div className="login-brand-sub">Admin Console</div>
          </div>
        </div>

        <div className="login-brand-copy">
          <p className="login-eyebrow">&lt;Command center /&gt;</p>
          <h1>
            Run ZAN Tech <span>from one place.</span>
          </h1>
          <ul>
            {HIGHLIGHTS.map(({ icon: Icon, text }) => (
              <li key={text}>
                <span><Icon size={16} /></span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        <p className="login-brand-foot">© {new Date().getFullYear()} ZAN Tech · Robotics · IoT · Education</p>
      </aside>

      {/* Form */}
      <main className="login-main">
        <motion.div
          className="login-box"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="login-header">
            <img src={logo} alt="ZAN Tech Logo" className="login-logo" />
            <h2>Welcome back</h2>
            <p>Sign in to manage the store, courses and more.</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="login-field">
              <label htmlFor="email">Email address</label>
              <input
                type="email"
                id="email"
                name="email"
                className="form-control"
                value={formData.email}
                onChange={handleChange}
                placeholder="name@zantechbd.com"
                autoComplete="username"
                required
              />
            </div>

            <div className="login-field">
              <label htmlFor="password">Password</label>
              <div className="input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  className="form-control"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="form-options">
              <label className="remember-me" htmlFor="remember">
                <input type="checkbox" id="remember" className="form-check-input" />
                Remember me
              </label>
              <span className="forgot-hint">Forgot it? Ask a super admin.</span>
            </div>

            <button type="submit" className="login-button" disabled={loading}>
              {loading ? (
                <Loader2 size={20} className="spin" />
              ) : (
                <>
                  Sign in <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        </motion.div>
      </main>
    </div>
  );
};

export default Login;
