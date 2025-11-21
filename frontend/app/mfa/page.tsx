"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-toastify";
import { signIn } from "next-auth/react";
import api from "../api";

const extractErrorMessage = (err: unknown, fallback: string) => {
  if (err && typeof err === "object" && "response" in err) {
    const response = (err as { response?: { data?: { message?: string } } }).response;
    if (response?.data?.message) {
      return response.data.message;
    }
  }
  return fallback;
};

export default function MFAPage() {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const params = useSearchParams();
  const userId = params.get("userId");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!userId) {
      toast.error("Missing user identifier.");
      return;
    }
    setLoading(true);

    try {
      const res = await api.post("/auth/verify-otp", { userId, otp });
      toast.success(res.data.message || "OTP verified successfully!");
      const nextAuthResult = await signIn("credentials", {
        redirect: false,
        userJson: JSON.stringify({
          ...res.data.user,
          accessToken: res.data.accessToken,
          refreshToken: res.data.refreshToken,
        }),
      });
      if (nextAuthResult?.error) {
        toast.error(nextAuthResult.error || "Unable to start session");
        return;
      }
      router.push("/profile");
    } catch (err: unknown) {
      toast.error(extractErrorMessage(err, "OTP verification failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto mt-12 max-w-lg rounded-3xl border border-slate-200 bg-white/80 p-8 shadow-xl backdrop-blur">
      <p className="text-xs font-semibold uppercase text-slate-500">Step 2 of 2</p>
      <h1 className="mt-2 text-3xl font-semibold text-slate-900">Multi-factor verification</h1>
      <p className="mt-2 text-sm text-slate-600">
        Enter the one-time password that was emailed to you. Tokens expire in 5 minutes.
      </p>
      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <input
          type="text"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          placeholder="6-digit OTP"
          maxLength={6}
          required
          className="w-full rounded-2xl border border-slate-200 bg-white/70 p-4 text-center text-2xl tracking-[0.6em] focus:border-slate-900 focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-2xl bg-slate-900 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
        >
          {loading ? "Verifying..." : "Verify OTP"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-500">
        Didn’t receive the code? Request another from the login page after 60 seconds.
      </p>
    </div>
  );
}
