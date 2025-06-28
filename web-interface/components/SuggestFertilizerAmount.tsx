import { useSensor } from "./SensorContext";
import { useWeather } from "./WeatherContext";
import { optimalNitrogenContent } from "@/lib/optimizer";

export function SuggestFertilizerAmount() {
  const { data: sensor, error: sensorError } = useSensor();
  const { data: weather, error: weatherError } = useWeather();

  if (sensorError || weatherError) {
    return (
      <div className="text-red-500">Error: {sensorError || weatherError}</div>
    );
  }

  if (!sensor || !weather) {
    return <div>Loading sensor and weather data…</div>;
  }

  const nitrogen = sensor.nitrogen;
  const temperature = weather.temperature;
  const precipitation = weather.precipitation;

  const idealNitrogenAmount = optimalNitrogenContent(
    precipitation,
    temperature
  );

  return (
    <div className="p-4 rounded shadow">
      <h2 className="text-lg font-semibold mb-2">Fertilizer Suggestion</h2>
      <p>
        Based on the current nitrogen level of{" "}
        <span className="font-bold text-cyan-100">{nitrogen} mg/kg</span>, a
        temperature of{" "}
        <span className="font-bold text-cyan-100">{temperature}°C</span>, and
        precipitation of{" "}
        <span className="font-bold text-cyan-100">{precipitation} mm</span>, the
        ideal fertilizer amount is{" "}
        <strong className="text-lg font-extrabold text-green-500">
          {idealNitrogenAmount.toFixed(2)} mg/kg
        </strong>.
        Therefore, we suggest applying approximately{" "}
        <strong className="text-lg font-extrabold text-green-500">
          {Math.max(0, idealNitrogenAmount - nitrogen).toFixed(2)} mg/kg
        </strong>{" "}
        of fertilizer.
      </p>
    </div>
  );
}
