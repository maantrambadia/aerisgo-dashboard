import { useEffect, useState } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { SiteHeader } from "@/components/SiteHeader";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import api from "@/lib/axios";
import useDocumentTitle from "@/hooks/useDocumentTitle";
import { LoadFactorChart } from "@/components/charts/LoadFactorChart";
import { Plane, Users, RefreshCw } from "lucide-react";

export default function StaffDashboard() {
  useDocumentTitle("Staff Dashboard");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadFactor, setLoadFactor] = useState(null);
  const [totalFlights, setTotalFlights] = useState(0);

  useEffect(() => {
    fetchAllData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchAllData() {
    try {
      setLoading(true);
      await Promise.all([fetchLoadFactor(), fetchTotalFlights()]);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      toast.error("We couldn't load dashboard data.");
    } finally {
      setLoading(false);
    }
  }

  async function fetchLoadFactor() {
    try {
      const res = await api.get("/analytics/load-factor");
      setLoadFactor(res.data);
    } catch (err) {
      console.error("Error fetching load factor:", err);
    }
  }

  async function fetchTotalFlights() {
    try {
      const res = await api.get("/analytics/dashboard");
      const stats = res.data.overview || res.data;
      setTotalFlights(stats.totalFlights || 0);
    } catch (err) {
      console.error("Error fetching total flights:", err);
    }
  }

  async function refreshData() {
    setRefreshing(true);
    await fetchAllData();
    setRefreshing(false);
    toast.success("Dashboard refreshed");
  }

  function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  if (loading) {
    return (
      <SidebarProvider>
        <AppSidebar variant="inset" />
        <SidebarInset className="dark:bg-black/20">
          <SiteHeader />
          <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-64 w-full" />
            ))}
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset className="dark:bg-black/20">
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-6 p-4 md:p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">
                  Staff Dashboard
                </h1>
                <p className="text-muted-foreground">
                  Today's operations and flight management
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={refreshData}
                disabled={refreshing}
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="@container/card bg-gradient-to-t from-blue-500/5 to-card">
                <CardHeader>
                  <CardDescription>Total Flights</CardDescription>
                  <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                    {totalFlights}
                  </CardTitle>
                  <CardAction>
                    <Badge variant="outline">
                      <Plane className="h-3 w-3" />
                    </Badge>
                  </CardAction>
                </CardHeader>
                <CardFooter className="flex-col items-start gap-1.5 text-sm">
                  <div className="line-clamp-1 flex gap-2 font-medium">
                    All scheduled flights
                  </div>
                  <div className="text-muted-foreground">Total operations</div>
                </CardFooter>
              </Card>

              <Card className="@container/card bg-gradient-to-t from-green-500/5 to-card">
                <CardHeader>
                  <CardDescription>Load Factor</CardDescription>
                  <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                    {loadFactor?.average
                      ? `${loadFactor.average.toFixed(1)}%`
                      : "N/A"}
                  </CardTitle>
                  <CardAction>
                    <Badge variant="outline">
                      <Users className="h-3 w-3" />
                    </Badge>
                  </CardAction>
                </CardHeader>
                <CardFooter className="flex-col items-start gap-1.5 text-sm">
                  <div className="line-clamp-1 flex gap-2 font-medium">
                    Average occupancy
                  </div>
                  <div className="text-muted-foreground">
                    Across all flights
                  </div>
                </CardFooter>
              </Card>
            </div>

            {/* Load Factor Chart */}
            <LoadFactorChart data={loadFactor?.data || []} />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
