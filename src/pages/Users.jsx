import { useEffect, useState } from "react";
import useDocumentTitle from "@/hooks/useDocumentTitle.js";
import api from "@/lib/axios";
import { toast } from "sonner";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { SiteHeader } from "@/components/SiteHeader";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
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
  Pencil,
  UserCheck,
  Users as UsersIcon,
  MoreVertical,
  RefreshCw,
  Trash2,
  Coins,
} from "lucide-react";
import RewardsManagementDialog from "@/components/users/RewardsManagementDialog";

export default function Users() {
  useDocumentTitle("Users");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState({});
  const [activeTab, setActiveTab] = useState("all");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [rewardsDialogOpen, setRewardsDialogOpen] = useState(false);
  const [rewardsUser, setRewardsUser] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    phone: "",
    gender: "other",
    role: "passenger",
    isVerified: false,
    password: "",
  });
  const [updating, setUpdating] = useState(false);

  async function fetchUsers() {
    setLoading(true);
    try {
      const { data } = await api.get("/users");
      setUsers(data.users || []);
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to load users";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  async function approve(id) {
    setApproving((s) => ({ ...s, [id]: true }));
    try {
      const { data } = await api.post(`/users/${id}/approve`);
      toast.success(data?.message || "User approved");
      setUsers((list) =>
        list.map((u) =>
          u._id === id || u.id === id ? { ...u, isVerified: true } : u
        )
      );
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to approve user";
      toast.error(msg);
    } finally {
      setApproving((s) => ({ ...s, [id]: false }));
    }
  }

  function openEditDialog(user) {
    setEditingUser(user);
    setEditForm({
      name: user.name || "",
      email: user.email || "",
      phone: user.phone?.replace("+91", "") || "",
      gender: user.gender || "other",
      role: user.role || "passenger",
      isVerified: user.isVerified || false,
      password: "",
    });
    setEditDialogOpen(true);
  }

  function closeEditDialog() {
    setEditDialogOpen(false);
    setEditingUser(null);
    setEditForm({
      name: "",
      email: "",
      phone: "",
      gender: "other",
      role: "passenger",
      isVerified: false,
      password: "",
    });
  }

  async function handleUpdateUser(e) {
    e.preventDefault();
    if (!editingUser) return;

    setUpdating(true);
    try {
      const payload = {
        name: editForm.name.trim(),
        email: editForm.email.trim(),
        phone: editForm.phone.startsWith("+91")
          ? editForm.phone
          : `+91${editForm.phone}`,
        gender: editForm.gender,
        role: editForm.role,
        isVerified: editForm.isVerified,
      };

      // Only include password if it's not empty
      if (editForm.password.trim()) {
        payload.password = editForm.password;
      }

      const id = editingUser._id || editingUser.id;
      const { data } = await api.put(`/users/${id}`, payload);
      toast.success(data?.message || "User updated successfully");

      // Update local state
      setUsers((list) =>
        list.map((u) =>
          u._id === id || u.id === id ? { ...u, ...data.user } : u
        )
      );

      closeEditDialog();
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to update user";
      toast.error(msg);
    } finally {
      setUpdating(false);
    }
  }

  function openDeleteDialog(user) {
    setDeletingUser(user);
    setDeleteDialogOpen(true);
  }

  function closeDeleteDialog() {
    setDeleteDialogOpen(false);
    setDeletingUser(null);
  }

  function openRewardsDialog(user) {
    setRewardsUser(user);
    setRewardsDialogOpen(true);
  }

  function closeRewardsDialog() {
    setRewardsDialogOpen(false);
    setRewardsUser(null);
  }

  async function handleDeleteUser() {
    if (!deletingUser) return;

    setDeleting(true);
    try {
      const id = deletingUser._id || deletingUser.id;
      await api.delete(`/users/${id}`);
      toast.success("User deleted successfully");

      // Remove from local state
      setUsers((list) => list.filter((u) => u._id !== id && u.id !== id));

      closeDeleteDialog();
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to delete user";
      toast.error(msg);
    } finally {
      setDeleting(false);
    }
  }

  // Filter users by role
  const filteredUsers = users.filter((user) => {
    if (activeTab === "all") return true;
    return user.role === activeTab;
  });

  // Count users by role
  const counts = {
    all: users.length,
    passenger: users.filter((u) => u.role === "passenger").length,
    staff: users.filter((u) => u.role === "staff").length,
    admin: users.filter((u) => u.role === "admin").length,
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
                      <UsersIcon className="h-5 w-5" />
                      Users Management
                    </CardTitle>
                    <CardDescription className="mt-1.5">
                      Manage user accounts, roles, and approvals
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchUsers}
                    disabled={loading}
                  >
                    <RefreshCw
                      className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                    />
                  </Button>
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
                    <TabsTrigger value="passenger" className="relative">
                      Passengers
                      <Badge
                        variant="secondary"
                        className="ml-2 px-1.5 py-0 text-xs"
                      >
                        {counts.passenger}
                      </Badge>
                    </TabsTrigger>
                    <TabsTrigger value="staff" className="relative">
                      Staff
                      <Badge
                        variant="secondary"
                        className="ml-2 px-1.5 py-0 text-xs"
                      >
                        {counts.staff}
                      </Badge>
                    </TabsTrigger>
                    <TabsTrigger value="admin" className="relative">
                      Admins
                      <Badge
                        variant="secondary"
                        className="ml-2 px-1.5 py-0 text-xs"
                      >
                        {counts.admin}
                      </Badge>
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value={activeTab} className="mt-0">
                    {loading ? (
                      <div className="space-y-3">
                        {[...Array(5)].map((_, i) => (
                          <div key={i} className="flex items-center gap-4">
                            <Skeleton className="h-12 w-12 rounded-full" />
                            <div className="space-y-2 flex-1">
                              <Skeleton className="h-4 w-[250px]" />
                              <Skeleton className="h-3 w-[200px]" />
                            </div>
                            <Skeleton className="h-9 w-20" />
                          </div>
                        ))}
                      </div>
                    ) : filteredUsers.length === 0 ? (
                      <div className="text-center py-12">
                        <UsersIcon className="mx-auto h-12 w-12 text-muted-foreground/50" />
                        <p className="mt-4 text-sm text-muted-foreground">
                          No {activeTab !== "all" ? activeTab : ""} users found
                        </p>
                      </div>
                    ) : (
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Name</TableHead>
                              <TableHead>Email</TableHead>
                              <TableHead>Phone</TableHead>
                              <TableHead>Gender</TableHead>
                              <TableHead>Role</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead className="text-right">
                                Actions
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredUsers.map((user) => {
                              const id = user._id || user.id;
                              const verified = Boolean(user.isVerified);
                              return (
                                <TableRow key={id}>
                                  <TableCell className="font-medium">
                                    {user.name}
                                  </TableCell>
                                  <TableCell className="text-muted-foreground">
                                    {user.email}
                                  </TableCell>
                                  <TableCell className="text-muted-foreground">
                                    {user.phone || "—"}
                                  </TableCell>
                                  <TableCell className="capitalize">
                                    {user.gender}
                                  </TableCell>
                                  <TableCell>
                                    <Badge
                                      variant={
                                        user.role === "admin"
                                          ? "default"
                                          : user.role === "staff"
                                          ? "secondary"
                                          : "outline"
                                      }
                                      className="capitalize"
                                    >
                                      {user.role}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    {verified ? (
                                      <Badge
                                        variant="secondary"
                                        className="bg-green-500/10 text-green-700 dark:text-green-400 hover:bg-green-500/20"
                                      >
                                        <UserCheck className="mr-1 h-3 w-3" />
                                        Verified
                                      </Badge>
                                    ) : (
                                      <Badge variant="destructive">
                                        Pending
                                      </Badge>
                                    )}
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
                                        <DropdownMenuLabel>
                                          Actions
                                        </DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                          onClick={() => openEditDialog(user)}
                                        >
                                          <Pencil className="mr-2 h-4 w-4" />
                                          Edit User
                                        </DropdownMenuItem>
                                        {!verified && (
                                          <DropdownMenuItem
                                            onClick={() => approve(id)}
                                            disabled={!!approving[id]}
                                          >
                                            <UserCheck className="mr-2 h-4 w-4" />
                                            {approving[id]
                                              ? "Approving..."
                                              : "Approve User"}
                                          </DropdownMenuItem>
                                        )}
                                        {user.role === "passenger" && (
                                          <>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                              onClick={() =>
                                                openRewardsDialog(user)
                                              }
                                            >
                                              <Coins className="mr-2 h-4 w-4" />
                                              Manage Rewards
                                            </DropdownMenuItem>
                                          </>
                                        )}
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                          onClick={() => openDeleteDialog(user)}
                                          className="text-destructive focus:text-destructive"
                                        >
                                          <Trash2 className="mr-2 h-4 w-4" />
                                          Delete User
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
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

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={handleUpdateUser}>
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>
                Update user information and permissions
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Full Name</Label>
                <Input
                  id="edit-name"
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editForm.email}
                  onChange={(e) =>
                    setEditForm({ ...editForm, email: e.target.value })
                  }
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-phone">Phone</Label>
                <div className="flex">
                  <span className="inline-flex items-center rounded-l-md border border-r-0 bg-input/50 px-3 text-sm text-foreground/80">
                    +91
                  </span>
                  <Input
                    id="edit-phone"
                    className="rounded-l-none"
                    value={editForm.phone.replace("+91", "")}
                    onChange={(e) => {
                      const digits = e.target.value
                        .replace(/\D/g, "")
                        .slice(0, 10);
                      setEditForm({ ...editForm, phone: digits });
                    }}
                    maxLength={10}
                    required
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Gender</Label>
                <RadioGroup
                  value={editForm.gender}
                  onValueChange={(value) =>
                    setEditForm({ ...editForm, gender: value })
                  }
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="male" id="edit-male" />
                    <Label htmlFor="edit-male" className="font-normal">
                      Male
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="female" id="edit-female" />
                    <Label htmlFor="edit-female" className="font-normal">
                      Female
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="other" id="edit-other" />
                    <Label htmlFor="edit-other" className="font-normal">
                      Other
                    </Label>
                  </div>
                </RadioGroup>
              </div>
              <div className="grid gap-2">
                <Label>Role</Label>
                <RadioGroup
                  value={editForm.role}
                  onValueChange={(value) =>
                    setEditForm({ ...editForm, role: value })
                  }
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="passenger" id="edit-passenger" />
                    <Label htmlFor="edit-passenger" className="font-normal">
                      Passenger
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="staff" id="edit-staff" />
                    <Label htmlFor="edit-staff" className="font-normal">
                      Staff
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="admin" id="edit-admin" />
                    <Label htmlFor="edit-admin" className="font-normal">
                      Admin
                    </Label>
                  </div>
                </RadioGroup>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <Label htmlFor="edit-verified">Verified Status</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow user to access the system
                  </p>
                </div>
                <Switch
                  id="edit-verified"
                  checked={editForm.isVerified}
                  onCheckedChange={(checked) =>
                    setEditForm({ ...editForm, isVerified: checked })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-password">
                  New Password{" "}
                  <span className="text-muted-foreground">(optional)</span>
                </Label>
                <Input
                  id="edit-password"
                  type="password"
                  placeholder="Leave blank to keep current password"
                  value={editForm.password}
                  onChange={(e) =>
                    setEditForm({ ...editForm, password: e.target.value })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={closeEditDialog}
                disabled={updating}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updating}>
                {updating ? "Updating..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {deletingUser?.name}? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={closeDeleteDialog}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteUser}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rewards Management Dialog */}
      <RewardsManagementDialog
        user={rewardsUser}
        open={rewardsDialogOpen}
        onOpenChange={setRewardsDialogOpen}
      />
    </SidebarProvider>
  );
}
