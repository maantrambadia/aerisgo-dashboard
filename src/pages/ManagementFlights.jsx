import React, { useEffect, useMemo, useState } from "react";
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
} from "lucide-react";
import { useAuth } from "@/context/AuthContext.jsx";

export default function ManagementFlights() {
  useDocumentTitle("Flights");

  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [limit, setLimit] = useState(10);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);

  const [q, setQ] = useState("");
  const [source, setSource] = useState("");
  const [destination, setDestination] = useState("");
  const [status, setStatus] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  // Delete dialog state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Controlled status for the Sheet form using shadcn Select
  const [statusValue, setStatusValue] = useState("scheduled");

  const filters = useMemo(
    () => ({ q, source, destination, status, dateFrom, dateTo }),
    [q, source, destination, status, dateFrom, dateTo]
  );

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
  }
  function openEdit(f) {
    setEditing(f);
    setDrawerOpen(true);
    setStatusValue(f?.status || "scheduled");
  }

  function requestDelete(f) {
    setDeleteTarget(f);
    setDeleteOpen(true);
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

    // Build payload
    const payload = {
      flightNumber: fd.get("flightNumber")?.toString().trim(),
      source: fd.get("source")?.toString().trim(),
      destination: fd.get("destination")?.toString().trim(),
      aircraftType: fd.get("aircraftType")?.toString().trim() || "a320 neo",
      departureTime: fd.get("departureTime")?.toString(),
      arrivalTime: fd.get("arrivalTime")?.toString(),
      baseFare: Number(fd.get("baseFare")),
      status: fd.get("status")?.toString() || "scheduled",
    };

    // Convert local datetime to ISO
    if (payload.departureTime)
      payload.departureTime = new Date(payload.departureTime).toISOString();
    if (payload.arrivalTime)
      payload.arrivalTime = new Date(payload.arrivalTime).toISOString();

    try {
      setSaving(true);
      if (editing?._id) {
        const { _id, ...rest } = editing;
        await api.put(`/flights/${editing._id}`, payload);
        toast.success("Flight updated");
      } else {
        await api.post(`/flights`, payload);
        toast.success("Flight created");
      }
      setDrawerOpen(false);
      fetchFlights();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  function clearFilters() {
    setQ("");
    setSource("");
    setDestination("");
    setStatus("");
    setDateFrom("");
    setDateTo("");
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
                    <CardTitle className="flex items-center gap-2">
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
                        Add Flight
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-4 mb-6">
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
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Flight #</TableHead>
                              <TableHead>Route</TableHead>
                              <TableHead>Departure</TableHead>
                              <TableHead>Arrival</TableHead>
                              <TableHead>Fare</TableHead>
                              <TableHead>Status</TableHead>
                              {isAdmin && (
                                <TableHead className="text-right">
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
                                    ? format(new Date(f.departureTime), "PPp")
                                    : "-"}
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                  {f.arrivalTime
                                    ? format(new Date(f.arrivalTime), "PPp")
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
                                          onClick={() => openEdit(f)}
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
              <input
                type="hidden"
                name="status"
                value={statusValue}
                id="status-hidden"
              />
              <div className="grid grid-cols-1 gap-4 py-4">
                <div>
                  <Label htmlFor="flightNumber" className="mb-1.5 block">
                    Flight Number
                  </Label>
                  <Input
                    id="flightNumber"
                    name="flightNumber"
                    defaultValue={editing?.flightNumber || ""}
                    required
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="source" className="mb-1.5 block">
                      Source
                    </Label>
                    <Input
                      id="source"
                      name="source"
                      defaultValue={editing?.source || ""}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="destination" className="mb-1.5 block">
                      Destination
                    </Label>
                    <Input
                      id="destination"
                      name="destination"
                      defaultValue={editing?.destination || ""}
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="aircraftType" className="mb-1.5 block">
                    Aircraft Type
                  </Label>
                  <Input
                    id="aircraftType"
                    name="aircraftType"
                    defaultValue={editing?.aircraftType || "a320 neo"}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="departureTime" className="mb-1.5 block">
                      Departure Time
                    </Label>
                    <Input
                      id="departureTime"
                      name="departureTime"
                      type="datetime-local"
                      defaultValue={
                        editing?.departureTime
                          ? new Date(editing.departureTime)
                              .toISOString()
                              .slice(0, 16)
                          : ""
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="arrivalTime" className="mb-1.5 block">
                      Arrival Time
                    </Label>
                    <Input
                      id="arrivalTime"
                      name="arrivalTime"
                      type="datetime-local"
                      defaultValue={
                        editing?.arrivalTime
                          ? new Date(editing.arrivalTime)
                              .toISOString()
                              .slice(0, 16)
                          : ""
                      }
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="baseFare" className="mb-1.5 block">
                      Base Fare (INR)
                    </Label>
                    <Input
                      id="baseFare"
                      name="baseFare"
                      type="number"
                      step="0.01"
                      min="0"
                      defaultValue={editing?.baseFare ?? ""}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="status" className="mb-1.5 block">
                      Status
                    </Label>
                    <Select value={statusValue} onValueChange={setStatusValue}>
                      <SelectTrigger id="status" className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                        <SelectItem value="delayed">Delayed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
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
      </SidebarInset>
    </SidebarProvider>
  );
}
