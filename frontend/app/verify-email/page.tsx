
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
  const [verifyForm, setVerifyForm] = useState({ userId: "", token: "" });
  const [resendEmail, setResendEmail] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const userId = params.get("id") || "";
    const token = params.get("token") || "";
    if (userId || token) {
      setVerifyForm({ userId, token });
    }
  }, [params]);

  const handleVerify = async (e: FormEvent) => {
    e.preventDefault();
    if (!verifyForm.userId || !verifyForm.token) {
      toast.error("Both user ID and token are required.");
      return;
    }
    setBusy(true);
    try {
      const res = await api.post("/auth/verify-email", verifyForm);
      toast.success(res.data.message || "Email verified successfully. You can log in now.");
    } catch (err: unknown) {
      toast.error(extractError(err, "Verification failed"));
    } finally {
      setBusy(false);
    }
  };

  const handleResend = async (e: FormEvent) => {
    e.preventDefault();
    if (!resendEmail) {
      toast.error("Enter an email address to resend verification.");
      return;
    }
    setBusy(true);
    try {
      const res = await api.post("/auth/resend-verification", { email: resendEmail });
      toast.success(res.data.message || "Verification email sent");
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
          Paste the verification token from your inbox. Tokens expire after 24 hours.
        </p>
        <form onSubmit={handleVerify} className="mt-6 space-y-4">
          <label className="block text-sm font-medium text-slate-700">
            User ID
            <input
              value={verifyForm.userId}
              onChange={(e) => setVerifyForm({ ...verifyForm, userId: e.target.value })}
              className="mt-1 w-full rounded border border-slate-300 p-2"
              placeholder="64c0..."
              required
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Verification token
            <textarea
              value={verifyForm.token}
              onChange={(e) => setVerifyForm({ ...verifyForm, token: e.target.value })}
              className="mt-1 w-full rounded border border-slate-300 p-2"
              rows={3}
              placeholder="Paste the token from the verification email"
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
        <h2 className="text-xl font-semibold">Resend verification link</h2>
        <p className="mt-2 text-sm text-slate-200">
          If your token expired or you never received the message, send yourself another verification email.
        </p>
        <form onSubmit={handleResend} className="mt-6 space-y-4">
          <label className="block text-sm font-medium text-slate-200">
            Email address
            <input
              type="email"
              value={resendEmail}
              onChange={(e) => setResendEmail(e.target.value)}
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
