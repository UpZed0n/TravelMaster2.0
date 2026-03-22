"use client";

import { cn } from "@/lib/utils";

export function MobileContainer({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "relative mx-auto flex h-[100dvh] w-full max-w-[450px] flex-col overflow-hidden bg-[#e8eaef] touch-pan-y",
        className
      )}
    >
      {children}
    </div>
  );
}
