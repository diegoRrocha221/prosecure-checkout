// src/components/ui/Notifications.tsx
import { FC } from 'react';
import { X, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';
import { Notification } from '../../hooks/useNotification';

interface NotificationsProps {
  notifications: Notification[];
  onRemove: (id: string) => void;
}

const getIcon = (type: Notification['type']) => {
  switch (type) {
    case 'success':
      return <CheckCircle className="w-5 h-5 text-white" />;
    case 'error':
      return <AlertCircle className="w-5 h-5 text-white" />;
    case 'warning':
      return <AlertTriangle className="w-5 h-5 text-white" />;
    case 'info':
      return <Info className="w-5 h-5 text-white" />;
  }
};

const getBackgroundColor = (type: Notification['type']) => {
  switch (type) {
    case 'success':
      return 'bg-green-500';
    case 'error':
      return 'bg-red-500';
    case 'warning':
      return 'bg-yellow-500';
    case 'info':
      return 'bg-blue-500';
  }
};

export const Notifications: FC<NotificationsProps> = ({ notifications, onRemove }) => {
  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`flex items-center p-4 rounded-lg shadow-lg text-white min-w-[300px] max-w-md transform transition-all duration-300 ease-in-out ${getBackgroundColor(notification.type)}`}
        >
          <div className="flex-shrink-0 mr-3">
            {getIcon(notification.type)}
          </div>
          <div className="flex-1 mr-2">
            <p className="text-sm font-medium">{notification.message}</p>
          </div>
          <button
            onClick={() => onRemove(notification.id)}
            className="flex-shrink-0 text-white hover:text-gray-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      ))}
    </div>
  );
};