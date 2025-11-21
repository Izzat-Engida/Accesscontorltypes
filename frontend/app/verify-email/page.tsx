
'use client'

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { toast } from "react-toastify";
import api from "../api";

const extractError = (err: unknown, fallback: string) => {
  if (err && typeof err === "object" && "response" in err) {
    const response = (err as { response?: { data?: { message?: string } } }).response;
    if (response?.data?.message) return response.data.message;
  }
  return fallback;
};

export default function VerifyEmailPage() {
  const params = useSearchParams();
  const [form, setForm] = useState({ email: "", code: "" });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const email = params.get("email") || "";
    const code = params.get("token") || "";
    setForm((prev) => ({
      email: email || prev.email,
      code: code || prev.code,
    }));
  }, [params]);

  const handleVerify = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.code) {
      toast.error("Email and verification code are required.");
      return;
    }
    setBusy(true);
    try {
      const res = await api.post("/auth/verify-email", { email: form.email, code: form.code });
      toast.success(res.data.message || "Email verified successfully. You can log in now.");
      setForm((prev) => ({ ...prev, code: "" }));
    } catch (err: unknown) {
      toast.error(extractError(err, "Verification failed"));
    } finally {
      setBusy(false);
    }
  };

  const handleResend = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.email) {
      toast.error("Enter an email address to resend verification.");
      return;
    }
    setBusy(true);
    try {
      const res = await api.post("/auth/resend-verification", { email: form.email });
      toast.success(res.data.message || "Verification code sent");
    } catch (err: unknown) {
      toast.error(extractError(err, "Unable to resend verification"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto mt-10 flex max-w-4xl flex-col gap-6 md:flex-row">
      <section className="flex-1 rounded-xl bg-white p-6 shadow">
        <h1 className="text-2xl font-semibold text-slate-900">Verify your email</h1>
        <p className="mt-2 text-sm text-slate-600">
          Enter the 6-digit code that we emailed you. Codes expire after 24 hours.
        </p>
        <form onSubmit={handleVerify} className="mt-6 space-y-4">
          <label className="block text-sm font-medium text-slate-700">
            Email address
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="mt-1 w-full rounded border border-slate-300 p-2"
              placeholder="you@company.com"
              required
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Verification code
            <input
              type="text"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              className="mt-1 w-full rounded border border-slate-300 p-2 text-center tracking-[0.4em]"
              placeholder="123456"
              maxLength={6}
              required
            />
          </label>
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded bg-blue-600 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            Verify email
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-600">
          Ready to sign in?{" "}
          <Link href="/login" className="text-blue-600 hover:underline">
            Go to login
          </Link>
        </p>
      </section>

      <section className="flex-1 rounded-xl bg-slate-900 p-6 text-white shadow">
        <h2 className="text-xl font-semibold">Need a new code?</h2>
        <p className="mt-2 text-sm text-slate-200">
          Resend a verification code to your inbox. Make sure to check spam folders as well.
        </p>
        <form onSubmit={handleResend} className="mt-6 space-y-4">
          <label className="block text-sm font-medium text-slate-200">
            Email address
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="mt-1 w-full rounded border border-white/20 bg-transparent p-2 text-white placeholder:text-slate-400"
              placeholder="you@company.com"
              required
            />
          </label>
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded bg-white/10 py-2 text-sm font-semibold text-white backdrop-blur disabled:opacity-60"
          >
            Resend verification
          </button>
        </form>
        <p className="mt-4 text-xs text-slate-400">
          We only send security emails to registered accounts. Check your spam folder if you don’t see a message.
        </p>
      </section>
    </div>
  );
}
