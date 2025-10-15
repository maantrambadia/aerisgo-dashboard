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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import api from "@/lib/axios";
import useDocumentTitle from "@/hooks/useDocumentTitle";
import { LoadFactorChart } from "@/components/charts/LoadFactorChart";
import {
  Plane,
  Users,
  RefreshCw,
  Calendar,
  MapPin,
  Clock,
  User,
  Armchair,
} from "lucide-react";

export default function StaffDashboard() {
  useDocumentTitle("Staff Dashboard");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [todayFlights, setTodayFlights] = useState([]);
  const [loadFactor, setLoadFactor] = useState(null);
  const [totalFlights, setTotalFlights] = useState(0);
  const [selectedFlight, setSelectedFlight] = useState(null);
  const [passengers, setPassengers] = useState([]);
  const [loadingPassengers, setLoadingPassengers] = useState(false);

  useEffect(() => {
    fetchAllData();
  }, []);

  async function fetchAllData() {
    try {
      setLoading(true);
      await Promise.all([
        fetchTodayFlights(),
        fetchLoadFactor(),
        fetchTotalFlights(),
      ]);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }

  async function fetchTodayFlights() {
    try {
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
      const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();

      const res = await api.get("/flights", {
        params: {
          dateFrom: startOfDay,
          dateTo: endOfDay,
          limit: 100, // Get more flights for today
        },
      });

      // Filter for scheduled and delayed flights on client side
      const flights = (res.data.items || []).filter(
        (flight) => flight.status === "scheduled" || flight.status === "delayed"
      );
      setTodayFlights(flights);
    } catch (err) {
      console.error("Error fetching today's flights:", err);
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

  async function fetchPassengers(flightId) {
    try {
      setLoadingPassengers(true);
      const res = await api.get(`/bookings/passengers/${flightId}`);
      setPassengers(res.data.passengers || []);
    } catch (err) {
      console.error("Error fetching passengers:", err);
      toast.error("Failed to load passenger list");
    } finally {
      setLoadingPassengers(false);
    }
  }

  async function refreshData() {
    setRefreshing(true);
    await fetchAllData();
    setRefreshing(false);
    toast.success("Dashboard refreshed");
  }

  function handleViewPassengers(flight) {
    setSelectedFlight(flight);
    fetchPassengers(flight._id);
  }

  function getStatusColor(status) {
    switch (status) {
      case "scheduled":
        return "bg-green-500/10 text-green-700 border-green-500/20";
      case "delayed":
        return "bg-yellow-500/10 text-yellow-700 border-yellow-500/20";
      case "cancelled":
        return "bg-red-500/10 text-red-700 border-red-500/20";
      case "completed":
        return "bg-blue-500/10 text-blue-700 border-blue-500/20";
      default:
        return "bg-gray-500/10 text-gray-700 border-gray-500/20";
    }
  }

  function formatTime(dateString) {
    return new Date(dateString).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  }

  function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  // Generate seat map visualization
  function renderSeatMap() {
    if (!passengers.length) return null;

    const seatMap = {};
    passengers.forEach((p) => {
      seatMap[p.seatNumber] = p;
    });

    // A320 Neo layout: 30 rows, 6 seats per row (A-F)
    const rows = [];
    for (let row = 1; row <= 30; row++) {
      const seats = ["A", "B", "C", "D", "E", "F"].map((letter) => {
        const seatNumber = `${row}${letter}`;
        const passenger = seatMap[seatNumber];
        return { seatNumber, passenger };
      });
      rows.push({ row, seats });
    }

    const getRowClass = (row) => {
      if (row <= 2) return "First Class";
      if (row <= 7) return "Business";
      return "Economy";
    };

    return (
      <div className="space-y-2">
        <div className="flex items-center gap-4 text-xs mb-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-primary rounded" />
            <span>Booked</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-muted border rounded" />
            <span>Available</span>
          </div>
        </div>
        <div className="max-h-[400px] overflow-y-auto space-y-1">
          {rows.map(({ row, seats }) => (
            <div key={row} className="flex items-center gap-2">
              <div className="w-8 text-xs text-muted-foreground text-right">
                {row}
              </div>
              <div className="flex gap-1">
                {seats.slice(0, 3).map(({ seatNumber, passenger }) => (
                  <div
                    key={seatNumber}
                    className={`w-6 h-6 rounded text-[8px] flex items-center justify-center ${
                      passenger
                        ? "bg-primary text-primary-foreground font-semibold"
                        : "bg-muted border"
                    }`}
                    title={passenger ? passenger.userId?.name : "Available"}
                  >
                    {seatNumber.slice(-1)}
                  </div>
                ))}
                <div className="w-4" />
                {seats.slice(3, 6).map(({ seatNumber, passenger }) => (
                  <div
                    key={seatNumber}
                    className={`w-6 h-6 rounded text-[8px] flex items-center justify-center ${
                      passenger
                        ? "bg-primary text-primary-foreground font-semibold"
                        : "bg-muted border"
                    }`}
                    title={passenger ? passenger.userId?.name : "Available"}
                  >
                    {seatNumber.slice(-1)}
                  </div>
                ))}
              </div>
              {[1, 3, 8].includes(row) && (
                <div className="text-[10px] text-muted-foreground ml-2">
                  {getRowClass(row)}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
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
                  <CardDescription>Today's Flights</CardDescription>
                  <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                    {todayFlights.length}
                  </CardTitle>
                  <CardAction>
                    <Badge variant="outline">
                      <Calendar className="h-3 w-3" />
                    </Badge>
                  </CardAction>
                </CardHeader>
                <CardFooter className="flex-col items-start gap-1.5 text-sm">
                  <div className="line-clamp-1 flex gap-2 font-medium">
                    {formatDate(new Date())}
                  </div>
                  <div className="text-muted-foreground">
                    Active operations today
                  </div>
                </CardFooter>
              </Card>
            </div>

            {/* Load Factor Chart */}
            <LoadFactorChart data={loadFactor?.data || []} />

            {/* Today's Flights */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Today's Flight Operations
                </CardTitle>
                <CardDescription>
                  View passenger lists and seat maps for today's flights
                </CardDescription>
              </CardHeader>
              <CardContent>
                {todayFlights.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Plane className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="font-medium">
                      No flights scheduled for today
                    </p>
                    <p className="text-sm mt-2">
                      {formatDate(new Date())} - Create flights in the Flights
                      page
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {todayFlights.map((flight) => (
                      <div
                        key={flight._id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-3">
                            <div className="font-semibold text-lg">
                              {flight.flightNumber}
                            </div>
                            <Badge
                              variant="outline"
                              className={getStatusColor(flight.status)}
                            >
                              {flight.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              <span>
                                {flight.source} → {flight.destination}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              <span>
                                {formatTime(flight.departureTime)} -{" "}
                                {formatTime(flight.arrivalTime)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewPassengers(flight)}
                        >
                          <Users className="h-4 w-4 mr-2" />
                          View Passengers
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </SidebarInset>

      {/* Passenger List & Seat Map Dialog */}
      <Dialog
        open={!!selectedFlight}
        onOpenChange={() => setSelectedFlight(null)}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plane className="h-5 w-5" />
              {selectedFlight?.flightNumber} - Passenger List
            </DialogTitle>
            <DialogDescription>
              {selectedFlight?.source} → {selectedFlight?.destination} •{" "}
              {selectedFlight && formatDate(selectedFlight.departureTime)}
            </DialogDescription>
          </DialogHeader>

          {loadingPassengers ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Tabs
              defaultValue="list"
              className="flex-1 overflow-hidden flex flex-col"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="list">
                  <Users className="h-4 w-4 mr-2" />
                  Passenger List ({passengers.length})
                </TabsTrigger>
                <TabsTrigger value="seatmap">
                  <Armchair className="h-4 w-4 mr-2" />
                  Seat Map
                </TabsTrigger>
              </TabsList>

              <TabsContent value="list" className="flex-1 overflow-y-auto mt-4">
                {passengers.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No passengers booked yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {passengers.map((booking, idx) => (
                      <div
                        key={booking._id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-sm">
                            {idx + 1}
                          </div>
                          <div>
                            <div className="font-medium">
                              {booking.userId?.name || "N/A"}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {booking.userId?.email}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-sm font-medium">
                              Seat {booking.seatNumber}
                            </div>
                            <div className="text-xs text-muted-foreground capitalize">
                              {booking.travelClass}
                            </div>
                          </div>
                          <Badge variant="outline">{booking.status}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent
                value="seatmap"
                className="flex-1 overflow-y-auto mt-4"
              >
                {renderSeatMap()}
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}
