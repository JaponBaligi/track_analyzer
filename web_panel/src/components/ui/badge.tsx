// web_panel/src/components/ui/badge.tsx

import * as React from "react";
import { cn } from "../../lib/utils";
import { useTheme } from "../../context/ThemeContext";

type BadgeVariant = "default" | "destructive" | "outline";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = "default",
  ...props
}) => {
  const { theme } = useTheme();

  const badgeVariants: Record<BadgeVariant, string> = {
    default:
      theme === "light"
        ? "bg-blue-500 text-white"
        : "bg-blue-400 text-gray-900",
    destructive:
      theme === "light"
        ? "bg-red-500 text-white"
        : "bg-red-400 text-gray-900",
    outline:
      theme === "light"
        ? "border border-gray-300 text-gray-800"
        : "border border-gray-600 text-gray-100",
  };

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
