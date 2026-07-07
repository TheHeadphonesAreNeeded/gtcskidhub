import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { SettingsProvider } from "@/components/providers/SettingsProvider";
import { ToastProvider } from "@/components/providers/ToastProvider";
import { AdSenseScript } from "@/components/AdSense";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#0a0a0f",
};

export const metadata: Metadata = {
  title: "SkidHub — Download Exclusive Gorilla Tag Copies",
  description:
    "SkidHub is a premium Gorilla Tag copy-sharing platform. Verified Owners and Moderators can access exclusive copies.",
  openGraph: {
    title: "SkidHub",
    description: "Download exclusive Gorilla Tag copies. Verified access only.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`dark ${inter.variable} ${mono.variable}`}>
      <body className="font-sans">
        <AdSenseScript />
        <SettingsProvider>
          <ToastProvider>
            <AuthProvider>{children}</AuthProvider>
          </ToastProvider>
        </SettingsProvider>
      </body>
    </html>
  );
}
