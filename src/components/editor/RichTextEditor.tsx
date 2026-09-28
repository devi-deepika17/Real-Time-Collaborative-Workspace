import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  Link as LinkIcon,
  Table as TableIcon,
  Minus,
  MessageSquarePlus,
  RotateCcw,
  RotateCw,
  CheckCircle,
  Cloud,
  Eye,
  Lock,
  Download,
  Share2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useToast } from '../../context/ToastContext';
import { DocumentItem, RemoteCursor } from '../../types';
import { api } from '../../services/api';

interface RichTextEditorProps {
  document: DocumentItem;
  onUpdateTitle: (title: string) => void;
  onOpenComments: () => void;
  onRequestAddComment: (selectedText: string) => void;
  onShareDocument?: () => void;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  document: doc,
  onUpdateTitle,
  onOpenComments,
  onRequestAddComment,
  onShareDocument,
}) => {
  const { user } = useAuth();
  const {
    socket,
    activePeers,
    remoteCursors,
    updateCursor,
    updateSelection,
    updateDocumentContent,
  } = useSocket();
  const { toast } = useToast();

  const [title, setTitle] = useState(doc.title);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'synced'>('saved');
  const [selectedText, setSelectedText] = useState('');
  const [selectedRange, setSelectedRange] = useState<{ start: number; end: number } | null>(null);

  const editorRef = useRef<HTMLDivElement>(null);
  const isLocalEditRef = useRef(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const userRole = doc.currentUserRole || 'viewer';
  const isReadOnly = userRole === 'viewer';

  // Initialize editor content
  useEffect(() => {
    if (editorRef.current && !isLocalEditRef.current) {
      editorRef.current.innerHTML = doc.content || '<p></p>';
    }
    setTitle(doc.title);
  }, [doc.id]);

  // Listen to remote document updates
  useEffect(() => {
    if (!socket) return;

    const handleRemoteUpdate = (data: { documentId: string; content: string; userName: string; version: number }) => {
      if (data.documentId !== doc.id) return;
      if (isLocalEditRef.current) return;

      if (editorRef.current) {
        // Save current selection if active
        const sel = window.getSelection();
        let savedRange: Range | null = null;
        if (sel && sel.rangeCount > 0 && editorRef.current.contains(sel.anchorNode)) {
          savedRange = sel.getRangeAt(0).cloneRange();
        }

        editorRef.current.innerHTML = data.content;
        setSaveStatus('synced');

        // Restore selection if possible
        if (savedRange && sel) {
          try {
            sel.removeAllRanges();
            sel.addRange(savedRange);
          } catch {
            // Ignore range restore failures
          }
        }
      }
    };

    socket.on('document:update', handleRemoteUpdate);

    return () => {
      socket.off('document:update', handleRemoteUpdate);
    };
  }, [socket, doc.id]);

  // Broadcast cursor & selection changes on mouseup, keyup, selectionchange
  const handleSelectionChange = useCallback(() => {
    if (isReadOnly || !editorRef.current) return;

    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || !editorRef.current.contains(sel.anchorNode)) {
      setSelectedText('');
      setSelectedRange(null);
      return;
    }

    const range = sel.getRangeAt(0);
    const text = sel.toString();
    setSelectedText(text);

    // Calculate approximate coordinates for remote cursor
    const rect = range.getBoundingClientRect();
    const editorRect = editorRef.current.getBoundingClientRect();

    if (rect.width !== 0 || rect.height !== 0) {
      const cursorData = {
        x: rect.left - editorRect.left,
        y: rect.top - editorRect.top + editorRef.current.scrollTop,
        offset: range.startOffset,
      };

      updateCursor(doc.id, cursorData);

      if (text.length > 0) {
        updateSelection(doc.id, {
          start: range.startOffset,
          end: range.endOffset,
          text,
        });
      }
    }
  }, [doc.id, isReadOnly, updateCursor, updateSelection]);

  useEffect(() => {
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, [handleSelectionChange]);

  // Content modification handler with debounced persistence and real-time socket emit
  const handleContentInput = () => {
    if (isReadOnly || !editorRef.current) return;

    isLocalEditRef.current = true;
    setSaveStatus('saving');
    const newContent = editorRef.current.innerHTML;

    // Real-time broadcast to peers
    updateDocumentContent(doc.id, newContent);

    // Debounced autosave to database
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await api.updateDocument(doc.id, { content: newContent });
        setSaveStatus('saved');
      } catch (err) {
        console.error('Failed to autosave document:', err);
        setSaveStatus('saved');
      } finally {
        isLocalEditRef.current = false;
      }
    }, 800);
  };

  // Title change handler
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    onUpdateTitle(newTitle);

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await api.updateDocument(doc.id, { title: newTitle });
        setSaveStatus('saved');
      } catch (err) {
        console.error('Failed to save title:', err);
      }
    }, 600);
  };

  // Rich Text Commands
  const executeCommand = (command: string, value: string | undefined = undefined) => {
    if (isReadOnly) return;
    document.execCommand(command, false, value);
    if (editorRef.current) {
      editorRef.current.focus();
    }
    handleContentInput();
  };

  const insertHeading = (level: 'H1' | 'H2' | 'H3') => {
    executeCommand('formatBlock', `<${level.toLowerCase()}>`);
  };

  const insertTable = () => {
    const tableHtml = `
      <table class="border-collapse border border-slate-300 dark:border-slate-700 my-3 w-full">
        <thead>
          <tr class="bg-slate-100 dark:bg-slate-800">
            <th class="border border-slate-300 dark:border-slate-700 p-2 text-left">Header 1</th>
            <th class="border border-slate-300 dark:border-slate-700 p-2 text-left">Header 2</th>
            <th class="border border-slate-300 dark:border-slate-700 p-2 text-left">Header 3</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="border border-slate-300 dark:border-slate-700 p-2">Item A</td>
            <td class="border border-slate-300 dark:border-slate-700 p-2">Item B</td>
            <td class="border border-slate-300 dark:border-slate-700 p-2">Item C</td>
          </tr>
          <tr>
            <td class="border border-slate-300 dark:border-slate-700 p-2">Data 1</td>
            <td class="border border-slate-300 dark:border-slate-700 p-2">Data 2</td>
            <td class="border border-slate-300 dark:border-slate-700 p-2">Data 3</td>
          </tr>
        </tbody>
      </table>
      <p></p>
    `;
    executeCommand('insertHTML', tableHtml);
  };

  const insertLink = () => {
    const url = prompt('Enter destination URL:', 'https://');
    if (url) {
      executeCommand('createLink', url);
    }
  };

  const handleExport = (type: 'markdown' | 'html' | 'text') => {
    if (!editorRef.current) return;
    let content = '';
    let ext = 'txt';
    let mime = 'text/plain';

    if (type === 'html') {
      content = `<!DOCTYPE html><html><head><title>${title}</title></head><body><h1>${title}</h1>${editorRef.current.innerHTML}</body></html>`;
      ext = 'html';
      mime = 'text/html';
    } else if (type === 'markdown') {
      content = `# ${title}\n\n` + editorRef.current.innerText;
      ext = 'md';
      mime = 'text/markdown';
    } else {
      content = `${title}\n\n` + editorRef.current.innerText;
      ext = 'txt';
    }

    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.toLowerCase().replace(/\s+/g, '_')}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
    toast(`Exported as .${ext}`, 'success');
  };

  // Who is currently typing or editing
  const editingCollaborators = activePeers.filter(p => p.status === 'editing');
  const viewingCollaborators = activePeers.filter(p => p.status === 'viewing');

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 overflow-hidden">
      {/* Read-Only Banner for Viewers */}
      {isReadOnly && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900/60 px-4 py-2 flex items-center justify-between text-xs text-amber-800 dark:text-amber-300">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>
              <strong>Viewing Mode:</strong> You have Viewer permissions for this document. You can read and leave comments, but cannot edit text.
            </span>
          </div>
          <span className="text-[11px] bg-amber-100 dark:bg-amber-900 px-2 py-0.5 rounded font-medium">Read-Only</span>
        </div>
      )}

      {/* Editor Subheader & Status Bar */}
      <div className="px-6 py-2.5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50 text-xs">
        <div className="flex items-center gap-3">
          {/* Status Indicator */}
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
            {saveStatus === 'saving' ? (
              <>
                <Cloud className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                <span>Saving changes...</span>
              </>
            ) : saveStatus === 'synced' ? (
              <>
                <Cloud className="w-3.5 h-3.5 text-emerald-500" />
                <span>Synced with peers</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Saved just now</span>
              </>
            )}
          </div>

          {/* Active collaborator status badges */}
          {editingCollaborators.length > 0 && (
            <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />
              <span>
                {editingCollaborators.map(c => c.name.split(' ')[0]).join(', ')} is editing...
              </span>
            </div>
          )}

          {editingCollaborators.length === 0 && viewingCollaborators.length > 0 && (
            <div className="flex items-center gap-1 text-slate-400">
              <Eye className="w-3.5 h-3.5 text-slate-400" />
              <span>
                {viewingCollaborators.map(c => c.name.split(' ')[0]).join(', ')} viewing
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Add Comment on Selection Button */}
          {selectedText.trim().length > 0 && (
            <button
              onClick={() => onRequestAddComment(selectedText)}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-medium shadow-xs transition-colors animate-in fade-in"
            >
              <MessageSquarePlus className="w-3.5 h-3.5" />
              <span>Comment on "{selectedText.slice(0, 16)}..."</span>
            </button>
          )}

          <button
            onClick={onOpenComments}
            className="flex items-center gap-1.5 px-2.5 py-1 text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-md transition-colors"
          >
            <MessageSquarePlus className="w-3.5 h-3.5" />
            <span>Comments</span>
          </button>

          {/* Export Dropdown */}
          <div className="flex items-center border border-slate-200 dark:border-slate-800 rounded-md overflow-hidden">
            <button
              onClick={() => handleExport('markdown')}
              className="px-2 py-1 text-[11px] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1"
              title="Download as Markdown"
            >
              <Download className="w-3 h-3" />
              <span>Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Editor Formatting Toolbar */}
      {!isReadOnly && (
        <div className="px-6 py-1.5 border-b border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-1 flex-wrap overflow-x-auto text-slate-700 dark:text-slate-300">
          <button
            onClick={() => executeCommand('undo')}
            className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
            title="Undo"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => executeCommand('redo')}
            className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
            title="Redo"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>

          <div className="w-px h-4 bg-slate-200 dark:bg-slate-800 mx-1" />

          <button
            onClick={() => insertHeading('H1')}
            className="px-2 py-1 rounded text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-0.5"
            title="Heading 1"
          >
            <Heading1 className="w-4 h-4" />
          </button>
          <button
            onClick={() => insertHeading('H2')}
            className="px-2 py-1 rounded text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-0.5"
            title="Heading 2"
          >
            <Heading2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => insertHeading('H3')}
            className="px-2 py-1 rounded text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-0.5"
            title="Heading 3"
          >
            <Heading3 className="w-4 h-4" />
          </button>

          <div className="w-px h-4 bg-slate-200 dark:bg-slate-800 mx-1" />

          <button
            onClick={() => executeCommand('bold')}
            className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 font-bold"
            title="Bold (Ctrl+B)"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => executeCommand('italic')}
            className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 italic"
            title="Italic (Ctrl+I)"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => executeCommand('underline')}
            className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 underline"
            title="Underline (Ctrl+U)"
          >
            <Underline className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => executeCommand('strikeThrough')}
            className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
            title="Strikethrough"
          >
            <Strikethrough className="w-3.5 h-3.5" />
          </button>

          <div className="w-px h-4 bg-slate-200 dark:bg-slate-800 mx-1" />

          <button
            onClick={() => executeCommand('insertUnorderedList')}
            className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
            title="Bullet List"
          >
            <List className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => executeCommand('insertOrderedList')}
            className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
            title="Numbered List"
          >
            <ListOrdered className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => executeCommand('formatBlock', '<blockquote>')}
            className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
            title="Blockquote"
          >
            <Quote className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => executeCommand('formatBlock', '<pre>')}
            className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 font-mono text-xs"
            title="Code Block"
          >
            <Code className="w-3.5 h-3.5" />
          </button>

          <div className="w-px h-4 bg-slate-200 dark:bg-slate-800 mx-1" />

          <button
            onClick={insertLink}
            className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
            title="Insert Link"
          >
            <LinkIcon className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={insertTable}
            className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
            title="Insert Table"
          >
            <TableIcon className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => executeCommand('insertHorizontalRule')}
            className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
            title="Divider"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Editor Content Area */}
      <div className="flex-1 overflow-y-auto relative px-8 py-8 md:px-20 lg:px-32">
        <div className="max-w-4xl mx-auto relative min-h-full">
          {/* Document Title */}
          <div className="mb-6">
            <input
              type="text"
              value={title}
              onChange={handleTitleChange}
              disabled={isReadOnly}
              placeholder="Untitled Document"
              className="w-full text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-slate-100 bg-transparent focus:outline-hidden tracking-tight placeholder-slate-300 dark:placeholder-slate-700 disabled:opacity-90"
            />
            <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
              <span>Last updated: {new Date(doc.lastModifiedAt).toLocaleDateString()} at {new Date(doc.lastModifiedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              <span>•</span>
              <span>Version {doc.version}</span>
            </div>
          </div>

          {/* Remote Cursors Live Overlay */}
          <div className="pointer-events-none absolute inset-0 z-20">
            {Array.from(remoteCursors.values()).map(rc => {
              if (!rc.cursor || rc.cursor.x === undefined || rc.cursor.y === undefined) return null;
              return (
                <div
                  key={rc.userId}
                  className="absolute transition-all duration-100 ease-out"
                  style={{
                    left: `${rc.cursor.x}px`,
                    top: `${rc.cursor.y}px`,
                  }}
                >
                  <div
                    className="w-0.5 h-5 rounded-full"
                    style={{ backgroundColor: rc.color }}
                  />
                  <div
                    className="px-1.5 py-0.5 rounded-sm text-[10px] text-white font-medium whitespace-nowrap shadow-xs -mt-1 -ml-1 flex items-center gap-1"
                    style={{ backgroundColor: rc.color }}
                  >
                    <span>{rc.name.split(' ')[0]}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Editable Content Container */}
          <div
            ref={editorRef}
            contentEditable={!isReadOnly}
            suppressContentEditableWarning
            onInput={handleContentInput}
            onKeyUp={handleSelectionChange}
            onMouseUp={handleSelectionChange}
            className="prose prose-slate dark:prose-invert max-w-none focus:outline-hidden text-base leading-relaxed min-h-[500px]"
            data-placeholder="Type your ideas, paste notes, or use rich text tools..."
          />
        </div>
      </div>
    </div>
  );
};
