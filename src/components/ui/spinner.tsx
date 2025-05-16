import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "../../lib/utils";

const spinnerVariants = cva("flex-col items-center justify-center", {
  variants: {
    show: {
      true: "flex",
      false: "hidden",
    },
  },
  defaultVariants: {
    show: true,
  },
});

const loaderVariants = cva("animate-spin", {
  variants: {
    size: {
      small: "size-6",
      medium: "size-8",
      large: "size-12",
    },
    color: {
      white: "text-white",
      primary: "text-primary",
      hero: "text-[#FDAB04]",
    },
  },
  defaultVariants: {
    size: "medium",
    color: "primary",
  },
});

interface SpinnerContentProps
  extends VariantProps<typeof spinnerVariants>,
    VariantProps<typeof loaderVariants> {
  className?: string;
  children?: React.ReactNode;
}

export function Spinner({
  size,
  show,
  color = "white",
  children,
  className,
}: SpinnerContentProps) {
  return (
    <span className={spinnerVariants({ show })}>
      <Loader2 className={cn(loaderVariants({ size, color }), className)} />
      {children}
    </span>
  );
}
