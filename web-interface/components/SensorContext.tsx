// SensorContext.tsx
"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { get, ref } from "firebase/database";
import { database } from "@/lib/firebase";

export interface SensorData {
  timestamp: number;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
}

interface SensorContextValue {
  data: SensorData | null;
  error: string | null;
}

const SensorContext = createContext<SensorContextValue>({
  data: null,
  error: null,
});
const SENSOR_DB_PATH = "soil";

export const SensorProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [data, setData] = useState<SensorData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchSensor = async () => {
    try {
      const snapshot = await get(ref(database, SENSOR_DB_PATH));
      if (!snapshot.exists()) throw new Error("No sensor data available");
      const val = snapshot.val();
      setData({
        timestamp: Date.now(),
        nitrogen: val.nitrogen ?? 0,
        phosphorus: val.phosphorus ?? 0,
        potassium: val.potassium ?? 0,
      });
      setError(null);
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchSensor();
  }, []);

  // Poll every 2 seconds
  useEffect(() => {
    const interval = setInterval(fetchSensor, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <SensorContext.Provider value={{ data, error }}>
      {children}
    </SensorContext.Provider>
  );
};

export const useSensor = () => useContext(SensorContext);
