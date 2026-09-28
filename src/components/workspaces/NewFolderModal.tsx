import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Folder } from '../../types';

interface NewFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
  onFolderCreated: (folder: Folder) => void;
}

const FOLDER_ICONS = ['📁', '📂', '⚡', '📊', '🎨', '🚀', '💡', '🔒', '📦'];

export const NewFolderModal: React.FC<NewFolderModalProps> = ({
  isOpen,
  onClose,
  workspaceId,
  onFolderCreated,
}) => {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('📁');
  const [loading, setLoading] = useState(false);
  const { success, error } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      const folder = await api.createFolder(workspaceId, name.trim(), icon);
      success(`Folder "${folder.name}" created`);
      onFolderCreated(folder);
      onClose();
      setName('');
    } catch (err: any) {
      error(err.message || 'Failed to create folder');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Folder">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Folder Icon
          </label>
          <div className="flex gap-2 flex-wrap">
            {FOLDER_ICONS.map(i => (
              <button
                key={i}
                type="button"
                onClick={() => setIcon(i)}
                className={`w-8 h-8 rounded-lg text-base flex items-center justify-center border transition-all ${
                  icon === i
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/60'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {i}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Folder Name *
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Sprint Specifications"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-blue-500"
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
            {loading ? 'Creating...' : 'Create Folder'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
