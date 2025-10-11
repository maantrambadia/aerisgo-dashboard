import { useEffect, useMemo, useState } from "react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import api from "@/lib/axios";
import useDocumentTitle from "@/hooks/useDocumentTitle";
import { format } from "date-fns";
import {
  Plus,
  Edit3,
  XCircle,
  RefreshCw,
  Ticket,
  MoreVertical,
  Search,
} from "lucide-react";
import BookingDialog from "@/components/bookings/BookingDialog";

export default function Bookings() {
  useDocumentTitle("Bookings");

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [limit, setLimit] = useState(10);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);

  const [q, setQ] = useState("");
  const [flightNumber, setFlightNumber] = useState("");
  const [passengerName, setPassengerName] = useState("");
  const [status, setStatus] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState(null);

  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState(null);

  const filters = useMemo(
    () => ({ q, flightNumber, passengerName, status }),
    [q, flightNumber, passengerName, status]
  );

  async function fetchBookings(opts = {}) {
    const params = new URLSearchParams();
    params.set("page", String(opts.page ?? page));
    params.set("limit", String(opts.limit ?? limit));
    if (q) params.set("q", q);
    if (flightNumber) params.set("flightNumber", flightNumber);
    if (passengerName) params.set("passengerName", passengerName);
    if (status) params.set("status", status);

    try {
      if (!loading) setFetching(true);
      const { data } = await api.get(`/bookings?${params.toString()}`);
      setItems(Array.isArray(data.items) ? data.items : []);
      setTotal(data.total || 0);
      setPage(data.page || 1);
      setPages(data.pages || 1);
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to fetch bookings";
      toast.error(msg);
    } finally {
      setLoading(false);
      setFetching(false);
    }
  }

  useEffect(() => {
    fetchBookings({ page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, limit]);

  function openCreate() {
    setEditingBooking(null);
    setBookingDialogOpen(true);
  }

  function openEdit(booking) {
    setEditingBooking(booking);
    setBookingDialogOpen(true);
  }

  function requestCancel(booking) {
    setCancelTarget(booking);
    setCancelDialogOpen(true);
  }

  async function confirmCancel() {
    if (!cancelTarget?._id) return setCancelDialogOpen(false);
    try {
      await api.post(`/bookings/${cancelTarget._id}/cancel`);
      toast.success("Booking cancelled");
      setCancelDialogOpen(false);
      setCancelTarget(null);
      fetchBookings();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Cancel failed");
    }
  }

  function clearFilters() {
    setQ("");
    setFlightNumber("");
    setPassengerName("");
    setStatus("");
  }

  const filteredItems = items.filter((booking) => {
    if (activeTab === "all") return true;
    return booking.status === activeTab;
  });

  const counts = {
    all: items.length,
    confirmed: items.filter((b) => b.status === "confirmed").length,
    pending: items.filter((b) => b.status === "pending").length,
    cancelled: items.filter((b) => b.status === "cancelled").length,
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
                      <Ticket className="h-5 w-5" />
                      Bookings Management
                    </CardTitle>
                    <CardDescription className="mt-1.5">
                      Manage flight bookings, passenger lists, and seat
                      assignments
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchBookings()}
                      disabled={fetching}
                    >
                      <RefreshCw
                        className={`h-4 w-4 ${fetching ? "animate-spin" : ""}`}
                      />
                    </Button>
                    <Button size="sm" onClick={openCreate}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Booking
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Filters */}
                <div className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search bookings..."
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Input
                    placeholder="Flight number..."
                    value={flightNumber}
                    onChange={(e) => setFlightNumber(e.target.value)}
                  />
                  <Input
                    placeholder="Passenger name..."
                    value={passengerName}
                    onChange={(e) => setPassengerName(e.target.value)}
                  />
                  {(q || flightNumber || passengerName || status) && (
                    <Button variant="outline" onClick={clearFilters}>
                      Clear Filters
                    </Button>
                  )}
                </div>

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
                    <TabsTrigger value="confirmed" className="relative">
                      Confirmed
                      <Badge
                        variant="secondary"
                        className="ml-2 px-1.5 py-0 text-xs"
                      >
                        {counts.confirmed}
                      </Badge>
                    </TabsTrigger>
                    <TabsTrigger value="pending" className="relative">
                      Pending
                      <Badge
                        variant="secondary"
                        className="ml-2 px-1.5 py-0 text-xs"
                      >
                        {counts.pending}
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
                        <Ticket className="mx-auto h-12 w-12 text-muted-foreground/50" />
                        <p className="mt-4 text-sm text-muted-foreground">
                          No {activeTab !== "all" ? activeTab : ""} bookings
                          found
                        </p>
                      </div>
                    ) : (
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Booking ID</TableHead>
                              <TableHead>Passenger</TableHead>
                              <TableHead>Flight</TableHead>
                              <TableHead>Seat</TableHead>
                              <TableHead>Class</TableHead>
                              <TableHead>Price</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead className="text-right">
                                Actions
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredItems.map((booking) => (
                              <TableRow key={booking._id}>
                                <TableCell className="font-mono text-xs">
                                  {booking._id.slice(-8)}
                                </TableCell>
                                <TableCell>
                                  <div className="font-medium">
                                    {booking.userId?.name || "—"}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {booking.userId?.email || "—"}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="font-medium">
                                    {booking.flightId?.flightNumber || "—"}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {booking.flightId?.source} →{" "}
                                    {booking.flightId?.destination}
                                  </div>
                                </TableCell>
                                <TableCell className="font-medium">
                                  {booking.seatNumber}
                                </TableCell>
                                <TableCell className="capitalize">
                                  {booking.travelClass}
                                </TableCell>
                                <TableCell>
                                  ₹
                                  {Number(booking.price || 0).toLocaleString(
                                    "en-IN"
                                  )}
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant={
                                      booking.status === "confirmed"
                                        ? "default"
                                        : booking.status === "pending"
                                        ? "secondary"
                                        : "destructive"
                                    }
                                    className="capitalize"
                                  >
                                    {booking.status}
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
                                      <DropdownMenuLabel>
                                        Actions
                                      </DropdownMenuLabel>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        onClick={() => openEdit(booking)}
                                        disabled={
                                          booking.status === "cancelled"
                                        }
                                      >
                                        <Edit3 className="mr-2 h-4 w-4" />
                                        Edit Booking
                                      </DropdownMenuItem>
                                      {booking.status !== "cancelled" && (
                                        <>
                                          <DropdownMenuSeparator />
                                          <DropdownMenuItem
                                            onClick={() =>
                                              requestCancel(booking)
                                            }
                                            className="text-destructive focus:text-destructive"
                                          >
                                            <XCircle className="mr-2 h-4 w-4" />
                                            Cancel Booking
                                          </DropdownMenuItem>
                                        </>
                                      )}
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                    {pages > 1 && (
                      <div className="mt-4 flex items-center justify-between">
                        <div className="text-xs text-muted-foreground">
                          Page {page} of {pages} • {total} total bookings
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={page <= 1}
                            onClick={() => fetchBookings({ page: page - 1 })}
                          >
                            Previous
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={page >= pages}
                            onClick={() => fetchBookings({ page: page + 1 })}
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

        {/* Booking Dialog */}
        <BookingDialog
          open={bookingDialogOpen}
          onOpenChange={setBookingDialogOpen}
          booking={editingBooking}
          onSuccess={fetchBookings}
        />

        {/* Cancel Confirmation Dialog */}
        <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Cancel booking</AlertDialogTitle>
              <AlertDialogDescription>
                This will cancel the booking and free up the seat. This action
                cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmCancel}>
                Confirm
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SidebarInset>
    </SidebarProvider>
  );
}
