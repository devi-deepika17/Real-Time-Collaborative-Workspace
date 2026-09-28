import React, { useState } from 'react';
import {
  FileText,
  Plus,
  Star,
  Trash2,
  Copy,
  MoreVertical,
  LayoutGrid,
  List as ListIcon,
  RotateCcw,
  Search,
  Filter,
} from 'lucide-react';
import { DocumentItem, Folder, Workspace } from '../types';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';

interface WorkspaceViewProps {
  workspace: Workspace | null;
  documents: DocumentItem[];
  folders: Folder[];
  selectedFolderId: string | null;
  isTrashView?: boolean;
  onSelectDocument: (docId: string) => void;
  onCreateDocument: (folderId?: string | null) => void;
  onRefreshDocuments: () => void;
}

export const WorkspaceView: React.FC<WorkspaceViewProps> = ({
  workspace,
  documents,
  folders,
  selectedFolderId,
  isTrashView = false,
  onSelectDocument,
  onCreateDocument,
  onRefreshDocuments,
}) => {
  const { success, error } = useToast();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterQuery, setFilterQuery] = useState('');
  const [activeMenuDocId, setActiveMenuDocId] = useState<string | null>(null);

  const userRole = workspace?.currentUserRole || 'viewer';
  const canEdit = userRole === 'owner' || userRole === 'editor';

  // Filter documents
  const filteredDocs = documents.filter(doc => {
    if (isTrashView) {
      if (!doc.isTrash) return false;
    } else {
      if (doc.isTrash) return false;
      if (selectedFolderId && doc.folderId !== selectedFolderId) return false;
    }

    if (filterQuery.trim()) {
      return (
        doc.title.toLowerCase().includes(filterQuery.toLowerCase()) ||
        doc.content.toLowerCase().includes(filterQuery.toLowerCase())
      );
    }
    return true;
  });

  const selectedFolder = folders.find(f => f.id === selectedFolderId);

  const handleToggleFavorite = async (e: React.MouseEvent, doc: DocumentItem) => {
    e.stopPropagation();
    try {
      await api.updateDocument(doc.id, { isFavorite: !doc.isFavorite });
      onRefreshDocuments();
      success(doc.isFavorite ? 'Removed from favorites' : 'Added to favorites');
    } catch (err: any) {
      error(err.message || 'Failed to update favorite status');
    }
  };

  const handleTrashDocument = async (e: React.MouseEvent, doc: DocumentItem) => {
    e.stopPropagation();
    try {
      await api.updateDocument(doc.id, { isTrash: true });
      onRefreshDocuments();
      success(`Moved "${doc.title}" to trash`);
    } catch (err: any) {
      error(err.message || 'Failed to move to trash');
    }
  };

  const handleRestoreDocument = async (e: React.MouseEvent, doc: DocumentItem) => {
    e.stopPropagation();
    try {
      await api.updateDocument(doc.id, { isTrash: false });
      onRefreshDocuments();
      success(`Restored "${doc.title}"`);
    } catch (err: any) {
      error(err.message || 'Failed to restore document');
    }
  };

  const handleDeletePermanent = async (e: React.MouseEvent, doc: DocumentItem) => {
    e.stopPropagation();
    if (!confirm(`Permanently delete "${doc.title}"? This action cannot be undone.`)) return;

    try {
      await api.deleteDocument(doc.id);
      onRefreshDocuments();
      success('Document permanently deleted');
    } catch (err: any) {
      error(err.message || 'Failed to delete document');
    }
  };

  const handleDuplicate = async (e: React.MouseEvent, doc: DocumentItem) => {
    e.stopPropagation();
    try {
      await api.duplicateDocument(doc.id);
      onRefreshDocuments();
      success('Document duplicated');
    } catch (err: any) {
      error(err.message || 'Failed to duplicate document');
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 bg-white dark:bg-slate-900">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span>{isTrashView ? '🗑️ Trash' : selectedFolder ? `${selectedFolder.icon || '📁'} ${selectedFolder.name}` : '📄 All Documents'}</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {isTrashView
              ? 'Items in trash can be restored or permanently removed.'
              : `${filteredDocs.length} document${filteredDocs.length === 1 ? '' : 's'} in this view`}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Search in list */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Filter titles..."
              value={filterQuery}
              onChange={e => setFilterQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden"
            />
          </div>

          {/* Grid/List switch */}
          <div className="flex border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 ${viewMode === 'grid' ? 'bg-slate-200 dark:bg-slate-700 text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 ${viewMode === 'list' ? 'bg-slate-200 dark:bg-slate-700 text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
              title="List View"
            >
              <ListIcon className="w-4 h-4" />
            </button>
          </div>

          {/* Create Document button */}
          {!isTrashView && canEdit && (
            <button
              onClick={() => onCreateDocument(selectedFolderId)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Document</span>
            </button>
          )}
        </div>
      </div>

      {/* Document Grid / List */}
      {filteredDocs.length === 0 ? (
        <div className="py-16 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-400">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">No documents found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {isTrashView ? 'Trash is empty.' : 'There are no documents matching your criteria.'}
          </p>
          {!isTrashView && canEdit && (
            <button
              onClick={() => onCreateDocument(selectedFolderId)}
              className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg"
            >
              <Plus className="w-3.5 h-3.5" /> Create Document
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredDocs.map(doc => (
            <div
              key={doc.id}
              onClick={() => onSelectDocument(doc.id)}
              className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 bg-white dark:bg-slate-900 shadow-2xs hover:shadow-md cursor-pointer transition-all flex flex-col justify-between group h-44"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">{doc.icon || '📄'}</span>
                  <div className="flex items-center gap-1">
                    {!isTrashView && (
                      <button
                        onClick={e => handleToggleFavorite(e, doc)}
                        className="p-1 text-slate-300 hover:text-amber-500 transition-colors"
                        title={doc.isFavorite ? 'Unstar' : 'Star'}
                      >
                        <Star
                          className={`w-4 h-4 ${doc.isFavorite ? 'text-amber-500 fill-amber-500' : ''}`}
                        />
                      </button>
                    )}
                    {canEdit && (
                      <div className="relative">
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            setActiveMenuDocId(activeMenuDocId === doc.id ? null : doc.id);
                          }}
                          className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded"
                        >
                          <MoreVertical className="w-3.5 h-3.5" />
                        </button>
                        {activeMenuDocId === doc.id && (
                          <div className="absolute right-0 mt-1 w-40 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl py-1 z-30 text-xs">
                            {!isTrashView ? (
                              <>
                                <button
                                  onClick={e => {
                                    setActiveMenuDocId(null);
                                    handleDuplicate(e, doc);
                                  }}
                                  className="w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-800"
                                >
                                  <Copy className="w-3.5 h-3.5" /> Duplicate
                                </button>
                                <button
                                  onClick={e => {
                                    setActiveMenuDocId(null);
                                    handleTrashDocument(e, doc);
                                  }}
                                  className="w-full text-left px-3 py-1.5 flex items-center gap-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                                >
                                  <Trash2 className="w-3.5 h-3.5" /> Move to Trash
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={e => {
                                    setActiveMenuDocId(null);
                                    handleRestoreDocument(e, doc);
                                  }}
                                  className="w-full text-left px-3 py-1.5 flex items-center gap-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" /> Restore
                                </button>
                                <button
                                  onClick={e => {
                                    setActiveMenuDocId(null);
                                    handleDeletePermanent(e, doc);
                                  }}
                                  className="w-full text-left px-3 py-1.5 flex items-center gap-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                                >
                                  <Trash2 className="w-3.5 h-3.5" /> Delete Forever
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400 line-clamp-1">
                  {doc.title}
                </h3>
                <p className="text-xs text-slate-400 line-clamp-2 mt-1">
                  {doc.content.replace(/<[^>]*>?/gm, '').slice(0, 80) || 'Empty document'}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                <span>v{doc.version}</span>
                <span>{new Date(doc.lastModifiedAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="p-3.5">Title</th>
                <th className="p-3.5 hidden sm:table-cell">Author</th>
                <th className="p-3.5">Last Modified</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {filteredDocs.map(doc => (
                <tr
                  key={doc.id}
                  onClick={() => onSelectDocument(doc.id)}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                >
                  <td className="p-3.5">
                    <div className="flex items-center gap-2.5">
                      <span className="text-lg">{doc.icon || '📄'}</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">{doc.title}</span>
                    </div>
                  </td>
                  <td className="p-3.5 text-slate-500 hidden sm:table-cell">{doc.authorName || 'Collaborator'}</td>
                  <td className="p-3.5 text-slate-400">{new Date(doc.lastModifiedAt).toLocaleDateString()}</td>
                  <td className="p-3.5 text-right">
                    {!isTrashView ? (
                      <button
                        onClick={e => handleTrashDocument(e, doc)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded"
                        title="Trash"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button
                        onClick={e => handleRestoreDocument(e, doc)}
                        className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                        title="Restore"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
