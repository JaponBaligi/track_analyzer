// web_panel/src/components/IconWrappers.tsx
import React from "react";
import { FiUserPlus, FiTrash2 } from "react-icons/fi";

type IconProps = { className?: string };

// Temaya uygun varsayılan renk ekledik: light için gri-800, dark için gri-200
export const UserPlusIcon: React.FC<IconProps> = ({ className }) =>
  React.createElement(FiUserPlus as any, {
    className: `text-gray-800 dark:text-gray-200 ${className || ""}`,
  });

export const TrashIcon: React.FC<IconProps> = ({ className }) =>
  React.createElement(FiTrash2 as any, {
    className: `text-gray-800 dark:text-gray-200 ${className || ""}`,
  });
