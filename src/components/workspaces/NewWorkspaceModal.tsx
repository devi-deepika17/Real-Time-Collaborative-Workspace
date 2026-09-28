import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Workspace } from '../../types';

interface NewWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onWorkspaceCreated: (ws: Workspace) => void;
}

const EMOJI_OPTIONS = ['🚀', '💼', '🎨', '⚡', '📊', '🌐', '💡', '🔥', '📚', '🎯'];

export const NewWorkspaceModal: React.FC<NewWorkspaceModalProps> = ({
  isOpen,
  onClose,
  onWorkspaceCreated,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('🚀');
  const [loading, setLoading] = useState(false);
  const { success, error } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      const created = await api.createWorkspace({
        name: name.trim(),
        description: description.trim(),
        icon,
      });
      success(`Workspace "${created.name}" created!`);
      onWorkspaceCreated(created);
      onClose();
      setName('');
      setDescription('');
    } catch (err: any) {
      error(err.message || 'Failed to create workspace');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Workspace">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Workspace Icon
          </label>
          <div className="flex gap-2 flex-wrap">
            {EMOJI_OPTIONS.map(emoji => (
              <button
                key={emoji}
                type="button"
                onClick={() => setIcon(emoji)}
                className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center border transition-all ${
                  icon === emoji
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/60 scale-105'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Workspace Name *
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Engineering & Design Team"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Description
          </label>
          <textarea
            rows={2}
            placeholder="What is this workspace used for?"
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-blue-500 resize-none"
          />
        </div>

        <div className="pt-2 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="px-4 py-2 text-xs font-medium bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition-colors shadow-2xs"
          >
            {loading ? 'Creating...' : 'Create Workspace'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
