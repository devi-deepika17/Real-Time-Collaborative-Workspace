import { Router } from 'express';
import { db, Document } from '../db/store.ts';
import { requireAuth, requireWorkspaceAccess, AuthRequest } from '../middleware/auth.ts';
import { v4 as uuidv4 } from 'uuid';

export const documentsRouter = Router();

// GET /api/workspaces/:id/documents
documentsRouter.get('/workspaces/:id/documents', requireAuth, requireWorkspaceAccess('viewer'), (req: AuthRequest, res) => {
  const workspaceId = req.params.id;
  const includeTrash = req.query.trash === 'true';

  const docs = db.getDocuments()
    .filter(d => d.workspaceId === workspaceId && (includeTrash ? d.isTrash : !d.isTrash))
    .map(d => {
      const author = db.findUserById(d.createdById);
      const modifier = db.findUserById(d.lastModifiedById);
      return {
        ...d,
        authorName: author?.name || 'Unknown',
        modifierName: modifier?.name || 'Unknown',
      };
    });

  return res.json(docs);
});

// POST /api/workspaces/:id/documents - create document
documentsRouter.post('/workspaces/:id/documents', requireAuth, requireWorkspaceAccess('editor'), (req: AuthRequest, res) => {
  const workspaceId = req.params.id;
  const { title = 'Untitled Document', folderId = null, icon = '📄', content = '' } = req.body;
  const userId = req.user!.id;

  const newDoc: Document = {
    id: 'doc_' + uuidv4().slice(0, 8),
    workspaceId,
    folderId: folderId || null,
    title: title.trim() || 'Untitled Document',
    icon,
    content: content || '<p>Start typing or use "/" for commands...</p>',
    isFavorite: false,
    isTrash: false,
    createdById: userId,
    lastModifiedById: userId,
    lastModifiedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    version: 1,
  };

  db.getDocuments().push(newDoc);
  db.addActivity(workspaceId, userId, 'created_document', `Created document "${newDoc.title}"`, newDoc.id);
  db.save();

  return res.status(201).json(newDoc);
});

// GET /api/documents/:id
documentsRouter.get('/documents/:id', requireAuth, (req: AuthRequest, res) => {
  const docId = req.params.id;
  const doc = db.getDocuments().find(d => d.id === docId);

  if (!doc) {
    return res.status(404).json({ error: 'Document not found.' });
  }

  // Check workspace membership
  const userRole = db.getWorkspaceUserRole(doc.workspaceId, req.user!.id);
  if (!userRole) {
    return res.status(403).json({ error: 'You do not have access to this document.' });
  }

  const author = db.findUserById(doc.createdById);
  const modifier = db.findUserById(doc.lastModifiedById);
  const comments = db.getComments().filter(c => c.documentId === doc.id);

  return res.json({
    ...doc,
    currentUserRole: userRole,
    author: author ? { id: author.id, name: author.name, avatar: author.avatar } : null,
    modifier: modifier ? { id: modifier.id, name: modifier.name, avatar: modifier.avatar } : null,
    commentsCount: comments.length,
  });
});

// PATCH /api/documents/:id - update document title, content, folder, favorite, trash
documentsRouter.patch('/documents/:id', requireAuth, (req: AuthRequest, res) => {
  const docId = req.params.id;
  const doc = db.getDocuments().find(d => d.id === docId);

  if (!doc) {
    return res.status(404).json({ error: 'Document not found.' });
  }

  const userRole = db.getWorkspaceUserRole(doc.workspaceId, req.user!.id);
  if (!userRole) {
    return res.status(403).json({ error: 'You do not have access to this document.' });
  }

  // Viewers cannot modify document title or content or delete/trash it
  const { title, content, folderId, isFavorite, isTrash, icon } = req.body;

  if ((title !== undefined || content !== undefined || folderId !== undefined || isTrash !== undefined) && userRole === 'viewer') {
    return res.status(403).json({ error: 'Viewers cannot modify document properties.' });
  }

  const userId = req.user!.id;
  let hasContentChanged = false;

  if (title !== undefined && title !== doc.title) {
    db.addActivity(doc.workspaceId, userId, 'renamed_document', `Renamed document from "${doc.title}" to "${title}"`, doc.id);
    doc.title = title;
  }

  if (content !== undefined && content !== doc.content) {
    doc.content = content;
    doc.version += 1;
    hasContentChanged = true;
  }

  if (folderId !== undefined) doc.folderId = folderId;
  if (isFavorite !== undefined) doc.isFavorite = isFavorite;
  if (icon !== undefined) doc.icon = icon;

  if (isTrash !== undefined && isTrash !== doc.isTrash) {
    doc.isTrash = isTrash;
    const action = isTrash ? 'moved_to_trash' : 'restored_document';
    db.addActivity(doc.workspaceId, userId, action, `${isTrash ? 'Moved to trash' : 'Restored'} "${doc.title}"`, doc.id);
  }

  doc.lastModifiedById = userId;
  doc.lastModifiedAt = new Date().toISOString();

  if (hasContentChanged) {
    // Only log periodic content change if needed, not every keystroke
    db.addActivity(doc.workspaceId, userId, 'edited_document', `Edited "${doc.title}"`, doc.id);
  }

  db.save();

  return res.json({
    ...doc,
    currentUserRole: userRole,
  });
});

// DELETE /api/documents/:id - permanent delete (Owner or Editor)
documentsRouter.delete('/documents/:id', requireAuth, (req: AuthRequest, res) => {
  const docId = req.params.id;
  const docIndex = db.getDocuments().findIndex(d => d.id === docId);

  if (docIndex === -1) {
    return res.status(404).json({ error: 'Document not found.' });
  }

  const doc = db.getDocuments()[docIndex];
  const userRole = db.getWorkspaceUserRole(doc.workspaceId, req.user!.id);
  if (!userRole || userRole === 'viewer') {
    return res.status(403).json({ error: 'Insufficient permissions to delete document.' });
  }

  db.getDocuments().splice(docIndex, 1);
  db.addActivity(doc.workspaceId, req.user!.id, 'deleted_document', `Permanently deleted "${doc.title}"`);
  db.save();

  return res.json({ message: 'Document permanently deleted.' });
});

// POST /api/documents/:id/duplicate
documentsRouter.post('/documents/:id/duplicate', requireAuth, (req: AuthRequest, res) => {
  const docId = req.params.id;
  const original = db.getDocuments().find(d => d.id === docId);

  if (!original) {
    return res.status(404).json({ error: 'Document not found.' });
  }

  const userRole = db.getWorkspaceUserRole(original.workspaceId, req.user!.id);
  if (!userRole || userRole === 'viewer') {
    return res.status(403).json({ error: 'Insufficient permissions to duplicate document.' });
  }

  const newDoc: Document = {
    ...original,
    id: 'doc_' + uuidv4().slice(0, 8),
    title: `${original.title} (Copy)`,
    isFavorite: false,
    isTrash: false,
    createdById: req.user!.id,
    lastModifiedById: req.user!.id,
    lastModifiedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    version: 1,
  };

  db.getDocuments().push(newDoc);
  db.addActivity(original.workspaceId, req.user!.id, 'duplicated_document', `Duplicated "${original.title}"`, newDoc.id);
  db.save();

  return res.status(201).json(newDoc);
});
