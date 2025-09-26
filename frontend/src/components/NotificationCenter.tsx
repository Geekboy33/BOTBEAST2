// src/components/NotificationCenter.tsx
import React from 'react';
import { Notification } from '../hooks/useNotifications';

interface NotificationCenterProps {
  notifications: Notification[];
  onRemove: (id: string) => void;
}

export default function NotificationCenter({ notifications, onRemove }: NotificationCenterProps) {
  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`p-4 rounded-lg shadow-lg max-w-sm ${
            notification.type === 'success' ? 'bg-green-600' :
            notification.type === 'error' ? 'bg-red-600' :
            notification.type === 'warning' ? 'bg-yellow-600' :
            'bg-blue-600'
          } text-white`}
        >
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-semibold">{notification.title}</h4>
              <p className="text-sm opacity-90">{notification.message}</p>
            </div>
            <button
              onClick={() => onRemove(notification.id)}
              className="ml-2 text-white hover:text-gray-200"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}