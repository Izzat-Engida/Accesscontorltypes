"use client";

import { FormEvent, useState } from "react";
import { toast } from "react-toastify";
import api from "../../api";

export default function LeaveRequestPage() {
  const [form, setForm] = useState({
    type: "annual" as "annual" | "sick" | "maternity" | "unpaid" | "other",
    startDate: "",
    endDate: "",
    days: 1,
    reason: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!form.startDate || !form.endDate || form.days < 1) {
      toast.error("Please fill all required fields.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post("/leave", form); // Calls POST /api/leave
      toast.success(res.data.message || "Leave request submitted successfully!");
      setForm({
        type: "annual",
        startDate: "",
        endDate: "",
        days: 1,
        reason: "",
      });
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to submit request");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="rounded-2xl bg-white p-8 shadow-lg">
        <h1 className="mb-8 text-3xl font-bold text-slate-900">Submit Leave Request</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Leave Type</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as any })}
              className="w-full rounded-lg border border-slate-300 px-4 py-3 focus:border-blue-500 focus:outline-none"
              required
            >
              <option value="annual">Annual Leave</option>
              <option value="sick">Sick Leave</option>
              <option value="maternity">Maternity / Paternity Leave</option>
              <option value="unpaid">Unpaid Leave</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Start Date</label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-4 py-3 focus:border-blue-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">End Date</label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-4 py-3 focus:border-blue-500 focus:outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Number of Days</label>
            <input
              type="number"
              min="1"
              max="90"
              value={form.days}
              onChange={(e) => setForm({ ...form, days: Number(e.target.value) || 1 })}
              className="w-full rounded-lg border border-slate-300 px-4 py-3 focus:border-blue-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Reason (Optional)</label>
            <textarea
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              rows={4}
              className="w-full rounded-lg border border-slate-300 px-4 py-3 focus:border-blue-500 focus:outline-none"
              placeholder="Brief explanation for your leave"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 py-4 text-lg font-semibold text-white shadow-lg hover:shadow-xl disabled:opacity-60 transition"
          >
            {submitting ? "Submitting..." : "Submit Leave Request"}
          </button>
        </form>
      </div>
    </div>
  );
}