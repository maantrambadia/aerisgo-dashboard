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

export default function Users() {
  useDocumentTitle("Users");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState({});

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

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset className="dark:bg-black/20">
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2 py-4 md:gap-6 md:py-6">
            <Card className="mx-4 md:mx-6">
              <CardHeader>
                <CardTitle>Users</CardTitle>
                <CardDescription>
                  Manage user accounts and approvals
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-sm text-muted-foreground">
                    Loading users...
                  </div>
                ) : users.length === 0 ? (
                  <div className="text-sm text-muted-foreground">
                    No users found.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left border-b">
                          <th className="py-2 pr-3">Name</th>
                          <th className="py-2 pr-3">Email</th>
                          <th className="py-2 pr-3">Phone</th>
                          <th className="py-2 pr-3">Role</th>
                          <th className="py-2 pr-3">Status</th>
                          <th className="py-2 pr-3">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((u) => {
                          const id = u._id || u.id;
                          const verified = Boolean(u.isVerified);
                          return (
                            <tr key={id} className="border-b last:border-0">
                              <td className="py-2 pr-3">{u.name}</td>
                              <td className="py-2 pr-3">{u.email}</td>
                              <td className="py-2 pr-3">{u.phone || "—"}</td>
                              <td className="py-2 pr-3 capitalize">{u.role}</td>
                              <td className="py-2 pr-3">
                                {verified ? (
                                  <Badge variant="secondary">Verified</Badge>
                                ) : (
                                  <Badge variant="destructive">Pending</Badge>
                                )}
                              </td>
                              <td className="py-2 pr-3">
                                {!verified ? (
                                  <Button
                                    size="sm"
                                    disabled={!!approving[id]}
                                    onClick={() => approve(id)}
                                  >
                                    {approving[id] ? "Approving..." : "Approve"}
                                  </Button>
                                ) : (
                                  <span className="text-muted-foreground">
                                    —
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
