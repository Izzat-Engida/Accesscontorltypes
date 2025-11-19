'use client'

import { useState, useEffect } from "react";
import axios from "axios";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  clearanceLevel: string;
};

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [name, setName] = useState("");
  const [department, setDepartment] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      try {
        const res = await axios.get("http://localhost:5000/api/auth/me", { withCredentials: true });
        setUser(res.data.user);
        setName(res.data.user.name);
        setDepartment(res.data.user.department);
      } catch (err) {
        console.error(err);
        alert("Failed to fetch profile. Please login again.");
      }
      setLoading(false);
    };
    fetchUser();
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    try {
      const res = await axios.put("http://localhost:5000/api/auth/me", {
        name,
        department
      }, { withCredentials: true });

      alert(res.data.message || "Profile updated successfully");
      setUser(res.data.user);
    } catch (err) {
      const message = axios.isAxiosError(err) ? err.response?.data?.message : (err instanceof Error ? err.message : String(err));
      alert("Update failed: " + message);
    }
    setUpdating(false);
  };

  if (loading) return <div className="text-center mt-10">Loading...</div>;

  if (!user) return <div className="text-center mt-10">No user data</div>;

  return (
    <div className="max-w-md mx-auto mt-10 p-6 border rounded">
      <h1 className="text-xl font-bold mb-4">Profile</h1>
      <form onSubmit={handleUpdate} className="space-y-3">
        <div>
          <label className="block text-sm font-medium">Name:</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border p-2 w-full"
          />
        </div>
        <div>
          <label htmlFor="department" className="block text-sm font-medium">Department:</label>
          <select id="department" value={department} onChange={(e) => setDepartment(e.target.value)} className="border p-2 w-full" aria-label="Department">
            <option value="HR">HR</option>
            <option value="Finance">Finance</option>
            <option value="IT">IT</option>
            <option value="Sales">Sales</option>
            <option value="General">General</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">Email:</label>
          <input value={user.email} disabled className="border p-2 w-full bg-gray-100"/>
        </div>
        <div>
          <label className="block text-sm font-medium">Role:</label>
          <input value={user.role} disabled className="border p-2 w-full bg-gray-100"/>
        </div>
        <div>
          <label className="block text-sm font-medium">Clearance Level:</label>
          <input value={user.clearanceLevel} disabled className="border p-2 w-full bg-gray-100"/>
        </div>
        <button type="submit" disabled={updating} className="bg-blue-600 text-white px-4 py-2 rounded">
          {updating ? "Updating..." : "Update Profile"}
        </button>
      </form>
    </div>
  );
}
