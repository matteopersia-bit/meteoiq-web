import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "Meteo IQ", description: "Previsioni basate sul confronto tra modelli", manifest: "/manifest.json", appleWebApp: { capable: true, statusBarStyle: "default", title: "Meteo IQ" }, icons: { apple: "/icons/apple-touch-icon.svg" } };
export const viewport: Viewport = { themeColor: "#F4F7FA", width: "device-width", initialScale: 1, viewportFit: "cover" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="it"><body>{children}</body></html>; }
