// src/components/layout/Layout.tsx
import { ReactNode } from "react";
import { Link } from "react-router-dom";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-100 text-gray-900">
      <nav className="bg-white shadow px-6 py-4 flex justify-between items-center">
        <Link to="/" className="text-xl font-bold text-indigo-600">🎧 Metricify</Link>
        <div className="text-sm text-gray-500">Unplayable Track Monitor</div>
      </nav>
      <main className="p-6">{children}</main>
    </div>
  );
}
