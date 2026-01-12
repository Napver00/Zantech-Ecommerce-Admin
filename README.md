# Zantech Dashboard

Zantech Dashboard is a comprehensive administrative dashboard built with React for managing an e-commerce platform. It provides a user-friendly interface for tracking sales, managing orders, products, customers, and much more.

## Features

  * **Dashboard Overview:** Get a quick overview of your store's performance with key metrics like total orders, sales, and recent activities.
  * **Order Management:** View, track, and manage all customer orders. Update order statuses, view payment information, and generate invoices.
  * **Product Management:** Add, edit, and delete products. Manage product details, images, categories, and bundle products.
  * **Customer Management:** View and manage your customer base. Track customer order history and contact information.
  * **Inventory Management:** Manage suppliers, challans, and expenses to keep your inventory up-to-date.
  * **Reporting and Analytics:** Gain insights into your sales and expenses with detailed reports and charts.
  * **Landing Page Management:** Manage content for your landing page, including hero images, projects, and company information.

## Tech Stack

  * **Frontend:** React, Vite, React Router
  * **Styling:** Bootstrap, React-Bootstrap, CSS
  * **State Management:** React Context API
  * **HTTP Client:** Axios
  * **Charting:** Recharts
  * **Notifications:** React Hot Toast

## Getting Started

### Prerequisites

  * Node.js (v18.0.0 or higher)
  * npm (v8.0.0 or higher)

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/nakib00/zantechdashboardreact.git
    ```
2.  Navigate to the project directory:
    ```bash
    cd zantechdashboardreact
    ```
3.  Install the dependencies:
    ```bash
    npm install
    ```

### Running the Project

To run the project in development mode, use the following command:

```bash
npm run dev
```

This will start the development server at `http://localhost:5173`.

## Available Scripts

  * `npm run dev`: Starts the development server.
  * `npm run build`: Builds the app for production to the `dist` folder.
  * `npm run lint`: Lints the project files.
  * `npm run preview`: Serves the production build locally for preview.

## Project Structure

```
zantechDashboardReact/
├── public/
│   └── vite.svg
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── Challan/
│   │   ├── Customers/
│   │   ├── Dashboard/
│   │   ├── Header/
│   │   ├── Orders/
│   │   ├── Products/
│   │   ├── Sidebar/
│   │   ├── InvoiceDocument.jsx
│   │   └── Loading.jsx
│   ├── config/
│   │   └── axios.js
│   ├── context/
│   │   └── OrderContext.jsx
│   ├── hooks/
│   │   ├── useAuth.js
│   │   └── usePageTitle.js
│   ├── pages/
│   │   ├── Activity/
│   │   ├── Categories/
│   │   ├── Challan/
│   │   ├── Contact/
│   │   ├── Coupons/
│   │   ├── Customers/
│   │   ├── Dashboard/
│   │   ├── Expenses/
│   │   ├── HeroImages/
│   │   ├── LandingPage/
│   │   ├── Login/
│   │   ├── NotFound/
│   │   ├── Orders/
│   │   ├── Products/
│   │   ├── Profile/
│   │   ├── Ratings/
│   │   ├── Reports/
│   │   ├── Staff/
│   │   ├── Suppliers/
│   │   └── Transitions/
│   ├── services/
│   │   └── api.js
│   ├── App.css
│   ├── App.jsx
│   ├── index.css
│   └── main.jsx
├── .gitignore
├── index.html
├── package.json
└── vite.config.js
```# Zantech-Ecommerce-Admin
