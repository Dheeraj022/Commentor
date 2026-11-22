import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Social Comment Monitor | Social Media Comment Monitoring Dashboard",
  description: "Monitor, extract, and analyze social media comments across platforms with sentiment analysis and deduplication.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col font-sans bg-slate-50 text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
