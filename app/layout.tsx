import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fewchore Asset Disposal",
  description: "Internal asset auction platform",
  icons: { icon: "/assets/ffcl-icon.png" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
