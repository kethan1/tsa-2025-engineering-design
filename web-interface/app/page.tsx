"use client";

import { useState, useEffect } from "react";
import { get, ref } from "firebase/database";
import { database } from "@/lib/firebase";

import { NitrogenLineChart } from "@/components/NitrogenLineChart";
import type { ChartPoint } from "@/components/SensorContext";
import { WeatherLineChart } from "@/components/WeatherLineChart";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const DATA_FETCH_INTERVAL_S = 2;

export default function Home() {
  const [data, setData] = useState<ChartPoint[]>([]);
  const [updateData, setUpdateData] = useState<number>(0);

  useEffect(() => {
    const interval = setInterval(
      () => setUpdateData((prev) => prev + 1),
      DATA_FETCH_INTERVAL_S * 1000
    );
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (data.length > 15) {
      setData((prev) => prev.slice(-15));
    }
  }, [data]);

  useEffect(() => {
    const dataRef = ref(database, "soil");
    get(dataRef)
      .then((snapshot) => {
        if (snapshot.exists()) {
          const fetchedData = snapshot.val();

          const newPoint = {
            timestamp: Date.now(),
            nitrogen: fetchedData?.nitrogen || 0,
            phosphorus: fetchedData?.phosphorus || 0,
            potassium: fetchedData?.potassium || 0,
          };

          setData((prev) => [...prev, newPoint]);
        } else {
          console.log("No data available");
        }
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
      });
  }, [updateData]);

  return (
    <main className="px-[5%] py-5 gap-3 flex flex-col items-center justify-center min-h-screen w-full">
      <h1 className="text-2xl lg:text-3xl font-bold">NitroSense</h1>
      <h2 className="text-base md:text-lg">
        Intelligently Optimize Your Nitrogen Fertilizer Usage.
      </h2>
      <Tabs defaultValue="nitrogen-line-chart" className="w-full md:w-[85%] lg:w-[60%]">
        <TabsList>
          <TabsTrigger value="nitrogen-line-chart">
            Nitrogen Line Chart
          </TabsTrigger>
          <TabsTrigger value="weather-line-chart">
            Weather Line Chart
          </TabsTrigger>
        </TabsList>
        <TabsContent
          forceMount
          value="nitrogen-line-chart"
          className="data-[state=inactive]:hidden"
        >
          <NitrogenLineChart data={data} />
        </TabsContent>
        <TabsContent
          forceMount
          value="weather-line-chart"
          className="data-[state=inactive]:hidden"
        >
          <WeatherLineChart />
        </TabsContent>
      </Tabs>
    </main>
  );
}
