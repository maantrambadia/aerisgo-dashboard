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
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import api from "@/lib/axios";
import useDocumentTitle from "@/hooks/useDocumentTitle";
import { useAuth } from "@/context/AuthContext";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,
  Plane,
  Users,
  DollarSign,
  Calendar,
  RefreshCw,
  Award,
  Clock,
  Percent,
} from "lucide-react";

const COLORS = ["#10b981", "#f59e0b", "#ef4444", "#3b82f6"];

export default function Dashboard() {
  useDocumentTitle("Dashboard");
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchFlightsReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flightsPeriod]);

  async function fetchAllData() {
    try {
      setLoading(true);
      await Promise.all([
        fetchDashboardStats(),
        fetchFlightsReport(),
        fetchLoadFactor(),
        fetchPunctuality(),
        isAdmin && fetchRewards(),
        isAdmin && fetchRoutes(),
      ]);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    } finally {
      setLoading(false);
    }
  }

  async function refreshData() {
    setRefreshing(true);
    await fetchAllData();
    setRefreshing(false);
    toast.success("Dashboard refreshed");
  }

  async function fetchDashboardStats() {
    try {
      const { data } = await api.get("/analytics/dashboard");
      setStats(data.overview);
    } catch (err) {
      console.error("Failed to fetch dashboard stats:", err);
    }
  }

  async function fetchFlightsReport() {
    try {
      const { data } = await api.get(
        `/analytics/flights-operated?period=${flightsPeriod}`
      );
      setFlightsReport(data.data || []);
    } catch (err) {
      console.error("Failed to fetch flights report:", err);
    }
  }

  async function fetchLoadFactor() {
    try {
      const { data } = await api.get("/analytics/load-factor?limit=10");
      setLoadFactor(data);
    } catch (err) {
      console.error("Failed to fetch load factor:", err);
    }
  }

  async function fetchPunctuality() {
    try {
      const { data } = await api.get("/analytics/punctuality");
      setPunctuality(data);
    } catch (err) {
      console.error("Failed to fetch punctuality:", err);
    }
  }

  async function fetchRewards() {
    try {
      const { data } = await api.get("/analytics/rewards");
      setRewards(data);
    } catch (err) {
      console.error("Failed to fetch rewards:", err);
    }
  }

  async function fetchRoutes() {
    try {
      const { data } = await api.get("/analytics/route-performance");
      setRoutes(data.data || []);
    } catch (err) {
      console.error("Failed to fetch routes:", err);
    }
  }

  // Format data for charts
  const formatFlightsData = () => {
    return flightsReport.map((item) => {
      let label = "";
      if (item.period.day) {
        label = `${item.period.day}/${item.period.month}`;
      } else if (item.period.week) {
        label = `W${item.period.week}`;
      } else {
        label = `M${item.period.month}`;
      }
      return {
        name: label,
        flights: item.totalFlights,
        passengers: item.totalPassengers,
        revenue: item.totalRevenue,
      };
    });
  };

  const formatPunctualityData = () => {
    if (!punctuality?.statusBreakdown) return [];
    return punctuality.statusBreakdown.map((item) => ({
      name: item._id.charAt(0).toUpperCase() + item._id.slice(1),
      value: item.count,
    }));
  };

  const formatRewardsData = () => {
    if (!rewards?.monthlyTrends) return [];
    return rewards.monthlyTrends.map((item) => ({
      name: `${item._id.month}/${item._id.year}`,
      bookings: item.totalBookings,
      points: item.totalPointsUsed,
    }));
  };

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
          <div className="@container/main flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Dashboard</h1>
                <p className="text-muted-foreground">
                  Analytics and reports for AerisGo operations
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
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Flights
                  </CardTitle>
                  <Plane className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats?.totalFlights || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {stats?.activeFlights || 0} active today
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Bookings
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats?.totalBookings || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {stats?.todayBookings || 0} today
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Revenue
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ₹{(stats?.totalRevenue || 0).toLocaleString("en-IN")}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    ₹{(stats?.todayRevenue || 0).toLocaleString("en-IN")} today
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Verified Users
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats?.totalUsers || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Active customers
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Flights Operated Report */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Flights Operated Report
                    </CardTitle>
                    <CardDescription>
                      Track flights, passengers, and revenue over time
                    </CardDescription>
                  </div>
                  <Select
                    value={flightsPeriod}
                    onValueChange={setFlightsPeriod}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={formatFlightsData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="flights"
                      stroke="#3b82f6"
                      name="Flights"
                    />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="passengers"
                      stroke="#10b981"
                      name="Passengers"
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="revenue"
                      stroke="#f59e0b"
                      name="Revenue (₹)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
              {/* Load Factor */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Percent className="h-5 w-5" />
                    Load Factor Report
                  </CardTitle>
                  <CardDescription>
                    Average: {loadFactor?.averageLoadFactor || 0}%
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {loadFactor?.data?.slice(0, 5).map((flight) => (
                      <div key={flight._id} className="flex items-center gap-3">
                        <div className="flex-1">
                          <div className="font-medium text-sm">
                            {flight.flightNumber}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {flight.source} → {flight.destination}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">{flight.loadFactor}%</div>
                          <div className="text-xs text-muted-foreground">
                            {flight.bookedSeats}/{flight.totalSeats}
                          </div>
                        </div>
                        <div className="w-24 bg-muted rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full"
                            style={{ width: `${flight.loadFactor}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Punctuality */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Flight Punctuality
                  </CardTitle>
                  <CardDescription>
                    On-time: {punctuality?.summary?.onTimePercentage || 0}%
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={formatPunctualityData()}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry) => `${entry.name}: ${entry.value}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {formatPunctualityData().map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Admin-only sections */}
            {isAdmin && (
              <>
                {/* Rewards Report */}
                {rewards && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Award className="h-5 w-5" />
                        Rewards Usage & Redemption
                      </CardTitle>
                      <CardDescription>
                        Redemption Rate: {rewards.summary?.redemptionRate || 0}%
                        • Total Points:{" "}
                        {rewards.summary?.totalPointsRedeemed || 0}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={formatRewardsData()}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar
                            dataKey="bookings"
                            fill="#3b82f6"
                            name="Bookings"
                          />
                          <Bar
                            dataKey="points"
                            fill="#10b981"
                            name="Points Used"
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}

                {/* Route Performance */}
                {routes.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Top Routes by Performance
                      </CardTitle>
                      <CardDescription>
                        Most popular routes by bookings
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {routes.slice(0, 5).map((route, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between"
                          >
                            <div className="flex items-center gap-3">
                              <Badge variant="outline">{idx + 1}</Badge>
                              <div>
                                <div className="font-medium">
                                  {route._id.source} → {route._id.destination}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {route.totalBookings} bookings
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold">
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
              </>
            )}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
