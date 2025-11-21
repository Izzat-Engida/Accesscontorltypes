'use client'
import {useForm} from 'react-hook-form'
import { useState } from 'react'
import Script from 'next/script'
import { toast } from "react-toastify";
import api from "../api";
import Link from "next/link";

declare global {
    interface Window {
        grecaptcha?: {
            getResponse: () => string | null;
            reset: () => void;
        };
    }
}

type FormData={
    name:string,
    email:string,
    password:string
}
function RegisterPage() {
    const {register, handleSubmit} = useForm<FormData>()
    const [loading, setLoading] = useState(false)
    const onSubmit=async(data:FormData)=>{
        setLoading(true)
        try{
            const recup = window.grecaptcha?.getResponse();
            if(!recup){
                toast.error("Please complete the reCAPTCHA");
                setLoading(false)
                return
            }
            const res = await api.post("/auth/register",{
              name:data.name,
              email:data.email,
              password:data.password,
              department:"General",
              recaptachaToken:recup,
            });
            toast.success(res.data.message || "Registration completed! Verify your email.");
            window.grecaptcha?.reset();
        }catch(err: any){
            toast.error(err.response?.data?.message || "Registration failed");
        } finally {
            setLoading(false)
        }
    }
  return (
   <div className="mx-auto mt-10 max-w-md rounded-xl bg-white p-6 shadow">
      <h1 className="text-2xl font-semibold text-slate-900">Create Secure Account</h1>
      <p className="mt-2 text-sm text-slate-600">CAPTCHA, password policy and email verification enforced.</p>
      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
        <div>
          <label className="text-sm font-semibold text-slate-700">Full name</label>
          <input {...register("name")} placeholder="Jane Doe" required className="mt-1 w-full rounded border border-slate-300 p-2"/>
        </div>
        <div>
          <label className="text-sm font-semibold text-slate-700">Email</label>
          <input {...register("email")} type="email" placeholder="you@company.com" required className="mt-1 w-full rounded border border-slate-300 p-2"/>
        </div>
        <div>
          <label className="text-sm font-semibold text-slate-700">Password</label>
          <input {...register("password")} type="password" placeholder="Strong password" required className="mt-1 w-full rounded border border-slate-300 p-2"/>
          <p className="mt-1 text-xs text-slate-500">≥10 characters, upper + lower case, number, special symbol.</p>
        </div>
        
        <div className="g-recaptcha" data-sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}></div>

        <button type="submit" disabled={loading} className="w-full rounded bg-blue-600 py-2 font-semibold text-white disabled:opacity-60">
          {loading ? "Registering..." : "Register"}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-slate-600">
        Already verified?{" "}
        <Link href="/login" className="text-blue-600 hover:underline">
          Sign in
        </Link>
      </p>
<Script
  src="https://www.google.com/recaptcha/api.js"
  strategy="afterInteractive"
/>
    </div>
  )
}

export default RegisterPage
