import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
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
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import api from "@/lib/axios";
import useDocumentTitle from "@/hooks/useDocumentTitle";
import { format } from "date-fns";
import {
  Plus,
  Edit3,
  Trash2,
  RefreshCw,
  Plane,
  MoreVertical,
  Armchair,
  Users,
  Activity,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext.jsx";
import { getAllAirports } from "@/lib/airports";
import ModernSeatMapDialog from "@/components/flights/ModernSeatMapDialog";
import PassengerListDialog from "@/components/flights/PassengerListDialog";
import FlightOperationsDialog from "@/components/flights/FlightOperationsDialog";

export default function ManagementFlights() {
  useDocumentTitle("Flights Management");

  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [limit] = useState(10);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);

  const [q] = useState("");
  const [source] = useState("");
  const [destination] = useState("");
  const [status] = useState("");
  const [dateFrom] = useState("");
  const [dateTo] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const [flightNumberValue, setFlightNumberValue] = useState("");
  const [sourceValue, setSourceValue] = useState("");
  const [destinationValue, setDestinationValue] = useState("");

  // Airports state
  const [airports, setAirports] = useState([]);
  const [airportsLoading, setAirportsLoading] = useState(false);

  // Aircraft state
  const [aircraft, setAircraft] = useState([]);
  const [aircraftLoading, setAircraftLoading] = useState(false);

  // Delete dialog state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Seat Map & Passenger List state
  const [seatMapDialogOpen, setSeatMapDialogOpen] = useState(false);
  const [passengerDialogOpen, setPassengerDialogOpen] = useState(false);
  const [opsDialogOpen, setOpsDialogOpen] = useState(false);
  const [selectedFlight, setSelectedFlight] = useState(null);

  // Controlled status for the Sheet form using shadcn Select
  const [statusValue, setStatusValue] = useState("scheduled");

  const filters = useMemo(
    () => ({ q, source, destination, status, dateFrom, dateTo }),
    [q, source, destination, status, dateFrom, dateTo]
  );

  // Load airports and aircraft on mount
  useEffect(() => {
    const loadAirports = async () => {
      try {
        setAirportsLoading(true);
        const data = await getAllAirports();
        setAirports(data);
      } catch (error) {
        console.error("Failed to load airports:", error);
        toast.error("Failed to load airports data");
      } finally {
        setAirportsLoading(false);
      }
    };

    const loadAircraft = async () => {
      try {
        setAircraftLoading(true);
        const { data } = await api.get("/aircraft?limit=100&status=active");
        setAircraft(data.aircraft || []);
      } catch (error) {
        console.error("Failed to load aircraft:", error);
        toast.error("Failed to load aircraft data");
      } finally {
        setAircraftLoading(false);
      }
    };

    loadAirports();
    loadAircraft();
  }, []);

  async function fetchFlights(opts = {}) {
    const params = new URLSearchParams();
    params.set("page", String(opts.page ?? page));
    params.set("limit", String(opts.limit ?? limit));
    if (q) params.set("q", q);
    if (source) params.set("source", source);
    if (destination) params.set("destination", destination);
    if (status) params.set("status", status);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);

    try {
      if (!loading) setFetching(true);
      const { data } = await api.get(`/flights?${params.toString()}`);
      setItems(Array.isArray(data.items) ? data.items : []);
      setTotal(data.total || 0);
      setPage(data.page || 1);
      setPages(data.pages || 1);
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to fetch flights";
      toast.error(msg);
    } finally {
      setLoading(false);
      setFetching(false);
    }
  }

  useEffect(() => {
    fetchFlights({ page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, limit]);

  function openCreate() {
    setEditing(null);
    setDrawerOpen(true);
    setStatusValue("scheduled");
    setFlightNumberValue("");
    setSourceValue("");
    setDestinationValue("");
  }
  function openEdit(f) {
    setEditing(f);
    setDrawerOpen(true);
    setStatusValue(f?.status || "scheduled");
    setFlightNumberValue(f?.flightNumber || "");
    setSourceValue(f?.source || "");
    setDestinationValue(f?.destination || "");
  }

  function requestDelete(f) {
    setDeleteTarget(f);
    setDeleteOpen(true);
  }

  function openSeatMap(flight) {
    setSelectedFlight(flight);
    setSeatMapDialogOpen(true);
  }

  function openPassengerList(flight) {
    setSelectedFlight(flight);
    setPassengerDialogOpen(true);
  }

  function openFlightOps(flight) {
    setSelectedFlight(flight);
    setOpsDialogOpen(true);
  }

  async function confirmDelete() {
    if (!deleteTarget?._id) return setDeleteOpen(false);
    try {
      await api.delete(`/flights/${deleteTarget._id}`);
      toast.success("Flight deleted");
      setDeleteOpen(false);
      setDeleteTarget(null);
      fetchFlights();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Delete failed");
    }
  }

  async function onSubmit(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);

    // Build payload from form data
    const payload = Object.fromEntries(fd);

    // Add Select values that aren't in FormData
    payload.flightNumber = flightNumberValue;
    payload.source = sourceValue;
    payload.destination = destinationValue;
    payload.status = statusValue;

    // Convert datetime-local input to UTC for database storage
    // Browser automatically handles timezone conversion
    if (payload.departureTime) {
      payload.departureTime = new Date(payload.departureTime).toISOString();
    }
    if (payload.arrivalTime) {
      payload.arrivalTime = new Date(payload.arrivalTime).toISOString();
    }

    try {
      setSaving(true);
      if (editing?._id) {
        // When editing, only send the fields that can be changed
        const updatePayload = {
          departureTime: payload.departureTime,
          arrivalTime: payload.arrivalTime,
          status: payload.status,
        };
        await api.put(`/flights/${editing._id}`, updatePayload);
        toast.success("Flight updated");
      } else {
        // When creating, force status to 'scheduled'
        payload.status = "scheduled";
        await api.post(`/flights`, payload);
        toast.success("Flight created with seats");
      }
      setDrawerOpen(false);
      fetchFlights();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  // Filter flights by status tab
  const filteredItems = items.filter((flight) => {
    if (activeTab === "all") return true;
    return flight.status === activeTab;
  });

  // Count flights by status
  const counts = {
    all: items.length,
    scheduled: items.filter((f) => f.status === "scheduled").length,
    delayed: items.filter((f) => f.status === "delayed").length,
    cancelled: items.filter((f) => f.status === "cancelled").length,
    completed: items.filter((f) => f.status === "completed").length,
  };

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
                      <Plane className="h-5 w-5" />
                      Flights Management
                    </CardTitle>
                    <CardDescription className="mt-1.5">
                      Manage flight schedules, routes, and availability
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchFlights()}
                      disabled={fetching}
                    >
                      <RefreshCw
                        className={`h-4 w-4 ${fetching ? "animate-spin" : ""}`}
                      />
                    </Button>
                    {isAdmin && (
                      <Button size="sm" onClick={openCreate}>
                        <Plus className="mr-2 h-4 w-4" />
                        <span className="hidden sm:inline">Add Flight</span>
                        <span className="sm:hidden">Add</span>
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="inline-flex h-10 items-center justify-start rounded-md bg-muted p-1 text-muted-foreground w-full overflow-x-auto mb-6">
                    <TabsTrigger value="all" className="relative">
                      All
                      <Badge
                        variant="secondary"
                        className="ml-2 px-1.5 py-0 text-xs"
                      >
                        {counts.all}
                      </Badge>
                    </TabsTrigger>
                    <TabsTrigger value="scheduled" className="relative">
                      Scheduled
                      <Badge
                        variant="secondary"
                        className="ml-2 px-1.5 py-0 text-xs"
                      >
                        {counts.scheduled}
                      </Badge>
                    </TabsTrigger>
                    <TabsTrigger value="delayed" className="relative">
                      Delayed
                      <Badge
                        variant="secondary"
                        className="ml-2 px-1.5 py-0 text-xs"
                      >
                        {counts.delayed}
                      </Badge>
                    </TabsTrigger>
                    <TabsTrigger value="cancelled" className="relative">
                      Cancelled
                      <Badge
                        variant="secondary"
                        className="ml-2 px-1.5 py-0 text-xs"
                      >
                        {counts.cancelled}
                      </Badge>
                    </TabsTrigger>
                    <TabsTrigger value="completed" className="relative">
                      Completed
                      <Badge
                        variant="secondary"
                        className="ml-2 px-1.5 py-0 text-xs"
                      >
                        {counts.completed}
                      </Badge>
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value={activeTab} className="mt-0">
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
                    ) : filteredItems.length === 0 ? (
                      <div className="text-center py-12">
                        <Plane className="mx-auto h-12 w-12 text-muted-foreground/50" />
                        <p className="mt-4 text-sm text-muted-foreground">
                          No {activeTab !== "all" ? activeTab : ""} flights
                          found
                        </p>
                      </div>
                    ) : (
                      <div className="rounded-md border overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="min-w-[100px]">
                                Flight #
                              </TableHead>
                              <TableHead className="min-w-[180px]">
                                Route
                              </TableHead>
                              <TableHead className="min-w-[160px]">
                                Departure
                              </TableHead>
                              <TableHead className="min-w-[160px]">
                                Arrival
                              </TableHead>
                              <TableHead className="min-w-[100px]">
                                Fare
                              </TableHead>
                              <TableHead className="min-w-[100px]">
                                Status
                              </TableHead>
                              {isAdmin && (
                                <TableHead className="text-right min-w-[100px]">
                                  Actions
                                </TableHead>
                              )}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredItems.map((f) => (
                              <TableRow key={f._id}>
                                <TableCell className="font-medium">
                                  {f.flightNumber}
                                </TableCell>
                                <TableCell>
                                  {f.source} → {f.destination}
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                  {f.departureTime
                                    ? format(
                                        new Date(f.departureTime),
                                        "dd MMM yyyy, HH:mm"
                                      )
                                    : "-"}
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                  {f.arrivalTime
                                    ? format(
                                        new Date(f.arrivalTime),
                                        "dd MMM yyyy, HH:mm"
                                      )
                                    : "-"}
                                </TableCell>
                                <TableCell>
                                  ₹
                                  {Number(f.baseFare || 0).toLocaleString(
                                    "en-IN"
                                  )}
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant={
                                      f.status === "scheduled"
                                        ? "default"
                                        : f.status === "delayed"
                                        ? "secondary"
                                        : f.status === "completed"
                                        ? "outline"
                                        : "destructive"
                                    }
                                    className="capitalize"
                                  >
                                    {f.status}
                                  </Badge>
                                </TableCell>
                                {isAdmin && (
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
                                        <DropdownMenuLabel>
                                          Actions
                                        </DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                          onClick={() =>
                                            navigate(
                                              `/flights/${f._id}/seat-map`
                                            )
                                          }
                                        >
                                          <Activity className="mr-2 h-4 w-4" />
                                          Real-time Seat Map
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          onClick={() => openSeatMap(f)}
                                        >
                                          <Armchair className="mr-2 h-4 w-4" />
                                          View Seat Map
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          onClick={() => openPassengerList(f)}
                                        >
                                          <Users className="mr-2 h-4 w-4" />
                                          Passenger List
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          onClick={() => openFlightOps(f)}
                                        >
                                          <Activity className="mr-2 h-4 w-4" />
                                          Flight Operations
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                          onClick={() => openEdit(f)}
                                          disabled={
                                            f.status === "cancelled" ||
                                            f.status === "completed"
                                          }
                                        >
                                          <Edit3 className="mr-2 h-4 w-4" />
                                          Edit Flight
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          onClick={() => requestDelete(f)}
                                          className="text-destructive focus:text-destructive"
                                        >
                                          <Trash2 className="mr-2 h-4 w-4" />
                                          Delete Flight
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </TableCell>
                                )}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                    {/* Pagination */}
                    {pages > 1 && (
                      <div className="mt-4 flex items-center justify-between">
                        <div className="text-xs text-muted-foreground">
                          Page {page} of {pages} • {total} total flights
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={page <= 1}
                            onClick={() => fetchFlights({ page: page - 1 })}
                          >
                            Previous
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={page >= pages}
                            onClick={() => fetchFlights({ page: page + 1 })}
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Create/Edit Dialog */}
        <Dialog open={drawerOpen} onOpenChange={setDrawerOpen}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editing ? `Edit ${editing.flightNumber}` : "Add Flight"}
              </DialogTitle>
              <DialogDescription>
                {editing
                  ? "Update flight information and schedule"
                  : "Create a new flight with route and schedule details"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={onSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="flightNumber">
                    Aircraft Registration Number
                  </Label>
                  <Select
                    value={flightNumberValue}
                    onValueChange={setFlightNumberValue}
                    disabled={!!editing || aircraftLoading}
                  >
                    <SelectTrigger id="flightNumber" className="w-full">
                      <SelectValue placeholder="Select aircraft" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {aircraftLoading ? (
                        <SelectItem value="loading" disabled>
                          Loading aircraft...
                        </SelectItem>
                      ) : aircraft.length === 0 ? (
                        <SelectItem value="none" disabled>
                          No active aircraft available
                        </SelectItem>
                      ) : (
                        aircraft.map((ac) => (
                          <SelectItem key={ac._id} value={ac.flightNumber}>
                            {ac.flightNumber} ({ac.registrationNumber}) -{" "}
                            {ac.aircraftType}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Select aircraft by flight number
                  </p>
                </div>
                {!!editing && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Flight number cannot be changed
                  </p>
                )}
                <div className="grid gap-2">
                  <Label htmlFor="source">Source</Label>
                  <Select
                    value={sourceValue}
                    onValueChange={setSourceValue}
                    disabled={!!editing || airportsLoading}
                  >
                    <SelectTrigger id="source" className="w-full">
                      <SelectValue
                        placeholder={
                          airportsLoading
                            ? "Loading airports..."
                            : "Select source city"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {airports.map((airport) => (
                        <SelectItem key={airport.code} value={airport.city}>
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {airport.city} ({airport.code})
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {airport.name}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {!!editing && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Source cannot be changed
                    </p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="destination">Destination</Label>
                  <Select
                    value={destinationValue}
                    onValueChange={setDestinationValue}
                    disabled={!!editing || airportsLoading}
                  >
                    <SelectTrigger id="destination" className="w-full">
                      <SelectValue
                        placeholder={
                          airportsLoading
                            ? "Loading airports..."
                            : "Select destination city"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {airports.map((airport) => (
                        <SelectItem key={airport.code} value={airport.city}>
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {airport.city} ({airport.code})
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {airport.name}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {!!editing && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Destination cannot be changed
                    </p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="aircraftType">Aircraft Type</Label>
                  <Input
                    id="aircraftType"
                    name="aircraftType"
                    value="A320 Neo"
                    disabled
                    className="w-full bg-muted"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    All AerisGo flights use A320 Neo aircraft
                  </p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="departureTime">Departure Time</Label>
                  <Input
                    id="departureTime"
                    name="departureTime"
                    type="datetime-local"
                    placeholder="Select departure date and time"
                    className="w-full"
                    defaultValue={
                      editing?.departureTime
                        ? (() => {
                            // Convert UTC to local timezone (IST) for display
                            const date = new Date(editing.departureTime);
                            // Get local time components
                            const year = date.getFullYear();
                            const month = String(date.getMonth() + 1).padStart(
                              2,
                              "0"
                            );
                            const day = String(date.getDate()).padStart(2, "0");
                            const hours = String(date.getHours()).padStart(
                              2,
                              "0"
                            );
                            const minutes = String(date.getMinutes()).padStart(
                              2,
                              "0"
                            );
                            return `${year}-${month}-${day}T${hours}:${minutes}`;
                          })()
                        : ""
                    }
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="arrivalTime">Arrival Time</Label>
                  <Input
                    id="arrivalTime"
                    name="arrivalTime"
                    type="datetime-local"
                    placeholder="Select arrival date and time"
                    className="w-full"
                    defaultValue={
                      editing?.arrivalTime
                        ? (() => {
                            // Convert UTC to local timezone (IST) for display
                            const date = new Date(editing.arrivalTime);
                            // Get local time components
                            const year = date.getFullYear();
                            const month = String(date.getMonth() + 1).padStart(
                              2,
                              "0"
                            );
                            const day = String(date.getDate()).padStart(2, "0");
                            const hours = String(date.getHours()).padStart(
                              2,
                              "0"
                            );
                            const minutes = String(date.getMinutes()).padStart(
                              2,
                              "0"
                            );
                            return `${year}-${month}-${day}T${hours}:${minutes}`;
                          })()
                        : ""
                    }
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="baseFare">Base Fare (INR)</Label>
                  <Input
                    id="baseFare"
                    name="baseFare"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Enter base fare amount"
                    className="w-full"
                    defaultValue={editing?.baseFare ?? ""}
                    disabled={!!editing}
                    required={!editing}
                  />
                  {!!editing && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Base fare cannot be changed
                    </p>
                  )}
                </div>
                {editing && (
                  <div className="grid gap-2">
                    <Label htmlFor="status">Status</Label>
                    <Select value={statusValue} onValueChange={setStatusValue}>
                      <SelectTrigger id="status" className="w-full">
                        <SelectValue placeholder="Select flight status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                        <SelectItem value="delayed">Delayed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDrawerOpen(false)}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving..." : editing ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete flight</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete
                flight
                {deleteTarget?.flightNumber
                  ? ` ${deleteTarget.flightNumber}`
                  : ""}
                .
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Seat Map Dialog */}
        <ModernSeatMapDialog
          open={seatMapDialogOpen}
          onOpenChange={setSeatMapDialogOpen}
          flight={selectedFlight}
        />

        {/* Passenger List Dialog */}
        <PassengerListDialog
          open={passengerDialogOpen}
          onOpenChange={setPassengerDialogOpen}
          flight={selectedFlight}
        />

        {/* Flight Operations Dialog */}
        <FlightOperationsDialog
          open={opsDialogOpen}
          onOpenChange={setOpsDialogOpen}
          flight={selectedFlight}
          onUpdate={fetchFlights}
        />
      </SidebarInset>
    </SidebarProvider>
  );
}
