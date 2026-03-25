// ProtectedRoute.jsx
// Wraps around pages that require login.
// If not logged in → redirect to /login
// If logged in → show the page

import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { user } = useAuth();

  // user is null when nobody is logged in
  // Navigate replaces the current page with /login
  // replace={true} means the back button won't loop them back here
  if (!user) return <Navigate to="/login" replace />;

  // user exists — show whatever page is wrapped inside ProtectedRoute
  return children;
}