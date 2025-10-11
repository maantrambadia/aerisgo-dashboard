import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import api from "@/lib/axios";
import { toast } from "sonner";
import { Armchair, RefreshCw } from "lucide-react";

export default function SeatMapDialog({
  open,
  onOpenChange,
  flight,
  onSeatSelect,
}) {
  const [loading, setLoading] = useState(false);
  const [seats, setSeats] = useState([]);
  const [stats, setStats] = useState({ total: 0, available: 0, booked: 0 });

  useEffect(() => {
    if (open && flight?._id) {
      fetchSeats();
    }
  }, [open, flight]);

  async function fetchSeats() {
    try {
      setLoading(true);
      const { data } = await api.get(`/seats/flight/${flight._id}`);
      setSeats(data.seats || []);
      setStats({
        total: data.totalSeats || 0,
        available: data.availableSeats || 0,
        booked: data.bookedSeats || 0,
      });
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to fetch seats");
    } finally {
      setLoading(false);
    }
  }

  function groupSeatsByClass() {
    const groups = {
      first: [],
      business: [],
      economy: [],
    };

    seats.forEach((seat) => {
      if (groups[seat.travelClass]) {
        groups[seat.travelClass].push(seat);
      }
    });

    return groups;
  }

  function handleSeatClick(seat) {
    if (onSeatSelect && seat.isAvailable) {
      onSeatSelect(seat);
      onOpenChange(false);
    }
  }

  const seatGroups = groupSeatsByClass();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <Armchair className="h-5 w-5" />
                Seat Map - {flight?.flightNumber}
              </DialogTitle>
              <DialogDescription>
                {flight?.source} → {flight?.destination}
              </DialogDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchSeats}
              disabled={loading}
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
            </Button>
          </div>
        </DialogHeader>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-lg border p-3 text-center">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-xs text-muted-foreground">Total Seats</div>
          </div>
          <div className="rounded-lg border p-3 text-center bg-green-500/10">
            <div className="text-2xl font-bold text-green-700 dark:text-green-400">
              {stats.available}
            </div>
            <div className="text-xs text-muted-foreground">Available</div>
          </div>
          <div className="rounded-lg border p-3 text-center bg-red-500/10">
            <div className="text-2xl font-bold text-red-700 dark:text-red-400">
              {stats.booked}
            </div>
            <div className="text-xs text-muted-foreground">Booked</div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded border-2 border-green-500 bg-green-500/10" />
            <span>Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded border-2 border-red-500 bg-red-500/10" />
            <span>Booked</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded border-2 border-blue-500 bg-blue-500/10" />
            <span>Extra Legroom</span>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : seats.length === 0 ? (
          <div className="text-center py-12">
            <Armchair className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-sm text-muted-foreground">
              No seats configured for this flight
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* First Class */}
            {seatGroups.first.length > 0 && (
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <Badge variant="default">First Class</Badge>
                  <span className="text-xs text-muted-foreground">
                    {seatGroups.first.filter((s) => s.isAvailable).length}{" "}
                    available
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {seatGroups.first.map((seat) => (
                    <SeatButton
                      key={seat._id}
                      seat={seat}
                      onClick={() => handleSeatClick(seat)}
                    />
                  ))}
                </div>
                <Separator className="mt-6" />
              </div>
            )}

            {/* Business Class */}
            {seatGroups.business.length > 0 && (
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <Badge variant="secondary">Business Class</Badge>
                  <span className="text-xs text-muted-foreground">
                    {seatGroups.business.filter((s) => s.isAvailable).length}{" "}
                    available
                  </span>
                </div>
                <div className="grid grid-cols-6 gap-2">
                  {seatGroups.business.map((seat) => (
                    <SeatButton
                      key={seat._id}
                      seat={seat}
                      onClick={() => handleSeatClick(seat)}
                    />
                  ))}
                </div>
                <Separator className="mt-6" />
              </div>
            )}

            {/* Economy Class */}
            {seatGroups.economy.length > 0 && (
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <Badge variant="outline">Economy Class</Badge>
                  <span className="text-xs text-muted-foreground">
                    {seatGroups.economy.filter((s) => s.isAvailable).length}{" "}
                    available
                  </span>
                </div>
                <div className="grid grid-cols-6 gap-2">
                  {seatGroups.economy.map((seat) => (
                    <SeatButton
                      key={seat._id}
                      seat={seat}
                      onClick={() => handleSeatClick(seat)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function SeatButton({ seat, onClick }) {
  const isAvailable = seat.isAvailable;
  const isExtraLegroom = seat.isExtraLegroom;
  const passengerName = seat.booking?.userId?.name;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onClick}
            disabled={!isAvailable}
            className={`
              h-10 rounded border-2 text-xs font-medium transition-all
              ${
                isAvailable
                  ? isExtraLegroom
                    ? "border-blue-500 bg-blue-500/10 hover:bg-blue-500/20"
                    : "border-green-500 bg-green-500/10 hover:bg-green-500/20"
                  : "border-red-500 bg-red-500/10 cursor-not-allowed opacity-60"
              }
            `}
          >
            {seat.seatNumber}
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-xs">
            <div className="font-medium">{seat.seatNumber}</div>
            <div className="text-muted-foreground capitalize">
              {seat.travelClass}
            </div>
            {isExtraLegroom && (
              <div className="text-blue-500">Extra Legroom</div>
            )}
            {!isAvailable && passengerName && (
              <div className="text-red-500">Booked by {passengerName}</div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
