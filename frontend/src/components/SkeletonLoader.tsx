// src/components/SkeletonLoader.tsx
import React from 'react';

interface Props {
  className?: string;
  lines?: number;
}

export default function SkeletonLoader({ className = '', lines = 1 }: Props) {
  return (
    <div className={`animate-pulse ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className="h-4 bg-gray-700 rounded mb-2"
          style={{
            width: `${Math.random() * 40 + 60}%`
          }}
        />
      ))}
    </div>
  );
}

// Componentes específicos de skeleton
export function ModuleCardSkeleton() {
  return (
    <div className="bg-gray-800 rounded-lg p-4 shadow-md">
      <div className="flex justify-between items-center mb-2">
        <SkeletonLoader className="w-32 h-6" />
        <div className="w-11 h-6 bg-gray-700 rounded-full" />
      </div>
      <SkeletonLoader lines={2} />
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="bg-gray-800 rounded-lg p-4 h-80">
      <SkeletonLoader className="w-48 h-6 mb-4" />
      <div className="h-64 bg-gray-700 rounded" />
    </div>
  );
}

export function LogSkeleton() {
  return (
    <div className="bg-gray-800 rounded-lg p-4 h-80 overflow-y-auto">
      {Array.from({ length: 10 }).map((_, index) => (
        <div key={index} className="mb-2">
          <SkeletonLoader lines={1} />
        </div>
      ))}
    </div>
  );
}




