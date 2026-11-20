import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/utils/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#245b91] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none",
  {
    variants: {
      variant: {
        default:
          "bg-[#0b172a] text-white shadow-[0_8px_20px_-6px_rgba(11,23,42,0.35)] hover:bg-[#162542]",
        emerald:
          "bg-[#245b91] text-white shadow-[0_8px_20px_-6px_rgba(36,91,145,0.28)] hover:bg-[#1d4b78]",
        glass:
          "bg-white/85 text-[#0b172a] border border-white/95 shadow-sm hover:bg-white",
        outline:
          "border border-slate-300/80 bg-white/70 text-[#0b172a] hover:bg-white",
        secondary:
          "bg-slate-100/90 text-[#0b172a] hover:bg-slate-200/80",
        ghost:
          "text-slate-700 hover:bg-white/70 hover:text-[#0b172a]",
        link:
          "text-[#0e8a4f] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-6 py-2.5",
        sm: "h-9 px-4 text-xs",
        lg: "h-12 px-7 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
