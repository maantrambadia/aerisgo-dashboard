import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Percent } from "lucide-react";

const chartConfig = {
  loadFactor: {
    label: "Load Factor",
    color: "var(--chart-1)",
  },
  bookedSeats: {
    label: "Booked Seats",
    color: "var(--chart-2)",
  },
};

export function LoadFactorChart({ data = [] }) {
  const chartData = data.map((flight) => ({
    name: flight.flightNumber,
    loadFactor: flight.loadFactor,
    bookedSeats: flight.bookedSeats,
    totalSeats: flight.totalSeats,
    route: `${flight.source} → ${flight.destination}`,
  }));

  const averageLoadFactor =
    data.length > 0
      ? Math.round(data.reduce((sum, f) => sum + f.loadFactor, 0) / data.length)
      : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <Percent className="h-5 w-5" />
              Load Factor Report
            </CardTitle>
            <CardDescription>
              Average load factor: {averageLoadFactor}%
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="fillLoadFactor" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-loadFactor)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-loadFactor)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="name"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => value.slice(0, 6)}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => `${value}%`}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(value, payload) => {
                    const item = payload[0]?.payload;
                    return (
                      <div className="space-y-1">
                        <div className="font-semibold">{value}</div>
                        <div className="text-xs text-muted-foreground">
                          {item?.route}
                        </div>
                      </div>
                    );
                  }}
                  formatter={(value, name, item) => {
                    if (name === "loadFactor") {
                      return [
                        <div
                          key="load"
                          className="flex items-center justify-between gap-4"
                        >
                          <span>Load Factor</span>
                          <span className="font-semibold">{value}%</span>
                        </div>,
                      ];
                    }
                    return [
                      <div
                        key="seats"
                        className="flex items-center justify-between gap-4"
                      >
                        <span>Occupancy</span>
                        <span className="font-semibold">
                          {item.payload.bookedSeats}/{item.payload.totalSeats}
                        </span>
                      </div>,
                    ];
                  }}
                />
              }
            />
            <Area
              dataKey="loadFactor"
              type="natural"
              fill="url(#fillLoadFactor)"
              stroke="var(--color-loadFactor)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
