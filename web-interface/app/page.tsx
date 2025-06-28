"use client";

import { NitrogenLineChart } from "@/components/NitrogenLineChart";
import { WeatherLineChart } from "@/components/WeatherLineChart";
import { SuggestFertilizerAmount } from "@/components/SuggestFertilizerAmount";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Home() {
  return (
    <main className="px-[5%] py-5 gap-3 flex flex-col items-center justify-center min-h-screen w-full">
      <h1 className="text-2xl lg:text-3xl font-bold">NitroSense</h1>
      <h2 className="text-base md:text-lg">
        Intelligently Optimize Your Nitrogen Fertilizer Usage.
      </h2>
      <SuggestFertilizerAmount />
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
          <NitrogenLineChart />
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
