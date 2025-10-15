import { useAuth } from "@/context/AuthContext";
import AdminDashboard from "./AdminDashboard";
import StaffDashboard from "./StaffDashboard";

export default function Home() {
  const { user } = useAuth();

  // Route to appropriate dashboard based on role
  if (user?.role === "admin") {
    return <AdminDashboard />;
  }

  // Staff and other roles get the staff dashboard
  return <StaffDashboard />;
}
