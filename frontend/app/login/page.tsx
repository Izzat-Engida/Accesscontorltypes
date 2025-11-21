"use client";

import { useForm } from "react-hook-form";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { toast } from "react-toastify";
import Link from "next/link";
import { signIn } from "next-auth/react";
import api from "../api";

declare global {
  interface Window {
    grecaptcha?: {
      getResponse: () => string | null;
      reset: () => void;
    };
  }
}

type FormData = {
  email: string;
  password: string;
};

const extractErrorMessage = (err: unknown, fallback: string) => {
  if (err && typeof err === "object" && "response" in err) {
    const response = (err as { response?: { data?: { message?: string } } }).response;
    if (response?.data?.message) {
      return response.data.message;
    }
  }
  return fallback;
};

export default function LoginPage() {
  const { register, handleSubmit } = useForm<FormData>();
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const recaptchaToken = window.grecaptcha?.getResponse();
      const res = await api.post("/auth/login", {
        ...data,
        recaptchaToken,
      });

      if (res.data.mfaRequired) {
        toast.info("MFA required. Check your email for the OTP.");
        router.push(`/mfa?userId=${res.data.userId}`);
        return;
      }

      const userPayload = {
        ...res.data.user,
        accessToken: res.data.accessToken,
        refreshToken: res.data.refreshToken,
      };
      const nextAuthResult = await signIn("credentials", {
        redirect: false,
        userJson: JSON.stringify(userPayload),
      });
      if (nextAuthResult?.error) {
        toast.error(nextAuthResult.error || "Unable to start session");
        return;
      }

      toast.success("Login successful!");
      router.push("/profile");
      window.grecaptcha?.reset();
    } catch (err: unknown) {
      toast.error(extractErrorMessage(err, "Login failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto grid max-w-5xl gap-8 pt-12 lg:grid-cols-2">
      <div className="rounded-3xl border border-white/20 bg-linear-to-br from-slate-900 via-slate-800 to-blue-900 p-8 text-white shadow-2xl">
        <p className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs uppercase tracking-widest">
          Zero trust entry
        </p>
        <h1 className="mt-6 text-3xl font-semibold">Secure Login Portal</h1>
        <p className="mt-3 text-sm text-slate-200">
          CAPTCHA, adaptive rules, MFA, and audit trails stand between attackers and your organizational data.
        </p>
        <ul className="mt-6 space-y-3 text-sm text-slate-200">
          <li className="flex items-start gap-3">
            <span className="mt-1 h-2 w-2 rounded-full bg-emerald-400"></span>
            RuBAC denies off-hours or out-of-geo logins automatically.
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-1 h-2 w-2 rounded-full bg-sky-400"></span>
            MFA codes are issued for high-risk users and logins flagged by policy.
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-1 h-2 w-2 rounded-full bg-amber-300"></span>
            Every attempt is preserved in encrypted audit logs for instant forensics.
          </li>
        </ul>
        <div className="mt-8 rounded-2xl bg-white/10 p-5 text-sm text-slate-100 backdrop-blur">
          <p className="font-semibold text-white">Need help?</p>
          <p className="mt-1">Finish your verification email, then return here to sign in.</p>
          <Link href="/verify-email" className="mt-3 inline-flex text-emerald-200 hover:underline">
            Resend verification &rarr;
          </Link>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white/80 p-8 shadow-xl backdrop-blur">
        <div className="mb-6 space-y-1">
          <p className="text-xs font-semibold uppercase text-slate-500">Account Login</p>
          <h2 className="text-2xl font-semibold text-slate-900">Welcome back</h2>
          <p className="text-sm text-slate-500">Sign in with your enterprise credentials to continue.</p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <label className="block text-sm font-medium text-slate-700">
            Email
            <input
              {...register("email")}
              type="email"
              placeholder="you@company.com"
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-white/70 p-3 text-base shadow-inner focus:border-slate-900 focus:outline-none"
              required
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Password
            <input
              {...register("password")}
              type="password"
              placeholder="••••••••"
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-white/70 p-3 text-base shadow-inner focus:border-slate-900 focus:outline-none"
              required
            />
          </label>
          <div className="rounded-2xl border border-dashed border-slate-300 p-3">
            <div className="g-recaptcha" data-sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}></div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-slate-900 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
          >
            {loading ? "Validating..." : "Login securely"}
          </button>
        </form>
        <div className="mt-6 text-center text-sm text-slate-600">
          <p>
            Need an account?{" "}
            <Link href="/register" className="font-semibold text-slate-900 hover:underline">
              Register
            </Link>
          </p>
        </div>
      </div>
      <Script src="https://www.google.com/recaptcha/api.js" strategy="afterInteractive" />
    </div>
  );
}
