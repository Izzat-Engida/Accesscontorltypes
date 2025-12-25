"use client";

import React from "react";

export default function Input({ className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full rounded-xl border border-neutral-200 bg-transparent px-4 py-3 text-sm placeholder:opacity-70 focus:outline-none focus:ring-2 focus:ring-primary-400 ${className}`}
      {...props}
    />
  );
}
