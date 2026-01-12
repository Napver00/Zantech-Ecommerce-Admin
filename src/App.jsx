import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import React from "react";
import "./App.css";
import "bootstrap/dist/css/bootstrap.min.css";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import Products from "./pages/Products";
import Categories from "./pages/Categories";
import Careers from "./pages/Career";
import AddProduct from "./pages/Products/AddProduct";
import ViewProduct from "./pages/Products/ViewProduct";
import ProductBuyingPrice from "./pages/Products/ProductBuyingPrice";
import InStockProducts from "./pages/Products/InStockProducts";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import { Toaster } from "react-hot-toast";
import Suppliers from "./pages/Suppliers";
import Challen from "./pages/Challen";
import AddChallan from "./pages/Challen/AddChallan";
import ViewChallan from "./pages/Challen/ViewChallan";
import Expenses from "./pages/Expenses";
import ViewExpense from "./pages/Expenses/ViewExpense";
import Coupons from "./pages/Coupons";
import Ratings from "./pages/Ratings";
import Customers from "./pages/Customers";
import ViewCustomer from "./pages/Customers/ViewCustomer";
import Staff from "./pages/Staff";
import Transitions from "./pages/Transitions";
import Activity from "./pages/Activity";
import AddCareer from "./pages/Career/AddCareer";
import ViewCareer from "./pages/Career/ViewCareer";
import CareerApplications from "./pages/Career/CareerApplications";
import ViewApplication from "./pages/Career/ViewApplication";
import Orders from "./pages/Orders";
import ViewOrder from "./pages/Orders/ViewOrder";
import CreateOrder from "./pages/Orders/CreateOrder";
import CustomInvoice from "./pages/Orders/CustomInvoice";
import HeroImages from "./pages/HeroImages";
import Contact from "./pages/Contact";
import { OrderProvider } from "./context/OrderContext";
import Reports from "./pages/Reports";
import NotFound from "./pages/NotFound";
import LandingPage from "./pages/LandingPage";
import AddProject from "./pages/LandingPage/AddProject";
import ViewProject from "./pages/LandingPage/ViewProject";
import Blog from "./pages/Blog";
import AddPost from "./pages/Blog/AddPost";
import ViewPost from "./pages/Blog/ViewPost";
import FAQ from "./pages/FAQ";
import Documents from "./pages/Documents";

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/login" />;
};

const App = () => {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <OrderProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/*"
            element={
              <PrivateRoute>
                <>
                  <Header />
                  <div className="main d-flex">
                    <div className="sidebarwrapper">
                      <Sidebar />
                    </div>
                    <div className="contentwrapper">
                      <Routes>
                        <Route
                          path="/"
                          element={<Navigate to="/dashboard" />}
                        />
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/profile" element={<Profile />} />
                        <Route path="/products" element={<Products />} />
                        <Route path="/products/add" element={<AddProduct />} />
                        <Route
                          path="/products/buying-price"
                          element={<ProductBuyingPrice />}
                        />
                        <Route
                          path="/products/in-stock"
                          element={<InStockProducts />}
                        />
                        <Route path="/products/:id" element={<ViewProduct />} />
                        <Route path="/categories" element={<Categories />} />
                        <Route path="/careers/add" element={<AddCareer />} />
                        <Route path="/careers/:id" element={<ViewCareer />} />
                        <Route
                          path="/careers/:id/applications"
                          element={<CareerApplications />}
                        />
                        <Route
                          path="/careers/:career_id/applications/:application_id"
                          element={<ViewApplication />}
                        />
                        <Route path="/careers" element={<Careers />} />
                        <Route path="/blog" element={<Blog />} />
                        <Route path="/blog/add" element={<AddPost />} />
                        <Route path="/blog/:slug" element={<ViewPost />} />
                        <Route path="/suppliers" element={<Suppliers />} />
                        <Route path="/customers" element={<Customers />} />
                        <Route
                          path="/customers/:id"
                          element={<ViewCustomer />}
                        />
                        <Route path="/staff" element={<Staff />} />
                        <Route path="/challens" element={<Challen />} />
                        <Route path="/challans" element={<Challen />} />
                        <Route path="/challans/add" element={<AddChallan />} />
                        <Route path="/challans/:id" element={<ViewChallan />} />
                        <Route path="/expenses" element={<Expenses />} />
                        <Route path="/expenses/:id" element={<ViewExpense />} />
                        <Route path="/coupons" element={<Coupons />} />
                        <Route path="/ratings" element={<Ratings />} />
                        <Route path="/contact" element={<Contact />} />
                        <Route path="/transitions" element={<Transitions />} />
                        <Route path="/activity" element={<Activity />} />
                        <Route path="/orders" element={<Orders />} />
                        <Route
                          path="/orders/create"
                          element={<CreateOrder />}
                        />
                        <Route
                          path="/orders/custom-invoice"
                          element={<CustomInvoice />}
                        />
                        <Route path="/orders/:id" element={<ViewOrder />} />
                        <Route path="/settings/hero" element={<HeroImages />} />
                        <Route path="/reports" element={<Reports />} />
                        <Route path="/landing" element={<LandingPage />} />
                        <Route
                          path="/settings/documents"
                          element={<Documents />}
                        />
                        <Route
                          path="/landing/projects/add"
                          element={<AddProject />}
                        />
                        <Route
                          path="/landing/projects/:slug"
                          element={<ViewProject />}
                        />
                        <Route path="/faq" element={<FAQ />} />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </div>
                  </div>
                </>
              </PrivateRoute>
            }
          />
        </Routes>
      </OrderProvider>
    </BrowserRouter>
  );
};

export default App;
