import { Navigate, useLocation } from "react-router";
import { useAuth } from "@/context/AuthContext.jsx";

export default function RequireAdmin({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/sign-in" state={{ from: location }} replace />;
  }

  if (!user.isVerified) {
    return <Navigate to="/pending-approval" replace />;
  }

  if (user.role !== "admin") {
    // Not authorized for admin-only routes
    const from = location.state?.from?.pathname;
    // If they came from somewhere else, go back, else go to home
    return <Navigate to={from || "/"} replace />;
  }

  return children;
}
