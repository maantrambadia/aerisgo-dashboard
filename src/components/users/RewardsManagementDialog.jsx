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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Coins,
  TrendingUp,
  TrendingDown,
  Plus,
  Minus,
  History,
  Sparkles,
  ArrowUpCircle,
  ArrowDownCircle,
} from "lucide-react";
import api from "@/lib/axios";
import { toast } from "sonner";
import { format } from "date-fns";

export default function RewardsManagementDialog({ user, open, onOpenChange }) {
  const [loading, setLoading] = useState(true);
  const [rewardsData, setRewardsData] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [addForm, setAddForm] = useState({ points: "", description: "" });
  const [deductForm, setDeductForm] = useState({ points: "", description: "" });
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (open && user) {
      fetchRewardsData();
    }
  }, [open, user]);

  async function fetchRewardsData() {
    if (!user) return;
    setLoading(true);
    try {
      const { data } = await api.get(`/rewards/user/${user._id || user.id}`);
      setRewardsData(data);
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to load rewards data";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddPoints(e) {
    e.preventDefault();
    if (!addForm.points || parseInt(addForm.points) <= 0) {
      toast.error("Please enter a valid points amount");
      return;
    }

    setProcessing(true);
    try {
      const { data } = await api.post(
        `/rewards/user/${user._id || user.id}/add`,
        {
          points: parseInt(addForm.points),
          description: addForm.description.trim() || undefined,
        }
      );
      toast.success(data.message || "Points added successfully");
      setAddForm({ points: "", description: "" });
      await fetchRewardsData();
      setActiveTab("overview");
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to add points";
      toast.error(msg);
    } finally {
      setProcessing(false);
    }
  }

  async function handleDeductPoints(e) {
    e.preventDefault();
    if (!deductForm.points || parseInt(deductForm.points) <= 0) {
      toast.error("Please enter a valid points amount");
      return;
    }

    setProcessing(true);
    try {
      const { data } = await api.post(
        `/rewards/user/${user._id || user.id}/deduct`,
        {
          points: parseInt(deductForm.points),
          description: deductForm.description.trim() || undefined,
        }
      );
      toast.success(data.message || "Points deducted successfully");
      setDeductForm({ points: "", description: "" });
      await fetchRewardsData();
      setActiveTab("overview");
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to deduct points";
      toast.error(msg);
    } finally {
      setProcessing(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-500" />
            Rewards Management
          </DialogTitle>
          <DialogDescription>
            Manage reward points for {user?.name}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-lg" />
              ))}
            </div>
            <Skeleton className="h-[300px] rounded-lg" />
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="add">Add Points</TabsTrigger>
              <TabsTrigger value="deduct">Deduct Points</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4 mt-4">
              {/* Stats Cards */}
              <div className="grid grid-cols-3 gap-4">
                <div className="rounded-lg border bg-gradient-to-br from-yellow-500/10 to-orange-500/10 p-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
                    <Coins className="h-4 w-4" />
                    Current Balance
                  </div>
                  <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-500">
                    {rewardsData?.balance?.toLocaleString() || 0}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Available points
                  </p>
                </div>

                <div className="rounded-lg border bg-gradient-to-br from-green-500/10 to-emerald-500/10 p-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
                    <TrendingUp className="h-4 w-4" />
                    Total Earned
                  </div>
                  <div className="text-3xl font-bold text-green-600 dark:text-green-500">
                    {rewardsData?.totalEarned?.toLocaleString() || 0}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Lifetime earnings
                  </p>
                </div>

                <div className="rounded-lg border bg-gradient-to-br from-red-500/10 to-pink-500/10 p-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
                    <TrendingDown className="h-4 w-4" />
                    Total Redeemed
                  </div>
                  <div className="text-3xl font-bold text-red-600 dark:text-red-500">
                    {rewardsData?.totalRedeemed?.toLocaleString() || 0}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Lifetime redemptions
                  </p>
                </div>
              </div>

              {/* Transaction History */}
              <div className="rounded-lg border">
                <div className="p-4 border-b">
                  <div className="flex items-center gap-2">
                    <History className="h-4 w-4" />
                    <h3 className="font-semibold">Recent Transactions</h3>
                    <Badge variant="secondary" className="ml-auto">
                      {rewardsData?.transactionCount || 0} total
                    </Badge>
                  </div>
                </div>
                <div className="divide-y max-h-[300px] overflow-y-auto">
                  {rewardsData?.transactions?.length > 0 ? (
                    rewardsData.transactions.map((txn) => (
                      <div
                        key={txn._id}
                        className="p-4 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3 flex-1">
                            <div
                              className={`mt-0.5 rounded-full p-2 ${
                                txn.type === "earn"
                                  ? "bg-green-500/10 text-green-600 dark:text-green-500"
                                  : "bg-red-500/10 text-red-600 dark:text-red-500"
                              }`}
                            >
                              {txn.type === "earn" ? (
                                <ArrowUpCircle className="h-4 w-4" />
                              ) : (
                                <ArrowDownCircle className="h-4 w-4" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm">
                                {txn.description || "No description"}
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {format(
                                  new Date(txn.createdAt),
                                  "MMM dd, yyyy 'at' hh:mm a"
                                )}
                              </p>
                            </div>
                          </div>
                          <div
                            className={`font-bold text-sm whitespace-nowrap ${
                              txn.type === "earn"
                                ? "text-green-600 dark:text-green-500"
                                : "text-red-600 dark:text-red-500"
                            }`}
                          >
                            {txn.type === "earn" ? "+" : "-"}
                            {txn.points.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-muted-foreground">
                      <History className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No transactions yet</p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Add Points Tab */}
            <TabsContent value="add" className="mt-4">
              <form onSubmit={handleAddPoints} className="space-y-4">
                <div className="rounded-lg border bg-gradient-to-br from-green-500/5 to-emerald-500/5 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Plus className="h-5 w-5 text-green-600 dark:text-green-500" />
                    <h3 className="font-semibold">Add Reward Points</h3>
                  </div>
                  <Separator className="mb-4" />
                  <div className="space-y-4">
                    <div className="grid gap-2">
                      <Label htmlFor="add-points">Points Amount *</Label>
                      <Input
                        id="add-points"
                        type="number"
                        min="1"
                        placeholder="Enter points to add"
                        value={addForm.points}
                        onChange={(e) =>
                          setAddForm({ ...addForm, points: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="add-description">
                        Description (Optional)
                      </Label>
                      <Input
                        id="add-description"
                        placeholder="e.g., Bonus reward, Compensation, etc."
                        value={addForm.description}
                        onChange={(e) =>
                          setAddForm({
                            ...addForm,
                            description: e.target.value,
                          })
                        }
                      />
                      <p className="text-xs text-muted-foreground">
                        This will be visible in the transaction history
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setActiveTab("overview")}
                    disabled={processing}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={processing}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {processing ? "Adding..." : "Add Points"}
                  </Button>
                </div>
              </form>
            </TabsContent>

            {/* Deduct Points Tab */}
            <TabsContent value="deduct" className="mt-4">
              <form onSubmit={handleDeductPoints} className="space-y-4">
                <div className="rounded-lg border bg-gradient-to-br from-red-500/5 to-pink-500/5 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Minus className="h-5 w-5 text-red-600 dark:text-red-500" />
                    <h3 className="font-semibold">Deduct Reward Points</h3>
                  </div>
                  <Separator className="mb-4" />
                  <div className="space-y-4">
                    <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/20 p-3">
                      <p className="text-sm text-yellow-800 dark:text-yellow-200">
                        <strong>Current Balance:</strong>{" "}
                        {rewardsData?.balance?.toLocaleString() || 0} points
                      </p>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="deduct-points">Points Amount *</Label>
                      <Input
                        id="deduct-points"
                        type="number"
                        min="1"
                        max={rewardsData?.balance || 0}
                        placeholder="Enter points to deduct"
                        value={deductForm.points}
                        onChange={(e) =>
                          setDeductForm({
                            ...deductForm,
                            points: e.target.value,
                          })
                        }
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        Maximum: {rewardsData?.balance?.toLocaleString() || 0}{" "}
                        points
                      </p>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="deduct-description">
                        Description (Optional)
                      </Label>
                      <Input
                        id="deduct-description"
                        placeholder="e.g., Penalty, Adjustment, etc."
                        value={deductForm.description}
                        onChange={(e) =>
                          setDeductForm({
                            ...deductForm,
                            description: e.target.value,
                          })
                        }
                      />
                      <p className="text-xs text-muted-foreground">
                        This will be visible in the transaction history
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setActiveTab("overview")}
                    disabled={processing}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={processing}
                    variant="destructive"
                  >
                    {processing ? "Deducting..." : "Deduct Points"}
                  </Button>
                </div>
              </form>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
