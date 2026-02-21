import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { MainNav } from "@/components/MainNav";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
    title: "do-good-sleep",
    description: "Akash was here? i guess"
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className={inter.className}>
                <MainNav />
                {children}
            </body>
        </html>
    );
}
