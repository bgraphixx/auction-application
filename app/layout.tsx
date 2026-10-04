import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fewchore Asset Disposal",
  description: "Internal asset auction platform",
  icons: { icon: "/assets/ffcl-icon.png" },
};

import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
