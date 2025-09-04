import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import useDocumentTitle from "@/hooks/useDocumentTitle.js";
import { useAuth } from "@/context/AuthContext.jsx";

export default function PendingApproval() {
  useDocumentTitle("Pending Approval");
  const { logout } = useAuth();
  const navigate = useNavigate();

  async function onSignOut() {
    await logout();
    navigate("/sign-in", { replace: true });
  }
  return (
    <div className="flex min-h-svh items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Request received</CardTitle>
          <CardDescription>
            Your account is pending approval by an admin.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            You will be able to access the dashboard once your account has been
            approved. Try again later or contact your administrator.
          </p>
          <div className="mt-4">
            <Button variant="outline" onClick={onSignOut} className="w-full">
              Sign out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
