import { useEffect, useState, useMemo } from "react";
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
  Wrench,
} from "lucide-react";

export default function Aircraft() {
  useDocumentTitle("Aircraft Management");

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [limit] = useState(10);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);

  const [status, setStatus] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [flightNumber, setFlightNumber] = useState("");
  const [statusValue, setStatusValue] = useState("active");
  const [lastMaintenanceDate, setLastMaintenanceDate] = useState("");
  const [nextMaintenanceDate, setNextMaintenanceDate] = useState("");

  // Delete dialog state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const filters = useMemo(() => ({ status }), [status]);

  async function fetchAircraft(opts = {}) {
    const params = new URLSearchParams();
    params.set("page", String(opts.page ?? page));
    params.set("limit", String(opts.limit ?? limit));
    if (status) params.set("status", status);

    try {
      if (!loading) setFetching(true);
      const { data } = await api.get(`/aircraft?${params.toString()}`);
      setItems(Array.isArray(data.aircraft) ? data.aircraft : []);
      setTotal(data.total || 0);
      setPage(data.page || 1);
      setPages(data.pages || 1);
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to fetch aircraft";
      toast.error(msg);
    } finally {
      setLoading(false);
      setFetching(false);
    }
  }

  useEffect(() => {
    fetchAircraft({ page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, limit]);

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
    setRegistrationNumber("");
    setFlightNumber("");
    setStatusValue("active");
    setLastMaintenanceDate("");
    setNextMaintenanceDate("");
  }

  function openEdit(aircraft) {
    setEditing(aircraft);
    setDialogOpen(true);
    setRegistrationNumber(aircraft.registrationNumber || "");
    setFlightNumber(aircraft.flightNumber || "");
    setStatusValue(aircraft.status || "active");
    setLastMaintenanceDate(
      aircraft.lastMaintenanceDate
        ? format(new Date(aircraft.lastMaintenanceDate), "yyyy-MM-dd")
        : ""
    );
    setNextMaintenanceDate(
      aircraft.nextMaintenanceDate
        ? format(new Date(aircraft.nextMaintenanceDate), "yyyy-MM-dd")
        : ""
    );
  }

  function requestDelete(aircraft) {
    setDeleteTarget(aircraft);
    setDeleteOpen(true);
  }

  async function confirmDelete() {
    if (!deleteTarget?._id) return setDeleteOpen(false);
    try {
      await api.delete(`/aircraft/${deleteTarget._id}`);
      toast.success("Aircraft deleted");
      setDeleteOpen(false);
      setDeleteTarget(null);
      fetchAircraft();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Delete failed");
    }
  }

  async function onSubmit(e) {
    e.preventDefault();

    if (!registrationNumber.trim()) {
      toast.error("Registration number is required");
      return;
    }

    if (!flightNumber.trim()) {
      toast.error("Flight number is required");
      return;
    }

    const payload = {
      registrationNumber: registrationNumber.trim().toUpperCase(),
      flightNumber: flightNumber.trim().toUpperCase(),
      status: statusValue,
      lastMaintenanceDate: lastMaintenanceDate || undefined,
      nextMaintenanceDate: nextMaintenanceDate || undefined,
    };

    try {
      setSaving(true);
      if (editing?._id) {
        await api.put(`/aircraft/${editing._id}`, payload);
        toast.success("Aircraft updated");
      } else {
        await api.post(`/aircraft`, payload);
        toast.success("Aircraft created");
      }
      setDialogOpen(false);
      fetchAircraft();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  function getStatusBadge(status) {
    switch (status) {
      case "active":
        return (
          <Badge variant="default" className="capitalize">
            Active
          </Badge>
        );
      case "maintenance":
        return (
          <Badge variant="secondary" className="capitalize">
            Maintenance
          </Badge>
        );
      case "retired":
        return (
          <Badge variant="outline" className="capitalize">
            Retired
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="capitalize">
            {status}
          </Badge>
        );
    }
  }

  const filteredItems = useMemo(() => {
    if (activeTab === "all") return items;
    return items.filter((item) => item.status === activeTab);
  }, [items, activeTab]);

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
                      Aircraft Management
                    </CardTitle>
                    <CardDescription className="mt-1.5">
                      Manage your fleet of aircraft
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchAircraft()}
                      disabled={fetching}
                    >
                      <RefreshCw
                        className={`h-4 w-4 ${fetching ? "animate-spin" : ""}`}
                      />
                    </Button>
                    <Button size="sm" onClick={openCreate}>
                      <Plus className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">Add Aircraft</span>
                      <span className="sm:hidden">Add</span>
                    </Button>
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
                        {items.length}
                      </Badge>
                    </TabsTrigger>
                    <TabsTrigger value="active" className="relative">
                      Active
                      <Badge
                        variant="secondary"
                        className="ml-2 px-1.5 py-0 text-xs"
                      >
                        {items.filter((i) => i.status === "active").length}
                      </Badge>
                    </TabsTrigger>
                    <TabsTrigger value="maintenance" className="relative">
                      Maintenance
                      <Badge
                        variant="secondary"
                        className="ml-2 px-1.5 py-0 text-xs"
                      >
                        {items.filter((i) => i.status === "maintenance").length}
                      </Badge>
                    </TabsTrigger>
                    <TabsTrigger value="retired" className="relative">
                      Retired
                      <Badge
                        variant="secondary"
                        className="ml-2 px-1.5 py-0 text-xs"
                      >
                        {items.filter((i) => i.status === "retired").length}
                      </Badge>
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value={activeTab}>
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
                      <div className="text-center py-12 text-muted-foreground">
                        <Plane className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p className="font-medium">No aircraft found</p>
                        <p className="text-sm mt-2">
                          Add your first aircraft to get started
                        </p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="min-w-[120px]">
                                Registration
                              </TableHead>
                              <TableHead className="min-w-[120px]">
                                Flight Number
                              </TableHead>
                              <TableHead className="min-w-[100px]">
                                Type
                              </TableHead>
                              <TableHead className="min-w-[120px]">
                                Manufacturer
                              </TableHead>
                              <TableHead className="min-w-[80px]">
                                Seats
                              </TableHead>
                              <TableHead className="min-w-[100px]">
                                Status
                              </TableHead>
                              <TableHead className="min-w-[140px]">
                                Last Maintenance
                              </TableHead>
                              <TableHead className="min-w-[140px]">
                                Next Maintenance
                              </TableHead>
                              <TableHead className="text-right min-w-[100px]">
                                Actions
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredItems.map((aircraft) => (
                              <TableRow key={aircraft._id}>
                                <TableCell className="font-mono font-semibold">
                                  {aircraft.registrationNumber}
                                </TableCell>
                                <TableCell className="font-mono font-semibold text-blue-600">
                                  {aircraft.flightNumber}
                                </TableCell>
                                <TableCell>{aircraft.aircraftType}</TableCell>
                                <TableCell>{aircraft.manufacturer}</TableCell>
                                <TableCell>{aircraft.totalSeats}</TableCell>
                                <TableCell>
                                  {getStatusBadge(aircraft.status)}
                                </TableCell>
                                <TableCell>
                                  {aircraft.lastMaintenanceDate
                                    ? format(
                                        new Date(aircraft.lastMaintenanceDate),
                                        "dd MMM yyyy"
                                      )
                                    : "-"}
                                </TableCell>
                                <TableCell>
                                  {aircraft.nextMaintenanceDate
                                    ? format(
                                        new Date(aircraft.nextMaintenanceDate),
                                        "dd MMM yyyy"
                                      )
                                    : "-"}
                                </TableCell>
                                <TableCell className="text-right">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="sm">
                                        <MoreVertical className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuLabel>
                                        Actions
                                      </DropdownMenuLabel>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        onClick={() => openEdit(aircraft)}
                                      >
                                        <Edit3 className="h-4 w-4 mr-2" />
                                        Edit
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() => requestDelete(aircraft)}
                                        className="text-red-600"
                                      >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete
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
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </SidebarInset>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Aircraft" : "Add New Aircraft"}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? "Update aircraft details"
                : "Add a new aircraft to your fleet"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={onSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="registrationNumber">
                  Registration Number *
                </Label>
                <Input
                  id="registrationNumber"
                  placeholder="e.g., VT-ABC"
                  value={registrationNumber}
                  onChange={(e) =>
                    setRegistrationNumber(e.target.value.toUpperCase())
                  }
                  required
                  className="font-mono"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="flightNumber">Flight Number *</Label>
                <Input
                  id="flightNumber"
                  placeholder="e.g., AG101"
                  value={flightNumber}
                  onChange={(e) =>
                    setFlightNumber(e.target.value.toUpperCase())
                  }
                  required
                  className="font-mono"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={statusValue} onValueChange={setStatusValue}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="retired">Retired</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastMaintenance">Last Maintenance Date</Label>
                <Input
                  id="lastMaintenance"
                  type="date"
                  value={lastMaintenanceDate}
                  onChange={(e) => setLastMaintenanceDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nextMaintenance">Next Maintenance Date</Label>
                <Input
                  id="nextMaintenance"
                  type="date"
                  value={nextMaintenanceDate}
                  onChange={(e) => setNextMaintenanceDate(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : editing ? (
                  "Update"
                ) : (
                  "Create"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Aircraft?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete aircraft{" "}
              <strong>{deleteTarget?.registrationNumber}</strong>? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarProvider>
  );
}
