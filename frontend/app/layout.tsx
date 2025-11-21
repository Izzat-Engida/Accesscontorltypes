import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer } from "react-toastify";
import AppSessionProvider from "./session-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Secure Access Control Suite",
  description: "University project demonstrating MAC/DAC/RBAC/ABAC/RuBAC with MFA and auditing",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-50 min-h-screen`}>
        <AppSessionProvider>
          <header className="bg-slate-900 text-white">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
              <div className="text-lg font-semibold">AASTU Security Portal</div>
              <nav className="flex flex-wrap gap-4 text-sm">
                <Link href="/" className="hover:underline">
                  Home
                </Link>
                <Link href="/login" className="hover:underline">
                  Login
                </Link>
                <Link href="/register" className="hover:underline">
                  Register
                </Link>
                <Link href="/profile" className="hover:underline">
                  Profile
                </Link>
                <Link href="/documents" className="hover:underline">
                  Documents
                </Link>
                <Link href="/leave" className="hover:underline">
                  Leave
                </Link>
                <Link href="/admin/dashboard" className="hover:underline">
                  Admin
                </Link>
                <Link href="/verify-email" className="hover:underline">
                  Verify Email
                </Link>
              </nav>
            </div>
          </header>
          <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
          <ToastContainer position="top-right" theme="dark" />
        </AppSessionProvider>
      </body>
    </html>
  );
}
