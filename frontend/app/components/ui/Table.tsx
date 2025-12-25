"use client";

import React from "react";

export default function Table({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="min-w-full divide-y divide-neutral-200 text-sm">{children}</table>
    </div>
  );
}
