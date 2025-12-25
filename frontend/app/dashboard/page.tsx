"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import api from "../api";
import Link from "next/link";
import { Loader2, Users, FileText, Shield, Clock, CheckCircle, AlertTriangle } from "lucide-react";

interface AuditLog {
  _id: string;
  action: string;
  user?: { name: string };
  createdAt: string;
  severity: string;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [data, setData] = useState<any>({});
  const [recentAudits, setRecentAudits] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  const role = session?.user?.role || "Employee";

  useEffect(() => {
    if (status !== "authenticated") return;

    async function loadDashboard() {
      try {
        setLoading(true);

        if (role === "Admin") {
          const [usersRes, docsRes, auditRes] = await Promise.all([
            api.get("/admin/users"),
            api.get("/access/documents"),
            api.get("/audit"), // your audit endpoint
          ]);
          setData({
            totalUsers: usersRes.data.users?.length || 0,
            totalDocuments: docsRes.data.documents?.length || 0,
            topSecretDocs: docsRes.data.documents?.filter((d: any) => d.sensitivityLevel === "TopSecret").length || 0,
          });
          setRecentAudits(auditRes.data.slice(0, 5));
        } else if (role === "HR_Manager") {
          const [payrollRes, leaveRes] = await Promise.all([
            api.get("/access/hr-finance"),
            api.get("/leave/pending"), // assume you have this
          ]);
          setData({
            payrollCount: payrollRes.data.payrollRecords?.length || 0,
            pendingLeaves: leaveRes.data?.length || 0,
          });
        } else if (role === "Finance_Manager") {
          const financeRes = await api.get("/access/finance"); // your endpoint
          setData({
            pendingApprovals: financeRes.data.pending?.length || 0,
            totalTransactions: financeRes.data.total || 0,
          });
        } else if (role === "Manager") {
          const teamRes = await api.get("/team/members"); // your endpoint
          setData({
            teamSize: teamRes.data.members?.length || 0,
            pendingApprovals: teamRes.data.pendingRequests || 0,
          });
        } else {
          // Employee
          const [docsRes, profileRes] = await Promise.all([
            api.get("/access/documents"),
            api.get("/access/profile"),
          ]);
          setData({
            myDocuments: docsRes.data.documents?.length || 0,
            name: profileRes.data.user?.name || session.user?.name,
          });
        }
      } catch (err) {
        console.error("Dashboard load failed:", err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [session, status, role]);

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="mx-auto max-w-2xl py-16 text-center">
        <Shield className="mx-auto h-16 w-16 text-blue-600" />
        <h1 className="mt-6 text-3xl font-bold text-slate-900">Welcome to SecurePortal</h1>
        <p className="mt-4 text-lg text-slate-600">Please sign in to access your secure dashboard.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-white shadow-lg">
        <h1 className="text-3xl font-bold">Welcome back, {session.user?.name || "User"}</h1>
        <p className="mt-2 text-xl opacity-90">{role} Dashboard</p>
      </div>

      {/* Admin Dashboard */}
      {role === "Admin" && (
        <>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Total Users</p>
                  <p className="mt-2 text-3xl font-bold text-slate-900">{data.totalUsers}</p>
                </div>
                <Users className="h-10 w-10 text-blue-600" />
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Total Documents</p>
                  <p className="mt-2 text-3xl font-bold text-slate-900">{data.totalDocuments}</p>
                </div>
                <FileText className="h-10 w-10 text-indigo-600" />
              </div>
            </div>
            <div className="rounded-xl border border-red-200 bg-red-50 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-700">Top Secret Docs</p>
                  <p className="mt-2 text-3xl font-bold text-red-700">{data.topSecretDocs}</p>
                </div>
                <AlertTriangle className="h-10 w-10 text-red-600" />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-semibold text-slate-900">Recent Audit Activity</h2>
            {recentAudits.length > 0 ? (
              <div className="space-y-3">
                {recentAudits.map((log) => (
                  <div key={log._id} className="flex items-center justify-between rounded-lg border border-slate-100 p-3">
                    <div>
                      <p className="font-medium text-slate-900">{log.action}</p>
                      <p className="text-sm text-slate-600">
                        by {log.user?.name || "System"} • {format(new Date(log.createdAt), "PP p")}
                      </p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                      log.severity === "critical" ? "bg-red-100 text-red-800" :
                      log.severity === "high" ? "bg-orange-100 text-orange-800" :
                      "bg-green-100 text-green-800"
                    }`}>
                      {log.severity.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500">No recent activity</p>
            )}
            <Link href="/admin/audit-logs" className="mt-4 inline-block text-blue-600 hover:underline">
              View Full Audit Log →
            </Link>
          </div>
        </>
      )}

      {/* HR_Manager Dashboard */}
      {role === "HR_Manager" && (
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-slate-900">HR Overview</h3>
            <div className="mt-6 space-y-4">
              <div className="flex justify-between">
                <span className="text-slate-600">Payroll Records</span>
                <span className="text-2xl font-bold text-blue-600">{data.payrollCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Pending Leave Approvals</span>
                <span className="text-2xl font-bold text-orange-600">{data.pendingLeaves}</span>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-slate-900">Quick Actions</h3>
            <ul className="mt-6 space-y-3">
              <li><Link href="/leave/approvals" className="text-blue-600 hover:underline">→ Review Pending Leaves</Link></li>
              <li><Link href="/documents" className="text-blue-600 hover:underline">→ Manage Employee Documents</Link></li>
              <li><Link href="/hr/reports" className="text-blue-600 hover:underline">→ Generate Reports</Link></li>
            </ul>
          </div>
        </div>
      )}

      {/* Employee Dashboard */}
      {["Employee", "Manager", "Finance_Manager"].includes(role) && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <FileText className="h-10 w-10 text-blue-600" />
            <p className="mt-4 text-sm text-slate-600">My Documents</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{data.myDocuments || 0}</p>
            <Link href="/documents" className="mt-4 inline-block text-sm text-blue-600 hover:underline">
              View all →
            </Link>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <Clock className="h-10 w-10 text-orange-600" />
            <p className="mt-4 text-sm text-slate-600">Pending Requests</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{data.pendingApprovals || 0}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <CheckCircle className="h-10 w-10 text-green-600" />
            <p className="mt-4 text-sm text-slate-600">Approved This Month</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">12</p>
          </div>
        </div>
      )}

      {/* Common Quick Links */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-xl font-semibold text-slate-900">Quick Links</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <Link href="/documents" className="rounded-lg border border-slate-200 p-4 text-center hover:bg-slate-50">
            <FileText className="mx-auto h-8 w-8 text-blue-600" />
            <p className="mt-2 font-medium">My Documents</p>
          </Link>
          <Link href="/leave" className="rounded-lg border border-slate-200 p-4 text-center hover:bg-slate-50">
            <Clock className="mx-auto h-8 w-8 text-orange-600" />
            <p className="mt-2 font-medium">Leave Requests</p>
          </Link>
          <Link href="/profile" className="rounded-lg border border-slate-200 p-4 text-center hover:bg-slate-50">
            <Users className="mx-auto h-8 w-8 text-indigo-600" />
            <p className="mt-2 font-medium">My Profile</p>
          </Link>
          {role === "Admin" && (
            <Link href="/admin/audit-logs" className="rounded-lg border border-slate-200 p-4 text-center hover:bg-slate-50">
              <Shield className="mx-auto h-8 w-8 text-red-600" />
              <p className="mt-2 font-medium">Audit Logs</p>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}