"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import api from "../../api";

interface User {
  _id: string;
  name: string;
  email: string;
  role: "Admin" | "HR_Manager" | "Finance_Manager" | "Manager" | "Employee";
  department: "HR" | "Finance" | "IT" | "Sales" | "General";
  clearanceLevel: "Public" | "Internal" | "Confidential" | "TopSecret";
  mfaEnabled: boolean;
  employmentStatus: "Active" | "Inactive";
  accountLocked: boolean;
  emailVerified: boolean;
}

const roles: User["role"][] = ["Admin", "HR_Manager", "Finance_Manager", "Manager", "Employee"];
const departments: User["department"][] = ["HR", "Finance", "IT", "Sales", "General"];
const clearances: User["clearanceLevel"][] = ["Public", "Internal", "Confidential", "TopSecret"];

const AdminDashboard: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      const res = await api.get<{ users: User[] }>("/admin/users");
      setUsers(res.data.users);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const updateRole = async (id: string, role: User["role"]) => {
    try {
      const res = await api.patch(`/admin/users/${id}/role`, { role });
      toast.success(res.data.message || "Role updated");
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Unable to update role");
    }
  };

  const updateAttributes = async (id: string, payload: Partial<User>) => {
    try {
      const res = await api.patch(`/admin/users/${id}/attributes`, payload);
      toast.success(res.data.message || "Attributes updated");
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Update failed");
    }
  };

  const toggleMfa = async (id: string, enable: boolean) => {
    try {
      const endpoint = enable ? "enable-mfa" : "disable-mfa";
      const res = await api.patch(`/admin/users/${id}/${endpoint}`);
      toast.success(res.data.message || "MFA updated");
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Unable to toggle MFA");
    }
  };

  const deleteUser = async (id: string) => {
    if (!window.confirm("Are you sure?")) return;
    try {
      const res = await api.delete(`/admin/users/${id}`);
      toast.success(res.data.message || "User deleted");
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Delete failed");
    }
  };

  if (loading) return <div className="p-4 text-sm text-slate-600">Loading users...</div>;

  return (
    <div className="space-y-6 p-6">
      <header className="rounded-xl bg-white p-6 shadow">
        <h1 className="text-2xl font-bold text-slate-900">Account management</h1>
        <p className="mt-2 text-sm text-slate-600">
          Manage roles, departments, clearances, MFA, lockouts, and employment state. Every action is logged by the backend
          admin APIs.
        </p>
      </header>

      <section className="rounded-xl bg-white p-4 shadow">
        <div className="overflow-x-auto">
          <table className="w-full table-auto text-sm">
            <thead>
              <tr className="bg-slate-100 text-left text-xs uppercase tracking-wider text-slate-600">
                <th className="px-3 py-2">User</th>
                <th className="px-3 py-2">Role</th>
                <th className="px-3 py-2">Department</th>
                <th className="px-3 py-2">Clearance</th>
                <th className="px-3 py-2">Employment</th>
                <th className="px-3 py-2">Lock</th>
                <th className="px-3 py-2">MFA</th>
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user._id} className="border-t">
                  <td className="px-3 py-3">
                    <p className="font-semibold text-slate-900">{user.name}</p>
                    <p className="text-xs text-slate-500">{user.email}</p>
                  </td>
                  <td className="px-3 py-3">
                    <select
                      value={user.role}
                      onChange={(e) => updateRole(user._id, e.target.value as User["role"])}
                      className="w-full rounded border border-slate-200 p-2 text-sm"
                    >
                      {roles.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-3">
                    <select
                      value={user.department}
                      onChange={(e) => updateAttributes(user._id, { department: e.target.value as User["department"] })}
                      className="w-full rounded border border-slate-200 p-2 text-sm"
                    >
                      {departments.map((dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-3">
                    <select
                      value={user.clearanceLevel}
                      onChange={(e) =>
                        updateAttributes(user._id, { clearanceLevel: e.target.value as User["clearanceLevel"] })
                      }
                      className="w-full rounded border border-slate-200 p-2 text-sm"
                    >
                      {clearances.map((clear) => (
                        <option key={clear} value={clear}>
                          {clear}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-3">
                    <select
                      value={user.employmentStatus}
                      onChange={(e) =>
                        updateAttributes(user._id, { employmentStatus: e.target.value as User["employmentStatus"] })
                      }
                      className="w-full rounded border border-slate-200 p-2 text-sm"
                    >
                      {["Active", "Inactive"].map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-3">
                    <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
                      <input
                        type="checkbox"
                        checked={user.accountLocked}
                        onChange={() => updateAttributes(user._id, { accountLocked: !user.accountLocked })}
                      />
                      {user.accountLocked ? "Locked" : "Unlocked"}
                    </label>
                  </td>
                  <td className="px-3 py-3">
                    <button
                      onClick={() => toggleMfa(user._id, !user.mfaEnabled)}
                      className={`w-full rounded px-3 py-1 text-xs font-semibold ${
                        user.mfaEnabled ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {user.mfaEnabled ? "Disable MFA" : "Enable MFA"}
                    </button>
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className={`rounded px-2 py-1 text-xs font-semibold ${
                        user.emailVerified ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {user.emailVerified ? "Verified" : "Pending"}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <button
                      onClick={() => deleteUser(user._id)}
                      className="rounded bg-red-500 px-3 py-1 text-xs font-semibold text-white"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default AdminDashboard;
