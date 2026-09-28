import React, { useState, useEffect } from 'react';
import {
  X,
  MessageSquare,
  CheckCircle2,
  CornerDownRight,
  Trash2,
  Send,
  AtSign,
  Filter,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useToast } from '../../context/ToastContext';
import { Avatar } from '../common/Avatar';
import { CommentItem, WorkspaceMember } from '../../types';
import { api } from '../../services/api';

interface CommentsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: string;
  workspaceId: string;
  initialSelectedText?: string;
  onClearInitialSelectedText?: () => void;
}

export const CommentsDrawer: React.FC<CommentsDrawerProps> = ({
  isOpen,
  onClose,
  documentId,
  workspaceId,
  initialSelectedText = '',
  onClearInitialSelectedText,
}) => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const { success, error } = useToast();

  const [comments, setComments] = useState<CommentItem[]>([]);
  const [filter, setFilter] = useState<'all' | 'open' | 'resolved'>('open');
  const [newCommentText, setNewCommentText] = useState('');
  const [selectedText, setSelectedText] = useState(initialSelectedText);
  const [replyTextMap, setReplyTextMap] = useState<Record<string, string>>({});
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');

  useEffect(() => {
    if (initialSelectedText) {
      setSelectedText(initialSelectedText);
    }
  }, [initialSelectedText]);

  useEffect(() => {
    async function loadData() {
      if (!documentId) return;
      try {
        const [cList, mList] = await Promise.all([
          api.getComments(documentId),
          api.getMembers(workspaceId).catch(() => []),
        ]);
        setComments(cList);
        setMembers(mList);
      } catch (err) {
        console.error(err);
      }
    }

    if (isOpen) {
      loadData();
    }
  }, [isOpen, documentId, workspaceId]);

  // Real-time socket events for comments
  useEffect(() => {
    if (!socket) return;

    const handleCommentCreated = (newC: CommentItem) => {
      if (newC.documentId !== documentId) return;
      setComments(prev => [newC, ...prev.filter(c => c.id !== newC.id)]);
    };

    const handleCommentUpdated = (updatedC: CommentItem) => {
      if (updatedC.documentId !== documentId) return;
      setComments(prev => prev.map(c => (c.id === updatedC.id ? updatedC : c)));
    };

    const handleCommentDeleted = ({ commentId }: { commentId: string }) => {
      setComments(prev => prev.filter(c => c.id !== commentId));
    };

    socket.on('comment:created', handleCommentCreated);
    socket.on('comment:updated', handleCommentUpdated);
    socket.on('comment:deleted', handleCommentDeleted);

    return () => {
      socket.off('comment:created', handleCommentCreated);
      socket.off('comment:updated', handleCommentUpdated);
      socket.off('comment:deleted', handleCommentDeleted);
    };
  }, [socket, documentId]);

  if (!isOpen) return null;

  const handleCreateComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    try {
      const created = await api.createComment(documentId, {
        content: newCommentText.trim(),
        selectedText: selectedText || undefined,
      });

      setComments(prev => [created, ...prev]);
      if (socket) {
        socket.emit('comment:new', { documentId, comment: created });
      }

      setNewCommentText('');
      setSelectedText('');
      if (onClearInitialSelectedText) onClearInitialSelectedText();
      success('Comment posted');
    } catch (err: any) {
      error(err.message || 'Failed to post comment');
    }
  };

  const handleToggleResolve = async (comment: CommentItem) => {
    try {
      const updated = await api.updateComment(comment.id, {
        resolved: !comment.resolved,
      });
      setComments(prev => prev.map(c => (c.id === comment.id ? { ...c, resolved: updated.resolved } : c)));
      if (socket) {
        socket.emit('comment:update', { documentId, comment: { ...comment, resolved: updated.resolved } });
      }
      success(updated.resolved ? 'Comment resolved' : 'Comment reopened');
    } catch (err: any) {
      error(err.message || 'Failed to update comment');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await api.deleteComment(commentId);
      setComments(prev => prev.filter(c => c.id !== commentId));
      if (socket) {
        socket.emit('comment:delete', { documentId, commentId });
      }
      success('Comment deleted');
    } catch (err: any) {
      error(err.message || 'Failed to delete comment');
    }
  };

  const handleReplySubmit = async (commentId: string) => {
    const text = replyTextMap[commentId];
    if (!text || !text.trim()) return;

    try {
      const reply = await api.replyComment(commentId, text.trim());
      setComments(prev =>
        prev.map(c => {
          if (c.id === commentId) {
            return {
              ...c,
              replies: [...(c.replies || []), reply],
            };
          }
          return c;
        })
      );
      setReplyTextMap(prev => ({ ...prev, [commentId]: '' }));
      success('Reply sent');
    } catch (err: any) {
      error(err.message || 'Failed to send reply');
    }
  };

  const handleTextChange = (val: string) => {
    setNewCommentText(val);
    const lastWord = val.split(' ').pop() || '';
    if (lastWord.startsWith('@')) {
      setShowMentionSuggestions(true);
      setMentionQuery(lastWord.slice(1).toLowerCase());
    } else {
      setShowMentionSuggestions(false);
    }
  };

  const handleInsertMention = (name: string) => {
    const parts = newCommentText.split(' ');
    parts.pop();
    parts.push(`@${name.replace(/\s+/g, '').toLowerCase()}`);
    setNewCommentText(parts.join(' ') + ' ');
    setShowMentionSuggestions(false);
  };

  const filteredComments = comments.filter(c => {
    if (filter === 'open') return !c.resolved;
    if (filter === 'resolved') return c.resolved;
    return true;
  });

  const matchingMembers = members.filter(
    m =>
      m.name.toLowerCase().includes(mentionQuery) ||
      m.email.toLowerCase().includes(mentionQuery)
  );

  return (
    <div className="w-80 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col h-full z-20 shrink-0 shadow-lg animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Comments ({comments.length})
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex px-3 pt-2 border-b border-slate-100 dark:border-slate-800 text-xs">
        <button
          onClick={() => setFilter('open')}
          className={`flex-1 py-1.5 text-center font-medium border-b-2 transition-colors ${
            filter === 'open'
              ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Open ({comments.filter(c => !c.resolved).length})
        </button>
        <button
          onClick={() => setFilter('resolved')}
          className={`flex-1 py-1.5 text-center font-medium border-b-2 transition-colors ${
            filter === 'resolved'
              ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Resolved ({comments.filter(c => c.resolved).length})
        </button>
        <button
          onClick={() => setFilter('all')}
          className={`flex-1 py-1.5 text-center font-medium border-b-2 transition-colors ${
            filter === 'all'
              ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          All
        </button>
      </div>

      {/* Comment List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {filteredComments.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            {filter === 'open' ? 'No unresolved comments. Everything is clear!' : 'No comments found.'}
          </div>
        ) : (
          filteredComments.map(comment => (
            <div
              key={comment.id}
              className={`p-3 rounded-lg border text-xs transition-colors ${
                comment.resolved
                  ? 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 opacity-75'
                  : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 shadow-2xs'
              }`}
            >
              {/* Selected Passage Quote */}
              {comment.selectedText && (
                <div className="mb-2 pl-2 border-l-2 border-amber-400 bg-amber-50/60 dark:bg-amber-950/30 py-1 pr-1 text-[11px] text-slate-600 dark:text-slate-300 italic rounded-r">
                  "{comment.selectedText.slice(0, 80)}"
                </div>
              )}

              {/* Author & Action buttons */}
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <Avatar
                    name={comment.authorName || 'Collaborator'}
                    avatar={comment.authorAvatar}
                    color={comment.authorColor}
                    size="sm"
                  />
                  <div>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {comment.authorName}
                    </span>
                    <span className="text-[10px] text-slate-400 ml-1.5">
                      {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleToggleResolve(comment)}
                    className={`p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 ${
                      comment.resolved ? 'text-emerald-600' : 'text-slate-400 hover:text-emerald-600'
                    }`}
                    title={comment.resolved ? 'Reopen thread' : 'Mark resolved'}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </button>
                  {comment.userId === user?.id && (
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-700"
                      title="Delete thread"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Content with highlighted @mentions */}
              <div className="text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                {comment.content.split(' ').map((word, i) => {
                  if (word.startsWith('@')) {
                    return (
                      <span key={i} className="text-blue-600 dark:text-blue-400 font-semibold bg-blue-50 dark:bg-blue-950 px-1 py-0.5 rounded">
                        {word}{' '}
                      </span>
                    );
                  }
                  return word + ' ';
                })}
              </div>

              {/* Replies list */}
              {comment.replies && comment.replies.length > 0 && (
                <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-700/60 space-y-2">
                  {comment.replies.map(r => (
                    <div key={r.id} className="pl-2 border-l border-slate-200 dark:border-slate-700 text-[11px]">
                      <div className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                        <Avatar name={r.authorName || 'Peer'} avatar={r.authorAvatar} color={r.authorColor} size="sm" />
                        <span>{r.authorName}</span>
                        <span className="text-[10px] text-slate-400 font-normal">
                          {new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="mt-1 text-slate-600 dark:text-slate-400 pl-7">
                        {r.content}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Reply Input */}
              {!comment.resolved && (
                <div className="mt-2.5 pt-2 flex items-center gap-1.5 border-t border-slate-100 dark:border-slate-700/50">
                  <input
                    type="text"
                    placeholder="Reply..."
                    value={replyTextMap[comment.id] || ''}
                    onChange={e =>
                      setReplyTextMap(prev => ({ ...prev, [comment.id]: e.target.value }))
                    }
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleReplySubmit(comment.id);
                    }}
                    className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden"
                  />
                  <button
                    onClick={() => handleReplySubmit(comment.id)}
                    className="p-1 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950 rounded"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* New Comment Input Box at Bottom */}
      <form onSubmit={handleCreateComment} className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 relative">
        {selectedText && (
          <div className="mb-2 p-1.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded text-[11px] text-amber-900 dark:text-amber-200 flex items-center justify-between">
            <span className="truncate">Commenting on: "{selectedText.slice(0, 30)}..."</span>
            <button
              type="button"
              onClick={() => {
                setSelectedText('');
                if (onClearInitialSelectedText) onClearInitialSelectedText();
              }}
              className="text-amber-700 hover:text-amber-900 ml-1"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Mention Suggestions Popover */}
        {showMentionSuggestions && matchingMembers.length > 0 && (
          <div className="absolute bottom-full left-3 right-3 mb-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl py-1 z-30 max-h-36 overflow-y-auto">
            <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Mention Member
            </div>
            {matchingMembers.map(m => (
              <button
                key={m.id}
                type="button"
                onClick={() => handleInsertMention(m.name)}
                className="w-full text-left px-2.5 py-1.5 flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs text-slate-800 dark:text-slate-200"
              >
                <Avatar name={m.name} color={m.color} size="sm" />
                <span>{m.name}</span>
                <span className="text-[10px] text-slate-400">({m.email})</span>
              </button>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <textarea
            rows={2}
            value={newCommentText}
            onChange={e => handleTextChange(e.target.value)}
            placeholder="Add a comment... (Type @ to mention teammates)"
            className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:border-blue-500 resize-none"
          />
        </div>

        <div className="mt-2 flex items-center justify-between">
          <span className="text-[10px] text-slate-400 flex items-center gap-1">
            <AtSign className="w-3 h-3" /> Mention members
          </span>
          <button
            type="submit"
            disabled={!newCommentText.trim()}
            className="flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-md text-xs font-medium transition-colors shadow-2xs"
          >
            <Send className="w-3 h-3" />
            <span>Send</span>
          </button>
        </div>
      </form>
    </div>
  );
};
