// src/components/layout/Layout.tsx
import { ReactNode } from "react";
import Header from "../Header";

export default function Layout({ children }: { readonly children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 flex flex-col">
      {/* Header bileşeni */}
      <Header />

      {/* Ana içerik */}
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
