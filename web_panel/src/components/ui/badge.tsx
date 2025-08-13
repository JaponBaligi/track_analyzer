// web_panel/src/components/ui/badge.tsx

import * as React from "react";
import { cn } from "../../lib/utils";

type BadgeVariant = "default" | "destructive" | "outline";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const badgeVariants: Record<BadgeVariant, string> = {
  default: "bg-blue-500 text-white",
  destructive: "bg-red-500 text-white",
  outline: "border border-gray-300 text-gray-800",
};

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = "default",
  ...props
}) => {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-sm font-medium",
        badgeVariants[variant],
        className
      )}
      {...props}
    />
  );
};
