import React, { useState, useEffect } from 'react';
import { Bell, CheckCheck, MessageSquare, UserPlus, FileText, ArrowRight } from 'lucide-react';
import { api } from '../services/api';
import { NotificationItem } from '../types';
import { useToast } from '../context/ToastContext';

interface NotificationsPageProps {
  onNavigate: (view: string, id?: string) => void;
}

export const NotificationsPage: React.FC<NotificationsPageProps> = ({ onNavigate }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { success, error } = useToast();

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.getNotifications();
      setNotifications(res);
    } catch (err: any) {
      error(err.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleMarkRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      success('All notifications marked as read');
    } catch (err: any) {
      error(err.message || 'Failed to mark notifications read');
    }
  };

  const handleItemClick = (notif: NotificationItem) => {
    handleMarkRead(notif.id);
    if (notif.link.includes('/document/')) {
      const parts = notif.link.split('/document/');
      onNavigate('document', parts[1]);
    } else if (notif.link.includes('/workspace/')) {
      const parts = notif.link.split('/workspace/');
      onNavigate('workspace', parts[1]);
    }
  };

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'mention':
        return <MessageSquare className="w-4 h-4 text-blue-500" />;
      case 'invite':
        return <UserPlus className="w-4 h-4 text-purple-500" />;
      case 'comment':
        return <MessageSquare className="w-4 h-4 text-emerald-500" />;
      default:
        return <FileText className="w-4 h-4 text-amber-500" />;
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 bg-white dark:bg-slate-900 max-w-4xl">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Bell className="w-6 h-6 text-blue-600" />
            <span>Notifications</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Stay updated with mentions, comments, and workspace invitations.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950 font-medium rounded-lg transition-colors border border-blue-200 dark:border-blue-900"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Mark all read</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs text-slate-400">Loading notifications...</div>
      ) : notifications.length === 0 ? (
        <div className="py-16 text-center text-slate-400 text-xs">
          No notifications yet. You're all caught up!
        </div>
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs">
          {notifications.map(notif => (
            <div
              key={notif.id}
              onClick={() => handleItemClick(notif)}
              className={`p-4 flex items-start justify-between gap-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors ${
                !notif.read ? 'bg-blue-50/40 dark:bg-blue-950/20' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 shrink-0 mt-0.5">
                  {getIcon(notif.type)}
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <span>{notif.title}</span>
                    {!notif.read && (
                      <span className="w-2 h-2 rounded-full bg-blue-600 inline-block" />
                    )}
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                    {notif.message}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    {new Date(notif.createdAt).toLocaleDateString()} at{' '}
                    {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>

              <ArrowRight className="w-4 h-4 text-slate-400 shrink-0 self-center" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
