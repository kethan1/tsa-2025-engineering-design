import type { Metadata } from "next";
import { Inter } from "next/font/google";

import { WeatherProvider } from "@/components/WeatherContext";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
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
      <body className={`dark ${inter.variable} ${inter.className}`}>
        <WeatherProvider>{children}</WeatherProvider>
      </body>
    </html>
  );
}
