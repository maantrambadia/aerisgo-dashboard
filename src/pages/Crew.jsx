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
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import api from "@/lib/axios";
import useDocumentTitle from "@/hooks/useDocumentTitle";
import {
  Plus,
  Edit3,
  Trash2,
  RefreshCw,
  Users,
  MoreVertical,
} from "lucide-react";

export default function Crew() {
  useDocumentTitle("Crew Management");

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [limit] = useState(10);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);

  const [roleFilter, setRoleFilter] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  // Form state - EXACTLY matching backend model fields
  const [employeeId, setEmployeeId] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("pilot"); // Default to pilot
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [isActive, setIsActive] = useState(true);

  // Delete dialog state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const filters = useMemo(() => ({ role: roleFilter }), [roleFilter]);

  async function fetchCrew(opts = {}) {
    const params = new URLSearchParams();
    params.set("page", String(opts.page ?? page));
    params.set("limit", String(opts.limit ?? limit));
    if (roleFilter) params.set("role", roleFilter);

    try {
      if (!loading) setFetching(true);
      // Backend returns { crew, total, page, pages }
      const { data } = await api.get(`/crew?${params.toString()}`);
      setItems(Array.isArray(data.crew) ? data.crew : []);
      setTotal(data.total || 0);
      setPage(data.page || 1);
      setPages(data.pages || 1);
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to fetch crew";
      toast.error(msg);
    } finally {
      setLoading(false);
      setFetching(false);
    }
  }

  useEffect(() => {
    fetchCrew({ page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, limit]);

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
    // Reset form to defaults
    setEmployeeId("");
    setName("");
    setRole("pilot");
    setEmail("");
    setPhone("");
    setLicenseNumber("");
    setIsActive(true);
  }

  function openEdit(crew) {
    setEditing(crew);
    setDialogOpen(true);
    // Populate form with crew data - EXACT field names from backend
    setEmployeeId(crew.employeeId || "");
    setName(crew.name || "");
    setRole(crew.role || "pilot");
    setEmail(crew.email || "");
    // Remove +91 prefix if present for editing
    const phoneDigits = crew.phone?.replace(/^\+91/, "") || "";
    setPhone(phoneDigits);
    setLicenseNumber(crew.licenseNumber || "");
    setIsActive(crew.isActive !== undefined ? crew.isActive : true);
  }

  function handlePhoneChange(e) {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
    setPhone(digits);
  }

  function requestDelete(crew) {
    setDeleteTarget(crew);
    setDeleteOpen(true);
  }

  async function confirmDelete() {
    if (!deleteTarget?._id) return setDeleteOpen(false);
    try {
      await api.delete(`/crew/${deleteTarget._id}`);
      toast.success("Crew member deleted");
      setDeleteOpen(false);
      setDeleteTarget(null);
      fetchCrew();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Delete failed");
    }
  }

  async function onSubmit(e) {
    e.preventDefault();

    // Validation - matching backend required fields
    if (!employeeId.trim()) {
      toast.error("Employee ID is required");
      return;
    }
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (!role) {
      toast.error("Role is required");
      return;
    }
    if (!email.trim()) {
      toast.error("Email is required");
      return;
    }
    if (!phone.trim()) {
      toast.error("Phone is required");
      return;
    }
    if (phone.length !== 10) {
      toast.error("Phone number must be exactly 10 digits");
      return;
    }

    // Build payload - EXACT field names from backend
    const payload = {
      employeeId: employeeId.trim(),
      name: name.trim(),
      role, // Must be one of: pilot, co-pilot, flight-attendant
      email: email.trim().toLowerCase(), // Backend converts to lowercase
      phone: `+91${phone}`, // Add +91 prefix
      licenseNumber: licenseNumber.trim() || undefined, // Optional field
      isActive,
    };

    try {
      setSaving(true);
      if (editing?._id) {
        // Backend returns { message, crew }
        await api.put(`/crew/${editing._id}`, payload);
        toast.success("Crew member updated");
      } else {
        // Backend returns { message, crew }
        await api.post(`/crew`, payload);
        toast.success("Crew member created");
      }
      setDialogOpen(false);
      fetchCrew();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  function getRoleBadge(role) {
    switch (role) {
      case "pilot":
        return (
          <Badge variant="default" className="capitalize">
            Pilot
          </Badge>
        );
      case "co-pilot":
        return (
          <Badge variant="secondary" className="capitalize">
            Co-Pilot
          </Badge>
        );
      case "flight-attendant":
        return (
          <Badge variant="outline" className="capitalize">
            Flight Attendant
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="capitalize">
            {role}
          </Badge>
        );
    }
  }

  const filteredItems = useMemo(() => {
    if (activeTab === "all") return items;
    if (activeTab === "active") return items.filter((i) => i.isActive);
    if (activeTab === "inactive") return items.filter((i) => !i.isActive);
    return items.filter((i) => i.role === activeTab);
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
                      <Users className="h-5 w-5" />
                      Crew Management
                    </CardTitle>
                    <CardDescription className="mt-1.5">
                      Manage pilots, co-pilots, and flight attendants
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchCrew()}
                      disabled={fetching}
                    >
                      <RefreshCw
                        className={`h-4 w-4 ${fetching ? "animate-spin" : ""}`}
                      />
                    </Button>
                    <Button size="sm" onClick={openCreate}>
                      <Plus className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">Add Crew Member</span>
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
                    <TabsTrigger value="pilot" className="relative">
                      Pilots
                      <Badge
                        variant="secondary"
                        className="ml-2 px-1.5 py-0 text-xs"
                      >
                        {items.filter((i) => i.role === "pilot").length}
                      </Badge>
                    </TabsTrigger>
                    <TabsTrigger value="co-pilot" className="relative">
                      Co-Pilots
                      <Badge
                        variant="secondary"
                        className="ml-2 px-1.5 py-0 text-xs"
                      >
                        {items.filter((i) => i.role === "co-pilot").length}
                      </Badge>
                    </TabsTrigger>
                    <TabsTrigger value="flight-attendant" className="relative">
                      Attendants
                      <Badge
                        variant="secondary"
                        className="ml-2 px-1.5 py-0 text-xs"
                      >
                        {
                          items.filter((i) => i.role === "flight-attendant")
                            .length
                        }
                      </Badge>
                    </TabsTrigger>
                    <TabsTrigger value="active" className="relative">
                      Active
                      <Badge
                        variant="secondary"
                        className="ml-2 px-1.5 py-0 text-xs"
                      >
                        {items.filter((i) => i.isActive).length}
                      </Badge>
                    </TabsTrigger>
                    <TabsTrigger value="inactive" className="relative">
                      Inactive
                      <Badge
                        variant="secondary"
                        className="ml-2 px-1.5 py-0 text-xs"
                      >
                        {items.filter((i) => !i.isActive).length}
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
                        <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p className="font-medium">No crew members found</p>
                        <p className="text-sm mt-2">
                          Add your first crew member to get started
                        </p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="min-w-[120px]">
                                Employee ID
                              </TableHead>
                              <TableHead className="min-w-[150px]">
                                Name
                              </TableHead>
                              <TableHead className="min-w-[120px]">
                                Role
                              </TableHead>
                              <TableHead className="min-w-[200px]">
                                Email
                              </TableHead>
                              <TableHead className="min-w-[140px]">
                                Phone
                              </TableHead>
                              <TableHead className="min-w-[120px]">
                                License
                              </TableHead>
                              <TableHead className="min-w-[100px]">
                                Status
                              </TableHead>
                              <TableHead className="text-right min-w-[100px]">
                                Actions
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredItems.map((crew) => (
                              <TableRow key={crew._id}>
                                <TableCell className="font-mono font-semibold">
                                  {crew.employeeId}
                                </TableCell>
                                <TableCell className="font-medium">
                                  {crew.name}
                                </TableCell>
                                <TableCell>{getRoleBadge(crew.role)}</TableCell>
                                <TableCell className="text-sm">
                                  {crew.email}
                                </TableCell>
                                <TableCell>{crew.phone}</TableCell>
                                <TableCell className="font-mono font-semibold">
                                  {crew.licenseNumber || "-"}
                                </TableCell>
                                <TableCell>
                                  {crew.isActive ? (
                                    <Badge
                                      variant="default"
                                      className="capitalize"
                                    >
                                      Active
                                    </Badge>
                                  ) : (
                                    <Badge
                                      variant="outline"
                                      className="capitalize"
                                    >
                                      Inactive
                                    </Badge>
                                  )}
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
                                        onClick={() => openEdit(crew)}
                                      >
                                        <Edit3 className="h-4 w-4 mr-2" />
                                        Edit
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() => requestDelete(crew)}
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Crew Member" : "Add New Crew Member"}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? "Update crew member details"
                : "Add a new crew member to your team"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={onSubmit}>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="employeeId">Employee ID *</Label>
                <Input
                  id="employeeId"
                  placeholder="e.g., EMP001"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value.toUpperCase())}
                  required
                  className="font-mono"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., John Doe"
                  value={name}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Only allow letters and spaces, capitalize first letter of each word
                    const filtered = value.replace(/[^a-zA-Z\s]/g, "");
                    const capitalized = filtered
                      .split(" ")
                      .map(
                        (word) =>
                          word.charAt(0).toUpperCase() +
                          word.slice(1).toLowerCase()
                      )
                      .join(" ");
                    setName(capitalized);
                  }}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role *</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pilot">Pilot</SelectItem>
                    <SelectItem value="co-pilot">Co-Pilot</SelectItem>
                    <SelectItem value="flight-attendant">
                      Flight Attendant
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="e.g., john@aerisgo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone *</Label>
                <div className="flex">
                  <span className="inline-flex items-center rounded-l-md border border-r-0 bg-input/50 px-3 text-sm text-foreground/80">
                    +91
                  </span>
                  <Input
                    id="phone"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    className="rounded-l-none"
                    value={phone}
                    onChange={handlePhoneChange}
                    placeholder="10-digit number"
                    maxLength={10}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="licenseNumber">License Number</Label>
                <Input
                  id="licenseNumber"
                  placeholder="e.g., LIC12345"
                  value={licenseNumber}
                  onChange={(e) =>
                    setLicenseNumber(e.target.value.toUpperCase())
                  }
                  className="font-mono"
                />
              </div>

              <div className="col-span-2 flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={isActive}
                  onCheckedChange={setIsActive}
                />
                <Label htmlFor="isActive" className="cursor-pointer">
                  Active Status
                </Label>
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
            <AlertDialogTitle>Delete Crew Member?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <strong>{deleteTarget?.name}</strong> ({deleteTarget?.employeeId}
              )? This action cannot be undone.
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
