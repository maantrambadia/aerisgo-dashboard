import { Navigate, useLocation } from "react-router";
import { useAuth } from "@/context/AuthContext.jsx";

export default function RequireGuest({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
      </div>
    );
  }

  if (user) {
    // If already signed in, send to appropriate page
    if (user.isVerified) return <Navigate to="/" replace />;
    return (
      <Navigate to="/pending-approval" state={{ from: location }} replace />
    );
  }

  return children;
}
