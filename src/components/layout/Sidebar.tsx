import React, { useState } from 'react';
import {
  FileText,
  Folder as FolderIcon,
  ChevronRight,
  ChevronDown,
  Star,
  Trash2,
  Users,
  Settings,
  Plus,
  LayoutDashboard,
  FolderPlus,
} from 'lucide-react';
import { DocumentItem, Folder, Workspace } from '../../types';
import { RoleBadge } from '../common/Badge';

interface SidebarProps {
  workspace: Workspace | null;
  documents: DocumentItem[];
  folders: Folder[];
  activeDocumentId: string | null;
  activeView: string;
  selectedFolderId: string | null;
  onSelectDocument: (docId: string) => void;
  onSelectFolder: (folderId: string | null) => void;
  onNavigate: (view: string) => void;
  onCreateDocument: (folderId?: string | null) => void;
  onCreateFolder: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  workspace,
  documents,
  folders,
  activeDocumentId,
  activeView,
  selectedFolderId,
  onSelectDocument,
  onSelectFolder,
  onNavigate,
  onCreateDocument,
  onCreateFolder,
}) => {
  const [foldersOpen, setFoldersOpen] = useState(true);
  const [favoritesOpen, setFavoritesOpen] = useState(true);
  const [docsOpen, setDocsOpen] = useState(true);

  const favorites = documents.filter(d => d.isFavorite && !d.isTrash);
  const unorganizedDocs = documents.filter(d => !d.folderId && !d.isTrash);

  const userRole = workspace?.currentUserRole || 'viewer';
  const canEdit = userRole === 'owner' || userRole === 'editor';

  return (
    <aside className="w-64 border-r border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 flex flex-col h-full shrink-0 select-none">
      {/* Workspace Summary & Role */}
      <div className="p-3.5 border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 truncate">
            <span className="text-xl">{workspace?.icon || '📁'}</span>
            <div className="truncate">
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                {workspace?.name || 'Loading...'}
              </div>
              <div className="text-[11px] text-slate-400 truncate">
                {workspace?.description || 'Collaborative workspace'}
              </div>
            </div>
          </div>
        </div>
        <div className="mt-2.5 flex items-center justify-between text-xs">
          <span className="text-slate-500 dark:text-slate-400">Your role:</span>
          <RoleBadge role={userRole} />
        </div>
      </div>

      {/* Main Navigation Actions */}
      <div className="p-2 space-y-0.5 border-b border-slate-200/60 dark:border-slate-800/60">
        <button
          onClick={() => onNavigate('dashboard')}
          className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            activeView === 'dashboard'
              ? 'bg-blue-100/70 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
          }`}
        >
          <LayoutDashboard className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          <span>Dashboard</span>
        </button>

        <button
          onClick={() => {
            onSelectFolder(null);
            onNavigate('workspace');
          }}
          className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            activeView === 'workspace' && !selectedFolderId
              ? 'bg-blue-100/70 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
          }`}
        >
          <FileText className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          <span>All Documents</span>
        </button>
      </div>

      {/* Primary Action Button */}
      {canEdit && (
        <div className="p-2.5 flex gap-2">
          <button
            onClick={() => onCreateDocument(selectedFolderId)}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Document</span>
          </button>
          <button
            onClick={onCreateFolder}
            className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 rounded-lg transition-colors border border-slate-200 dark:border-slate-800"
            title="Create Folder"
          >
            <FolderPlus className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Scrollable Tree */}
      <div className="flex-1 overflow-y-auto px-2 py-1 space-y-3">
        {/* Favorites */}
        {favorites.length > 0 && (
          <div>
            <div
              onClick={() => setFavoritesOpen(!favoritesOpen)}
              className="flex items-center justify-between px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400 cursor-pointer hover:text-slate-600 dark:hover:text-slate-300"
            >
              <div className="flex items-center gap-1.5">
                <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                <span>Favorites</span>
              </div>
              {favoritesOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </div>

            {favoritesOpen && (
              <div className="mt-0.5 space-y-0.5">
                {favorites.map(doc => (
                  <button
                    key={doc.id}
                    onClick={() => onSelectDocument(doc.id)}
                    className={`w-full text-left flex items-center gap-2 px-2.5 py-1 rounded-md text-xs truncate transition-colors ${
                      activeDocumentId === doc.id
                        ? 'bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 font-semibold'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <span>{doc.icon || '📄'}</span>
                    <span className="truncate">{doc.title}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Folders Section */}
        <div>
          <div
            onClick={() => setFoldersOpen(!foldersOpen)}
            className="flex items-center justify-between px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400 cursor-pointer hover:text-slate-600 dark:hover:text-slate-300"
          >
            <div className="flex items-center gap-1.5">
              <FolderIcon className="w-3 h-3 text-amber-500" />
              <span>Folders ({folders.length})</span>
            </div>
            {foldersOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          </div>

          {foldersOpen && (
            <div className="mt-0.5 space-y-0.5">
              {folders.map(folder => {
                const folderDocs = documents.filter(d => d.folderId === folder.id && !d.isTrash);
                const isSelected = selectedFolderId === folder.id;

                return (
                  <div key={folder.id} className="space-y-0.5">
                    <button
                      onClick={() => {
                        onSelectFolder(folder.id);
                        onNavigate('workspace');
                      }}
                      className={`w-full text-left flex items-center justify-between px-2.5 py-1 rounded-md text-xs transition-colors ${
                        isSelected
                          ? 'bg-amber-100/80 text-amber-900 dark:bg-amber-950/50 dark:text-amber-200 font-semibold'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span>{folder.icon || '📁'}</span>
                        <span className="truncate">{folder.name}</span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {folderDocs.length}
                      </span>
                    </button>

                    {/* Nested Docs inside Folder */}
                    <div className="pl-4 space-y-0.5">
                      {folderDocs.map(doc => (
                        <button
                          key={doc.id}
                          onClick={() => onSelectDocument(doc.id)}
                          className={`w-full text-left flex items-center gap-1.5 px-2 py-1 rounded-md text-xs truncate transition-colors ${
                            activeDocumentId === doc.id
                              ? 'bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 font-medium'
                              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/40 dark:hover:bg-slate-800/40'
                          }`}
                        >
                          <span className="text-xs">{doc.icon || '📄'}</span>
                          <span className="truncate">{doc.title}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Unorganized Documents */}
        <div>
          <div
            onClick={() => setDocsOpen(!docsOpen)}
            className="flex items-center justify-between px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400 cursor-pointer hover:text-slate-600 dark:hover:text-slate-300"
          >
            <div className="flex items-center gap-1.5">
              <FileText className="w-3 h-3 text-blue-500" />
              <span>General ({unorganizedDocs.length})</span>
            </div>
            {docsOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          </div>

          {docsOpen && (
            <div className="mt-0.5 space-y-0.5">
              {unorganizedDocs.map(doc => (
                <button
                  key={doc.id}
                  onClick={() => onSelectDocument(doc.id)}
                  className={`w-full text-left flex items-center gap-2 px-2.5 py-1 rounded-md text-xs truncate transition-colors ${
                    activeDocumentId === doc.id
                      ? 'bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 font-semibold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <span>{doc.icon || '📄'}</span>
                  <span className="truncate">{doc.title}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer Nav: Members, Settings, Trash */}
      <div className="p-2 border-t border-slate-200/80 dark:border-slate-800/80 space-y-0.5">
        <button
          onClick={() => onNavigate('members')}
          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            activeView === 'members'
              ? 'bg-blue-100/70 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
          }`}
        >
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-500" />
            <span>Members</span>
          </div>
          <span className="text-[10px] bg-slate-200 dark:bg-slate-800 px-1.5 py-0.2 rounded text-slate-600 dark:text-slate-300">
            {workspace?.memberCount || 1}
          </span>
        </button>

        <button
          onClick={() => onNavigate('settings')}
          className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            activeView === 'settings'
              ? 'bg-blue-100/70 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
          }`}
        >
          <Settings className="w-4 h-4 text-slate-500" />
          <span>Workspace Settings</span>
        </button>

        <button
          onClick={() => onNavigate('trash')}
          className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            activeView === 'trash'
              ? 'bg-rose-100/70 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
          }`}
        >
          <Trash2 className="w-4 h-4 text-slate-500" />
          <span>Trash</span>
        </button>
      </div>
    </aside>
  );
};
