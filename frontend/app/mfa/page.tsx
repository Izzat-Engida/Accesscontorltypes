'use client'

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";

export default function MFAPage() {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const params = useSearchParams();
  const userId = params.get("userId"); // comes from login redirect

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await axios.post("http://localhost:5000/api/auth/mfa-verify", {
        userId,
        otp
      }, { withCredentials: true });

      alert(res.data.message || "OTP verified successfully!");
      router.push("/profile"); 
    } catch (err: unknown) {
      const message = axios.isAxiosError(err) ? err.response?.data?.message : (err instanceof Error ? err.message : String(err));
      alert("OTP verification failed: " + message);
    }

    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 border rounded">
      <h1 className="text-xl font-bold mb-4">MFA Verification</h1>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="text"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          placeholder="Enter OTP"
          required
          className="border p-2 w-full"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          {loading ? "Verifying..." : "Verify OTP"}
        </button>
      </form>
    </div>
  );
}
