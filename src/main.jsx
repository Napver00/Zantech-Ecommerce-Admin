import React from 'react';
import ReactDOM from 'react-dom/client';
// Bootstrap first, then the ZAN Tech theme, then the app (page stylesheets
// come in with App and can still fine-tune their own screens).
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import './index.css';
import App from './App.jsx';


ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
