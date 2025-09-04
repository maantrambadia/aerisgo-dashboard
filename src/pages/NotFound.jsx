import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import useDocumentTitle from "@/hooks/useDocumentTitle.js";

export default function NotFound() {
  useDocumentTitle("Page Not Found");
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 p-6 text-center">
      <div>
        <h1 className="text-3xl font-bold">404 - Page not found</h1>
        <p className="text-muted-foreground">
          The page you are looking for does not exist.
        </p>
      </div>
      <div className="flex gap-3">
        <Button asChild>
          <Link to="/">Go to Dashboard</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/sign-in">Sign in</Link>
        </Button>
      </div>
    </div>
  );
}
