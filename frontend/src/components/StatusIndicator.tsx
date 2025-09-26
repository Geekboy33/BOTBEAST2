// src/components/StatusIndicator.tsx
import React from 'react';

interface Props {
  status: 'online' | 'offline' | 'warning' | 'error';
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  pulse?: boolean;
}

export default function StatusIndicator({ 
  status, 
  size = 'md', 
  label, 
  pulse = false 
}: Props) {
  const getColor = () => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'offline': return 'bg-gray-500';
      case 'warning': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getSize = () => {
    switch (size) {
      case 'sm': return 'w-2 h-2';
      case 'md': return 'w-3 h-3';
      case 'lg': return 'w-4 h-4';
      default: return 'w-3 h-3';
    }
  };

  const getPulseClass = () => {
    if (!pulse) return '';
    switch (status) {
      case 'online': return 'animate-pulse';
      case 'warning': return 'animate-pulse';
      default: return '';
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <div 
        className={`${getSize()} ${getColor()} rounded-full ${getPulseClass()}`}
        title={`Estado: ${status}`}
      />
      {label && (
        <span className="text-sm text-gray-400 capitalize">
          {label}
        </span>
      )}
    </div>
  );
}




