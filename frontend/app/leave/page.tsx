"use client";

import { FormEvent, useState } from "react";
import { toast } from "react-toastify";
import api from "../api";

export default function LeaveAndSalaryPage() {
  const [leaveForm, setLeaveForm] = useState({ requestId: "", days: 5, justification: "" });
  const [approving, setApproving] = useState(false);
  const [salaryData, setSalaryData] = useState<string | null>(null);
  const [loadingSalary, setLoadingSalary] = useState(false);

  const handleApprove = async (e: FormEvent) => {
    e.preventDefault();
    if (!leaveForm.requestId) {
      toast.error("Provide a leave request ID.");
      return;
    }
    setApproving(true);
    try {
      const res = await api.post("/leave/approve", {
        requestId: leaveForm.requestId,
        days: leaveForm.days,
        justification: leaveForm.justification,
      });
      toast.success(res.data.message || "Leave approved (RuBAC + ABAC + MAC passed)");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Approval blocked by policy");
    } finally {
      setApproving(false);
    }
  };

  const fetchSalary = async () => {
    setLoadingSalary(true);
    try {
      const res = await api.get("/leave/salary");
      setSalaryData(res.data.data || JSON.stringify(res.data));
      toast.success(res.data.message || "Salary data unlocked via ABAC policy");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Access denied");
      setSalaryData(null);
    } finally {
      setLoadingSalary(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <section className="rounded-xl bg-white p-6 shadow">
        <h1 className="text-2xl font-semibold text-slate-900">Leave approval (RuBAC + ABAC demo)</h1>
        <p className="mt-2 text-sm text-slate-600">
          Submit a leave approval to `/api/leave/approve`. Only HR managers inside working hours, with the correct IP and
          clearance, will pass both ABAC and RuBAC checks. Attempts are logged centrally.
        </p>
        <form onSubmit={handleApprove} className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="text-sm font-medium text-slate-700">
            Request ID
            <input
              value={leaveForm.requestId}
              onChange={(e) => setLeaveForm({ ...leaveForm, requestId: e.target.value })}
              className="mt-1 w-full rounded border border-slate-300 p-2"
              placeholder="REQ-123"
              required
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Days requested
            <input
              type="number"
              min={1}
              max={30}
              value={leaveForm.days}
              onChange={(e) => setLeaveForm({ ...leaveForm, days: Number(e.target.value) })}
              className="mt-1 w-full rounded border border-slate-300 p-2"
              required
            />
          </label>
          <label className="md:col-span-2 text-sm font-medium text-slate-700">
            Justification / notes
            <textarea
              value={leaveForm.justification}
              onChange={(e) => setLeaveForm({ ...leaveForm, justification: e.target.value })}
              className="mt-1 w-full rounded border border-slate-300 p-2"
              rows={3}
              placeholder="Optional extra context sent to the backend for auditing"
            />
          </label>
          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={approving}
              className="rounded bg-blue-600 px-6 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {approving ? "Submitting..." : "Submit approval"}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-xl bg-white p-6 shadow">
        <header className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Salary data (ABAC demo)</h2>
            <p className="text-sm text-slate-600">
              Calls `/api/leave/salary` which is guarded by ABAC policies (department + clearance). Only Finance or
              approved users may decrypt the response.
            </p>
          </div>
          <button
            onClick={fetchSalary}
            disabled={loadingSalary}
            className="rounded bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {loadingSalary ? "Checking..." : "Fetch salary data"}
          </button>
        </header>
        <div className="mt-4 rounded border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          {salaryData ? salaryData : "No payroll information loaded yet."}
        </div>
      </section>
    </div>
  );
}

