import Link from "next/link";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { MainNav } from "@/components/MainNav";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: {
    default: "Do Good Sleep",
    template: "%s — Do Good Sleep",
  },
  description:
    "You feel good, and then you fall asleep",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://api.dogoodsleep.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://images.dogoodsleep.com" />
      </head>
      <body className={inter.variable}>
        <a className="skip-link" href="#main-content">Skip to content</a>
        <MainNav />
        {children}
        <footer className="site-footer">
          <span>Do Good Sleep · Akash</span>
          <Link href="/resume">About this site</Link>
        </footer>
      </body>
    </html>
  );
}
