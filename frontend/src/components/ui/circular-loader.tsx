"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface CircularLoaderProps {
  label?: string;
  className?: string;
}

export function CircularLoader({ label = "Loading...", className }: CircularLoaderProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Simulate progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) return prev; // Hold at 95% until data is loaded (unmounted)
        const increment = Math.max(1, Math.floor(Math.random() * 15));
        return Math.min(95, prev + increment);
      });
    }, 150);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={cn("flex flex-col items-center justify-center gap-4 py-8", className)}>
      <div className="relative w-16 h-16">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="40"
            className="stroke-muted fill-none"
            strokeWidth="8"
          />
          <circle
            cx="50"
            cy="50"
            r="40"
            className="stroke-primary fill-none transition-all duration-300 ease-out"
            strokeWidth="8"
            strokeDasharray="251.2"
            strokeDashoffset={251.2 - (251.2 * progress) / 100}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-semibold text-foreground">{progress}%</span>
        </div>
      </div>
      {label && <p className="text-sm font-medium text-muted-foreground animate-pulse">{label}</p>}
    </div>
  );
}
