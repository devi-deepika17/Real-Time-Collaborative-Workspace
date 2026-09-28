import React, { useState, useEffect } from 'react';
import {
  FileText,
  Clock,
  Star,
  Users,
  Plus,
  Folder as FolderIcon,
  Activity as ActivityIcon,
  ArrowRight,
  TrendingUp,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Avatar } from '../components/common/Avatar';
import { DocumentItem, Workspace, ActivityItem } from '../types';

interface DashboardProps {
  currentWorkspace: Workspace | null;
  workspaces: Workspace[];
  onSelectDocument: (docId: string) => void;
  onSelectWorkspace: (wsId: string) => void;
  onCreateDocument: () => void;
  onCreateWorkspace: () => void;
  onNavigate: (view: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  currentWorkspace,
  workspaces,
  onSelectDocument,
  onSelectWorkspace,
  onCreateDocument,
  onCreateWorkspace,
  onNavigate,
}) => {
  const { user } = useAuth();
  const [recentDocs, setRecentDocs] = useState<DocumentItem[]>([]);
  const [favoriteDocs, setFavoriteDocs] = useState<DocumentItem[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      if (!currentWorkspace) return;
      try {
        setLoading(true);
        const [docs, acts, mems] = await Promise.all([
          api.getDocuments(currentWorkspace.id),
          api.getWorkspaceActivity(currentWorkspace.id).catch(() => []),
          api.getMembers(currentWorkspace.id).catch(() => []),
        ]);

        const validDocs = docs.filter(d => !d.isTrash);
        setRecentDocs(
          [...validDocs].sort(
            (a, b) => new Date(b.lastModifiedAt).getTime() - new Date(a.lastModifiedAt).getTime()
          ).slice(0, 6)
        );
        setFavoriteDocs(validDocs.filter(d => d.isFavorite));
        setActivities(acts.slice(0, 10));
        setMembers(mems);
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, [currentWorkspace?.id]);

  const canEdit =
    currentWorkspace?.currentUserRole === 'owner' || currentWorkspace?.currentUserRole === 'editor';

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 bg-slate-50/50 dark:bg-slate-900/30">
      {/* Welcome Hero */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-700 text-white p-6 md:p-8 rounded-2xl shadow-md">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-semibold backdrop-blur-xs mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Real-Time Collaboration Engine</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Welcome back, {user?.name.split(' ')[0]}!
          </h1>
          <p className="text-blue-100 text-sm mt-1 max-w-xl">
            You are collaborating in <span className="font-semibold text-white">{currentWorkspace?.name}</span>. Documents, cursors, and comments synchronize instantly across active members.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {canEdit && (
            <button
              onClick={onCreateDocument}
              className="flex items-center gap-2 px-4 py-2.5 bg-white text-blue-700 hover:bg-blue-50 font-semibold text-xs rounded-xl shadow-sm transition-all hover:scale-105"
            >
              <Plus className="w-4 h-4" />
              <span>Create Document</span>
            </button>
          )}
          <button
            onClick={onCreateWorkspace}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/15 hover:bg-white/25 text-white font-semibold text-xs rounded-xl backdrop-blur-xs transition-colors"
          >
            <span>+ New Workspace</span>
          </button>
        </div>
      </div>

      {/* Grid: Recent Documents & Favorites */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2/3): Documents */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Documents */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Recent Documents
                </h2>
              </div>
              <button
                onClick={() => onNavigate('workspace')}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium"
              >
                <span>View all</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {loading ? (
              <div className="py-8 text-center text-xs text-slate-400">Loading documents...</div>
            ) : recentDocs.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No documents found. Click "Create Document" to start drafting!
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {recentDocs.map(doc => (
                  <div
                    key={doc.id}
                    onClick={() => onSelectDocument(doc.id)}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 bg-white dark:bg-slate-900/60 hover:shadow-md cursor-pointer transition-all group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl">{doc.icon || '📄'}</span>
                      {doc.isFavorite && <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />}
                    </div>
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400 line-clamp-1">
                      {doc.title}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-2 mt-1">
                      {doc.content.replace(/<[^>]*>?/gm, '').slice(0, 90) || 'Empty document'}
                    </p>
                    <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                      <span>v{doc.version}</span>
                      <span>{new Date(doc.lastModifiedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Favorite Documents */}
          {favoriteDocs.length > 0 && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
              <div className="flex items-center gap-2 mb-4">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Favorite Documents
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {favoriteDocs.map(doc => (
                  <div
                    key={doc.id}
                    onClick={() => onSelectDocument(doc.id)}
                    className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span>{doc.icon || '📄'}</span>
                      <span className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
                        {doc.title}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Workspaces List Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Your Workspaces ({workspaces.length})
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {workspaces.map(ws => (
                <div
                  key={ws.id}
                  onClick={() => onSelectWorkspace(ws.id)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                    ws.id === currentWorkspace?.id
                      ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <span className="text-2xl">{ws.icon || '📁'}</span>
                    <div className="truncate">
                      <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {ws.name}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {ws.memberCount || 1} members • {ws.documentCount || 0} docs
                      </div>
                    </div>
                  </div>
                  {ws.id === currentWorkspace?.id && (
                    <span className="text-[10px] bg-blue-600 text-white font-semibold px-2 py-0.5 rounded-full">
                      Active
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (1/3): Workspace Activity Feed & Team Members */}
        <div className="space-y-6">
          {/* Team Members Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Workspace Members ({members.length})
                </h2>
              </div>
              <button
                onClick={() => onNavigate('members')}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                Manage
              </button>
            </div>

            <div className="space-y-2 mt-2">
              {members.map(m => (
                <div
                  key={m.userId}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <Avatar name={m.name} avatar={m.avatar} color={m.color} size="sm" status="online" />
                    <div>
                      <div className="font-medium text-slate-800 dark:text-slate-200">{m.name}</div>
                      <div className="text-[10px] text-slate-400">{m.email}</div>
                    </div>
                  </div>
                  <span className="uppercase text-[10px] font-semibold tracking-wider text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                    {m.role}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Activity History Feed */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
            <div className="flex items-center gap-2 mb-4">
              <ActivityIcon className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Workspace Activity
              </h2>
            </div>

            {activities.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                No recent activity logged yet.
              </div>
            ) : (
              <div className="space-y-3">
                {activities.map(act => (
                  <div key={act.id} className="flex items-start gap-2.5 text-xs">
                    <Avatar
                      name={act.userName || 'Member'}
                      avatar={act.userAvatar}
                      color={act.userColor}
                      size="sm"
                    />
                    <div className="flex-1">
                      <div className="text-slate-800 dark:text-slate-200 leading-snug">
                        <span className="font-semibold">{act.userName}</span>{' '}
                        <span className="text-slate-500 dark:text-slate-400">{act.details}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(act.timestamp).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
