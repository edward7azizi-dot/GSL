import React from "react";
import { cn } from "@/lib/utils";

export default function UnreadBadge({ count, className, floating = false }) {
  if (!count || count <= 0) return null;
  const label = count > 99 ? "99+" : String(count);
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full bg-red-600 text-white font-semibold leading-none",
        floating
          ? "absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] text-[10px] px-1 ring-2 ring-card"
          : "min-w-[20px] h-5 text-[11px] px-1.5",
        className
      )}
      aria-label={`${count} unread`}
    >
      {label}
    </span>
  );
}
