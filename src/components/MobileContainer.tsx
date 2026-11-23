import React from "react";
import { cn } from "@/lib/utils";

interface MobileContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function MobileContainer({ children, className }: MobileContainerProps) {
  return (
    <div
      className={cn(
        "w-full max-w-md mx-auto min-h-screen bg-slate-50 shadow-xl pb-20 relative flex flex-col text-slate-900 border-x border-slate-200/60",
        className
      )}
    >
      {children}
    </div>
  );
}
