import { Armchair, Plane, DoorOpen, Coffee, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

/**
 * Reusable Seat Map View Component
 * Displays A320 Neo airplane layout with seats
 * Can be used in dialogs or inline
 */
export default function SeatMapView({ seats = [], passengers = [] }) {
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

  // Create passenger map for quick lookup
  const passengerMap = {};
  passengers.forEach((p) => {
    passengerMap[p.seatNumber] = p;
  });

  const seatRows = groupSeatsByRow();
  const rowNumbers = Object.keys(seatRows)
    .map(Number)
    .sort((a, b) => a - b);

  const getRowClass = (rowNum) => {
    if (rowNum <= 2) return "first";
    if (rowNum <= 7) return "business";
    return "economy";
  };

  if (seats.length === 0) {
    return (
      <div className="text-center py-12">
        <Armchair className="mx-auto h-12 w-12 text-muted-foreground/50" />
        <p className="mt-4 text-sm text-muted-foreground">
          No seat data available
        </p>
      </div>
    );
  }

  return (
    <div className="relative flex justify-center py-4">
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
                              rowClass === "business" ? "default" : "secondary"
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
                          const passenger = passengerMap[seat.seatNumber];
                          return (
                            <SeatDisplay
                              key={letter}
                              seat={seat}
                              passenger={passenger}
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
                          const passenger = passengerMap[seat.seatNumber];
                          return (
                            <SeatDisplay
                              key={letter}
                              seat={seat}
                              passenger={passenger}
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
  );
}

function SeatDisplay({ seat, passenger, rowClass, isExitRow }) {
  const isBooked = !!passenger;
  const isExtraLegroom = seat.isExtraLegroom || isExitRow;
  const passengerName = passenger?.userId?.name;

  // Color scheme based on class and availability
  const getColorScheme = () => {
    if (isBooked) {
      return {
        bg: "bg-red-500/20 dark:bg-red-900/30",
        border: "border-red-500 dark:border-red-600",
        text: "text-red-700 dark:text-red-400",
      };
    }

    if (isExtraLegroom) {
      return {
        bg: "bg-yellow-400/30 dark:bg-yellow-600/30",
        border: "border-yellow-500 dark:border-yellow-600",
        text: "text-yellow-800 dark:text-yellow-300",
      };
    }

    if (rowClass === "first") {
      return {
        bg: "bg-purple-400/30 dark:bg-purple-600/30",
        border: "border-purple-500 dark:border-purple-600",
        text: "text-purple-800 dark:text-purple-300",
      };
    }

    if (rowClass === "business") {
      return {
        bg: "bg-blue-400/30 dark:bg-blue-600/30",
        border: "border-blue-500 dark:border-blue-600",
        text: "text-blue-800 dark:text-blue-300",
      };
    }

    return {
      bg: "bg-gray-200 dark:bg-gray-700",
      border: "border-gray-400 dark:border-gray-600",
      text: "text-gray-700 dark:text-gray-300",
    };
  };

  const colors = getColorScheme();
  const seatHeight = rowClass === "first" ? "h-11" : "h-10";

  return (
    <div
      title={
        isBooked
          ? `${seat.seatNumber} - Booked${
              passengerName ? ` by ${passengerName}` : ""
            }`
          : `${seat.seatNumber} - Available${
              isExtraLegroom ? " (Extra Legroom)" : ""
            }`
      }
      className={`
        relative group w-11 ${seatHeight}
        rounded-lg border-2 transition-all duration-200
        flex flex-col items-center justify-center
        ${colors.bg} ${colors.border} ${colors.text}
        ${isBooked ? "opacity-60" : ""}
      `}
    >
      {/* Seat Icon */}
      <Armchair className="h-4 w-4" />

      {/* Seat Label */}
      <span className="text-[9px] font-bold mt-0.5">
        {seat.seatNumber.match(/[A-F]/)}
      </span>

      {/* Booked Indicator */}
      {isBooked && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-full h-0.5 bg-red-600 dark:bg-red-400 rotate-45" />
        </div>
      )}
    </div>
  );
}
