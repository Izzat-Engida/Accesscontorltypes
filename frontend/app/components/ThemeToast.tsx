"use client";

import { ToastContainer } from "react-toastify";
import { useEffect, useState } from "react";

export default function ThemeToast() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark") setTheme("dark");
    else {
      const prefersDark = typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
      setTheme(prefersDark ? "dark" : "light");
    }
  }, []);
  return <ToastContainer position="top-right" theme={theme} />;
}
