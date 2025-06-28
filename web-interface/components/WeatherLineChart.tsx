"use client";

import { useEffect, useRef, useState } from "react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

import { useWeather } from "./WeatherContext";

interface ChartPoint {
  timestamp: number; // epoch ms
  temperature: number; // °C
  precipitation: number; // mm
}

const chartConfig = {
  temperature: { label: "Temperature (°C)", color: "var(--chart-1)" },
  precipitation: { label: "Precipitation (mm)", color: "var(--chart-2)" },
} satisfies ChartConfig;

export function WeatherLineChart() {
  const { data: weather, error } = useWeather();
  const [series, setSeries] = useState<ChartPoint[]>([]);
  const lastStamp = useRef<number | null>(null);

  useEffect(() => {
    if (!weather) return;

    const stamp = weather.timestamp ?? Date.now();

    // Simple de‑dup so we don’t push the same point twice
    if (stamp !== lastStamp.current) {
      setSeries((prev) => [
        ...prev.slice(-15),
        {
          timestamp: stamp,
          temperature: weather.temperature,
          precipitation: weather.precipitation,
        },
      ]);
      lastStamp.current = stamp;
    }
  }, [weather]);

  if (error)
    return (
      <Card>
        <CardContent className="text-red-500">Error: {error}</CardContent>
      </Card>
    );

  if (!weather && series.length === 0)
    return (
      <Card>
        <CardContent>Loading weather&hellip;</CardContent>
      </Card>
    );

  return (
    <Card className="w-full md:w-[85%] lg:w-[60%]">
      <CardHeader>
        <CardTitle>Weather Trend</CardTitle>
        <CardDescription>
          Automatically pulled from OpenWeatherAPI.
        </CardDescription>
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
            {/* Grid + Axes -------------------------------------------------- */}
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
                const d = new Date(Number(value));
                return d.toLocaleTimeString(); // HH:MM:SS AM/PM
              }}
            />
            <YAxis
              yAxisId="left"
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${v} °C`}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${v} mm`}
            />

            {/* Tooltip ------------------------------------------------------ */}
            <ChartTooltip
              cursor={false}
              content={(props) => <ChartTooltipContent hideLabel {...props} />}
            />

            {/* Data series -------------------------------------------------- */}
            <Line
              yAxisId="left"
              dataKey="temperature"
              type="monotone"
              stroke="var(--chart-1)"
              strokeWidth={2}
              dot={{ fill: "var(--chart-1)" }}
              activeDot={{ r: 6 }}
            />
            <Line
              yAxisId="right"
              dataKey="precipitation"
              type="monotone"
              stroke="var(--chart-2)"
              strokeWidth={2}
              dot={{ fill: "var(--chart-2)" }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
