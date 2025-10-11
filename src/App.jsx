import { lazy, Suspense } from "react";
import { createBrowserRouter } from "react-router";
import RequireGuest from "@/components/RequireGuest.jsx";
import RequireAuth from "@/components/RequireAuth.jsx";
import RequireAdmin from "@/components/RequireAdmin.jsx";
import RequireAdminOrStaff from "@/components/RequireAdminOrStaff.jsx";

// Lazy load pages
const SignIn = lazy(() => import("@/pages/SignIn.jsx"));
const RequestAccess = lazy(() => import("@/pages/RequestAccess.jsx"));
const PendingApproval = lazy(() => import("@/pages/PendingApproval.jsx"));
const NotFound = lazy(() => import("@/pages/NotFound.jsx"));
const ManagementFlights = lazy(() => import("@/pages/Flights.jsx"));
const Home = lazy(() => import("@/pages/Home.jsx"));
const Users = lazy(() => import("@/pages/Users.jsx"));
const Bookings = lazy(() => import("@/pages/Bookings.jsx"));

const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <RequireAuth>
        <Suspense fallback={<div>Loading...</div>}>
          <Home />
        </Suspense>
      </RequireAuth>
    ),
  },
  {
    path: "/sign-in",
    element: (
      <RequireGuest>
        <Suspense fallback={<div>Loading...</div>}>
          <SignIn />
        </Suspense>
      </RequireGuest>
    ),
  },
  {
    path: "/request-access",
    element: (
      <RequireGuest>
        <Suspense fallback={<div>Loading...</div>}>
          <RequestAccess />
        </Suspense>
      </RequireGuest>
    ),
  },
  {
    path: "/pending-approval",
    element: (
      <Suspense fallback={<div>Loading...</div>}>
        <PendingApproval />
      </Suspense>
    ),
  },
  {
    path: "/flights",
    element: (
      <RequireAdmin>
        <Suspense fallback={<div>Loading...</div>}>
          <ManagementFlights />
        </Suspense>
      </RequireAdmin>
    ),
  },
  {
    path: "/users",
    element: (
      <RequireAdmin>
        <Suspense fallback={<div>Loading...</div>}>
          <Users />
        </Suspense>
      </RequireAdmin>
    ),
  },
  {
    path: "/bookings",
    element: (
      <RequireAdminOrStaff>
        <Suspense fallback={<div>Loading...</div>}>
          <Bookings />
        </Suspense>
      </RequireAdminOrStaff>
    ),
  },
  {
    path: "*",
    element: (
      <Suspense fallback={<div>Loading...</div>}>
        <NotFound />
      </Suspense>
    ),
  },
]);

export default router;
