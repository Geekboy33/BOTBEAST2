// src/components/ThemeToggle.tsx
import React from 'react';
import { useTheme } from '../hooks/useTheme';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
      title={`Cambiar a modo ${theme === 'dark' ? 'claro' : 'oscuro'}`}
    >
      {theme === 'dark' ? (
        <span className="text-yellow-400 text-xl">☀️</span>
      ) : (
        <span className="text-blue-400 text-xl">🌙</span>
      )}
    </button>
  );
}




