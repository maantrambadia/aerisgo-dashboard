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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, flight]);

  async function fetchPassengers() {
    try {
      setLoading(true);
      const { data } = await api.get(`/bookings/passengers/${flight._id}`);
      setPassengers(data.passengers || []);
      setTotalPassengers(data.totalPassengers || 0);
    } catch (err) {
      toast.error(
        err?.response?.data?.message || "We couldn't load the passenger list.",
      );
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
                  <TableHead>Gender</TableHead>
                  <TableHead>Document</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {passengers.map((passenger, index) => (
                  <TableRow key={`${passenger.bookingId}-${index}`}>
                    <TableCell className="font-medium">
                      {passenger.seatNumber}
                      {passenger.isPrimary && (
                        <Badge variant="secondary" className="ml-2 text-xs">
                          Primary
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {passenger.fullName || passenger.userId?.name || "—"}
                      </div>
                      {passenger.dateOfBirth && (
                        <div className="text-xs text-muted-foreground">
                          DOB:{" "}
                          {new Date(passenger.dateOfBirth).toLocaleDateString(
                            "en-IN",
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="capitalize text-muted-foreground">
                      {passenger.gender || "—"}
                    </TableCell>
                    <TableCell>
                      {passenger.documentType && passenger.documentNumber ? (
                        <div className="text-sm">
                          <div className="font-medium">
                            {passenger.documentType.toUpperCase()}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {passenger.documentNumber}
                          </div>
                        </div>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {passenger.email || "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {passenger.phone || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`capitalize ${
                          passenger.travelClass === "first"
                            ? "border-purple-500 text-purple-700 dark:text-purple-400"
                            : passenger.travelClass === "business"
                              ? "border-blue-500 text-blue-700 dark:text-blue-400"
                              : "border-gray-500 text-gray-700 dark:text-gray-400"
                        }`}
                      >
                        {passenger.travelClass === "first"
                          ? "⭐ First"
                          : passenger.travelClass === "business"
                            ? "✈️ Business"
                            : "🪑 Economy"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          passenger.status === "confirmed"
                            ? "default"
                            : passenger.status === "pending"
                              ? "secondary"
                              : "destructive"
                        }
                        className="capitalize"
                      >
                        {passenger.status}
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
