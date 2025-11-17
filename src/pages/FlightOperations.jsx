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
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { format, isToday, isTomorrow } from "date-fns";
import {
  Plane,
  RefreshCw,
  Activity,
  Search,
  MapPin,
  Clock,
  MoreVertical,
  Armchair,
  Users,
} from "lucide-react";
import FlightOperationsDialog from "@/components/flights/FlightOperationsDialog";
import ModernSeatMapDialog from "@/components/flights/ModernSeatMapDialog";
import PassengerListDialog from "@/components/flights/PassengerListDialog";

export default function FlightOperations() {
  useDocumentTitle("Flight Operations");

  const [flights, setFlights] = useState([]);
  const [filteredFlights, setFilteredFlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("today");

  const [opsDialogOpen, setOpsDialogOpen] = useState(false);
  const [seatMapDialogOpen, setSeatMapDialogOpen] = useState(false);
  const [passengerDialogOpen, setPassengerDialogOpen] = useState(false);
  const [selectedFlight, setSelectedFlight] = useState(null);

  useEffect(() => {
    fetchFlights();
  }, []);

  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flights, searchQuery, statusFilter, dateFilter]);

  async function fetchFlights() {
    try {
      setLoading(true);
      const res = await api.get("/flights", {
        params: {
          limit: 100,
          sortBy: "departureTime",
          sortOrder: "asc",
        },
      });
      setFlights(res.data.items || []);
    } catch (error) {
      console.error("Fetch flights error:", error);
      toast.error("Failed to load flights");
    } finally {
      setLoading(false);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    await fetchFlights();
    setRefreshing(false);
    toast.success("Flights refreshed");
  }

  function applyFilters() {
    let filtered = [...flights];

    // Date filter
    if (dateFilter === "today") {
      filtered = filtered.filter((f) => {
        try {
          return isToday(new Date(f.departureTime));
        } catch {
          return false;
        }
      });
    } else if (dateFilter === "tomorrow") {
      filtered = filtered.filter((f) => {
        try {
          return isTomorrow(new Date(f.departureTime));
        } catch {
          return false;
        }
      });
    } else if (dateFilter === "upcoming") {
      const now = new Date();
      filtered = filtered.filter((f) => {
        try {
          return new Date(f.departureTime) >= now;
        } catch {
          return false;
        }
      });
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((f) => f.status === statusFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (f) =>
          f.flightNumber.toLowerCase().includes(query) ||
          f.source.toLowerCase().includes(query) ||
          f.destination.toLowerCase().includes(query)
      );
    }

    setFilteredFlights(filtered);
  }

  function openFlightOps(flight) {
    setSelectedFlight(flight);
    setOpsDialogOpen(true);
  }

  function openSeatMap(flight) {
    setSelectedFlight(flight);
    setSeatMapDialogOpen(true);
  }

  function openPassengerList(flight) {
    setSelectedFlight(flight);
    setPassengerDialogOpen(true);
  }

  function getStatusVariant(status) {
    if (status === "scheduled") return "default";
    if (status === "delayed") return "warning";
    if (status === "cancelled") return "destructive";
    if (status === "completed") return "secondary";
    return "outline";
  }

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset className="dark:bg-black/20">
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2 py-4 md:gap-6 md:py-6">
            <Card className="mx-4 md:mx-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 font-bold text-2xl">
                      <Activity className="h-5 w-5" />
                      Flight Operations
                    </CardTitle>
                    <CardDescription className="mt-1.5">
                      Manage aircraft, crew, gates, and flight status
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefresh}
                    disabled={refreshing}
                  >
                    <RefreshCw
                      className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
                    />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-6 flex flex-col md:flex-row gap-3">
                  <div className="relative md:w-[300px]">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Flight number, route..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>

                  <Select value={dateFilter} onValueChange={setDateFilter}>
                    <SelectTrigger className="w-full md:w-[180px]">
                      <SelectValue placeholder="Select date" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="tomorrow">Tomorrow</SelectItem>
                      <SelectItem value="upcoming">All Upcoming</SelectItem>
                      <SelectItem value="all">All Flights</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full md:w-[180px]">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="delayed">Delayed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="mb-4 text-sm text-muted-foreground">
                  Showing {filteredFlights.length} flight
                  {filteredFlights.length !== 1 && "s"}
                </div>

                {loading ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex items-center gap-4">
                        <Skeleton className="h-12 w-12 rounded-md" />
                        <div className="space-y-2 flex-1">
                          <Skeleton className="h-4 w-[250px]" />
                          <Skeleton className="h-3 w-[200px]" />
                        </div>
                        <Skeleton className="h-9 w-20" />
                      </div>
                    ))}
                  </div>
                ) : filteredFlights.length === 0 ? (
                  <div className="text-center py-12">
                    <Plane className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      No flights found matching your filters
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="min-w-[140px]">
                            Flight
                          </TableHead>
                          <TableHead className="min-w-[180px]">Route</TableHead>
                          <TableHead className="min-w-[160px]">
                            Departure
                          </TableHead>
                          <TableHead className="min-w-[120px]">Gate</TableHead>
                          <TableHead className="min-w-[100px]">
                            Status
                          </TableHead>
                          <TableHead className="text-right min-w-[80px]">
                            Actions
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredFlights.map((flight) => (
                          <TableRow key={flight._id}>
                            <TableCell>
                              <div className="font-mono font-semibold">
                                {flight.flightNumber}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {flight.aircraftType}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <MapPin className="h-3 w-3 text-muted-foreground" />
                                <span className="font-medium">
                                  {flight.source}
                                </span>
                                <span className="text-muted-foreground">→</span>
                                <span className="font-medium">
                                  {flight.destination}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Clock className="h-3 w-3 text-muted-foreground" />
                                <div>
                                  <div className="text-sm">
                                    {format(
                                      new Date(flight.departureTime),
                                      "dd MMM yyyy"
                                    )}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {format(
                                      new Date(flight.departureTime),
                                      "HH:mm"
                                    )}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {flight.gate ? (
                                <Badge variant="outline" className="font-mono">
                                  {flight.gate}
                                </Badge>
                              ) : (
                                <span className="text-xs text-muted-foreground">
                                  Not assigned
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={getStatusVariant(flight.status)}
                                className="capitalize"
                              >
                                {flight.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                  >
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => openSeatMap(flight)}
                                  >
                                    <Armchair className="mr-2 h-4 w-4" />
                                    View Seat Map
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => openPassengerList(flight)}
                                  >
                                    <Users className="mr-2 h-4 w-4" />
                                    Passenger List
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => openFlightOps(flight)}
                                  >
                                    <Activity className="mr-2 h-4 w-4" />
                                    Flight Operations
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <FlightOperationsDialog
          open={opsDialogOpen}
          onOpenChange={setOpsDialogOpen}
          flight={selectedFlight}
          onUpdate={fetchFlights}
        />

        <ModernSeatMapDialog
          open={seatMapDialogOpen}
          onOpenChange={setSeatMapDialogOpen}
          flight={selectedFlight}
        />

        <PassengerListDialog
          open={passengerDialogOpen}
          onOpenChange={setPassengerDialogOpen}
          flight={selectedFlight}
        />
      </SidebarInset>
    </SidebarProvider>
  );
}
