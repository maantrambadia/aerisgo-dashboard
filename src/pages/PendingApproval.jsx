import { useEffect } from "react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Clock, Mail } from "lucide-react";
import useDocumentTitle from "@/hooks/useDocumentTitle.js";
import { useAuth } from "@/context/AuthContext.jsx";

export default function PendingApproval() {
  useDocumentTitle("Pending Approval");
  const { logout, user, loading } = useAuth();
  const navigate = useNavigate();

  // Redirect based on auth status
  useEffect(() => {
    if (!loading) {
      if (!user) {
        // Not logged in → redirect to sign-in
        navigate("/sign-in", { replace: true });
      } else if (user.isVerified) {
        // Account verified → redirect to dashboard
        navigate("/", { replace: true });
      }
    }
  }, [user, loading, navigate]);

  async function onSignOut() {
    await logout();
    navigate("/sign-in", { replace: true });
  }

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
      </div>
    );
  }

  // Don't render if no user (will redirect)
  if (!user) {
    return null;
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center p-4 bg-gradient-to-br from-background to-muted/20">
      {/* Logo */}
      <div className="mb-8">
        <img
          src="/images/welcome-logo-2.png"
          alt="AerisGo"
          className="h-12 w-auto"
        />
      </div>

      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-yellow-100 dark:bg-yellow-900/20 flex items-center justify-center">
            <Clock className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
          </div>
          <CardTitle className="text-2xl font-bold">Pending Approval</CardTitle>
          <CardDescription className="text-base">
            Your access request is under review
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-lg bg-muted/50 p-4 space-y-2">
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium">Account Details</p>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground text-center">
              An administrator will review your request shortly. You'll receive
              access once approved.
            </p>
            <p className="text-xs text-muted-foreground text-center">
              This usually takes 24-48 hours
            </p>
          </div>

          <div className="space-y-2">
            <Button onClick={onSignOut} className="w-full" variant="default">
              Sign out
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              You can try signing in again later
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
