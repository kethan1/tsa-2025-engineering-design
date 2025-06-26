"use client";

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

export const description = "A line chart with dots";

const chartConfig = {
  nitrogen: {
    label: "Nitrogen",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

export type ChartPoint = {
  timestamp: number;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
}

export function NitrogenLineChart({ data }: { data: ChartPoint[] }) {
  return (
    <Card className="w-[60%]">
      <CardHeader>
        <CardTitle>Nitrogen Content</CardTitle>
        <CardDescription>
          Measured by using an ESP32 and NPK Sensor. Updates in Realtime.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer className="max-h-[100vh]" config={chartConfig}>
          <LineChart
            accessibilityLayer
            data={data}
            margin={{
              left: 12,
              right: 24,
              top: 12,
              bottom: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              tickCount={5}
              dataKey="timestamp"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => {
                if (typeof value !== "number") {
                  return value;
                }
                const date = new Date(value);
                const hours = date.getHours() < 10 ? `0${date.getHours()}` : date.getHours();
                const minutes = date.getMinutes() < 10 ? `0${date.getMinutes()}` : date.getMinutes();
                const seconds = date.getSeconds() < 10 ? `0${date.getSeconds()}` : date.getSeconds();
                return `${hours}:${minutes}:${seconds}`;
            }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={0}
              tickFormatter={(value) => `${value} mg/kg`}
            />
            <ChartTooltip
              cursor={false}
              content={(props) => <ChartTooltipContent hideLabel {...props} />}
            />
            <Line
              dataKey="nitrogen"
              type="natural"
              stroke="#98c5ff"
              strokeWidth={2}
              dot={{
                fill: "#98c5ff",
              }}
              activeDot={{
                r: 6,
              }}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
