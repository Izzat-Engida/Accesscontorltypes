"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import api from "../../api";
import { toast } from "react-toastify";

interface LeaveRequest {
  _id: string;
  user: { name: string; email: string; department: string };
  type: string;
  startDate: string;
  endDate: string;
  days: number;
  reason?: string;
  status: "pending" | "approved" | "rejected";
}

export default function LeaveApprovalsPage() {
  const { data: session } = useSession();
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPending = async () => {
      try {
        const res = await api.get("/leave/pending");
        setLeaves(res.data.pending || []);
      } catch (err: any) {
        toast.error(err.response?.data?.message || "Failed to load pending leaves");
      } finally {
        setLoading(false);
      }
    };

    if (session && ["HR_Manager", "Manager", "Admin"].includes(session.user?.role || "")) {
      fetchPending();
    }
  }, [session]);

  const handleApprove = async (id: string) => {
    try {
      await api.post(`/leave/approve/${id}`);
      toast.success("Leave approved");
      setLeaves(leaves.filter(l => l._id !== id));
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Approval failed (policy blocked?)");
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt("Reason for rejection:");
    if (!reason) return;
    try {
      await api.post(`/leave/reject/${id}`, { reason });
      toast.success("Leave rejected");
      setLeaves(leaves.filter(l => l._id !== id));
    } catch (err: any) {
      toast.error("Rejection failed");
    }
  };

  if (!session) return <div className="p-8">Please sign in</div>;

  if (!["HR_Manager", "Manager", "Admin"].includes(session.user?.role || "")) {
    return <div className="p-8 text-center text-red-600">Access denied — HR/Manager only</div>;
  }

  if (loading) return <div className="p-8 text-center">Loading pending leaves...</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-slate-900 mb-8">Pending Leave Approvals</h1>

      {leaves.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-12 text-center">
          <p className="text-slate-600 text-lg">No pending leave requests</p>
        </div>
      ) : (
        <div className="space-y-6">
          {leaves.map((leave) => (
            <div key={leave._id} className="bg-white rounded-xl shadow border border-slate-200 p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-slate-900">{leave.user.name}</h3>
                  <p className="text-sm text-slate-600">{leave.user.email} • {leave.user.department}</p>
                  <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Type:</span> {leave.type}
                    </div>
                    <div>
                      <span className="font-medium">Days:</span> {leave.days}
                    </div>
                    <div>
                      <span className="font-medium">From:</span> {format(new Date(leave.startDate), "PPP")}
                    </div>
                    <div>
                      <span className="font-medium">To:</span> {format(new Date(leave.endDate), "PPP")}
                    </div>
                  </div>
                  {leave.reason && (
                    <div className="mt-4">
                      <span className="font-medium">Reason:</span>
                      <p className="text-slate-700 mt-1">{leave.reason}</p>
                    </div>
                  )}
                </div>
                <div className="flex gap-3 ml-6">
                  <button
                    onClick={() => handleApprove(leave._id)}
                    className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(leave._id)}
                    className="bg-red-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-red-700"
                  >
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}