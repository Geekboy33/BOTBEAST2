// src/components/ModuleCard.tsx
import React from "react";
import StatusIndicator from "./StatusIndicator";

type Props = {
  title: string;
  description: string;
  enabled: boolean;
  status?: 'online' | 'offline' | 'warning' | 'error';
  onToggle?: () => void;
};

export default function ModuleCard({
  title,
  description,
  enabled,
  status = 'offline',
  onToggle,
}: Props) {
  const getStatus = () => {
    if (!enabled) return 'offline';
    return status;
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4 shadow-md hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <h2 className="text-lg font-semibold">{title}</h2>
          <StatusIndicator 
            status={getStatus()} 
            size="sm" 
            pulse={enabled && status === 'online'}
          />
        </div>
        {onToggle && (
          <label className="inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={enabled}
              onChange={onToggle}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-600 peer-checked:bg-green-600 rounded-full peer-checked:after:translate-x-full 
                after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
          </label>
        )}
      </div>
      <p className="mt-2 text-sm text-gray-400">{description}</p>
    </div>
  );
}
