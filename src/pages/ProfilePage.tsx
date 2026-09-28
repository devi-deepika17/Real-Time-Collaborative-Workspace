import React from 'react';
import { User as UserIcon, Mail, Shield, Zap, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Avatar } from '../components/common/Avatar';

export const ProfilePage: React.FC = () => {
  const { user, switchUser } = useAuth();

  const demoAccounts = [
    {
      name: 'Alice Chen',
      email: 'alice@collab.io',
      role: 'Workspace Owner / Lead',
      color: '#2563eb',
      desc: 'Owner of Acme Product & Engineering. Can manage settings, invite members, and edit all docs.',
    },
    {
      name: 'Bob Miller',
      email: 'bob@collab.io',
      role: 'Senior Engineer / Editor',
      color: '#059669',
      desc: 'Editor in Acme Product & Engineering. Can co-author, create documents, and leave comments.',
    },
    {
      name: 'Sarah Connor',
      email: 'sarah@collab.io',
      role: 'Designer / Viewer',
      color: '#db2777',
      desc: 'Viewer in Acme Product & Engineering and Owner of Design Systems. Demonstrates view-only permissions.',
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 bg-white dark:bg-slate-900 max-w-4xl">
      <div className="pb-4 border-b border-slate-200 dark:border-slate-800">
        <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <UserIcon className="w-6 h-6 text-blue-600" />
          <span>User Profile</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Review your account identity, assigned role credentials, and presence parameters.
        </p>
      </div>

      {/* User Info Card */}
      <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col sm:flex-row items-center sm:items-start gap-5">
        <Avatar
          name={user?.name || 'User'}
          avatar={user?.avatar}
          color={user?.color}
          size="xl"
          status="online"
        />

        <div className="flex-1 text-center sm:text-left space-y-2">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">{user?.name}</h2>
            <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              <Mail className="w-3.5 h-3.5" />
              <span>{user?.email}</span>
            </div>
          </div>

          <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold text-white shadow-2xs"
              style={{ backgroundColor: user?.color }}
            >
              <span className="w-2 h-2 rounded-full bg-white/80" />
              Presence Palette
            </span>
            <span className="text-xs text-slate-400">
              Joined {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '2026'}
            </span>
          </div>
        </div>
      </div>

      {/* 1-Click Multi-User Simulation Switcher */}
      <div className="space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Zap className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span>Simulate Multi-User Real-Time Collaboration</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Switch accounts in 1-click or open two browser tabs to test simultaneous live edits, presence badges, and remote cursors.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {demoAccounts.map(account => {
            const isActive = user?.email === account.email;
            return (
              <div
                key={account.email}
                className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                  isActive
                    ? 'border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/30 ring-2 ring-indigo-500/20 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Avatar name={account.name} color={account.color} size="md" status="online" />
                    {isActive ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-900/60 px-2 py-0.5 rounded-full">
                        <Check className="w-3 h-3" /> Logged In
                      </span>
                    ) : (
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        Available
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">{account.name}</h3>
                  <div className="text-xs text-indigo-600 dark:text-indigo-400 font-medium mt-0.5">
                    {account.role}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                    {account.desc}
                  </p>
                </div>

                <button
                  onClick={() => switchUser(account.email)}
                  disabled={isActive}
                  className={`mt-4 w-full py-1.5 px-3 rounded-lg text-xs font-semibold transition-colors ${
                    isActive
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-default'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs'
                  }`}
                >
                  {isActive ? 'Currently Active' : `Switch to ${account.name.split(' ')[0]}`}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
