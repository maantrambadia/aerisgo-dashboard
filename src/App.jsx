import { createBrowserRouter } from "react-router";
import SignIn from "@/pages/SignIn.jsx";
import RequestAccess from "@/pages/RequestAccess.jsx";
import PendingApproval from "@/pages/PendingApproval.jsx";
import NotFound from "@/pages/NotFound.jsx";
import RequireGuest from "@/components/RequireGuest.jsx";
import RequireAuth from "@/components/RequireAuth.jsx";
import RequireAdmin from "@/components/RequireAdmin.jsx";
import ManagementFlights from "@/pages/ManagementFlights.jsx";
import Home from "@/pages/Home.jsx";

const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <RequireAuth>
        <Home />
      </RequireAuth>
    ),
  },
  {
    path: "/sign-in",
    element: (
      <RequireGuest>
        <SignIn />
      </RequireGuest>
    ),
  },
  {
    path: "/request-access",
    element: (
      <RequireGuest>
        <RequestAccess />
      </RequireGuest>
    ),
  },
  { path: "/pending-approval", element: <PendingApproval /> },
  {
    path: "/flights",
    element: (
      <RequireAdmin>
        <ManagementFlights />
      </RequireAdmin>
    ),
  },
  { path: "*", element: <NotFound /> },
]);

export default router;
