import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CT vs MRI Analyzer",
  description:
    "Upload a medical image and use on-device machine learning to estimate whether it is a CT scan or an MRI image."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="bg-slate-950">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
