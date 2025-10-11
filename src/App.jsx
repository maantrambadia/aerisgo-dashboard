import { lazy, Suspense } from "react";
import { createBrowserRouter } from "react-router";
import RequireGuest from "@/components/RequireGuest.jsx";
import RequireAuth from "@/components/RequireAuth.jsx";
import RequireAdmin from "@/components/RequireAdmin.jsx";
import RequireAdminOrStaff from "@/components/RequireAdminOrStaff.jsx";
import LoadingFallback from "@/components/LoadingFallback.jsx";

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
        <Suspense fallback={<LoadingFallback />}>
          <Home />
        </Suspense>
      </RequireAuth>
    ),
  },
  {
    path: "/sign-in",
    element: (
      <RequireGuest>
        <Suspense fallback={<LoadingFallback />}>
          <SignIn />
        </Suspense>
      </RequireGuest>
    ),
  },
  {
    path: "/request-access",
    element: (
      <RequireGuest>
        <Suspense fallback={<LoadingFallback />}>
          <RequestAccess />
        </Suspense>
      </RequireGuest>
    ),
  },
  {
    path: "/pending-approval",
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <PendingApproval />
      </Suspense>
    ),
  },
  {
    path: "/flights",
    element: (
      <RequireAdmin>
        <Suspense fallback={<LoadingFallback />}>
          <ManagementFlights />
        </Suspense>
      </RequireAdmin>
    ),
  },
  {
    path: "/users",
    element: (
      <RequireAdmin>
        <Suspense fallback={<LoadingFallback />}>
          <Users />
        </Suspense>
      </RequireAdmin>
    ),
  },
  {
    path: "/bookings",
    element: (
      <RequireAdminOrStaff>
        <Suspense fallback={<LoadingFallback />}>
          <Bookings />
        </Suspense>
      </RequireAdminOrStaff>
    ),
  },
  {
    path: "*",
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <NotFound />
      </Suspense>
    ),
  },
]);

export default router;
