import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({subsets: ["latin"]});

export const metadata: Metadata = {
  title: "SnacpTrack",
  description: "Finance Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.className} `}
      >
        {/*header */}
        {children}
        {/*footer */}
        <footer className="bg-blue-50 py-12">
          <div className="container mx-auto px-4 text-center">
            <p>Made by Mabel Zhou 2025</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
