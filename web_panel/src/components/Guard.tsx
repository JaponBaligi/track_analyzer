// src/components/Guard.tsx

import { Navigate } from "react-router-dom";
import { ReactNode } from "react";

interface Props {
  readonly children: ReactNode;
}

export default function Guard({ children }: Props) {
  const token = localStorage.getItem("token");
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
