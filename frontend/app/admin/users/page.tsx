"use client";
import axios from "axios";
import { useEffect, useState } from "react";

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    axios.get("http://localhost:5000/api/admin/users", { withCredentials: true })
      .then(res => setUsers(res.data.users))
      .catch(() => alert("Failed to load users"));
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">User Management</h1>
      <table className="w-full border">
        <thead>
          <tr className="bg-gray-200">
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>MFA</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {users.map((u) => (
            <tr key={u._id} className="border-b">
              <td>{u.name}</td>
              <td>{u.email}</td>
              <td>{u.role}</td>
              <td>{u.mfaEnabled ? "Enabled" : "Disabled"}</td>
              <td>
                <a
                  className="text-blue-600 underline"
                  href={`/admin/users/${u._id}`}
                >
                  Manage
                </a>
              </td>
            </tr>
          ))}
        </tbody>

      </table>
    </div>
  );
}
