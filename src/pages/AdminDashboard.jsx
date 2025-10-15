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
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import api from "@/lib/axios";
import useDocumentTitle from "@/hooks/useDocumentTitle";
import { FlightsAreaChart } from "@/components/charts/FlightsAreaChart";
import { LoadFactorChart } from "@/components/charts/LoadFactorChart";
import { PunctualityChart } from "@/components/charts/PunctualityChart";
import {
  TrendingUp,
  Plane,
  Users,
  DollarSign,
  RefreshCw,
  Award,
} from "lucide-react";

export default function AdminDashboard() {
  useDocumentTitle("Admin Dashboard");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Dashboard data
  const [stats, setStats] = useState(null);
  const [flightsReport, setFlightsReport] = useState([]);
  const [flightsPeriod, setFlightsPeriod] = useState("daily");
  const [loadFactor, setLoadFactor] = useState(null);
  const [punctuality, setPunctuality] = useState(null);
  const [rewards, setRewards] = useState(null);
  const [routes, setRoutes] = useState([]);

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    fetchFlightsReport();
  }, [flightsPeriod]);

  async function fetchAllData() {
    try {
      setLoading(true);
      await Promise.all([
        fetchDashboardStats(),
        fetchFlightsReport(),
        fetchLoadFactor(),
        fetchPunctuality(),
        fetchRewards(),
        fetchRoutes(),
      ]);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }

  async function fetchDashboardStats() {
    try {
      const res = await api.get("/analytics/dashboard");
      setStats(res.data.overview || res.data);
    } catch (err) {
      console.error("Error fetching dashboard stats:", err);
    }
  }

  async function fetchFlightsReport() {
    try {
      const res = await api.get("/analytics/flights-operated", {
        params: { period: flightsPeriod },
      });
      setFlightsReport(res.data.data || []);
    } catch (err) {
      console.error("Error fetching flights report:", err);
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

  async function fetchPunctuality() {
    try {
      const res = await api.get("/analytics/punctuality");
      setPunctuality(res.data);
    } catch (err) {
      console.error("Error fetching punctuality:", err);
    }
  }

  async function fetchRewards() {
    try {
      const res = await api.get("/analytics/rewards");
      setRewards(res.data);
    } catch (err) {
      console.error("Error fetching rewards:", err);
    }
  }

  async function fetchRoutes() {
    try {
      const res = await api.get("/analytics/route-performance");
      setRoutes(res.data.data || []);
    } catch (err) {
      console.error("Error fetching routes:", err);
    }
  }

  async function refreshData() {
    setRefreshing(true);
    await fetchAllData();
    setRefreshing(false);
    toast.success("Dashboard refreshed");
  }

  if (loading) {
    return (
      <SidebarProvider>
        <AppSidebar variant="inset" />
        <SidebarInset className="dark:bg-black/20">
          <SiteHeader />
          <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
            {[...Array(6)].map((_, i) => (
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
                  Admin Dashboard
                </h1>
                <p className="text-muted-foreground">
                  Complete analytics and insights for AerisGo operations
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

            {/* Overview Stats */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card className="@container/card bg-gradient-to-t from-blue-500/5 to-card">
                <CardHeader>
                  <CardDescription>Total Flights</CardDescription>
                  <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                    {stats?.totalFlights || 0}
                  </CardTitle>
                  <CardAction>
                    <Badge variant="outline">
                      <Plane className="h-3 w-3" />
                    </Badge>
                  </CardAction>
                </CardHeader>
                <CardFooter className="flex-col items-start gap-1.5 text-sm">
                  <div className="line-clamp-1 flex gap-2 font-medium">
                    {stats?.activeFlights || 0} active today
                  </div>
                  <div className="text-muted-foreground">
                    Scheduled operations
                  </div>
                </CardFooter>
              </Card>

              <Card className="@container/card bg-gradient-to-t from-green-500/5 to-card">
                <CardHeader>
                  <CardDescription>Total Bookings</CardDescription>
                  <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                    {stats?.totalBookings || 0}
                  </CardTitle>
                  <CardAction>
                    <Badge variant="outline">
                      <TrendingUp className="h-3 w-3" />+
                      {stats?.todayBookings || 0}
                    </Badge>
                  </CardAction>
                </CardHeader>
                <CardFooter className="flex-col items-start gap-1.5 text-sm">
                  <div className="line-clamp-1 flex gap-2 font-medium">
                    {stats?.todayBookings || 0} bookings today
                  </div>
                  <div className="text-muted-foreground">
                    Customer reservations
                  </div>
                </CardFooter>
              </Card>

              <Card className="@container/card bg-gradient-to-t from-amber-500/5 to-card">
                <CardHeader>
                  <CardDescription>Total Revenue</CardDescription>
                  <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                    ₹{(stats?.totalRevenue || 0).toLocaleString("en-IN")}
                  </CardTitle>
                  <CardAction>
                    <Badge variant="outline">
                      <DollarSign className="h-3 w-3" />
                    </Badge>
                  </CardAction>
                </CardHeader>
                <CardFooter className="flex-col items-start gap-1.5 text-sm">
                  <div className="line-clamp-1 flex gap-2 font-medium">
                    ₹{(stats?.todayRevenue || 0).toLocaleString("en-IN")} today
                  </div>
                  <div className="text-muted-foreground">
                    Revenue performance
                  </div>
                </CardFooter>
              </Card>

              <Card className="@container/card bg-gradient-to-t from-purple-500/5 to-card">
                <CardHeader>
                  <CardDescription>Active Users</CardDescription>
                  <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                    {stats?.totalUsers || 0}
                  </CardTitle>
                  <CardAction>
                    <Badge variant="outline">
                      <Users className="h-3 w-3" />
                    </Badge>
                  </CardAction>
                </CardHeader>
                <CardFooter className="flex-col items-start gap-1.5 text-sm">
                  <div className="line-clamp-1 flex gap-2 font-medium">
                    Verified customers
                  </div>
                  <div className="text-muted-foreground">User engagement</div>
                </CardFooter>
              </Card>
            </div>

            {/* Flights Area Chart */}
            <FlightsAreaChart
              data={flightsReport}
              period={flightsPeriod}
              onPeriodChange={setFlightsPeriod}
            />

            {/* Load Factor & Punctuality */}
            <div className="grid gap-4 md:grid-cols-2">
              <LoadFactorChart data={loadFactor?.data || []} />
              <PunctualityChart data={punctuality} />
            </div>

            {/* Rewards & Routes */}
            <div className="grid gap-4 md:grid-cols-2">
              {/* Rewards */}
              {rewards && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="h-5 w-5" />
                      Rewards Program
                    </CardTitle>
                    <CardDescription>
                      Redemption rate:{" "}
                      <span className="font-semibold text-foreground">
                        {rewards.summary?.redemptionRate || 0}%
                      </span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                        <div>
                          <div className="text-sm text-muted-foreground">
                            Total Points Redeemed
                          </div>
                          <div className="text-2xl font-bold">
                            {rewards.summary?.totalPointsRedeemed || 0}
                          </div>
                        </div>
                        <TrendingUp className="h-8 w-8 text-green-500" />
                      </div>
                      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                        <div>
                          <div className="text-sm text-muted-foreground">
                            Total Points Earned
                          </div>
                          <div className="text-2xl font-bold">
                            {rewards.summary?.totalPointsEarned || 0}
                          </div>
                        </div>
                        <Award className="h-8 w-8 text-amber-500" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Top Routes */}
              {routes.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Top Routes
                    </CardTitle>
                    <CardDescription>
                      Best performing routes by revenue
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {routes.slice(0, 5).map((route, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className="font-bold">
                              #{idx + 1}
                            </Badge>
                            <div>
                              <div className="font-semibold">
                                {route._id.source} → {route._id.destination}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {route.totalBookings} bookings
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-green-600">
                              ₹{route.totalRevenue.toLocaleString("en-IN")}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Avg: ₹
                              {Math.round(route.avgPrice).toLocaleString(
                                "en-IN"
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
