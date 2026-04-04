'use client';

import { create } from 'zustand';

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

interface NotificationState {
  notifications: Notification[];
  pushPermission: NotificationPermission | 'default';
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  setPushPermission: (permission: NotificationPermission) => void;
}

let notificationId = 0;

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  pushPermission: 'default',
  addNotification: (notification) => {
    const id = `notification-${++notificationId}`;
    set((state) => ({
      notifications: [...state.notifications, { ...notification, id }],
    }));
    const duration = notification.duration ?? 5000;
    if (duration > 0) {
      setTimeout(() => {
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        }));
      }, duration);
    }
  },
  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),
  clearAll: () => set({ notifications: [] }),
  setPushPermission: (pushPermission) => set({ pushPermission }),
}));
