import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "lucide-react";

const chartConfig = {
  flights: {
    label: "Flights",
    color: "var(--chart-1)",
  },
  passengers: {
    label: "Passengers",
    color: "var(--chart-2)",
  },
};

export function FlightsAreaChart({ data = [], period, onPeriodChange }) {
  const chartData = data.map((item) => {
    let label = "";
    if (item.period.day) {
      label = `${item.period.day}/${item.period.month}`;
    } else if (item.period.week) {
      label = `W${item.period.week}`;
    } else {
      label = `M${item.period.month}`;
    }
    return {
      date: label,
      flights: item.totalFlights,
      passengers: item.totalPassengers,
    };
  });

  return (
    <Card>
      <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
        <div className="grid flex-1 gap-1">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Flights & Passengers Overview
          </CardTitle>
          <CardDescription>
            Showing flights and passengers for the selected period
          </CardDescription>
        </div>
        <Select value={period} onValueChange={onPeriodChange}>
          <SelectTrigger
            className="w-[160px] rounded-lg sm:ml-auto"
            aria-label="Select a period"
          >
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="daily" className="rounded-lg">
              Daily
            </SelectItem>
            <SelectItem value="weekly" className="rounded-lg">
              Weekly
            </SelectItem>
            <SelectItem value="monthly" className="rounded-lg">
              Monthly
            </SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[300px] w-full"
        >
          <AreaChart
            data={chartData}
            margin={{ top: 30, right: 12, left: 12, bottom: 0 }}
          >
            <defs>
              <linearGradient id="fillFlights" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="10%"
                  stopColor="var(--color-flights)"
                  stopOpacity={0.6}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-flights)"
                  stopOpacity={0.05}
                />
              </linearGradient>
              <linearGradient id="fillPassengers" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="10%"
                  stopColor="var(--color-passengers)"
                  stopOpacity={0.6}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-passengers)"
                  stopOpacity={0.05}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dot" />}
            />
            <Area
              dataKey="passengers"
              type="natural"
              fill="url(#fillPassengers)"
              stroke="var(--color-passengers)"
              strokeWidth={2}
              stackId="a"
            />
            <Area
              dataKey="flights"
              type="natural"
              fill="url(#fillFlights)"
              stroke="var(--color-flights)"
              strokeWidth={2}
              stackId="a"
            />
            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
