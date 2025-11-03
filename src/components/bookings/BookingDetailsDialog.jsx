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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
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
import { toast } from "sonner";
import api from "@/lib/axios";
import { format } from "date-fns";
import {
  Utensils,
  Luggage,
  XCircle,
  CheckCircle,
  AlertTriangle,
  Info,
  Plane,
  Ticket,
} from "lucide-react";

export default function BookingDetailsDialog({
  booking,
  open,
  onOpenChange,
  onUpdate,
}) {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("meals");

  // Data states
  const [mealData, setMealData] = useState(null);
  const [baggageData, setBaggageData] = useState(null);
  const [cancellationData, setCancellationData] = useState(null);
  const [checkInData, setCheckInData] = useState(null);

  // Cancel confirmation
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (open && booking) {
      fetchAllData();
    }
  }, [open, booking]);

  async function fetchAllData() {
    setLoading(true);
    try {
      await Promise.all([
        fetchMealData(),
        fetchBaggageData(),
        fetchCancellationPreview(),
        fetchCheckInStatus(),
      ]);
    } catch (error) {
      console.error("Fetch booking details error:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchMealData() {
    try {
      const { data } = await api.get(`/meals/${booking._id}`);
      setMealData(data);
    } catch (error) {
      console.error("Fetch meal data error:", error);
      setMealData(null);
    }
  }

  async function fetchBaggageData() {
    try {
      const { data } = await api.get(`/baggage/booking/${booking._id}`);
      setBaggageData(data);
    } catch (error) {
      console.error("Fetch baggage data error:", error);
      setBaggageData(null);
    }
  }

  async function fetchCancellationPreview() {
    try {
      const { data } = await api.get(
        `/bookings/${booking._id}/cancellation-preview`
      );
      setCancellationData(data);
    } catch (error) {
      console.error("Fetch cancellation preview error:", error);
      setCancellationData(null);
    }
  }

  async function fetchCheckInStatus() {
    try {
      const { data } = await api.get(`/check-in/${booking._id}/eligibility`);
      setCheckInData(data);
    } catch (error) {
      console.error("Fetch check-in status error:", error);
      setCheckInData(null);
    }
  }

  async function handleCancelBooking() {
    setCancelling(true);
    try {
      await api.post(`/bookings/${booking._id}/cancel`, {
        reason: "Cancelled by admin/staff",
      });
      toast.success("Booking cancelled successfully");
      setCancelDialogOpen(false);
      if (onUpdate) onUpdate();
      onOpenChange(false);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to cancel booking");
    } finally {
      setCancelling(false);
    }
  }

  async function handleCancelCheckIn() {
    setCancelling(true);
    try {
      await api.delete(`/check-in/${booking._id}`);
      toast.success("Check-in cancelled successfully");
      await fetchCheckInStatus();
      if (onUpdate) onUpdate();
      onOpenChange(false);
    } catch (error) {
      console.error("Cancel check-in error:", error);
      toast.error(
        error?.response?.data?.message || "Failed to cancel check-in"
      );
    } finally {
      setCancelling(false);
    }
  }

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Ticket className="h-5 w-5" />
              Booking Details - {booking?.pnr}
            </DialogTitle>
            <DialogDescription>
              {booking?.flightId?.flightNumber} • {booking?.flightId?.source} →{" "}
              {booking?.flightId?.destination}
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="meals">
                <Utensils className="h-4 w-4 mr-2" />
                Meals
              </TabsTrigger>
              <TabsTrigger value="baggage">
                <Luggage className="h-4 w-4 mr-2" />
                Baggage
              </TabsTrigger>
              <TabsTrigger value="cancellation">
                <XCircle className="h-4 w-4 mr-2" />
                Cancel
              </TabsTrigger>
              <TabsTrigger value="checkin">
                <CheckCircle className="h-4 w-4 mr-2" />
                Check-in
              </TabsTrigger>
            </TabsList>

            {/* Meals Tab */}
            <TabsContent value="meals" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Meal Preferences</h3>
                  {mealData?.mealPreference ? (
                    <div className="p-4 border rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2">
                        <Utensils className="h-5 w-5 text-primary" />
                        <div>
                          <div className="font-medium">
                            {mealData.mealPreference}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Selected meal preference
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 border rounded-lg border-dashed">
                      <p className="text-sm text-muted-foreground">
                        No meal preference selected
                      </p>
                    </div>
                  )}
                </div>

                {mealData?.availableMeals && (
                  <div>
                    <h3 className="font-semibold mb-2">
                      Available Meals ({booking?.travelClass})
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      {mealData.availableMeals.map((meal, idx) => (
                        <div
                          key={idx}
                          className="p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="font-medium text-sm">{meal.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {meal.description}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Baggage Tab */}
            <TabsContent value="baggage" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Baggage Allowance</h3>
                  {baggageData?.allowance ? (
                    <div className="space-y-3">
                      <div className="p-4 border rounded-lg bg-blue-500/5">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm text-muted-foreground">
                              Cabin Baggage
                            </div>
                            <div className="text-2xl font-bold">
                              {baggageData.allowance.cabinBaggage?.pieces} ×{" "}
                              {baggageData.allowance.cabinBaggage?.maxWeight}kg
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {
                                baggageData.allowance.cabinBaggage
                                  ?.maxDimensions
                              }
                            </div>
                          </div>
                          <Luggage className="h-8 w-8 text-blue-500" />
                        </div>
                      </div>

                      <div className="p-4 border rounded-lg bg-green-500/5">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm text-muted-foreground">
                              Checked Baggage
                            </div>
                            <div className="text-2xl font-bold">
                              {baggageData.allowance.checkedBaggage?.pieces}{" "}
                              piece(s)
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {baggageData.allowance.checkedBaggage?.maxWeight}
                              kg each
                            </div>
                          </div>
                          <Luggage className="h-8 w-8 text-green-500" />
                        </div>
                      </div>

                      {baggageData.allowance.personalItem?.allowed && (
                        <div className="p-3 border rounded-lg bg-muted/30">
                          <div className="flex items-start gap-2">
                            <Info className="h-4 w-4 mt-0.5 text-muted-foreground" />
                            <div className="text-sm text-muted-foreground">
                              {baggageData.allowance.personalItem.description}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-4 border rounded-lg border-dashed">
                      <p className="text-sm text-muted-foreground">
                        Baggage information not available
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Cancellation Tab */}
            <TabsContent value="cancellation" className="space-y-4">
              <div className="space-y-4">
                {booking?.status === "cancelled" ? (
                  <div className="p-4 border rounded-lg bg-red-500/5 border-red-500/20">
                    <div className="flex items-center gap-2 text-red-700">
                      <XCircle className="h-5 w-5" />
                      <div className="font-semibold">
                        This booking is already cancelled
                      </div>
                    </div>
                    {booking?.cancellationDetails && (
                      <div className="mt-3 space-y-1 text-sm">
                        <div>
                          Cancelled on:{" "}
                          {format(
                            new Date(booking.cancellationDetails.cancelledAt),
                            "dd MMM yyyy, HH:mm"
                          )}
                        </div>
                        <div>
                          Cancellation Fee: ₹
                          {booking.cancellationDetails.cancellationFee}
                        </div>
                        <div>
                          Refund Amount: ₹
                          {booking.cancellationDetails.refundAmount}
                        </div>
                        <div>
                          Refund Status:{" "}
                          <Badge variant="outline">
                            {booking.cancellationDetails.refundStatus}
                          </Badge>
                        </div>
                      </div>
                    )}
                  </div>
                ) : cancellationData?.canCancel ? (
                  <div className="space-y-4">
                    <div className="p-4 border rounded-lg bg-yellow-500/5 border-yellow-500/20">
                      <div className="flex items-center gap-2 text-yellow-700 mb-3">
                        <AlertTriangle className="h-5 w-5" />
                        <div className="font-semibold">
                          Cancellation Fee Preview
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Booking Amount</span>
                          <span className="font-semibold">
                            ₹{cancellationData.bookingAmount}
                          </span>
                        </div>

                        <div className="flex justify-between items-center text-red-600">
                          <span className="text-sm">Cancellation Fee</span>
                          <span className="font-semibold">
                            -₹{cancellationData.cancellationFee}
                          </span>
                        </div>

                        <div className="flex justify-between items-center text-green-600">
                          <span className="text-sm">Refund Amount</span>
                          <span className="font-bold text-lg">
                            ₹{cancellationData.refundAmount}
                          </span>
                        </div>

                        <div className="pt-3 border-t">
                          <div className="text-xs text-muted-foreground">
                            {cancellationData.tier?.description}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Hours until departure:{" "}
                            {Math.round(cancellationData.hoursUntilDeparture)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Refund processing:{" "}
                            {cancellationData.refundProcessingDays} business
                            days
                          </div>
                        </div>
                      </div>
                    </div>

                    <Button
                      variant="destructive"
                      className="w-full"
                      onClick={() => setCancelDialogOpen(true)}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Cancel Booking
                    </Button>
                  </div>
                ) : (
                  <div className="p-4 border rounded-lg bg-red-500/5 border-red-500/20">
                    <div className="flex items-center gap-2 text-red-700">
                      <XCircle className="h-5 w-5" />
                      <div>
                        <div className="font-semibold">
                          Cannot cancel this booking
                        </div>
                        <div className="text-sm mt-1">
                          {cancellationData?.reason ||
                            "Cancellation not allowed"}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Check-in Tab */}
            <TabsContent value="checkin" className="space-y-4">
              <div className="space-y-4">
                {booking?.isCheckedIn ? (
                  <>
                    <div className="p-4 border rounded-lg bg-green-500/5 border-green-500/20">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-green-700">
                          <CheckCircle className="h-5 w-5" />
                          <div>
                            <div className="font-semibold">Checked In</div>
                            <div className="text-sm mt-1">
                              Passenger has completed check-in
                            </div>
                          </div>
                        </div>
                        {(booking.boardingPass?.gate ||
                          booking.flightId?.gate) && (
                          <div className="flex flex-col items-end">
                            <div className="text-xs text-muted-foreground">
                              Gate
                            </div>
                            <div className="text-2xl font-bold text-primary">
                              {booking.boardingPass?.gate ||
                                booking.flightId?.gate}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleCancelCheckIn}
                      disabled={cancelling}
                    >
                      {cancelling ? "Cancelling..." : "Cancel Check-in"}
                    </Button>
                  </>
                ) : checkInData?.eligible ? (
                  <div className="p-4 border rounded-lg bg-blue-500/5 border-blue-500/20">
                    <div className="flex items-center gap-2 text-blue-700">
                      <Info className="h-5 w-5" />
                      <div>
                        <div className="font-semibold">
                          Eligible for Check-in
                        </div>
                        <div className="text-sm mt-1">
                          {checkInData.message || "Passenger can check in now"}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 border rounded-lg bg-yellow-500/5 border-yellow-500/20">
                    <div className="flex items-center gap-2 text-yellow-700">
                      <AlertTriangle className="h-5 w-5" />
                      <div>
                        <div className="font-semibold">Not Eligible Yet</div>
                        <div className="text-sm mt-1">
                          {checkInData?.reason || "Check-in not available"}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Booking?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this booking (PNR: {booking?.pnr}
              )?
              <br />
              <br />
              <strong>Cancellation Fee:</strong> ₹
              {cancellationData?.cancellationFee}
              <br />
              <strong>Refund Amount:</strong> ₹{cancellationData?.refundAmount}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelling}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelBooking}
              disabled={cancelling}
              className="bg-red-600"
            >
              {cancelling ? "Cancelling..." : "Confirm Cancellation"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
