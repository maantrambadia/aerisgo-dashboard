import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import api from "@/lib/axios";
import { toast } from "sonner";
import { Users, RefreshCw, Plane } from "lucide-react";

export default function PassengerListDialog({ open, onOpenChange, flight }) {
  const [loading, setLoading] = useState(false);
  const [passengers, setPassengers] = useState([]);
  const [totalPassengers, setTotalPassengers] = useState(0);

  useEffect(() => {
    if (open && flight?._id) {
      fetchPassengers();
    }
  }, [open, flight]);

  async function fetchPassengers() {
    try {
      setLoading(true);
      const { data } = await api.get(`/bookings/passengers/${flight._id}`);
      setPassengers(data.passengers || []);
      setTotalPassengers(data.totalPassengers || 0);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to fetch passengers");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Passenger List - {flight?.flightNumber}
              </DialogTitle>
              <DialogDescription className="flex items-center gap-2 mt-1">
                <Plane className="h-3 w-3" />
                {flight?.source} → {flight?.destination}
                <span>•</span>
                <span className="font-medium text-foreground">
                  {totalPassengers} passengers
                </span>
              </DialogDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchPassengers}
              disabled={loading}
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
            </Button>
          </div>
        </DialogHeader>

        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-[250px]" />
                  <Skeleton className="h-3 w-[200px]" />
                </div>
              </div>
            ))}
          </div>
        ) : passengers.length === 0 ? (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-sm text-muted-foreground">
              No passengers booked yet
            </p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Seat</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {passengers.map((booking) => (
                  <TableRow key={booking._id}>
                    <TableCell className="font-medium">
                      {booking.seatNumber}
                    </TableCell>
                    <TableCell>{booking.userId?.name || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {booking.userId?.email || "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {booking.userId?.phone || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`capitalize ${
                          booking.travelClass === "first"
                            ? "border-purple-500 text-purple-700 dark:text-purple-400"
                            : booking.travelClass === "business"
                            ? "border-blue-500 text-blue-700 dark:text-blue-400"
                            : "border-gray-500 text-gray-700 dark:text-gray-400"
                        }`}
                      >
                        {booking.travelClass === "first"
                          ? "⭐ First"
                          : booking.travelClass === "business"
                          ? "✈️ Business"
                          : "🪑 Economy"}
                      </Badge>
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
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
