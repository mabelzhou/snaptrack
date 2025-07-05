import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/header";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({subsets: ["latin"]});

export const metadata: Metadata = {
  title: "SnapTrack",
  description: "Finance Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
    <html lang="en">
      <body
        className={`${inter.className} `}
      >
        {/*header */}
        <Header/>
        <main className="min-h-screen">
          {children}
        </main>
        <Toaster richColors/>
        {/*footer */}
        <footer className="bg-green-50 py-12">
          <div className="container mx-auto px-4 text-center">
            <p>Made by Mabel Zhou 2025</p>
          </div>
        </footer>
      </body>
    </html>
  </ClerkProvider>
  );
}
