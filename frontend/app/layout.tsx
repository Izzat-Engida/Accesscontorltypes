import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer } from "react-toastify";
import AppSessionProvider from "./session-provider";
import Navigation from "./components/Navigation";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SecurePortal - Enterprise Access Control",
  description: "Enterprise-grade access control system with advanced security features",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 min-h-screen`}>
        <AppSessionProvider>
          <Navigation />
          <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
          <footer className="mt-16 border-t border-slate-200 bg-white/50 py-8">
            <div className="mx-auto max-w-7xl px-6 text-center text-sm text-slate-600">
              <p>&copy; {new Date().getFullYear()} SecurePortal. All rights reserved.</p>
            </div>
          </footer>
          <ToastContainer position="top-right" theme="light" />
        </AppSessionProvider>
      </body>
    </html>
  );
}
