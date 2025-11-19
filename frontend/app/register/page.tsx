'use client'
import {useForm} from 'react-hook-form'
import axios from 'axios'
import { useState } from 'react'
import Script from 'next/script'
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
    const {register, handleSubmit, formState: {errors}} = useForm<FormData>()
    const [loading, setLoading] = useState(false)
    const onSubmit=async(data:FormData)=>{
        setLoading(true)
        try{
            const recup = window.grecaptcha?.getResponse();
            if(!recup){
                alert("Please complete the reCAPTCHA")
                setLoading(false)
                return
            }
            const res = await axios.post(
  "http://localhost:5000/api/auth/register",
  {
    name: data.name,
    email: data.email,
    password: data.password,
    department: "General", 
    recaptachaToken: recup,
  },
  { headers: { "Content-Type": "application/json" } }
);

           alert(res.data.message || "Registration completed!");
            window.grecaptcha?.reset();
        }catch(err: unknown){
            const message = err instanceof Error ? err.message : String(err)
            alert("An error occurred: "+message)
        }
        setLoading(false)
    }
  return (
   <div className="max-w-md mx-auto mt-10 p-6 border rounded">
      <h1 className="text-xl font-bold mb-4">Register</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <input {...register("name")} placeholder="Name" required className="border p-2 w-full"/>
        <input {...register("email")} type="email" placeholder="Email" required className="border p-2 w-full"/>
        <input {...register("password")} type="password" placeholder="Password" required className="border p-2 w-full"/>
        
        <div className="g-recaptcha" data-sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}></div>

        <button type="submit" disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded">
          {loading ? "Registering..." : "Register"}
        </button>
      </form>
<Script
  src="https://www.google.com/recaptcha/api.js"
  strategy="afterInteractive"
/>
    </div>
  )
}

export default RegisterPage
