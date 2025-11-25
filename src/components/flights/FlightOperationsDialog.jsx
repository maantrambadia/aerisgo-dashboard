import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import api from "@/lib/axios";
import { format } from "date-fns";
import {
  Plane,
  Users,
  MapPin,
  Clock,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";

export default function FlightOperationsDialog({
  flight,
  open,
  onOpenChange,
  onUpdate,
}) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("aircraft");

  // Operations data
  const [opsData, setOpsData] = useState(null);

  // Aircraft
  const [aircraftList, setAircraftList] = useState([]);
  const [selectedAircraft, setSelectedAircraft] = useState("");

  // Crew
  const [pilots, setPilots] = useState([]);
  const [coPilots, setCoPilots] = useState([]);
  const [attendants, setAttendants] = useState([]);
  const [selectedPilot, setSelectedPilot] = useState("");
  const [selectedCoPilot, setSelectedCoPilot] = useState("");
  const [selectedAttendants, setSelectedAttendants] = useState([]);

  // Gate
  const [gate, setGate] = useState("");
  const [notifyGateChange, setNotifyGateChange] = useState(true);

  // Status & Delay
  const [status, setStatus] = useState("scheduled");
  const [delayReason, setDelayReason] = useState("");
  const [estimatedDepartureTime, setEstimatedDepartureTime] = useState("");
  const [notifyDelay, setNotifyDelay] = useState(true);

  useEffect(() => {
    if (open && flight) {
      fetchData();
    }
  }, [open, flight]);

  async function fetchData() {
    setLoading(true);
    try {
      // Fetch flight operations data
      const opsRes = await api.get(`/flight-ops/${flight._id}`);
      setOpsData(opsRes.data.flight);

      // Fetch aircraft list
      const aircraftRes = await api.get("/aircraft?limit=100&status=active");
      setAircraftList(aircraftRes.data.aircraft || []);

      // Fetch crew lists
      const [pilotsRes, coPilotsRes, attendantsRes] = await Promise.all([
        api.get("/crew?limit=100&role=pilot&isActive=true"),
        api.get("/crew?limit=100&role=co-pilot&isActive=true"),
        api.get("/crew?limit=100&role=flight-attendant&isActive=true"),
      ]);

      setPilots(pilotsRes.data.crew || []);
      setCoPilots(coPilotsRes.data.crew || []);
      setAttendants(attendantsRes.data.crew || []);

      // Populate form with existing data
      const ops = opsRes.data.flight;
      setSelectedAircraft(ops.aircraft?._id || "");
      setSelectedPilot(ops.crew?.pilot?._id || "");
      setSelectedCoPilot(ops.crew?.coPilot?._id || "");
      setSelectedAttendants(
        ops.crew?.flightAttendants?.map((a) => a._id) || []
      );
      setGate(ops.gate || "");
      setStatus(ops.status || "scheduled");
      setDelayReason(ops.delayReason || "");
      setEstimatedDepartureTime(
        ops.estimatedDepartureTime
          ? format(new Date(ops.estimatedDepartureTime), "yyyy-MM-dd'T'HH:mm")
          : ""
      );
    } catch (error) {
      console.error("Fetch operations data error:", error);
      toast.error("Failed to load flight operations data");
    } finally {
      setLoading(false);
    }
  }

  async function handleAssignAircraft() {
    if (!selectedAircraft) {
      toast.error("Please select an aircraft");
      return;
    }

    setSaving(true);
    try {
      await api.post(`/flight-ops/${flight._id}/assign-aircraft`, {
        aircraftId: selectedAircraft,
      });
      toast.success("Aircraft assigned successfully");
      if (onUpdate) onUpdate();
      fetchData();
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Failed to assign aircraft"
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleAssignCrew() {
    if (!selectedPilot || !selectedCoPilot) {
      toast.error("Pilot and Co-Pilot are required");
      return;
    }

    setSaving(true);
    try {
      await api.post(`/flight-ops/${flight._id}/assign-crew`, {
        pilotId: selectedPilot,
        coPilotId: selectedCoPilot,
        flightAttendantIds: selectedAttendants,
      });
      toast.success("Crew assigned successfully");
      if (onUpdate) onUpdate();
      fetchData();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to assign crew");
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdateGate() {
    if (!gate.trim()) {
      toast.error("Please enter a gate number");
      return;
    }

    setSaving(true);
    try {
      await api.put(`/flight-ops/${flight._id}/gate`, {
        gate: gate.trim().toUpperCase(),
        notifyPassengers: notifyGateChange,
      });
      toast.success("Gate updated successfully");
      if (onUpdate) onUpdate();
      fetchData();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to update gate");
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdateStatus() {
    setSaving(true);
    try {
      const payload = {
        status,
        notifyPassengers: notifyDelay,
      };

      if (status === "delayed") {
        if (!delayReason.trim()) {
          toast.error("Please provide a delay reason");
          setSaving(false);
          return;
        }
        payload.delayReason = delayReason.trim();
        payload.estimatedDepartureTime = estimatedDepartureTime || undefined;
      }

      await api.put(`/flight-ops/${flight._id}/status`, payload);
      toast.success("Flight status updated successfully");
      if (onUpdate) onUpdate();
      fetchData();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to update status");
    } finally {
      setSaving(false);
    }
  }

  function toggleAttendant(attendantId) {
    setSelectedAttendants((prev) =>
      prev.includes(attendantId)
        ? prev.filter((id) => id !== attendantId)
        : [...prev, attendantId]
    );
  }

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Flight Operations</DialogTitle>
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plane className="h-5 w-5" />
            Flight Operations - {flight?.flightNumber}
          </DialogTitle>
          <DialogDescription>
            {flight?.source} → {flight?.destination} •{" "}
            {flight?.departureTime &&
              format(new Date(flight.departureTime), "dd MMM yyyy, HH:mm")}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="aircraft">Aircraft</TabsTrigger>
            <TabsTrigger value="crew">Crew</TabsTrigger>
            <TabsTrigger value="gate">Gate</TabsTrigger>
            <TabsTrigger value="status">Status & Delays</TabsTrigger>
          </TabsList>

          {/* Aircraft Tab */}
          <TabsContent value="aircraft" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label>Current Aircraft</Label>
                {opsData?.aircraft ? (
                  <div className="mt-2 p-3 border rounded-lg bg-muted/50">
                    <div className="font-mono font-semibold">
                      {opsData.aircraft.flightNumber}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {opsData.aircraft.registrationNumber} •{" "}
                      {opsData.aircraft.aircraftType} •{" "}
                      {opsData.aircraft.totalSeats} seats
                    </div>
                  </div>
                ) : (
                  <div className="mt-2 p-3 border rounded-lg border-dashed">
                    <p className="text-sm text-muted-foreground">
                      No aircraft assigned
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="aircraft">Assign Aircraft</Label>
                <Select
                  value={selectedAircraft}
                  onValueChange={setSelectedAircraft}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select aircraft" />
                  </SelectTrigger>
                  <SelectContent>
                    {aircraftList.map((aircraft) => (
                      <SelectItem key={aircraft._id} value={aircraft._id}>
                        {aircraft.flightNumber} ({aircraft.registrationNumber})
                        - {aircraft.aircraftType}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleAssignAircraft}
                disabled={saving || !selectedAircraft}
                className="w-full"
              >
                {saving ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Assigning...
                  </>
                ) : (
                  "Assign Aircraft"
                )}
              </Button>
            </div>
          </TabsContent>

          {/* Crew Tab */}
          <TabsContent value="crew" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label>Current Crew</Label>
                <div className="mt-2 space-y-2">
                  {opsData?.crew?.pilot ? (
                    <div className="p-2 border rounded-lg bg-blue-500/5">
                      <div className="text-xs text-muted-foreground">Pilot</div>
                      <div className="font-medium">
                        {opsData.crew.pilot.name}
                      </div>
                    </div>
                  ) : (
                    <div className="p-2 border rounded-lg border-dashed">
                      <p className="text-xs text-muted-foreground">
                        No pilot assigned
                      </p>
                    </div>
                  )}

                  {opsData?.crew?.coPilot ? (
                    <div className="p-2 border rounded-lg bg-purple-500/5">
                      <div className="text-xs text-muted-foreground">
                        Co-Pilot
                      </div>
                      <div className="font-medium">
                        {opsData.crew.coPilot.name}
                      </div>
                    </div>
                  ) : (
                    <div className="p-2 border rounded-lg border-dashed">
                      <p className="text-xs text-muted-foreground">
                        No co-pilot assigned
                      </p>
                    </div>
                  )}

                  {opsData?.crew?.flightAttendants?.length > 0 ? (
                    <div className="p-2 border rounded-lg bg-green-500/5">
                      <div className="text-xs text-muted-foreground">
                        Flight Attendants (
                        {opsData.crew.flightAttendants.length})
                      </div>
                      <div className="text-sm">
                        {opsData.crew.flightAttendants
                          .map((a) => a.name)
                          .join(", ")}
                      </div>
                    </div>
                  ) : (
                    <div className="p-2 border rounded-lg border-dashed">
                      <p className="text-xs text-muted-foreground">
                        No attendants assigned
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pilot">Pilot *</Label>
                <Select value={selectedPilot} onValueChange={setSelectedPilot}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select pilot" />
                  </SelectTrigger>
                  <SelectContent>
                    {pilots.map((pilot) => (
                      <SelectItem key={pilot._id} value={pilot._id}>
                        {pilot.name} ({pilot.employeeId})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="coPilot">Co-Pilot *</Label>
                <Select
                  value={selectedCoPilot}
                  onValueChange={setSelectedCoPilot}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select co-pilot" />
                  </SelectTrigger>
                  <SelectContent>
                    {coPilots.map((coPilot) => (
                      <SelectItem key={coPilot._id} value={coPilot._id}>
                        {coPilot.name} ({coPilot.employeeId})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Flight Attendants</Label>
                <div className="border rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
                  {attendants.map((attendant) => (
                    <div
                      key={attendant._id}
                      className="flex items-center space-x-2"
                    >
                      <Checkbox
                        id={attendant._id}
                        checked={selectedAttendants.includes(attendant._id)}
                        onCheckedChange={() => toggleAttendant(attendant._id)}
                      />
                      <label
                        htmlFor={attendant._id}
                        className="text-sm cursor-pointer flex-1"
                      >
                        {attendant.name} ({attendant.employeeId})
                      </label>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Selected: {selectedAttendants.length}
                </p>
              </div>

              <Button
                onClick={handleAssignCrew}
                disabled={saving || !selectedPilot || !selectedCoPilot}
                className="w-full"
              >
                {saving ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Assigning...
                  </>
                ) : (
                  "Assign Crew"
                )}
              </Button>
            </div>
          </TabsContent>

          {/* Gate Tab */}
          <TabsContent value="gate" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label>Current Gate</Label>
                {opsData?.gate ? (
                  <div className="mt-2 p-4 border rounded-lg bg-muted/50 text-center">
                    <div className="text-3xl font-bold">{opsData.gate}</div>
                  </div>
                ) : (
                  <div className="mt-2 p-3 border rounded-lg border-dashed">
                    <p className="text-sm text-muted-foreground">
                      No gate assigned
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="gate">Gate Number</Label>
                <Input
                  id="gate"
                  placeholder="e.g., A12"
                  value={gate}
                  onChange={(e) => setGate(e.target.value.toUpperCase())}
                  className="text-center text-lg font-semibold"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="notifyGate"
                  checked={notifyGateChange}
                  onCheckedChange={setNotifyGateChange}
                />
                <Label htmlFor="notifyGate" className="cursor-pointer">
                  Notify passengers via email
                </Label>
              </div>

              <Button
                onClick={handleUpdateGate}
                disabled={saving || !gate.trim()}
                className="w-full"
              >
                {saving ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Gate"
                )}
              </Button>
            </div>
          </TabsContent>

          {/* Status & Delays Tab */}
          <TabsContent value="status" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label>Current Status</Label>
                <div className="mt-2">
                  <Badge
                    className={
                      opsData?.status === "scheduled"
                        ? "bg-green-500/10 text-green-700 border-green-500/20"
                        : opsData?.status === "delayed"
                        ? "bg-yellow-500/10 text-yellow-700 border-yellow-500/20"
                        : opsData?.status === "cancelled"
                        ? "bg-red-500/10 text-red-700 border-red-500/20"
                        : "bg-blue-500/10 text-blue-700 border-blue-500/20"
                    }
                  >
                    {opsData?.status}
                  </Badge>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Update Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="delayed">Delayed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {status === "delayed" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="delayReason">Delay Reason *</Label>
                    <Textarea
                      id="delayReason"
                      placeholder="e.g., Technical issues, Weather conditions..."
                      value={delayReason}
                      onChange={(e) => setDelayReason(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="estimatedTime">
                      Estimated Departure Time
                    </Label>
                    <Input
                      id="estimatedTime"
                      type="datetime-local"
                      value={estimatedDepartureTime}
                      onChange={(e) =>
                        setEstimatedDepartureTime(e.target.value)
                      }
                    />
                  </div>
                </>
              )}

              <div className="flex items-center space-x-2">
                <Switch
                  id="notifyStatus"
                  checked={notifyDelay}
                  onCheckedChange={setNotifyDelay}
                />
                <Label htmlFor="notifyStatus" className="cursor-pointer">
                  Notify passengers via email
                </Label>
              </div>

              <Button
                onClick={handleUpdateStatus}
                disabled={saving}
                className="w-full"
              >
                {saving ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Status"
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
