"use client";

import Link from "next/link";

interface LyraLogoProps {
  className?: string;
  variant?: "dark" | "light";
  size?: "sm" | "md" | "lg";
}

export function LyraLogo({
  className = "",
  variant = "dark",
  size = "md",
}: LyraLogoProps) {
  const sizeClasses = {
    sm: "text-lg gap-2",
    md: "text-xl gap-2.5",
    lg: "text-2xl gap-3",
  };

  const variantClasses = {
    dark: "text-slate-900",
    light: "text-white",
  };

  return (
    <Link
      href="/"
      className={`inline-flex items-center font-bold tracking-tight transition hover:opacity-80 ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
    >
      <div className="relative">
        {/* Lyra constellation icon */}
        <svg
          width="28"
          height="28"
          viewBox="0 0 28 28"
          fill="none"
          className="relative z-10"
        >
          {/* Main star pattern representing Lyra constellation */}
          <circle cx="14" cy="6" r="1.5" fill="currentColor" />
          <circle cx="8" cy="10" r="1" fill="currentColor" opacity="0.8" />
          <circle cx="20" cy="10" r="1" fill="currentColor" opacity="0.8" />
          <circle cx="6" cy="18" r="1" fill="currentColor" opacity="0.6" />
          <circle cx="22" cy="18" r="1" fill="currentColor" opacity="0.6" />
          <circle cx="14" cy="22" r="1.5" fill="currentColor" />

          {/* Connecting lines to form the harp shape */}
          <path
            d="M14 6 L8 10 L6 18 L14 22 L22 18 L20 10 Z"
            stroke="currentColor"
            strokeWidth="0.5"
            fill="none"
            opacity="0.4"
          />

          {/* Harp strings */}
          <line
            x1="10"
            y1="12"
            x2="18"
            y2="12"
            stroke="currentColor"
            strokeWidth="0.3"
            opacity="0.6"
          />
          <line
            x1="9"
            y1="14"
            x2="19"
            y2="14"
            stroke="currentColor"
            strokeWidth="0.3"
            opacity="0.5"
          />
          <line
            x1="8"
            y1="16"
            x2="20"
            y2="16"
            stroke="currentColor"
            strokeWidth="0.3"
            opacity="0.4"
          />
        </svg>

        {/* Subtle glow effect for dark variant */}
        {variant === "dark" && (
          <div className="absolute inset-0 rounded-full bg-sky-400/20 blur-sm" />
        )}
      </div>

      <span>Lyra</span>
    </Link>
  );
}
