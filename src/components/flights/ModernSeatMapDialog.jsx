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
import api from "@/lib/axios";
import { toast } from "sonner";
import {
  Armchair,
  RefreshCw,
  Plane,
  DoorOpen,
  Coffee,
  AlertCircle,
} from "lucide-react";

export default function ModernSeatMapDialog({
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

  function groupSeatsByRow() {
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
  }

  function handleSeatClick(seat) {
    if (onSeatSelect && seat.isAvailable) {
      onSeatSelect(seat);
      onOpenChange(false);
    }
  }

  const seatRows = groupSeatsByRow();
  const rowNumbers = Object.keys(seatRows)
    .map(Number)
    .sort((a, b) => a - b);

  // Determine class for each row
  const getRowClass = (rowNum) => {
    if (rowNum <= 2) return "first";
    if (rowNum <= 7) return "business";
    return "economy";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <Plane className="h-5 w-5" />
                A320 Neo Seat Map - {flight?.flightNumber}
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
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
          <div className="flex items-center gap-2">
            <div className="h-9 w-11 rounded-lg border-2 border-purple-500 bg-purple-400/30 flex items-center justify-center">
              <Armchair className="h-4 w-4 text-purple-800" />
            </div>
            <span className="font-medium">First Class</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-9 w-11 rounded-lg border-2 border-blue-500 bg-blue-400/30 flex items-center justify-center">
              <Armchair className="h-4 w-4 text-blue-800" />
            </div>
            <span className="font-medium">Business</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-9 w-11 rounded-lg border-2 border-gray-400 bg-gray-200 flex items-center justify-center">
              <Armchair className="h-4 w-4 text-gray-700" />
            </div>
            <span className="font-medium">Economy</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-9 w-11 rounded-lg border-2 border-yellow-500 bg-yellow-400/30 flex items-center justify-center">
              <Armchair className="h-4 w-4 text-yellow-800" />
            </div>
            <span className="font-medium">Extra Legroom</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-9 w-11 rounded-lg border-2 border-red-500 bg-red-500/20 flex items-center justify-center relative">
              <Armchair className="h-4 w-4 text-red-700" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-full h-0.5 bg-red-600 rotate-45" />
              </div>
            </div>
            <span className="font-medium">Booked</span>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
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
          <div className="relative flex justify-center py-8">
            {/* Airplane Container */}
            <div className="relative">
              {/* Airplane Fuselage */}
              <div className="relative mx-auto w-[420px] rounded-[60px] shadow-2xl border-4 border-primary/20 bg-gradient-to-b from-background to-muted overflow-hidden">
                {/* Cockpit - Rounded Top */}
                <div className="relative h-24 bg-gradient-to-b from-primary/10 to-background border-b-2 border-primary/20 flex items-center justify-center">
                  <div className="absolute top-4">
                    <Plane className="h-8 w-8 text-primary" />
                  </div>
                  {/* Cockpit Windows */}
                  <div className="absolute bottom-4 flex gap-3">
                    <div className="w-7 h-9 bg-primary/20 rounded-t-full border-2 border-primary/40" />
                    <div className="w-7 h-9 bg-primary/20 rounded-t-full border-2 border-primary/40" />
                  </div>
                </div>

                {/* Main Fuselage Body */}
                <div className="bg-gradient-to-b from-background to-muted">
                  {/* Front Lavatories */}
                  <div className="flex justify-between px-4 py-3 bg-primary/5 border-b border-primary/10">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <DoorOpen className="h-4 w-4 text-primary" />
                      <span className="font-medium">Lavatory</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Coffee className="h-4 w-4 text-primary" />
                      <span className="font-medium">Galley</span>
                    </div>
                  </div>

                  {/* Wings Indicators */}
                  <div className="absolute left-0 top-[200px] -translate-x-full flex items-center">
                    <div className="w-16 h-24 bg-gradient-to-r from-primary/30 to-primary/10 rounded-l-full border-2 border-primary/30 shadow-lg flex items-center justify-center">
                      <AlertCircle className="h-5 w-5 text-destructive" />
                    </div>
                  </div>
                  <div className="absolute right-0 top-[200px] translate-x-full flex items-center">
                    <div className="w-16 h-24 bg-gradient-to-l from-primary/30 to-primary/10 rounded-r-full border-2 border-primary/30 shadow-lg flex items-center justify-center">
                      <AlertCircle className="h-5 w-5 text-destructive" />
                    </div>
                  </div>

                  {/* Seats Container */}
                  <div className="px-6 py-4 space-y-2">
                    {rowNumbers.map((rowNum) => {
                      const row = seatRows[rowNum];
                      const rowClass = getRowClass(rowNum);
                      const isFirstOfClass =
                        rowNum === 1 || rowNum === 3 || rowNum === 8;
                      const isExitRow = rowNum === 10 || rowNum === 11;

                      return (
                        <div key={rowNum}>
                          {/* Class Separator */}
                          {isFirstOfClass && rowNum !== 1 && (
                            <div className="my-3 py-3 bg-gradient-to-r from-transparent via-primary/10 to-transparent">
                              <div className="text-center">
                                <Badge
                                  variant={
                                    rowClass === "business"
                                      ? "default"
                                      : "secondary"
                                  }
                                  className="text-xs font-bold"
                                >
                                  {rowClass === "business"
                                    ? "✈️ Business Class"
                                    : "🪑 Economy Class"}
                                </Badge>
                              </div>
                            </div>
                          )}

                          {/* First Class Header */}
                          {rowNum === 1 && (
                            <div className="text-center py-2 mb-2">
                              <Badge className="text-xs font-bold bg-gradient-to-r from-yellow-500 to-yellow-600">
                                ⭐ First Class
                              </Badge>
                            </div>
                          )}

                          {/* Exit Row Indicator */}
                          {isExitRow && rowNum === 10 && (
                            <div className="flex items-center justify-center gap-2 py-2 bg-yellow-50 dark:bg-yellow-950 rounded-lg border border-yellow-300 dark:border-yellow-700 mb-2">
                              <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                              <span className="text-xs font-bold text-yellow-700 dark:text-yellow-300">
                                EXIT ROW - Extra Legroom
                              </span>
                              <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                            </div>
                          )}

                          {/* Seat Row */}
                          <div className="flex items-center gap-2">
                            {/* Row Number (Left) */}
                            <div className="w-6 text-center text-xs font-bold text-gray-600 dark:text-gray-400">
                              {rowNum}
                            </div>

                            {/* Left Side: A, B, C */}
                            <div className="flex gap-1.5 flex-1 justify-end">
                              {["A", "B", "C"].map((letter) => {
                                const seat = row[letter];
                                if (!seat)
                                  return <div key={letter} className="w-11" />;
                                return (
                                  <SeatButton
                                    key={letter}
                                    seat={seat}
                                    onClick={() => handleSeatClick(seat)}
                                    rowClass={rowClass}
                                    isExitRow={isExitRow}
                                  />
                                );
                              })}
                            </div>

                            {/* Aisle */}
                            <div className="w-10 h-full flex items-center justify-center">
                              <div className="w-full h-full border-l-2 border-r-2 border-dashed border-blue-300 dark:border-blue-700 bg-blue-50/30 dark:bg-blue-950/30" />
                            </div>

                            {/* Right Side: D, E, F */}
                            <div className="flex gap-1.5 flex-1">
                              {["D", "E", "F"].map((letter) => {
                                const seat = row[letter];
                                if (!seat)
                                  return <div key={letter} className="w-11" />;
                                return (
                                  <SeatButton
                                    key={letter}
                                    seat={seat}
                                    onClick={() => handleSeatClick(seat)}
                                    rowClass={rowClass}
                                    isExitRow={isExitRow}
                                  />
                                );
                              })}
                            </div>

                            {/* Row Number (Right) */}
                            <div className="w-6 text-center text-xs font-bold text-gray-600 dark:text-gray-400">
                              {rowNum}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Rear Lavatories */}
                  <div className="flex justify-between px-4 py-3 bg-primary/5 border-t border-primary/10">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <DoorOpen className="h-4 w-4 text-primary" />
                      <span className="font-medium">Lavatory</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <DoorOpen className="h-4 w-4 text-primary" />
                      <span className="font-medium">Lavatory</span>
                    </div>
                  </div>
                </div>
                {/* End Main Fuselage Body */}

                {/* Tail - Rounded Bottom */}
                <div className="relative h-20 bg-gradient-to-b from-background to-primary/10 border-t-2 border-primary/20 flex items-center justify-center">
                  <div className="absolute top-4">
                    <Coffee className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </div>

              {/* Side Labels */}
              <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full ml-4">
                <div className="bg-primary text-primary-foreground px-3 py-8 rounded-r-lg shadow-lg">
                  <div className="writing-mode-vertical text-sm font-bold tracking-wider">
                    A320 NEO
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function SeatButton({ seat, onClick, rowClass, isExitRow }) {
  const isAvailable = seat.isAvailable;
  const isExtraLegroom = seat.isExtraLegroom || isExitRow;
  const passengerName = seat.booking?.userId?.name;

  // Color scheme based on class and availability
  const getColorScheme = () => {
    if (!isAvailable) {
      return {
        bg: "bg-red-500/20 dark:bg-red-900/30",
        border: "border-red-500 dark:border-red-600",
        text: "text-red-700 dark:text-red-400",
        hover: "",
      };
    }

    if (isExtraLegroom) {
      return {
        bg: "bg-yellow-400/30 dark:bg-yellow-600/30",
        border: "border-yellow-500 dark:border-yellow-600",
        text: "text-yellow-800 dark:text-yellow-300",
        hover: "hover:bg-yellow-400/50 hover:scale-110 hover:shadow-lg",
      };
    }

    if (rowClass === "first") {
      return {
        bg: "bg-purple-400/30 dark:bg-purple-600/30",
        border: "border-purple-500 dark:border-purple-600",
        text: "text-purple-800 dark:text-purple-300",
        hover: "hover:bg-purple-400/50 hover:scale-110 hover:shadow-lg",
      };
    }

    if (rowClass === "business") {
      return {
        bg: "bg-blue-400/30 dark:bg-blue-600/30",
        border: "border-blue-500 dark:border-blue-600",
        text: "text-blue-800 dark:text-blue-300",
        hover: "hover:bg-blue-400/50 hover:scale-110 hover:shadow-lg",
      };
    }

    return {
      bg: "bg-gray-200 dark:bg-gray-700",
      border: "border-gray-400 dark:border-gray-600",
      text: "text-gray-700 dark:text-gray-300",
      hover:
        "hover:bg-gray-300 dark:hover:bg-gray-600 hover:scale-110 hover:shadow-lg",
    };
  };

  const colors = getColorScheme();
  const seatHeight = rowClass === "first" ? "h-11" : "h-10";

  return (
    <button
      onClick={onClick}
      disabled={!isAvailable}
      title={
        isAvailable
          ? `${seat.seatNumber} - Available${
              isExtraLegroom ? " (Extra Legroom)" : ""
            }`
          : `${seat.seatNumber} - Booked${
              passengerName ? ` by ${passengerName}` : ""
            }`
      }
      className={`
        relative group w-11 ${seatHeight}
        rounded-lg border-2 transition-all duration-200
        flex flex-col items-center justify-center
        ${colors.bg} ${colors.border} ${colors.text}
        ${
          isAvailable
            ? colors.hover + " cursor-pointer"
            : "cursor-not-allowed opacity-60"
        }
      `}
    >
      {/* Seat Icon */}
      <Armchair className="h-4 w-4" />

      {/* Seat Label */}
      <span className="text-[9px] font-bold mt-0.5">
        {seat.seatNumber.match(/[A-F]/)}
      </span>

      {/* Hover Tooltip */}
      {isAvailable && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-2 py-1 rounded text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
          {seat.seatNumber}
          {isExtraLegroom && " ✨"}
        </div>
      )}

      {/* Booked Indicator */}
      {!isAvailable && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-full h-0.5 bg-red-600 dark:bg-red-400 rotate-45" />
        </div>
      )}
    </button>
  );
}
