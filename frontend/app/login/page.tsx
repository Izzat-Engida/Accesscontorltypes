'use client'

import { useForm } from "react-hook-form";
import axios from "axios";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";

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

export default function LoginPage() {
  const { register, handleSubmit } = useForm<FormData>();
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      
      const recaptchaToken = window.grecaptcha?.getResponse();

      const res = await axios.post('http://localhost:5000/api/auth/login', {
        ...data,
        recaptchaToken
      }, { withCredentials: true }); 

      
      if (res.data.mfaRequired) {
        router.push(`/mfa?userId=${res.data.userId}`);
        return;
      }

      alert("Login successful!");
      router.push("/profile"); 

      window.grecaptcha?.reset();
    } catch (err: unknown) {
      const message = axios.isAxiosError(err) ? err.response?.data?.message : (err instanceof Error ? err.message : String(err));
      alert("Login failed: " + message);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 border rounded">
      <h1 className="text-xl font-bold mb-4">Login</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <input {...register("email")} type="email" placeholder="Email" required className="border p-2 w-full"/>
        <input {...register("password")} type="password" placeholder="Password" required className="border p-2 w-full"/>

    
        <div className="g-recaptcha" data-sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}></div>

        <button type="submit" disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded">
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>

      <Script
        src="https://www.google.com/recaptcha/api.js"
        strategy="afterInteractive"
      />
    </div>
  );
}
