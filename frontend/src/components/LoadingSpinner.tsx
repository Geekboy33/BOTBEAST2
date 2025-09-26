// src/components/LoadingSpinner.tsx
import React from 'react';

interface Props {
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'secondary' | 'white';
  text?: string;
}

export default function LoadingSpinner({ 
  size = 'md', 
  color = 'primary', 
  text 
}: Props) {
  const getSize = () => {
    switch (size) {
      case 'sm': return 'h-4 w-4';
      case 'md': return 'h-8 w-8';
      case 'lg': return 'h-12 w-12';
      default: return 'h-8 w-8';
    }
  };

  const getColor = () => {
    switch (color) {
      case 'primary': return 'border-green-500';
      case 'secondary': return 'border-blue-500';
      case 'white': return 'border-white';
      default: return 'border-green-500';
    }
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-2">
      <div 
        className={`${getSize()} ${getColor()} border-2 border-t-transparent rounded-full animate-spin`}
      />
      {text && (
        <p className="text-sm text-gray-400">{text}</p>
      )}
    </div>
  );
}




