// src/components/Layout.tsx
import React, { ReactNode } from "react";
import ThemeToggle from "./ThemeToggle";

type Props = { children: ReactNode };

export default function Layout({ children }: Props) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-900 text-white">
      <header className="bg-gray-800 p-4 shadow-md border-b border-gray-700">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Grok‑Beast Dashboard</h1>
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm text-gray-400">Sistema Activo</span>
            </div>
          </div>
        </div>
      </header>
      <main className="flex-1 p-4">{children}</main>
      <footer className="bg-gray-800 text-center p-2 text-sm border-t border-gray-700">
        © 2025 Grok‑Beast Team – MIT License | 
        <span className="ml-2 text-green-400">v2.0.0</span>
      </footer>
    </div>
  );
}
