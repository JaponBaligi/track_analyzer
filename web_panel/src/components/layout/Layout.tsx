// src/components/layout/Layout.tsx
import { ReactNode } from "react";
import Header from "../Header";

interface LayoutProps {
  readonly children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col">
      {/* Header */}
      <Header />

      {/* Main content */}
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
