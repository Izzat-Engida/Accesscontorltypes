"use client";

import { FormEvent, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import api from "../api";

interface Profile {
  _id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  clearanceLevel: string;
  mfaEnabled: boolean;
  employmentStatus?: string;
  emailVerified?: boolean;
}

export default function ProfilePage() {
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileForm, setProfileForm] = useState({ name: "", department: "" });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "" });
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  const fetchProfile = async () => {
    try {
      const res = await api.get("/auth/me");
      setUser(res.data.user);
      setProfileForm({
        name: res.data.user.name,
        department: res.data.user.department,
      });
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to fetch profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleProfileUpdate = async (e: FormEvent) => {
    e.preventDefault();
    try {
      setBusy(true);
      const res = await api.put("/auth/me", profileForm);
      toast.success(res.data.message || "Profile updated");
      fetchProfile();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Update failed");
    } finally {
      setBusy(false);
    }
  };

  const handlePasswordChange = async (e: FormEvent) => {
    e.preventDefault();
    try {
      setBusy(true);
      const res = await api.post("/auth/change-password", passwordForm);
      toast.success(res.data.message || "Password changed");
      setPasswordForm({ currentPassword: "", newPassword: "" });
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Password change failed");
    } finally {
      setBusy(false);
    }
  };

  const handleEnableMfa = async () => {
    try {
      setBusy(true);
      const res = await api.post("/auth/enable-mfa");
      toast.success(res.data.message || "MFA enabled");
      fetchProfile();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Unable to enable MFA");
    } finally {
      setBusy(false);
    }
  };

  const handleResendVerification = async () => {
    if (!user) return;
    try {
      setBusy(true);
      const res = await api.post("/auth/resend-verification", { email: user.email });
      toast.success(res.data.message || "Verification email sent");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Unable to send verification email");
    } finally {
      setBusy(false);
    }
  };

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
      await signOut({ redirect: false });
      toast.info("Logged out");
      setUser(null);
      router.push("/login");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Logout failed");
    }
  };

  if (loading) {
    return <div className="p-6">Loading profile...</div>;
  }

  if (!user) {
    return (
      <div className="p-6">
        <p className="text-sm text-slate-600">No profile data. Please login.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 p-6 md:grid-cols-2">
      <section className="rounded-xl bg-white p-6 shadow">
        <h2 className="text-xl font-semibold text-slate-900">Identity & Status</h2>
        <dl className="mt-4 space-y-2 text-sm text-slate-600">
          <div>
            <dt className="font-semibold text-slate-800">Name</dt>
            <dd>{user.name}</dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-800">Email</dt>
            <dd>
              {user.email}
              {!user.emailVerified && (
                <span className="ml-2 rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-800">Unverified</span>
              )}
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-800">Role • Department</dt>
            <dd>
              {user.role} • {user.department}
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-800">Clearance</dt>
            <dd>{user.clearanceLevel}</dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-800">Employment</dt>
            <dd>{user.employmentStatus || "Active"}</dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-800">MFA</dt>
            <dd>{user.mfaEnabled ? "Enabled" : "Disabled"}</dd>
          </div>
        </dl>
        <div className="mt-6 flex flex-wrap gap-3">
          {!user.emailVerified && (
            <button
              onClick={handleResendVerification}
              className="rounded bg-amber-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              disabled={busy}
            >
              Resend verification
            </button>
          )}
          {!user.mfaEnabled && user.role=='Admin' && (
            <button
              onClick={handleEnableMfa}
              className="rounded bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              disabled={busy}
            >
              Enable MFA
            </button>
          )}
          <button
            onClick={handleLogout}
            className="rounded bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-800"
          >
            Logout
          </button>
        </div>
      </section>

      <section className="space-y-6">
        <form onSubmit={handleProfileUpdate} className="rounded-xl bg-white p-6 shadow">
          <h3 className="text-lg font-semibold text-slate-900">Update profile</h3>
          <div className="mt-4 space-y-3">
            <label className="block text-sm font-medium text-slate-700">
              Name
              <input
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                className="mt-1 w-full rounded border border-slate-300 p-2"
                required
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Department
              <select
                value={profileForm.department}
                onChange={(e) => setProfileForm({ ...profileForm, department: e.target.value })}
                className="mt-1 w-full rounded border border-slate-300 p-2"
              >
                {["HR", "Finance", "IT", "Sales", "General"].map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <button
            type="submit"
            disabled={busy}
            className="mt-4 w-full rounded bg-blue-600 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            Save changes
          </button>
        </form>

        <form onSubmit={handlePasswordChange} className="rounded-xl bg-white p-6 shadow">
          <h3 className="text-lg font-semibold text-slate-900">Change password</h3>
          <div className="mt-4 space-y-3">
            <label className="block text-sm font-medium text-slate-700">
              Current password
              <input
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                className="mt-1 w-full rounded border border-slate-300 p-2"
                required
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              New password
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                className="mt-1 w-full rounded border border-slate-300 p-2"
                required
              />
            </label>
            <p className="text-xs text-slate-500">
              Must be at least 10 characters and include upper, lower, number and special character.
            </p>
          </div>
          <button
            type="submit"
            disabled={busy}
            className="mt-4 w-full rounded bg-slate-900 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            Update password
          </button>
        </form>
      </section>
    </div>
  );
}
