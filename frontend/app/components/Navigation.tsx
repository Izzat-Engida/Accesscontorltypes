"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";

export default function Navigation() {
  const { data: session } = useSession();
  const pathname = usePathname();

  const handleLogout = async () => {
    await signOut({ redirect: true, callbackUrl: "/login" });
  };

  const isActive = (path: string) => pathname.startsWith(path); // Better for nested routes

  const isAdmin = session?.user?.role === "Admin";

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-lg shadow-sm">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-bold text-lg">
            S
          </div>
          <span className="text-xl font-bold text-slate-900">SecurePortal</span>
        </Link>

        <div className="flex items-center gap-1">
          <Link
            href="/"
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              isActive("/") && pathname === "/" ? "bg-blue-50 text-blue-700" : "text-slate-700 hover:bg-slate-100"
            }`}
          >
            Home
          </Link>

          {session ? (
            <>
              <Link
                href="/profile"
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  isActive("/profile") ? "bg-blue-50 text-blue-700" : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                Profile
              </Link>
              <Link
                href="/documents"
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  isActive("/documents") ? "bg-blue-50 text-blue-700" : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                Documents
              </Link>
              <Link
                href="/leave"
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  isActive("/leave") ? "bg-blue-50 text-blue-700" : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                Leave
              </Link>

              {/* Admin-only Links */}
              {isAdmin && (
                <>
                  <Link
                    href="/admin/dashboard"
                    className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                      isActive("/admin/dashboard") ? "bg-blue-50 text-blue-700" : "text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    User Accounts
                  </Link>
                  <Link
                    href="/admin/audit-logs"
                    className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                      isActive("/admin/audit-logs") ? "bg-blue-50 text-blue-700" : "text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    Audit Logs
                  </Link>
                </>
              )}

              <div className="mx-2 h-6 w-px bg-slate-300"></div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-600">{session.user?.name}</span>
                <button
                  onClick={handleLogout}
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800"
                >
                  Logout
                </button>
              </div>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  isActive("/login") ? "bg-blue-50 text-blue-700" : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                Login
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:from-blue-700 hover:to-indigo-700"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}