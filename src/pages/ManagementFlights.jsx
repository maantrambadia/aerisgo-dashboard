import React, { useEffect, useMemo, useState } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { SiteHeader } from "@/components/SiteHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Plus, Edit3, Trash2, RefreshCw } from "lucide-react";
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

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset className="dark:bg-black/20">
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="flex items-center justify-between px-4 md:px-6">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchFlights()}
                    disabled={fetching}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" /> Refresh
                  </Button>
                  {isAdmin && (
                    <Button size="sm" onClick={openCreate}>
                      <Plus className="mr-2 h-4 w-4" /> Add Flight
                    </Button>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  {fetching
                    ? "Loading..."
                    : `${total} result${total === 1 ? "" : "s"}`}
                </div>
              </div>

              <Card className="mx-4 md:mx-6">
                <CardHeader>
                  <CardTitle>Filters</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="q">Search</Label>
                      <Input
                        id="q"
                        placeholder="Flight #, Source or Destination"
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="source">Source</Label>
                      <Input
                        id="source"
                        placeholder="e.g., LAX"
                        value={source}
                        onChange={(e) => setSource(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="destination">Destination</Label>
                      <Input
                        id="destination"
                        placeholder="e.g., JFK"
                        value={destination}
                        onChange={(e) => setDestination(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="status">Status</Label>
                      <Select
                        value={status || "all"}
                        onValueChange={(v) => setStatus(v === "all" ? "" : v)}
                      >
                        <SelectTrigger id="status" className="h-9">
                          <SelectValue placeholder="Any" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Any</SelectItem>
                          <SelectItem value="scheduled">Scheduled</SelectItem>
                          <SelectItem value="delayed">Delayed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="dateFrom">Departure From</Label>
                      <Input
                        id="dateFrom"
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="dateTo">Departure To</Label>
                      <Input
                        id="dateTo"
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button variant="outline" size="sm" onClick={clearFilters}>
                      Clear
                    </Button>
                    <Button size="sm" onClick={() => fetchFlights({ page: 1 })}>
                      Apply
                    </Button>
                    <div className="ml-auto flex items-center gap-2">
                      <Label htmlFor="limit">Per page</Label>
                      <Select
                        value={String(limit)}
                        onValueChange={(v) => setLimit(Number(v))}
                      >
                        <SelectTrigger id="limit" className="h-9 w-[100px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[10, 20, 50].map((n) => (
                            <SelectItem key={n} value={String(n)}>
                              {n}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="mx-4 md:mx-6">
                <CardHeader>
                  <CardTitle>Flights</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="space-y-2">
                      {Array(5)
                        .fill(0)
                        .map((_, i) => (
                          <Skeleton key={i} className="h-10 w-full" />
                        ))}
                    </div>
                  ) : items.length === 0 ? (
                    <div className="text-sm text-muted-foreground">
                      No flights found.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left border-b">
                            <th className="py-2 pr-2">Flight #</th>
                            <th className="py-2 pr-2">Route</th>
                            <th className="py-2 pr-2">Departure</th>
                            <th className="py-2 pr-2">Arrival</th>
                            <th className="py-2 pr-2">Fare</th>
                            <th className="py-2 pr-2">Status</th>
                            {isAdmin && (
                              <th className="py-2 pr-2 text-right">Actions</th>
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {items.map((f) => (
                            <tr key={f._id} className="border-b last:border-0">
                              <td className="py-2 pr-2 font-medium">
                                {f.flightNumber}
                              </td>
                              <td className="py-2 pr-2">
                                {f.source} → {f.destination}
                              </td>
                              <td className="py-2 pr-2">
                                {f.departureTime
                                  ? format(new Date(f.departureTime), "PPpp")
                                  : "-"}
                              </td>
                              <td className="py-2 pr-2">
                                {f.arrivalTime
                                  ? format(new Date(f.arrivalTime), "PPpp")
                                  : "-"}
                              </td>
                              <td className="py-2 pr-2">
                                ₹
                                {Number(f.baseFare || 0).toLocaleString(
                                  "en-IN"
                                )}
                              </td>
                              <td className="py-2 pr-2 capitalize">
                                {f.status}
                              </td>
                              {isAdmin && (
                                <td className="py-2 pr-2">
                                  <div className="flex justify-end gap-2">
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      onClick={() => openEdit(f)}
                                    >
                                      <Edit3 className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="destructive"
                                      size="icon"
                                      onClick={() => requestDelete(f)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  {/* Pagination */}
                  {pages > 1 && (
                    <div className="mt-4 flex items-center justify-between">
                      <div className="text-xs text-muted-foreground">
                        Page {page} of {pages}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={page <= 1}
                          onClick={() => fetchFlights({ page: page - 1 })}
                        >
                          Prev
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
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Create/Edit Drawer */}
        <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
          <SheetContent side="right" className="sm:max-w-xl">
            <SheetHeader>
              <SheetTitle>
                {editing ? `Edit ${editing.flightNumber}` : "Add Flight"}
              </SheetTitle>
            </SheetHeader>
            <form
              className="flex flex-1 flex-col p-4 gap-3"
              onSubmit={onSubmit}
            >
              <input
                type="hidden"
                name="status"
                value={statusValue}
                id="status-hidden"
              />
              <div className="grid grid-cols-1 gap-3">
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
              <SheetFooter>
                <div className="flex gap-2">
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
                </div>
              </SheetFooter>
            </form>
          </SheetContent>
        </Sheet>
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
