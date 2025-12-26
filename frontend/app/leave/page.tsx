"use client";

import { FormEvent, useState } from "react";
import { toast } from "react-toastify";
import api from "../api";
import Link from "next/link";

export default function LeaveAndSalaryPage() {
  const [leaveForm, setLeaveForm] = useState({ requestId: "", days: 5, justification: "" });
  const [approving, setApproving] = useState(false);
  const [salaryData, setSalaryData] = useState<string | null>(null);
  const [loadingSalary, setLoadingSalary] = useState(false);

  const handleApprove = async (e: FormEvent) => {
    e.preventDefault();
    if (!leaveForm.requestId) {
      toast.error("Provide a valid leave request ID.");
      return;
    }
    setApproving(true);
    try {
      const res = await api.post(`/leave/approve/${leaveForm.requestId}`, {
        days: leaveForm.days,
        justification: leaveForm.justification,
      });
      toast.success(res.data.message || "Leave approved successfully");
      setLeaveForm({ requestId: "", days: 5, justification: "" });
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Approval failed — policy blocked?");
    } finally {
      setApproving(false);
    }
  };

  const fetchSalary = async () => {
    setLoadingSalary(true);
    try {
      const res = await api.get("/leave/salary");
      setSalaryData(res.data.data || JSON.stringify(res.data));
      toast.success(res.data.message || "Salary data loaded");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Access denied");
      setSalaryData(null);
    } finally {
      setLoadingSalary(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header with Link to Employee Submission */}
      <div className="rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Security Policy Demo</h1>
            <p className="mt-2 text-sm text-slate-600">
              This page demonstrates RuBAC, ABAC, and MAC policies in action.
            </p>
          </div>
          <Link
            href="/leave/request"
            className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow hover:bg-blue-700 transition"
          >
            → Submit Leave Request (Employee View)
          </Link>
        </div>
      </div>

      {/* Leave Approval Section */}
      <section className="rounded-xl bg-white p-6 shadow">
        <h2 className="text-xl font-semibold text-slate-900 mb-2">Manual Leave Approval</h2>
        <p className="text-sm text-slate-600 mb-6">
          Test the full security stack by approving a leave request. 
          This calls <code className="bg-slate-100 px-1 rounded">/api/leave/approve/:id</code> 
          — protected by RBAC + MAC + ABAC + RuBAC.
        </p>
        <form onSubmit={handleApprove} className="grid gap-4 md:grid-cols-2">
          <label className="text-sm font-medium text-slate-700">
            Leave Request ID
            <input
              value={leaveForm.requestId}
              onChange={(e) => setLeaveForm({ ...leaveForm, requestId: e.target.value })}
              className="mt-1 w-full rounded border border-slate-300 p-2 focus:border-blue-500 focus:outline-none"
              placeholder="e.g., 66f1a2b3c4d5e6f789012345"
              required
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Days Requested
            <input
              type="number"
              min={1}
              max={30}
              value={leaveForm.days}
              onChange={(e) => setLeaveForm({ ...leaveForm, days: Number(e.target.value) })}
              className="mt-1 w-full rounded border border-slate-300 p-2 focus:border-blue-500 focus:outline-none"
              required
            />
          </label>
          <label className="md:col-span-2 text-sm font-medium text-slate-700">
            Justification / Notes
            <textarea
              value={leaveForm.justification}
              onChange={(e) => setLeaveForm({ ...leaveForm, justification: e.target.value })}
              className="mt-1 w-full rounded border border-slate-300 p-2 focus:border-blue-500 focus:outline-none"
              rows={3}
              placeholder="Optional notes for audit log"
            />
          </label>
          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={approving}
              className="rounded bg-blue-600 px-6 py-3 text-sm font-semibold text-white disabled:opacity-60 hover:bg-blue-700 transition"
            >
              {approving ? "Submitting Approval..." : "Approve Leave"}
            </button>
          </div>
        </form>
      </section>

      {/* Salary Data Section */}
      <section className="rounded-xl bg-white p-6 shadow">
        <header className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Salary Data (ABAC Demo)</h2>
            <p className="text-sm text-slate-600">
              Calls <code className="bg-slate-100 px-1 rounded">/api/leave/salary</code> — 
              only accessible if ABAC policy allows (e.g., department + clearance).
            </p>
          </div>
          <button
            onClick={fetchSalary}
            disabled={loadingSalary}
            className="rounded bg-slate-900 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60 hover:bg-slate-800 transition"
          >
            {loadingSalary ? "Checking Access..." : "Fetch Salary Data"}
          </button>
        </header>
        <div className="rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 p-6 text-center">
          {salaryData ? (
            <pre className="text-left text-sm text-slate-800 overflow-x-auto">{salaryData}</pre>
          ) : (
            <p className="text-slate-500">Click button to test salary data access</p>
          )}
        </div>
      </section>

      {/* Footer Note */}
      <div className="text-center text-sm text-slate-500">
        <p>
          Use this page to test security policies. 
          Normal users should use{" "}
          <Link href="/leave/request" className="text-blue-600 hover:underline">
            Submit Leave Request
          </Link>{" "}
          and{" "}
          <Link href="/leave/approvals" className="text-blue-600 hover:underline">
            Approve Leaves
          </Link>{" "}
          for daily workflow.
        </p>
      </div>
    </div>
  );
}