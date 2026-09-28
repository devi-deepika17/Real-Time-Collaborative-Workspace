import React, { useState, useEffect } from 'react';
import { Settings, Trash2, Save, ShieldAlert } from 'lucide-react';
import { Workspace } from '../types';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';

interface WorkspaceSettingsPageProps {
  workspace: Workspace | null;
  onWorkspaceUpdated: (ws: Workspace) => void;
  onWorkspaceDeleted: (wsId: string) => void;
}

const EMOJI_OPTIONS = ['🚀', '💼', '🎨', '⚡', '📊', '🌐', '💡', '🔥', '📚', '🎯'];

export const WorkspaceSettingsPage: React.FC<WorkspaceSettingsPageProps> = ({
  workspace,
  onWorkspaceUpdated,
  onWorkspaceDeleted,
}) => {
  const { success, error } = useToast();
  const [name, setName] = useState(workspace?.name || '');
  const [description, setDescription] = useState(workspace?.description || '');
  const [icon, setIcon] = useState(workspace?.icon || '📁');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (workspace) {
      setName(workspace.name);
      setDescription(workspace.description || '');
      setIcon(workspace.icon || '📁');
    }
  }, [workspace]);

  const isOwner = workspace?.currentUserRole === 'owner';

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspace) return;

    setLoading(true);
    try {
      const updated = await api.updateWorkspace(workspace.id, {
        name: name.trim(),
        description: description.trim(),
        icon,
      });
      success('Workspace settings updated');
      onWorkspaceUpdated(updated);
    } catch (err: any) {
      error(err.message || 'Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!workspace) return;
    if (
      !confirm(
        `Are you sure you want to delete workspace "${workspace.name}"? All documents, folders, and comments will be permanently erased.`
      )
    )
      return;

    try {
      await api.deleteWorkspace(workspace.id);
      success('Workspace deleted');
      onWorkspaceDeleted(workspace.id);
    } catch (err: any) {
      error(err.message || 'Failed to delete workspace');
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 bg-white dark:bg-slate-900 max-w-3xl">
      <div className="pb-4 border-b border-slate-200 dark:border-slate-800">
        <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Settings className="w-6 h-6 text-blue-600" />
          <span>Workspace Settings</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Configure general properties and manage workspace lifecycle.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Workspace Icon
          </label>
          <div className="flex gap-2 flex-wrap">
            {EMOJI_OPTIONS.map(i => (
              <button
                key={i}
                type="button"
                disabled={!isOwner}
                onClick={() => setIcon(i)}
                className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center border transition-all ${
                  icon === i
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/60 scale-105'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                } disabled:opacity-50`}
              >
                {i}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Workspace Name
          </label>
          <input
            type="text"
            required
            disabled={!isOwner}
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-blue-500 disabled:opacity-50"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Description
          </label>
          <textarea
            rows={3}
            disabled={!isOwner}
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-blue-500 disabled:opacity-50 resize-none"
          />
        </div>

        {isOwner && (
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>{loading ? 'Saving...' : 'Save Changes'}</span>
          </button>
        )}
      </form>

      {/* Danger Zone */}
      {isOwner && (
        <div className="mt-12 pt-6 border-t border-rose-200 dark:border-rose-950/60">
          <div className="p-4 rounded-xl border border-rose-300 dark:border-rose-900 bg-rose-50/50 dark:bg-rose-950/20">
            <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-bold text-sm mb-1">
              <ShieldAlert className="w-5 h-5" />
              <span>Danger Zone</span>
            </div>
            <p className="text-xs text-rose-800 dark:text-rose-300 mb-4">
              Permanently delete this workspace and all associated documents, comments, and member records. This action cannot be reversed.
            </p>
            <button
              type="button"
              onClick={handleDelete}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Workspace Permanently</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
