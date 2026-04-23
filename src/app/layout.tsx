import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Holiday Density",
  description: "Holiday density application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col antialiased bg-zinc-900 text-zinc-100">{children}</body>
    </html>
  );
}
