"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Only render after hydration to avoid SSR mismatch
  useEffect(() => setMounted(true), []);
  if (!mounted) {
    // Reserve identical space so layout doesn't shift
    return <div className="h-9 w-9" aria-hidden />;
  }

  const isDark = theme === "dark";

  return (
    <Button
      size="icon"
      variant="ghost"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="relative h-9 w-9 text-muted-foreground hover:bg-accent/60 hover:text-foreground transition-colors"
    >
      {isDark ? (
        <Sun className="h-4 w-4 transition-transform duration-300 rotate-0 scale-100" />
      ) : (
        <Moon className="h-4 w-4 transition-transform duration-300 rotate-0 scale-100" />
      )}
    </Button>
  );
}
