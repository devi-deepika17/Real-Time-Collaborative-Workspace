import React, { useState, useEffect, useRef } from 'react';
import { Search, FileText, Folder as FolderIcon, MessageSquare, User as UserIcon, Loader2, ArrowRight } from 'lucide-react';
import { api } from '../../services/api';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
  onSelectDocument: (docId: string) => void;
  onSelectFolder?: (folderId: string) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  workspaceId,
  onSelectDocument,
  onSelectFolder,
}) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{
    documents: any[];
    folders: any[];
    comments: any[];
    members: any[];
  }>({ documents: [], folders: [], comments: [], members: [] });

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults({ documents: [], folders: [], comments: [], members: [] });
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim() || !workspaceId) {
      setResults({ documents: [], folders: [], comments: [], members: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.searchWorkspace(workspaceId, query);
        setResults(res);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query, workspaceId]);

  if (!isOpen) return null;

  const totalResults =
    results.documents.length + results.folders.length + results.comments.length + results.members.length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-slate-950/50 backdrop-blur-xs">
      <div className="fixed inset-0" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl overflow-hidden z-10">
        <div className="flex items-center px-4 py-3.5 border-b border-slate-200 dark:border-slate-800">
          <Search className="w-5 h-5 text-slate-400 mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search documents, folders, comments, or members... (Press Esc to close)"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full bg-transparent text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden text-base"
          />
          {loading && <Loader2 className="w-4 h-4 animate-spin text-slate-400 ml-2" />}
        </div>

        <div className="max-h-96 overflow-y-auto p-3 divide-y divide-slate-100 dark:divide-slate-800/60">
          {query.trim() && !loading && totalResults === 0 && (
            <div className="py-12 text-center text-sm text-slate-500">
              No matching results found for "{query}".
            </div>
          )}

          {!query.trim() && (
            <div className="py-10 text-center text-sm text-slate-400">
              Type to start searching throughout this workspace...
            </div>
          )}

          {/* Documents */}
          {results.documents.length > 0 && (
            <div className="py-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-3 pb-1 block">
                Documents ({results.documents.length})
              </span>
              {results.documents.map(d => (
                <button
                  key={d.id}
                  onClick={() => {
                    onSelectDocument(d.id);
                    onClose();
                  }}
                  className="w-full text-left flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 group transition-colors"
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <span className="text-lg">{d.icon || '📄'}</span>
                    <div>
                      <div className="text-sm font-medium text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate">
                        {d.title}
                      </div>
                      {d.matchedContent && (
                        <div className="text-xs text-slate-400 truncate max-w-md">
                          {d.matchedContent}
                        </div>
                      )}
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          )}

          {/* Folders */}
          {results.folders.length > 0 && (
            <div className="py-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-3 pb-1 block">
                Folders ({results.folders.length})
              </span>
              {results.folders.map(f => (
                <button
                  key={f.id}
                  onClick={() => {
                    if (onSelectFolder) onSelectFolder(f.id);
                    onClose();
                  }}
                  className="w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 group transition-colors"
                >
                  <FolderIcon className="w-4 h-4 text-amber-500" />
                  <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                    {f.name}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Comments */}
          {results.comments.length > 0 && (
            <div className="py-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-3 pb-1 block">
                Comments ({results.comments.length})
              </span>
              {results.comments.map(c => (
                <button
                  key={c.id}
                  onClick={() => {
                    onSelectDocument(c.documentId);
                    onClose();
                  }}
                  className="w-full text-left flex items-start gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 group transition-colors"
                >
                  <MessageSquare className="w-4 h-4 text-blue-500 mt-1 shrink-0" />
                  <div>
                    <div className="text-sm text-slate-800 dark:text-slate-200 font-medium">
                      "{c.content}"
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      By {c.authorName} in <span className="font-medium text-slate-600 dark:text-slate-300">{c.documentTitle}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Members */}
          {results.members.length > 0 && (
            <div className="py-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-3 pb-1 block">
                Workspace Members ({results.members.length})
              </span>
              {results.members.map(m => (
                <div
                  key={m.id}
                  className="flex items-center justify-between px-3 py-2 rounded-lg text-sm"
                >
                  <div className="flex items-center gap-2.5">
                    <UserIcon className="w-4 h-4 text-emerald-500" />
                    <span className="font-medium text-slate-800 dark:text-slate-200">{m.name}</span>
                    <span className="text-xs text-slate-400">({m.email})</span>
                  </div>
                  <span className="text-xs uppercase bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300">
                    {m.role}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs text-slate-400">
          <span>Pro tip: Press Esc anytime to close</span>
          <span>Fast Real-Time Search</span>
        </div>
      </div>
    </div>
  );
};
