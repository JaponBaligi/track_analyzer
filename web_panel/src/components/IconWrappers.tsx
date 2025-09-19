// web_panel/src/components/IconWrappers.tsx

import React from "react";
import { FiUserPlus, FiTrash2 } from "react-icons/fi";

type IconProps = { className?: string };

export const UserPlusIcon: React.FC<IconProps> = ({ className }) =>
  React.createElement(FiUserPlus as any, { className });

export const TrashIcon: React.FC<IconProps> = ({ className }) =>
  React.createElement(FiTrash2 as any, { className });
