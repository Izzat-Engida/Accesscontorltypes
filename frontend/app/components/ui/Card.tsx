"use client";
import React from "react";

export default function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl bg-white p-6 shadow-card dark:bg-neutral-900 ${className}`}>
      {children}
    </div>
  );
}
