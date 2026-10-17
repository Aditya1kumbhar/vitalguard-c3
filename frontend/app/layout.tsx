import type { Metadata, Viewport } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { AmbientProvider } from "./design/AmbientProvider";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "VitalGuard C3 | Clinical Device Monitor",
  description: "Autonomous real-time wearable telemetry and fall monitoring system.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#0A0D12",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={dmSans.variable} data-theme="dark">
      <body className="font-sans antialiased bg-[#0A0D12] text-white selection:bg-[#FF375F] selection:text-white transition-colors duration-300">
        <AuthProvider>
          <ThemeProvider>
            <AmbientProvider>
              {children}
            </AmbientProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
