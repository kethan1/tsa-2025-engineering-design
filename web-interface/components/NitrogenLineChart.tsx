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
};

export function NitrogenLineChart({ data }: { data: ChartPoint[] }) {
  return (
    <Card className="w-full md:w-[85%] lg:w-[60%]">
      <CardHeader>
        <CardTitle>Nitrogen Content</CardTitle>
        <CardDescription>
          Measured by using an ESP32 and NPK Sensor. Updates in Realtime.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer className="max-h-[100vh] size-full" config={chartConfig}>
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
              
              padding={{ left: 12, right: 12 }}
              height={80}
              tickCount={5}
              dataKey="timestamp"
              tickLine={false}
              axisLine={false}
              tickMargin={16}
              angle={-30}
              tickFormatter={(value) => {
                if (typeof value !== "number") return value;
                const date = new Date(value);
                let hours = date.getHours();
                const minutes = date.getMinutes();
                const seconds = date.getSeconds();
                const ampm = hours >= 12 ? "PM" : "AM";
                hours = hours % 12 || 12;
                const m = minutes < 10 ? `0${minutes}` : minutes;
                const s = seconds < 10 ? `0${seconds}` : seconds;
                return `${hours}:${m}:${s} ${ampm}`;
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
