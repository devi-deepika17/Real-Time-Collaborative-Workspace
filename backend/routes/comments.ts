import { Router } from 'express';
import { db, Comment, CommentReply } from '../db/store.ts';
import { requireAuth, AuthRequest } from '../middleware/auth.ts';
import { v4 as uuidv4 } from 'uuid';

export const commentsRouter = Router();

// GET /api/documents/:id/comments
commentsRouter.get('/documents/:id/comments', requireAuth, (req: AuthRequest, res) => {
  const documentId = req.params.id;
  const doc = db.getDocuments().find(d => d.id === documentId);
  if (!doc) return res.status(404).json({ error: 'Document not found.' });

  const role = db.getWorkspaceUserRole(doc.workspaceId, req.user!.id);
  if (!role) return res.status(403).json({ error: 'Access denied.' });

  const comments = db.getComments()
    .filter(c => c.documentId === documentId)
    .map(c => {
      const author = db.findUserById(c.userId);
      const enrichedReplies = (c.replies || []).map(r => {
        const replyAuthor = db.findUserById(r.userId);
        return {
          ...r,
          authorName: replyAuthor?.name || 'Collaborator',
          authorAvatar: replyAuthor?.avatar,
          authorColor: replyAuthor?.color || '#2563eb',
        };
      });

      return {
        ...c,
        authorName: author?.name || 'Collaborator',
        authorAvatar: author?.avatar,
        authorColor: author?.color || '#2563eb',
        replies: enrichedReplies,
      };
    });

  return res.json(comments);
});

// POST /api/documents/:id/comments
commentsRouter.post('/documents/:id/comments', requireAuth, (req: AuthRequest, res) => {
  const documentId = req.params.id;
  const { content, selectedText, position } = req.body;
  const userId = req.user!.id;

  if (!content || !content.trim()) {
    return res.status(400).json({ error: 'Comment content cannot be empty.' });
  }

  const doc = db.getDocuments().find(d => d.id === documentId);
  if (!doc) return res.status(404).json({ error: 'Document not found.' });

  const role = db.getWorkspaceUserRole(doc.workspaceId, userId);
  if (!role) return res.status(403).json({ error: 'Access denied.' });

  const newComment: Comment = {
    id: 'comment_' + uuidv4().slice(0, 8),
    documentId,
    userId,
    content: content.trim(),
    selectedText: selectedText || undefined,
    position: position || undefined,
    resolved: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    replies: [],
  };

  db.getComments().push(newComment);
  db.addActivity(doc.workspaceId, userId, 'added_comment', `Commented on "${doc.title}"`, doc.id);

  // Parse @mentions (e.g., @alice, @bob, @sarah)
  const mentions = content.match(/@(\w+)/g) || [];
  for (const m of mentions) {
    const handle = m.substring(1).toLowerCase();
    const mentionedUser = db.getUsers().find(u => 
      u.name.toLowerCase().replace(/\s+/g, '').includes(handle) || 
      u.email.toLowerCase().includes(handle)
    );
    if (mentionedUser && mentionedUser.id !== userId) {
      db.addNotification(
        mentionedUser.id,
        'Mentioned in a comment',
        `${req.user!.name} mentioned you in "${doc.title}": "${content.slice(0, 60)}"`,
        `/workspace/${doc.workspaceId}/document/${doc.id}`,
        'mention'
      );
    }
  }

  db.save();

  const author = db.findUserById(userId);
  return res.status(201).json({
    ...newComment,
    authorName: author?.name || 'Collaborator',
    authorAvatar: author?.avatar,
    authorColor: author?.color || '#2563eb',
    replies: [],
  });
});

// PATCH /api/comments/:id - resolve or edit comment
commentsRouter.patch('/comments/:id', requireAuth, (req: AuthRequest, res) => {
  const commentId = req.params.id;
  const comment = db.getComments().find(c => c.id === commentId);
  if (!comment) return res.status(404).json({ error: 'Comment not found.' });

  const doc = db.getDocuments().find(d => d.id === comment.documentId);
  if (!doc) return res.status(404).json({ error: 'Document not found.' });

  const role = db.getWorkspaceUserRole(doc.workspaceId, req.user!.id);
  if (!role) return res.status(403).json({ error: 'Access denied.' });

  const { resolved, content } = req.body;

  if (resolved !== undefined) {
    comment.resolved = resolved;
    if (resolved) {
      db.addActivity(doc.workspaceId, req.user!.id, 'resolved_comment', `Resolved a comment thread in "${doc.title}"`, doc.id);
    }
  }

  if (content !== undefined && content.trim()) {
    // Only author or owner can edit content
    if (comment.userId !== req.user!.id && role !== 'owner') {
      return res.status(403).json({ error: 'Only comment author can edit comment content.' });
    }
    comment.content = content.trim();
  }

  comment.updatedAt = new Date().toISOString();
  db.save();

  return res.json(comment);
});

// DELETE /api/comments/:id
commentsRouter.delete('/comments/:id', requireAuth, (req: AuthRequest, res) => {
  const commentId = req.params.id;
  const index = db.getComments().findIndex(c => c.id === commentId);
  if (index === -1) return res.status(404).json({ error: 'Comment not found.' });

  const comment = db.getComments()[index];
  const doc = db.getDocuments().find(d => d.id === comment.documentId);
  const role = doc ? db.getWorkspaceUserRole(doc.workspaceId, req.user!.id) : null;

  if (comment.userId !== req.user!.id && role !== 'owner') {
    return res.status(403).json({ error: 'You can only delete your own comments.' });
  }

  db.getComments().splice(index, 1);
  db.save();

  return res.json({ message: 'Comment deleted.' });
});

// POST /api/comments/:id/replies
commentsRouter.post('/comments/:id/replies', requireAuth, (req: AuthRequest, res) => {
  const commentId = req.params.id;
  const { content } = req.body;
  const userId = req.user!.id;

  if (!content || !content.trim()) {
    return res.status(400).json({ error: 'Reply content cannot be empty.' });
  }

  const comment = db.getComments().find(c => c.id === commentId);
  if (!comment) return res.status(404).json({ error: 'Comment not found.' });

  const doc = db.getDocuments().find(d => d.id === comment.documentId);
  if (!doc) return res.status(404).json({ error: 'Document not found.' });

  const role = db.getWorkspaceUserRole(doc.workspaceId, userId);
  if (!role) return res.status(403).json({ error: 'Access denied.' });

  const reply: CommentReply = {
    id: uuidv4(),
    commentId,
    userId,
    content: content.trim(),
    createdAt: new Date().toISOString(),
  };

  if (!comment.replies) comment.replies = [];
  comment.replies.push(reply);

  // Notify original comment author if different
  if (comment.userId !== userId) {
    db.addNotification(
      comment.userId,
      'Reply to your comment',
      `${req.user!.name} replied to your comment in "${doc.title}": "${content.slice(0, 50)}"`,
      `/workspace/${doc.workspaceId}/document/${doc.id}`,
      'comment'
    );
  }

  db.save();

  const author = db.findUserById(userId);
  return res.status(201).json({
    ...reply,
    authorName: author?.name || 'Collaborator',
    authorAvatar: author?.avatar,
    authorColor: author?.color || '#2563eb',
  });
});
