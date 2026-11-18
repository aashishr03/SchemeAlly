import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/utils/cn";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "bg-[#0b172a] text-white",
        emerald: "bg-[#0e8a4f] text-white shadow-xs",
        emeraldSoft: "bg-[#e6f6ee] text-[#0b7241] border border-[#b7e7ce]",
        amberSoft: "bg-amber-50 text-amber-800 border border-amber-200/80",
        glass: "glass-pill text-slate-800",
        outline: "border border-slate-300/80 bg-white/80 text-slate-700",
      },
    },
    defaultVariants: {
      variant: "glass",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
