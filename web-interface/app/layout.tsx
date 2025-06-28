import type { Metadata } from "next";
import { Rubik } from "next/font/google";

import { WeatherProvider } from "@/components/WeatherContext";
import { SensorProvider } from "@/components/SensorContext";
import "./globals.css";

const rubik = Rubik({
  variable: "--font-rubik",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "NitroSense - TSA 2025 Engineering Design",
  description: "Our submission to the TSA 2025 Engineering Design competition.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="apple-mobile-web-app-title" content="NitroSense" />
      </head>
      <body className={`dark ${rubik.variable} ${rubik.className}`}>
        <WeatherProvider>
          <SensorProvider>{children}</SensorProvider>
        </WeatherProvider>
      </body>
    </html>
  );
}
