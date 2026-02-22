import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext"; // Adjust path if your context is elsewhere

const ProtectedRoute = ({ children, role }) => {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;

  // 1. Check if user is logged in
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 2. Check if user has the required role (if a role is specified)
  if (role && user.role !== role) {
    // Redirect unauthorized users based on their actual role
    if (user.role === "admin") return <Navigate to="/superAdmin" replace />;
    if (user.role === "hotel_manager") return <Navigate to="/admin" replace />;
    return <Navigate to="/" replace />;
  }

  // 3. Authorized
  return children;
};

export default ProtectedRoute;