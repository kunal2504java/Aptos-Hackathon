"use client";
import "./globals.css";
import { Press_Start_2P, VT323 } from "next/font/google";
import type React from "react";
import FloatingPixels from "./components/FloatingPixels";
import SoundEffect from "./components/SoundEffect";
import PixelatedBackground from "./components/PixelatedBackground";
import AptosConnectButton from "./components/AptosConnectButton";
import BlinkingCursor from "./components/BlinkingCursor";
// import WalletDebug from "./components/WalletDebug"; // Temporarily disabled
import Link from "next/link";
import { WalletProvider } from "@/lib/wallet-context";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";

const pressStart2P = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-press-start-2p",
  display: "swap",
});

const vt323 = VT323({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-vt323",
  display: "swap",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const queryClient = new QueryClient();

  return (
    <html lang="en">
      <body
        className={`${pressStart2P.variable} ${vt323.variable} font-pixel bg-gray-900 text-green-400 dark:bg-gray-900 dark:text-green-400 flex flex-col min-h-screen`}
      >
        <QueryClientProvider client={queryClient}>
          <WalletProvider>
            <header className="p-8 flex flex-col">
              <div className="flex justify-between items-center">
                <Link href="/" className="text-2xl font-bold">
                  OmniBets
                  <BlinkingCursor />
                </Link>
                <AptosConnectButton />
              </div>
            </header>
            <PixelatedBackground />

            {/* Ensure the main content takes up available space */}
            <div className="flex-grow mx-auto px-4">
              <main>{children}</main>
            </div>

            {/* Move footer outside the inner div, so it sticks to the bottom */}
            <footer className="py-8 text-center font-mono w-full">
              © 2025 OmniBets. All rights pixelated.
            </footer>

            <FloatingPixels />
            <SoundEffect />
            {/* <WalletDebug /> Temporarily disabled */}
          </WalletProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
}
