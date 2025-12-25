"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";

const features = [
  {
    icon: "🔐",
    title: "Multi-Factor Authentication",
    description: "Secure your account with OTP-based MFA and advanced security policies.",
    href: "/login",
  },
  {
    icon: "📄",
    title: "Document Management",
    description: "Create, classify, and share documents with MAC and DAC access controls.",
    href: "/documents",
  },
  {
    icon: "👥",
    title: "Role-Based Access",
    description: "Comprehensive RBAC, RuBAC, and ABAC policies for enterprise security.",
    href: "/profile",
  },
  {
    icon: "📊",
    title: "Admin Dashboard",
    description: "Manage users, roles, and monitor system activity with detailed auditing.",
    href: "/admin/dashboard",
  },
  {
    icon: "🔍",
    title: "Audit Logging",
    description: "Complete audit trails for all system actions and security events.",
    href: "/admin/audit-logs",
  },
  {
    icon: "🛡️",
    title: "Zero Trust Security",
    description: "Advanced security policies with adaptive rules and real-time monitoring.",
    href: "/login",
  },
];

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (status === "authenticated") {
      router.push("/dashboard"); // or "/admin/dashboard" if you have different paths
    }
  }, [status, router]);

  // Show loading spinner while checking session
  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
      </div>
    );
  }

  // Only show landing page to unauthenticated users
  if (!session) {
    return (
      <div className="space-y-16 py-12">
        {/* Hero Section */}
        <section className="text-center">
          <div className="mx-auto max-w-4xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm text-blue-700">
              <span className="h-2 w-2 animate-pulse rounded-full bg-blue-600"></span>
              Enterprise Security Platform
            </div>
            <h1 className="mb-6 text-5xl font-bold tracking-tight text-slate-900 sm:text-6xl">
              Secure Access Control
              <span className="block bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Made Simple
              </span>
            </h1>
            <p className="mx-auto mb-8 max-w-2xl text-lg text-slate-600">
              Enterprise-grade access control system with multi-factor authentication, role-based permissions,
              document classification, and comprehensive audit logging.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/register"
                className="rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-base font-semibold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl"
              >
                Get Started
              </Link>
              <Link
                href="/login"
                className="rounded-lg border-2 border-slate-300 bg-white px-6 py-3 text-base font-semibold text-slate-900 transition-all hover:border-slate-400 hover:bg-slate-50"
              >
                Sign In
              </Link>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section>
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-slate-900">Powerful Features</h2>
            <p className="text-slate-600">Everything you need for enterprise security management</p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <Link
                key={feature.title}
                href={session ? feature.href : "/login"} // Optional: redirect to login if not signed in
                className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-blue-300 hover:shadow-lg"
              >
                <div className="mb-4 text-4xl">{feature.icon}</div>
                <h3 className="mb-2 text-xl font-semibold text-slate-900">{feature.title}</h3>
                <p className="text-sm text-slate-600">{feature.description}</p>
                <div className="mt-4 text-sm font-medium text-blue-600 opacity-0 transition-opacity group-hover:opacity-100">
                  Learn more →
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 p-12 text-center text-white">
          <h2 className="mb-4 text-3xl font-bold">Ready to get started?</h2>
          <p className="mb-8 text-blue-100">Join thousands of organizations securing their data with SecurePortal</p>
          <Link
            href="/register"
            className="inline-block rounded-lg bg-white px-8 py-3 text-base font-semibold text-blue-600 transition-all hover:scale-105 hover:shadow-xl"
          >
            Create Account
          </Link>
        </section>
      </div>
    );
  }

  
  return null;
}