import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import {
  ArrowLeft,
  Plane,
  Users,
  Lock,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import useDocumentTitle from "@/hooks/useDocumentTitle";
import { toast } from "sonner";
import api from "@/lib/axios";
import { getFlightSeats, adminUnlockSeat } from "@/lib/seats";
import { useSeatSocket } from "@/hooks/useSeatSocket";

// Seat Button Component for Admin View
const AdminSeatButton = ({ seat, onUnlock, lockedInfo }) => {
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);

  // Update timer every second for locked seats
  useEffect(() => {
    if (!lockedInfo?.isLocked || !lockedInfo?.expiresAt) {
      setTimeRemaining(0);
      return;
    }

    const updateTimer = () => {
      const remaining = Math.max(
        0,
        Math.floor((new Date(lockedInfo.expiresAt) - new Date()) / 1000)
      );
      setTimeRemaining(remaining);
    };

    // Update immediately
    updateTimer();

    // Then update every second
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [lockedInfo?.isLocked, lockedInfo?.expiresAt]);

  const getSeatColor = () => {
    if (lockedInfo?.isLocked) return "#f97316"; // Orange - Locked
    if (!seat.isAvailable) return "#dc2626"; // Red - Booked
    if (seat.isExtraLegroom) return "#eab308"; // Yellow - Extra Legroom
    return "#22c55e"; // Green - Available
  };

  const getBorderColor = () => {
    if (lockedInfo?.isLocked) return "#ea580c";
    if (!seat.isAvailable) return "#991b1b";
    if (seat.isExtraLegroom) return "#ca8a04";
    return "#16a34a";
  };

  const handleUnlock = async (e) => {
    e.stopPropagation();
    if (!lockedInfo?.isLocked) return;

    try {
      setIsUnlocking(true);
      await onUnlock(seat.seatNumber);
      toast.success(`Seat ${seat.seatNumber} unlocked successfully`);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to unlock seat");
    } finally {
      setIsUnlocking(false);
    }
  };

  const getTooltipContent = () => {
    if (lockedInfo?.isLocked) {
      const minutes = Math.floor(timeRemaining / 60);
      const seconds = timeRemaining % 60;

      return (
        <div className="space-y-2">
          <div className="font-semibold">Seat {seat.seatNumber} - Locked</div>
          <div className="text-xs space-y-1">
            <div>User: {lockedInfo.userName || "Unknown"}</div>
            <div>Email: {lockedInfo.userEmail || "N/A"}</div>
            <div>
              Expires in: {minutes}:{seconds.toString().padStart(2, "0")}
            </div>
          </div>
          <Button
            size="sm"
            variant="destructive"
            className="w-full mt-2"
            onClick={handleUnlock}
            disabled={isUnlocking}
          >
            {isUnlocking ? "Unlocking..." : "Release Lock"}
          </Button>
        </div>
      );
    }

    if (!seat.isAvailable) {
      return (
        <div className="space-y-1">
          <div className="font-semibold">Seat {seat.seatNumber} - Booked</div>
          <div className="text-xs">
            {seat.booking?.passengerName || "Passenger"}
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-1">
        <div className="font-semibold">Seat {seat.seatNumber} - Available</div>
        {seat.isExtraLegroom && (
          <div className="text-xs">Extra Legroom (+₹500)</div>
        )}
      </div>
    );
  };

  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <button
            className="w-11 h-11 rounded-xl flex flex-col items-center justify-center border-2 transition-all hover:scale-110"
            style={{
              backgroundColor: getSeatColor(),
              borderColor: getBorderColor(),
            }}
          >
            {lockedInfo?.isLocked ? (
              <Lock className="h-4 w-4 text-white" />
            ) : !seat.isAvailable ? (
              <XCircle className="h-4 w-4 text-white" />
            ) : (
              <CheckCircle2 className="h-4 w-4 text-white" />
            )}
            <span className="text-[9px] font-bold mt-0.5 text-white">
              {seat.seatNumber.match(/[A-F]/)}
            </span>
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          {getTooltipContent()}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default function FlightSeatMap() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [flight, setFlight] = useState(null);
  const [seats, setSeats] = useState([]);
  const [lockedSeats, setLockedSeats] = useState(new Map());
  const [activityLog, setActivityLog] = useState([]);

  useDocumentTitle("Flight Seat Map");

  useEffect(() => {
    fetchData();
  }, [id]);

  async function fetchData() {
    try {
      setLoading(true);

      // Fetch flight details
      const flightRes = await api.get(`/flights/${id}`);
      setFlight(flightRes.data.flight);

      // Fetch seats with lock information
      const seatsRes = await getFlightSeats(id);
      setSeats(seatsRes.seats || []);

      // Initialize locked seats from server
      const initialLocks = new Map();
      (seatsRes.seats || []).forEach((seat) => {
        if (seat.lockedBy && seat.lockExpiresAt) {
          initialLocks.set(seat.seatNumber, {
            isLocked: true,
            lockedBy: seat.lockedBy._id || seat.lockedBy,
            userName: seat.lockedBy.name || "Unknown",
            userEmail: seat.lockedBy.email || "N/A",
            expiresAt: seat.lockExpiresAt,
          });
        }
      });
      setLockedSeats(initialLocks);

      setLoading(false);
    } catch (error) {
      setLoading(false);
      toast.error(error.response?.data?.message || "Failed to load seat map");
      setTimeout(() => navigate("/flights"), 1500);
    }
  }

  // Activity log helper
  const addActivityLog = useCallback((message) => {
    const timestamp = new Date().toLocaleTimeString();
    setActivityLog((prev) =>
      [{ time: timestamp, message }, ...prev].slice(0, 10)
    );
  }, []);

  // Socket.IO real-time event handlers
  const socketHandlers = useMemo(
    () => ({
      onSeatLocked: (data) => {
        if (data.flightId !== id) return;
        setLockedSeats((prev) => {
          const newLocks = new Map(prev);
          newLocks.set(data.seatNumber, {
            isLocked: true,
            lockedBy: data.lockedBy,
            expiresAt: data.lockExpiresAt,
            userName: data.userName || "Unknown",
            userEmail: data.userEmail || "N/A",
          });
          return newLocks;
        });
        addActivityLog(
          `Seat ${data.seatNumber} locked by ${data.userName || "User"}`
        );
      },
      onSeatUnlocked: (data) => {
        if (data.flightId !== id) return;
        setLockedSeats((prev) => {
          const newLocks = new Map(prev);
          newLocks.delete(data.seatNumber);
          return newLocks;
        });
        addActivityLog(`Seat ${data.seatNumber} unlocked`);
      },
      onSeatBooked: (data) => {
        if (data.flightId !== id) return;
        setSeats((prevSeats) =>
          prevSeats.map((s) =>
            s.seatNumber === data.seatNumber ? { ...s, isAvailable: false } : s
          )
        );
        setLockedSeats((prev) => {
          const newLocks = new Map(prev);
          newLocks.delete(data.seatNumber);
          return newLocks;
        });
        addActivityLog(`Seat ${data.seatNumber} booked`);
      },
      onSeatExpired: (data) => {
        if (data.flightId !== id) return;
        setLockedSeats((prev) => {
          const newLocks = new Map(prev);
          newLocks.delete(data.seatNumber);
          return newLocks;
        });
        addActivityLog(`Seat ${data.seatNumber} lock expired`);
      },
      onError: (error) => {
        console.error("Socket error:", error);
      },
    }),
    [id, addActivityLog]
  );

  // Initialize Socket.IO connection
  useSeatSocket(id, socketHandlers);

  const handleUnlockSeat = async (seatNumber) => {
    await adminUnlockSeat({ flightId: id, seatNumber });
  };

  // Group seats by row
  const seatsByRow = useMemo(() => {
    const rows = {};
    seats.forEach((seat) => {
      const match = seat.seatNumber.match(/^(\d+)([A-F])$/);
      if (match) {
        const rowNum = parseInt(match[1]);
        if (!rows[rowNum]) rows[rowNum] = {};
        rows[rowNum][match[2]] = seat;
      }
    });
    return rows;
  }, [seats]);

  const rowNumbers = Object.keys(seatsByRow)
    .map(Number)
    .sort((a, b) => a - b);

  const getRowClass = (rowNum) => {
    if (rowNum <= 2) return "first";
    if (rowNum <= 7) return "business";
    return "economy";
  };

  // Calculate statistics
  const stats = useMemo(() => {
    const total = seats.length;
    const booked = seats.filter((s) => !s.isAvailable).length;
    const locked = lockedSeats.size;
    const available = total - booked - locked;

    return { total, available, locked, booked };
  }, [seats, lockedSeats]);

  if (loading || !flight) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center space-y-4">
          <Spinner className="h-12 w-12 mx-auto" />
          <p className="text-muted-foreground">Loading seat map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/flights")}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Flight Seat Map</h1>
                <p className="text-sm text-muted-foreground">
                  {flight.flightNumber} • {flight.source} → {flight.destination}
                </p>
              </div>
            </div>
            <Badge variant="outline" className="gap-2">
              <Clock className="h-4 w-4" />
              Real-time Monitoring
            </Badge>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="@container/card bg-gradient-to-t from-blue-500/5 to-card">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Seats
              </CardTitle>
              <div className="text-2xl font-bold tabular-nums @[250px]/card:text-3xl">
                {stats.total}
              </div>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              Aircraft capacity
            </CardContent>
          </Card>
          <Card className="@container/card bg-gradient-to-t from-green-500/5 to-card">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Available
              </CardTitle>
              <div className="text-2xl font-bold text-green-600 tabular-nums @[250px]/card:text-3xl">
                {stats.available}
              </div>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              Ready for booking
            </CardContent>
          </Card>
          <Card className="@container/card bg-gradient-to-t from-orange-500/5 to-card">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Lock className="h-4 w-4 text-orange-500" />
                Locked
              </CardTitle>
              <div className="text-2xl font-bold text-orange-600 tabular-nums @[250px]/card:text-3xl">
                {stats.locked}
              </div>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              In selection process
            </CardContent>
          </Card>
          <Card className="@container/card bg-gradient-to-t from-red-500/5 to-card">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4 text-red-500" />
                Booked
              </CardTitle>
              <div className="text-2xl font-bold text-red-600 tabular-nums @[250px]/card:text-3xl">
                {stats.booked}
              </div>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              Confirmed passengers
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Seat Map */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Seat Map</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="seat-map-scroll overflow-x-auto overflow-y-hidden pb-2">
                <div className="flex items-center gap-2 min-w-max pb-2">
                  {/* Cockpit */}
                  <div className="flex flex-col items-center justify-center w-16 h-[300px] bg-muted rounded-l-2xl">
                    <Plane className="h-6 w-6 text-muted-foreground mb-2" />
                    <span className="text-xs font-bold text-muted-foreground writing-mode-vertical">
                      COCKPIT
                    </span>
                  </div>

                  {/* Seat Rows */}
                  {rowNumbers.map((rowNum) => {
                    const row = seatsByRow[rowNum];
                    const rowClass = getRowClass(rowNum);

                    return (
                      <div key={rowNum} className="flex flex-col items-center">
                        {/* Row number top */}
                        <div className="h-6 flex items-center justify-center mb-1">
                          <span className="text-xs font-bold text-muted-foreground">
                            {rowNum}
                          </span>
                        </div>

                        {/* Seats */}
                        <div className="flex flex-col gap-2">
                          {["F", "E", "D"].map((letter) => {
                            const seat = row[letter];
                            if (!seat)
                              return <div key={letter} className="h-11 w-11" />;
                            return (
                              <AdminSeatButton
                                key={letter}
                                seat={seat}
                                onUnlock={handleUnlockSeat}
                                lockedInfo={lockedSeats.get(seat.seatNumber)}
                              />
                            );
                          })}

                          {/* Aisle */}
                          <div className="h-4 flex items-center justify-center">
                            <div className="w-full h-[2px] bg-blue-300/40" />
                          </div>

                          {["C", "B", "A"].map((letter) => {
                            const seat = row[letter];
                            if (!seat)
                              return <div key={letter} className="h-11 w-11" />;
                            return (
                              <AdminSeatButton
                                key={letter}
                                seat={seat}
                                onUnlock={handleUnlockSeat}
                                lockedInfo={lockedSeats.get(seat.seatNumber)}
                              />
                            );
                          })}
                        </div>

                        {/* Row number bottom */}
                        <div className="h-6 flex items-center justify-center mt-1">
                          <span className="text-xs font-bold text-muted-foreground">
                            {rowNum}
                          </span>
                        </div>
                      </div>
                    );
                  })}

                  {/* Tail */}
                  <div className="flex flex-col items-center justify-center w-16 h-[300px] bg-muted rounded-r-2xl">
                    <span className="text-xs font-bold text-muted-foreground">
                      TAIL
                    </span>
                  </div>
                </div>
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-4 mt-6 pt-6 border-t">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-green-500" />
                  <span className="text-sm">Available</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-orange-500" />
                  <span className="text-sm">Locked</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-red-500" />
                  <span className="text-sm">Booked</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-yellow-500" />
                  <span className="text-sm">Extra Legroom</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Activity Log */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Activity Log
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {activityLog.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No recent activity
                  </p>
                ) : (
                  activityLog.map((log, index) => (
                    <div
                      key={index}
                      className="text-sm p-2 rounded bg-muted/50 flex items-start gap-2"
                    >
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {log.time}
                      </span>
                      <span className="flex-1">{log.message}</span>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
