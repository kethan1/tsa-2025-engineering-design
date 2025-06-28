"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

interface WeatherData {
  timestamp: number;
  temperature: number;
  precipitation: number;
}

interface WeatherContextValue {
  data: WeatherData | null;
  error: string | null;
}

const WeatherContext = createContext<WeatherContextValue>({
  data: null,
  error: null,
});

const NASHVILLE_LATITUDE = 36.1627;
const NASHVILLE_LONGITUDE = -86.7816;

// Provider that fetches and updates weather every 30 seconds
export const WeatherProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [data, setData] = useState<WeatherData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Function to fetch weather for given coords
  const fetchWeather = async (latitude: number, longitude: number) => {
    try {
      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY}`
      );
      if (!res.ok) throw new Error("Failed to fetch weather data");
      const json = await res.json();
      const temp = json.main.temp;
      let precip = 0;
      if (json.rain?.["1h"]) precip = json.rain["1h"];
      else if (json.snow?.["1h"]) precip = json.snow["1h"];
      setData({
        timestamp: Date.now(),
        temperature: temp,
        precipitation: precip,
      });
      setError(null);
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Initial geolocation + fetch
  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by this browser");
      // Fallback to Nashville coordinates if geolocation is not available
      fetchWeather(NASHVILLE_LATITUDE, NASHVILLE_LONGITUDE);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        fetchWeather(pos.coords.latitude, pos.coords.longitude);
      },
      () => {
        setError("Permission denied for geolocation");
        fetchWeather(NASHVILLE_LATITUDE, NASHVILLE_LONGITUDE);
      }
    );
  }, []);

  // Poll every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude),
          () => {
            setError("Permission denied for geolocation");
            // Fallback to Nashville coordinates if permission denied
            fetchWeather(NASHVILLE_LATITUDE, NASHVILLE_LONGITUDE);
          }
        );
      } else {
        setError("Geolocation is not supported by this browser");
        // Fallback to Nashville coordinates if geolocation is not available
        fetchWeather(NASHVILLE_LATITUDE, NASHVILLE_LONGITUDE);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <WeatherContext.Provider value={{ data, error }}>
      {children}
    </WeatherContext.Provider>
  );
};

// Hook to consume weather context
export const useWeather = () => useContext(WeatherContext);
