"use client";

import { useEffect, useRef, useState } from "react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { useSensor, SensorData } from "./SensorContext";

const chartConfig = {
  nitrogen: { label: "Nitrogen (mg/kg)", color: "var(--chart-1)" },
} satisfies ChartConfig;

type ChartPoint = SensorData;

export function NitrogenLineChart() {
  const { data: sensor, error } = useSensor();
  const [series, setSeries] = useState<ChartPoint[]>([]);
  const lastStamp = useRef<number | null>(null);

  useEffect(() => {
    if (!sensor) return;
    const stamp = sensor.timestamp;
    if (stamp !== lastStamp.current) {
      setSeries((prev) => [...prev.slice(-15), sensor]);
      lastStamp.current = stamp;
    }
  }, [sensor]);

  if (error)
    return (
      <Card>
        <CardContent className="text-red-500">Error: {error}</CardContent>
      </Card>
    );

  if (!sensor && series.length === 0)
    return (
      <Card>
        <CardContent>Loading sensor data…</CardContent>
      </Card>
    );

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Nitrogen Content</CardTitle>
        <CardDescription>Real-time from Firebase.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          className="max-h-[100vh] size-full"
          config={chartConfig}
        >
          <LineChart
            accessibilityLayer
            data={series}
            margin={{ left: 12, right: 24, top: 12, bottom: 12 }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="timestamp"
              padding={{ left: 12, right: 12 }}
              height={80}
              tickCount={5}
              tickLine={false}
              axisLine={false}
              tickMargin={16}
              angle={-30}
              tickFormatter={(value) => {
                const date = new Date(Number(value));
                const hours = date.getHours() % 12 || 12;
                const minutes = String(date.getMinutes()).padStart(2, "0");
                const seconds = String(date.getSeconds()).padStart(2, "0");
                const ampm = date.getHours() >= 12 ? "PM" : "AM";
                return `${hours}:${minutes}:${seconds} ${ampm}`;
              }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={0}
              tickFormatter={(v) => `${v} mg/kg`}
            />
            <ChartTooltip
              cursor={false}
              content={(props) => <ChartTooltipContent hideLabel {...props} />}
            />
            <Line
              dataKey="nitrogen"
              type="monotone"
              stroke="var(--chart-1)"
              strokeWidth={2}
              dot={{ fill: "var(--chart-1)" }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
