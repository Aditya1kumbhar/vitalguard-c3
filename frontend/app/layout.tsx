import type { Metadata, Viewport } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./context/AuthContext";
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
      { url: "/logo-tight.png", type: "image/png" },
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={dmSans.variable}>
      <body className="font-sans antialiased bg-black text-white selection:bg-[#FF375F] selection:text-white">
        <AmbientProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </AmbientProvider>
      </body>
    </html>
  );
}
