// src/components/Guard.tsx

import { ReactNode } from "react";
import { Navigate } from "react-router-dom";

interface Props {
  readonly children: ReactNode;
}

export default function Guard({ children }: Props) {
  const token = localStorage.getItem("token");

  if (!token) return <Navigate to="/login" replace />;

  return <>{children}</>;
}
