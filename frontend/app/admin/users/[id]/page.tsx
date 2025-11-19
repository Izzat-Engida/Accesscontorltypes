"use client";

import axios from "axios";
import { useEffect, useState } from "react";

export default function ManageUser({ params }: any) {
  const { id } = params;
  const [user, setUser] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    axios.get(`http://localhost:5000/api/admin/users/${id}`, { withCredentials: true })
      .then(res => setUser(res.data.user))
      .catch(() => alert("Failed to load user"));
  }, []);

  const updateField = (field: string, value: any) => {
    setUser({ ...user, [field]: value });
  };

  const save = async () => {
    setSaving(true);
    try {
      await axios.put(
        `http://localhost:5000/api/admin/users/${id}`,
        {
          role: user.role,
          department: user.department,
          clearanceLevel: user.clearanceLevel,
          mfaEnabled: user.mfaEnabled,
          accountLocked: user.accountLocked
        },
        { withCredentials: true }
      );
      alert("Saved!");
    } catch (err:unknown) {
      alert("Failed to save");
    }
    setSaving(false);
  };

  if (!user) return <p>Loading...</p>;

  return (
    <div className="max-w-md mx-auto mt-10 space-y-4">
      <h1 className="text-xl font-bold">Manage {user.name}</h1>

      <p>Email: {user.email}</p>

      <label className="block">
        Role:
        <select
          value={user.role}
          onChange={(e) => updateField("role", e.target.value)}
          className="border p-2 w-full"
        >
          <option>Admin</option>
          <option>HR_Manager</option>
          <option>Finance_Manager</option>
          <option>Manager</option>
          <option>Employee</option>
        </select>
      </label>

      <label className="block">
        Department:
        <select
          value={user.department}
          onChange={(e) => updateField("department", e.target.value)}
          className="border p-2 w-full"
        >
          <option>HR</option>
          <option>Finance</option>
          <option>IT</option>
          <option>Sales</option>
          <option>General</option>
        </select>
      </label>

      <label className="block">
        Clearance Level:
        <select
          value={user.clearanceLevel}
          onChange={(e) => updateField("clearanceLevel", e.target.value)}
          className="border p-2 w-full"
        >
          <option>Public</option>
          <option>Internal</option>
          <option>Confidential</option>
          <option>TopSecret</option>
        </select>
      </label>

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={user.mfaEnabled}
          onChange={(e) => updateField("mfaEnabled", e.target.checked)}
        />
        MFA Required
      </label>

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={user.accountLocked}
          onChange={(e) => updateField("accountLocked", e.target.checked)}
        />
        Lock Account
      </label>

      <button
        onClick={save}
        disabled={saving}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        {saving ? "Saving..." : "Save Changes"}
      </button>
    </div>
  );
}
