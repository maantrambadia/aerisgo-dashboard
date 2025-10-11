import { Navigate, useLocation } from "react-router";
import { useAuth } from "@/context/AuthContext.jsx";

export default function RequireAdminOrStaff({ children }) {
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

  const role = user.role?.toLowerCase?.();
  if (role !== "admin" && role !== "staff") {
    const from = location.state?.from?.pathname;
    return <Navigate to={from || "/"} replace />;
  }

  return children;
}
