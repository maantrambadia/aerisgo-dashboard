import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Percent, TrendingUp } from "lucide-react";

const chartConfig = {
  loadFactor: {
    label: "Load Factor",
    color: "var(--chart-1)",
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
        <CardTitle className="flex items-center gap-2">
          <Percent className="h-5 w-5" />
          Load Factor Report
        </CardTitle>
        <CardDescription>
          Flight occupancy rates across all routes
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart accessibilityLayer data={chartData}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="name"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value.slice(0, 6)}
            />
            <ChartTooltip
              cursor={false}
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
                        <div className="text-xs text-muted-foreground">
                          {item?.bookedSeats}/{item?.totalSeats} seats
                        </div>
                      </div>
                    );
                  }}
                  formatter={(value) => [`${value}%`, "Load Factor"]}
                />
              }
            />
            <Bar
              dataKey="loadFactor"
              fill="var(--color-loadFactor)"
              radius={8}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 leading-none font-medium">
          Average load factor: {averageLoadFactor}%{" "}
          {averageLoadFactor >= 70 ? (
            <TrendingUp className="h-4 w-4 text-green-500" />
          ) : (
            <Percent className="h-4 w-4 text-amber-500" />
          )}
        </div>
        <div className="text-muted-foreground leading-none">
          Showing occupancy rates for recent flights
        </div>
      </CardFooter>
    </Card>
  );
}
