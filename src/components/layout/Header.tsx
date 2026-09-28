import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Bell,
  Sun,
  Moon,
  Users,
  ChevronDown,
  LogOut,
  User as UserIcon,
  Check,
  CheckCheck,
  Zap,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useTheme } from '../../context/ThemeContext';
import { Avatar } from '../common/Avatar';
import { api } from '../../services/api';
import { NotificationItem, Workspace } from '../../types';

interface HeaderProps {
  currentWorkspace: Workspace | null;
  workspaces: Workspace[];
  onSelectWorkspace: (wsId: string) => void;
  onOpenSearch: () => void;
  onNavigate: (view: string, id?: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentWorkspace,
  workspaces,
  onSelectWorkspace,
  onOpenSearch,
  onNavigate,
}) => {
  const { user, logout, switchUser } = useAuth();
  const { activePeers, isConnected } = useSocket();
  const { theme, toggleTheme } = useTheme();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showWorkspaceMenu, setShowWorkspaceMenu] = useState(false);
  const [showDemoMenu, setShowDemoMenu] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<HTMLDivElement>(null);
  const demoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadNotifications() {
      if (!user) return;
      try {
        const notifs = await api.getNotifications();
        setNotifications(notifs);
      } catch (err) {
        console.error('Failed to load notifications:', err);
      }
    }
    loadNotifications();

    const interval = setInterval(loadNotifications, 15000);
    return () => clearInterval(interval);
  }, [user]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifMenu(false);
      }
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
      if (wsRef.current && !wsRef.current.contains(e.target as Node)) {
        setShowWorkspaceMenu(false);
      }
      if (demoRef.current && !demoRef.current.contains(e.target as Node)) {
        setShowDemoMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const handleNotificationClick = async (notif: NotificationItem) => {
    if (!notif.read) {
      try {
        await api.markNotificationRead(notif.id);
        setNotifications(prev => prev.map(n => (n.id === notif.id ? { ...n, read: true } : n)));
      } catch (err) {
        console.error(err);
      }
    }
    setShowNotifMenu(false);
    // Parse link if internal
    if (notif.link.includes('/document/')) {
      const parts = notif.link.split('/document/');
      onNavigate('document', parts[1]);
    } else if (notif.link.includes('/workspace/')) {
      const parts = notif.link.split('/workspace/');
      onNavigate('workspace', parts[1]);
    }
  };

  const demoAccounts = [
    { name: 'Alice Chen', email: 'alice@collab.io', role: 'Owner', color: '#2563eb' },
    { name: 'Bob Miller', email: 'bob@collab.io', role: 'Editor', color: '#059669' },
    { name: 'Sarah Connor', email: 'sarah@collab.io', role: 'Viewer', color: '#db2777' },
  ];

  return (
    <header className="h-14 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 flex items-center justify-between z-30 shrink-0">
      {/* Left: Workspace Selector */}
      <div className="flex items-center gap-3">
        <div className="relative" ref={wsRef}>
          <button
            onClick={() => setShowWorkspaceMenu(prev => !prev)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 font-semibold text-sm transition-colors"
          >
            <span className="text-lg">{currentWorkspace?.icon || '🚀'}</span>
            <span className="max-w-[160px] truncate">{currentWorkspace?.name || 'Workspace'}</span>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </button>

          {showWorkspaceMenu && (
            <div className="absolute left-0 mt-1 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95">
              <div className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Workspaces
              </div>
              {workspaces.map(ws => (
                <button
                  key={ws.id}
                  onClick={() => {
                    onSelectWorkspace(ws.id);
                    setShowWorkspaceMenu(false);
                  }}
                  className={`w-full text-left px-3 py-2 flex items-center justify-between text-sm hover:bg-slate-100 dark:hover:bg-slate-800 ${
                    ws.id === currentWorkspace?.id ? 'text-blue-600 dark:text-blue-400 font-semibold' : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span>{ws.icon || '📁'}</span>
                    <span className="truncate">{ws.name}</span>
                  </div>
                  {ws.id === currentWorkspace?.id && <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
                </button>
              ))}
              <div className="border-t border-slate-100 dark:border-slate-800 mt-1 pt-1">
                <button
                  onClick={() => {
                    setShowWorkspaceMenu(false);
                    onNavigate('dashboard');
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs text-blue-600 dark:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  + View All Workspaces / Create
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Real-time Connection status pill */}
        <div
          className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${
            isConnected
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
              : 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300'
          }`}
          title={isConnected ? 'Real-Time WebSocket Connected' : 'Connecting to real-time engine...'}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-ping' : 'bg-amber-500'}`} />
          <span className="hidden sm:inline">{isConnected ? 'Live' : 'Syncing'}</span>
        </div>
      </div>

      {/* Center: Global Search Bar */}
      <button
        onClick={onOpenSearch}
        className="flex items-center gap-2 w-48 sm:w-80 px-3 py-1.5 text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/70 dark:hover:bg-slate-700/70 rounded-lg transition-colors border border-transparent dark:border-slate-700/50"
      >
        <Search className="w-3.5 h-3.5 text-slate-400" />
        <span className="flex-1 text-left truncate">Search workspace content...</span>
        <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-slate-400 shadow-2xs">
          ⌘K
        </kbd>
      </button>

      {/* Right: Presence Avatars + Demo Switcher + Notifications + Profile */}
      <div className="flex items-center gap-2.5">
        {/* Active Document Peers */}
        {activePeers.length > 0 && (
          <div className="flex items-center -space-x-1.5 mr-1" title={`${activePeers.length} collaborators in document`}>
            {activePeers.slice(0, 3).map(peer => (
              <Avatar
                key={peer.userId}
                name={peer.name}
                avatar={peer.avatar}
                color={peer.color}
                size="sm"
                status={peer.status}
              />
            ))}
            {activePeers.length > 3 && (
              <span className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-[10px] font-semibold flex items-center justify-center border-2 border-white dark:border-slate-900">
                +{activePeers.length - 3}
              </span>
            )}
          </div>
        )}

        {/* 1-Click Test User Switcher */}
        <div className="relative" ref={demoRef}>
          <button
            onClick={() => setShowDemoMenu(prev => !prev)}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800 rounded-lg transition-colors"
            title="Switch accounts to test real-time collaboration with multiple users"
          >
            <Zap className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span className="hidden md:inline">Simulate User:</span>
            <span className="font-semibold">{user?.name.split(' ')[0]}</span>
            <ChevronDown className="w-3 h-3 text-indigo-500" />
          </button>

          {showDemoMenu && (
            <div className="absolute right-0 mt-1 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl py-2 z-50">
              <div className="px-3 pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                  Switch User (Real-Time Testing)
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Instant switch to verify presence, colored cursors, and role permissions.
                </div>
              </div>
              <div className="py-1">
                {demoAccounts.map(account => (
                  <button
                    key={account.email}
                    onClick={async () => {
                      setShowDemoMenu(false);
                      await switchUser(account.email);
                    }}
                    className={`w-full text-left px-3 py-2 flex items-center justify-between text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
                      user?.email === account.email ? 'bg-indigo-50/50 dark:bg-indigo-950/40 font-semibold' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Avatar name={account.name} color={account.color} size="sm" />
                      <div>
                        <div className="text-slate-800 dark:text-slate-200 font-medium">{account.name}</div>
                        <div className="text-[10px] text-slate-400">{account.role}</div>
                      </div>
                    </div>
                    {user?.email === account.email && (
                      <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">Active</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Notifications Popover */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifMenu(prev => !prev)}
            className="relative p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-600 rounded-full ring-2 ring-white dark:ring-slate-900" />
            )}
          </button>

          {showNotifMenu && (
            <div className="absolute right-0 mt-1 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl overflow-hidden z-50">
              <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                  Notifications {unreadCount > 0 && `(${unreadCount})`}
                </span>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                  >
                    <CheckCheck className="w-3 h-3" /> Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    No notifications yet.
                  </div>
                ) : (
                  notifications.slice(0, 6).map(notif => (
                    <div
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif)}
                      className={`p-3 text-xs cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${
                        !notif.read ? 'bg-blue-50/40 dark:bg-blue-950/20 font-medium' : ''
                      }`}
                    >
                      <div className="text-slate-900 dark:text-slate-100">{notif.title}</div>
                      <div className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5 line-clamp-2">
                        {notif.message}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1">
                        {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="p-2 border-t border-slate-100 dark:border-slate-800 text-center">
                <button
                  onClick={() => {
                    setShowNotifMenu(false);
                    onNavigate('notifications');
                  }}
                  className="text-xs text-slate-600 dark:text-slate-300 hover:underline"
                >
                  View all notifications
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </button>

        {/* User Profile Menu */}
        <div className="relative" ref={userRef}>
          <button
            onClick={() => setShowUserMenu(prev => !prev)}
            className="flex items-center gap-1.5 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Avatar name={user?.name || 'User'} avatar={user?.avatar} color={user?.color} size="sm" />
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-1 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl py-1.5 z-50">
              <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">{user?.name}</div>
                <div className="text-[11px] text-slate-400 truncate">{user?.email}</div>
              </div>
              <button
                onClick={() => {
                  setShowUserMenu(false);
                  onNavigate('profile');
                }}
                className="w-full text-left px-3 py-2 text-xs flex items-center gap-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <UserIcon className="w-3.5 h-3.5" />
                <span>My Profile</span>
              </button>
              <button
                onClick={() => {
                  setShowUserMenu(false);
                  onNavigate('members');
                }}
                className="w-full text-left px-3 py-2 text-xs flex items-center gap-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Workspace Members</span>
              </button>
              <button
                onClick={() => {
                  setShowUserMenu(false);
                  onNavigate('landing');
                }}
                className="w-full text-left px-3 py-2 text-xs flex items-center gap-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>View Landing Page</span>
              </button>
              <div className="border-t border-slate-100 dark:border-slate-800 my-1" />
              <button
                onClick={() => {
                  setShowUserMenu(false);
                  logout();
                }}
                className="w-full text-left px-3 py-2 text-xs flex items-center gap-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
