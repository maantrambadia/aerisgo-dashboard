import { Pie, PieChart } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Clock, TrendingUp } from "lucide-react";

const chartConfig = {
  count: {
    label: "Flights",
  },
  scheduled: {
    label: "Scheduled",
    color: "var(--chart-1)",
  },
  completed: {
    label: "Completed",
    color: "var(--chart-2)",
  },
  delayed: {
    label: "Delayed",
    color: "var(--chart-3)",
  },
  cancelled: {
    label: "Cancelled",
    color: "var(--chart-4)",
  },
};

export function PunctualityChart({ data }) {
  if (!data?.statusBreakdown) return null;

  const chartData = data.statusBreakdown.map((item) => ({
    status: item._id,
    count: item.count,
    fill: `var(--color-${item._id})`,
  }));

  const onTimePercentage = data.summary?.onTimePercentage || 0;

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Flight Punctuality
        </CardTitle>
        <CardDescription>Flight status distribution</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[300px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={chartData}
              dataKey="count"
              nameKey="status"
              innerRadius={60}
              strokeWidth={5}
            />
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 leading-none font-medium">
          {onTimePercentage >= 80 ? (
            <>
              On-time performance: {onTimePercentage}%{" "}
              <TrendingUp className="h-4 w-4 text-green-500" />
            </>
          ) : (
            <>
              On-time performance: {onTimePercentage}%{" "}
              <Clock className="h-4 w-4 text-amber-500" />
            </>
          )}
        </div>
        <div className="text-muted-foreground leading-none">
          Based on all flight operations
        </div>
      </CardFooter>
    </Card>
  );
}
