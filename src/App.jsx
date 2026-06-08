// App.jsx
// This is the root component — the starting point of your entire app.
// Everything renders inside here.

// BrowserRouter — enables URL-based navigation (uses the browser's address bar)
// Routes — a container that looks at the current URL and decides which page to show
// Route — maps one specific URL path to one specific page component

import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./pages/Home";
import ProductDetail from "./pages/ProductDetail";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Admin from "./pages/Admin";
import CustomOrder from "./pages/CustomOrder";
import Orders from "./pages/Orders";
import ResetPassword from "./pages/ResetPassword";

export default function App() {
  return (
    // AuthProvider wraps everything so every page can access the logged-in user
    <AuthProvider>
      {/* BrowserRouter enables the URL system */}
      <BrowserRouter>
        {/* Navbar appears on every single page */}
        <Navbar />

        {/* Routes checks the URL and renders the matching page */}
        <Routes>

          {/* Public — anyone can visit these */}
          <Route path="/" element={<Home />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/reset-password" element={<ResetPassword />} />


          {/* Protected — must be logged in, otherwise redirected to /login */}
           {/*<Route path="/custom-order" element={
            <ProtectedRoute><CustomOrder /></ProtectedRoute>
          } />*/}
          <Route path="/orders" element={
            <ProtectedRoute><Orders /></ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute><Admin /></ProtectedRoute>
          } />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}