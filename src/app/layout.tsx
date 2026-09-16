import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CryptoWise | Private Financial Platform",
  description:
    "Securely access your account information, monitor financial activity, and follow global cryptocurrency market data.",
  keywords: ["CryptoWise", "crypto", "bitcoin", "ethereum", "trading", "exchange"],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "CryptoWise | Private Financial Platform",
    description:
      "Buy, sell and invest in the world's most popular cryptocurrencies — all in one secure platform.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
