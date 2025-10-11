import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import api from "@/lib/axios";
import { toast } from "sonner";

export default function BookingDialog({
  open,
  onOpenChange,
  booking,
  onSuccess,
}) {
  const [saving, setSaving] = useState(false);
  const [flights, setFlights] = useState([]);
  const [users, setUsers] = useState([]);
  const [seats, setSeats] = useState([]);
  const [loadingSeats, setLoadingSeats] = useState(false);
  const [pricingConfig, setPricingConfig] = useState(null);
  const [priceBreakdown, setPriceBreakdown] = useState(null);
  const [calculatingPrice, setCalculatingPrice] = useState(false);

  const [formData, setFormData] = useState({
    userId: "",
    flightId: "",
    seatNumber: "",
    travelClass: "economy",
    price: "",
  });

  useEffect(() => {
    if (open) {
      fetchFlights();
      fetchUsers();
      fetchPricingConfig();
      if (booking) {
        setFormData({
          userId: booking.userId?._id || "",
          flightId: booking.flightId?._id || "",
          seatNumber: booking.seatNumber || "",
          travelClass: booking.travelClass || "economy",
          price: booking.price?.toString() || "",
        });
        if (booking.flightId?._id) {
          fetchSeats(booking.flightId._id);
        }
      } else {
        setFormData({
          userId: "",
          flightId: "",
          seatNumber: "",
          travelClass: "economy",
          price: "",
        });
        setSeats([]);
      }
    } else {
      // Reset price breakdown only when dialog is closed
      setPriceBreakdown(null);
    }
  }, [open, booking]);

  // Define calculatePrice before it's used in useEffect
  const calculatePrice = useCallback(
    async (travelClass, isExtraLegroom) => {
      if (!formData.flightId || !pricingConfig) return;

      const selectedFlight = flights.find((f) => f._id === formData.flightId);
      if (!selectedFlight) return;

      try {
        setCalculatingPrice(true);

        // Get detailed breakdown
        const { data } = await api.post("/pricing/breakdown", {
          baseFare: selectedFlight.baseFare,
          travelClass,
          isExtraLegroom,
        });

        setPriceBreakdown(data);
        setFormData((prev) => ({ ...prev, price: data.total.toString() }));
      } catch (err) {
        console.error("Failed to calculate price:", err);
        setPriceBreakdown(null);
      } finally {
        setCalculatingPrice(false);
      }
    },
    [formData.flightId, pricingConfig, flights]
  );

  // Calculate price breakdown when editing and pricing config is loaded
  useEffect(() => {
    if (
      booking &&
      formData.flightId &&
      formData.seatNumber &&
      pricingConfig &&
      flights.length > 0
    ) {
      const selectedSeat = seats.find(
        (s) => s.seatNumber === formData.seatNumber
      );
      if (selectedSeat) {
        calculatePrice(
          formData.travelClass,
          selectedSeat.isExtraLegroom || false
        );
      }
    }
  }, [
    booking,
    formData.flightId,
    formData.seatNumber,
    formData.travelClass,
    pricingConfig,
    flights,
    seats,
    calculatePrice,
  ]);

  async function fetchFlights() {
    try {
      // Fetch all active flights (scheduled and delayed, but not cancelled or completed)
      const { data } = await api.get("/flights?limit=100");
      // Filter to show only scheduled and delayed flights
      const activeFlights = (data.items || []).filter(
        (flight) => flight.status === "scheduled" || flight.status === "delayed"
      );
      setFlights(activeFlights);
    } catch (err) {
      console.error("Failed to fetch flights:", err);
    }
  }

  async function fetchUsers() {
    try {
      const { data } = await api.get("/users");
      // Filter only passengers
      const passengers = (data.users || []).filter(
        (user) => user.role === "passenger"
      );
      setUsers(passengers);
    } catch (err) {
      console.error("Failed to fetch users:", err);
    }
  }

  async function fetchPricingConfig() {
    try {
      const { data } = await api.get("/pricing/config");
      setPricingConfig(data.config);
    } catch (err) {
      console.error("Failed to fetch pricing config:", err);
    }
  }

  async function fetchSeats(flightId) {
    try {
      setLoadingSeats(true);
      const { data } = await api.get(`/seats/flight/${flightId}`);
      setSeats(data.seats || []);
    } catch (err) {
      console.error("Failed to fetch seats:", err);
      setSeats([]);
    } finally {
      setLoadingSeats(false);
    }
  }

  function handleFlightChange(flightId) {
    // Find the selected flight to get its base fare
    const selectedFlight = flights.find((f) => f._id === flightId);
    const basePrice = selectedFlight?.baseFare?.toString() || "";

    setFormData({
      ...formData,
      flightId,
      seatNumber: "",
      travelClass: "economy", // Reset to economy when flight changes
      price: basePrice,
    });

    if (flightId) {
      fetchSeats(flightId);
    } else {
      setSeats([]);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        ...formData,
        price: parseFloat(formData.price),
      };

      if (booking) {
        await api.put(`/bookings/${booking._id}`, payload);
        toast.success("Booking updated successfully");
      } else {
        await api.post("/bookings", payload);
        toast.success("Booking created successfully");
      }

      onSuccess?.();
      onOpenChange(false);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to save booking");
    } finally {
      setSaving(false);
    }
  }

  // Filter and organize seats
  const availableSeats = seats.filter(
    (s) => s.isAvailable || s.seatNumber === booking?.seatNumber
  );

  // Group seats by travel class
  const seatsByClass = {
    first: availableSeats.filter((s) => s.travelClass === "first"),
    business: availableSeats.filter((s) => s.travelClass === "business"),
    economy: availableSeats.filter((s) => s.travelClass === "economy"),
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {booking ? "Edit Booking" : "Create Manual Booking"}
          </DialogTitle>
          <DialogDescription>
            {booking
              ? "Update booking details and seat assignment"
              : "Book a flight on behalf of a passenger"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="userId">Passenger</Label>
              <Select
                value={formData.userId}
                onValueChange={(value) =>
                  setFormData({ ...formData, userId: value })
                }
                disabled={!!booking}
              >
                <SelectTrigger id="userId" className="w-full">
                  <SelectValue placeholder="Select a passenger" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem
                      key={user._id || user.id}
                      value={user._id || user.id}
                    >
                      {user.name} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="flightId">Flight</Label>
              <Select
                value={formData.flightId}
                onValueChange={handleFlightChange}
                disabled={!!booking}
              >
                <SelectTrigger id="flightId" className="w-full">
                  <SelectValue placeholder="Select a flight" />
                </SelectTrigger>
                <SelectContent>
                  {flights.map((flight) => {
                    // Format times in local timezone (IST)
                    const depTime = new Date(
                      flight.departureTime
                    ).toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    });
                    const arrTime = new Date(
                      flight.arrivalTime
                    ).toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    });

                    return (
                      <SelectItem key={flight._id} value={flight._id}>
                        {flight.flightNumber} - {flight.source} →{" "}
                        {flight.destination} ({depTime} - {arrTime})
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="seatNumber">Seat Number</Label>
              <Select
                value={formData.seatNumber}
                onValueChange={(value) => {
                  // Auto-select travel class based on seat
                  const selectedSeat = seats.find(
                    (s) => s.seatNumber === value
                  );
                  const travelClass =
                    selectedSeat?.travelClass || formData.travelClass;
                  const isExtraLegroom = selectedSeat?.isExtraLegroom || false;

                  setFormData({
                    ...formData,
                    seatNumber: value,
                    travelClass,
                  });

                  // Auto-calculate price
                  calculatePrice(travelClass, isExtraLegroom);
                }}
                disabled={!formData.flightId || loadingSeats}
              >
                <SelectTrigger id="seatNumber" className="w-full">
                  <SelectValue
                    placeholder={
                      loadingSeats ? "Loading seats..." : "Select a seat"
                    }
                  />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {availableSeats.length === 0 ? (
                    <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                      No available seats
                    </div>
                  ) : (
                    <>
                      {/* First Class Seats */}
                      {seatsByClass.first.length > 0 && (
                        <>
                          <div className="px-2 py-1.5 text-xs font-semibold text-primary bg-background border-b">
                            First Class ({seatsByClass.first.length} available)
                          </div>
                          {seatsByClass.first.map((seat) => (
                            <SelectItem key={seat._id} value={seat.seatNumber}>
                              <div className="flex items-center justify-between w-full">
                                <span className="font-medium">
                                  {seat.seatNumber}
                                </span>
                                {seat.isExtraLegroom && (
                                  <span className="text-xs text-muted-foreground ml-2">
                                    • Extra Legroom
                                  </span>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </>
                      )}

                      {/* Business Class Seats */}
                      {seatsByClass.business.length > 0 && (
                        <>
                          <div className="px-2 py-1.5 text-xs font-semibold text-primary bg-background border-b mt-1">
                            Business Class ({seatsByClass.business.length}{" "}
                            available)
                          </div>
                          {seatsByClass.business.map((seat) => (
                            <SelectItem key={seat._id} value={seat.seatNumber}>
                              <div className="flex items-center justify-between w-full">
                                <span className="font-medium">
                                  {seat.seatNumber}
                                </span>
                                {seat.isExtraLegroom && (
                                  <span className="text-xs text-muted-foreground ml-2">
                                    • Extra Legroom
                                  </span>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </>
                      )}

                      {/* Economy Class Seats */}
                      {seatsByClass.economy.length > 0 && (
                        <>
                          <div className="px-2 py-1.5 text-xs font-semibold text-primary bg-background border-b mt-1">
                            Economy Class ({seatsByClass.economy.length}{" "}
                            available)
                          </div>
                          {seatsByClass.economy.map((seat) => (
                            <SelectItem key={seat._id} value={seat.seatNumber}>
                              <div className="flex items-center justify-between w-full">
                                <span className="font-medium">
                                  {seat.seatNumber}
                                </span>
                                {seat.isExtraLegroom && (
                                  <span className="text-xs text-muted-foreground ml-2">
                                    • Extra Legroom
                                  </span>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </>
                      )}
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="travelClass">Travel Class (Auto-selected)</Label>
              <Select
                value={formData.travelClass}
                onValueChange={(value) =>
                  setFormData({ ...formData, travelClass: value })
                }
                disabled
              >
                <SelectTrigger id="travelClass" className="w-full">
                  <SelectValue placeholder="Auto-selected from seat" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="economy">Economy</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                  <SelectItem value="first">First Class</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Price Summary */}
            {priceBreakdown ? (
              <div className="grid gap-2">
                <Label>Price Summary</Label>
                <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                  {priceBreakdown.items.map((item, index) => (
                    <div
                      key={index}
                      className={`flex justify-between items-center ${
                        item.isBold ? "font-semibold pt-2 border-t" : "text-sm"
                      }`}
                    >
                      <span className="text-muted-foreground">
                        {item.label}
                        {item.description && (
                          <span className="text-xs block text-muted-foreground/70">
                            {item.description}
                          </span>
                        )}
                      </span>
                      <span className={item.isBold ? "text-base" : "text-sm"}>
                        ₹{item.amount.toLocaleString("en-IN")}
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center pt-3 border-t-2 border-primary/20">
                    <span className="font-bold text-lg">Total Amount</span>
                    <span className="font-bold text-xl text-primary">
                      ₹{priceBreakdown.total.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              </div>
            ) : calculatingPrice ? (
              <div className="grid gap-2">
                <Label>Price Summary</Label>
                <div className="rounded-lg border bg-muted/30 p-4 text-center text-sm text-muted-foreground">
                  Calculating price...
                </div>
              </div>
            ) : formData.seatNumber ? (
              <div className="grid gap-2">
                <Label>Price Summary</Label>
                <div className="rounded-lg border bg-muted/30 p-4 text-center text-sm text-muted-foreground">
                  Select a seat to see price breakdown
                </div>
              </div>
            ) : null}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving || (booking && booking.status === "cancelled")}
            >
              {saving ? "Saving..." : booking ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
