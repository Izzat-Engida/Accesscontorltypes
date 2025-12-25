"use client";
import  api  from "../../api"
import { useSession } from "next-auth/react";
import { useEffect, useState, useMemo } from "react";
import { format } from "date-fns";
import { Download, Search, Loader2, AlertCircle } from "lucide-react";

interface AuditLog {
  _id: string;
  user?: {
    name?: string;
    email?: string;
  } | null;
  action: string;
  resource: string;
  resourceId?: string;
  details?: string;
  severity: "info" | "low" | "medium" | "high" | "critical";
  status: "success" | "failed";
  ip?: string;
  userAgent?: string;
  createdAt: string;
}

export default function AuditLogsPage() {
  const { data: session, status } = useSession();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);

  // Fetch logs
 useEffect(() => {
  if (status === "authenticated" && session?.user?.role === "Admin") {
    const loadLogs = async () => {
      try {
        setLoading(true);
        // Use the same api instance as Documents page!
        const res = await api.get<AuditLog[]>("/audit");  // adjust path if needed: "/api/audit"
        setLogs(res.data);
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to fetch logs");
      } finally {
        setLoading(false);
      }
    };

    loadLogs();
  } else if (status === "authenticated") {
    setError("Access denied: Admins only");
    setLoading(false);
  }
}, [session, status]);

  // Filtered & Searched logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const term = searchTerm.toLowerCase();
      return (
        log.action.toLowerCase().includes(term) ||
        log.resource.toLowerCase().includes(term) ||
        (log.details || "").toLowerCase().includes(term) ||
        (log.user?.name || "").toLowerCase().includes(term) ||
        (log.user?.email || "").toLowerCase().includes(term)
      );
    });
  }, [logs, searchTerm]);

  // Paginated logs
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredLogs.slice(start, start + pageSize);
  }, [filteredLogs, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredLogs.length / pageSize);

  // Export to CSV
  const exportToCSV = () => {
    const headers = [
      "Date",
      "User",
      "Email",
      "Action",
      "Resource",
      "Details",
      "Severity",
      "Status",
    ];
    const rows = filteredLogs.map((log) => [
      format(new Date(log.createdAt), "PPP p"),
      log.user?.name || "System",
      log.user?.email || "-",
      log.action,
      log.resource,
      `"${(log.details || "").replace(/"/g, '""')}"`,
      log.severity,
      log.status,
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-logs-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Severity badge colors
  const severityColors: Record<string, string> = {
    info: "bg-blue-100 text-blue-800",
    low: "bg-green-100 text-green-800",
    medium: "bg-yellow-100 text-yellow-800",
    high: "bg-orange-100 text-orange-800",
    critical: "bg-red-100 text-red-800",
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || session?.user?.role !== "Admin") {
    return (
      <div className="mx-auto max-w-4xl px-6 py-12">
        <div className="flex flex-col items-center gap-4 text-center">
          <AlertCircle className="h-12 w-12 text-red-500" />
          <h1 className="text-2xl font-bold text-slate-900">Access Denied</h1>
          <p className="text-slate-600">{error || "You must be an admin to view audit logs."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Audit Logs</h1>
          <p className="mt-1 text-slate-600">Complete system activity history</p>
        </div>

        <button
          onClick={exportToCSV}
          className="flex items-center gap-2 rounded-lg bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
        >
          <Download className="h-4 w-4" />
          Export to CSV
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by action, resource, details, user..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full rounded-lg border border-slate-300 pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="w-full table-auto">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-slate-600">
                Date & Time
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-slate-600">
                User
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-slate-600">
                Action
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-slate-600">
                Resource
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-slate-600">
                Details
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-slate-600">
                Severity
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-slate-600">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedLogs.map((log) => (
              <tr key={log._id} className="hover:bg-slate-50 transition">
                <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-900">
                  {format(new Date(log.createdAt), "PPP p")}
                </td>
                <td className="px-6 py-4 text-sm">
                  <div>
                    <div className="font-medium text-slate-900">
                      {log.user?.name || "System"}
                    </div>
                    {log.user?.email && (
                      <div className="text-xs text-slate-500">{log.user.email}</div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-900">{log.action}</td>
                <td className="px-6 py-4 text-sm text-slate-900">{log.resource}</td>
                <td className="max-w-xs px-6 py-4 text-sm text-slate-700">
                  <div className="truncate" title={log.details}>
                    {log.details || "-"}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${severityColors[log.severity]}`}
                  >
                    {log.severity.toUpperCase()}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                      log.status === "success"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {log.status.toUpperCase()}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {paginatedLogs.length === 0 && (
          <div className="py-12 text-center text-slate-500">
            {filteredLogs.length === 0 ? "No logs match your search." : "No logs found."}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-slate-600">
            Showing {(currentPage - 1) * pageSize + 1} to{" "}
            {Math.min(currentPage * pageSize, filteredLogs.length)} of {filteredLogs.length} logs
          </p>

          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}