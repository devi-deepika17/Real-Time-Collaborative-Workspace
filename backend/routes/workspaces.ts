import { Router } from 'express';
import { db, Workspace, WorkspaceMember } from '../db/store.ts';
import { requireAuth, requireWorkspaceAccess, AuthRequest } from '../middleware/auth.ts';
import { v4 as uuidv4 } from 'uuid';

export const workspaceRouter = Router();

// GET /api/workspaces - return workspaces where user is a member or owner
workspaceRouter.get('/', requireAuth, (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const memberWorkspaceIds = new Set(
    db.getWorkspaceMembers()
      .filter(m => m.userId === userId)
      .map(m => m.workspaceId)
  );

  const workspaces = db.getWorkspaces().filter(w => w.ownerId === userId || memberWorkspaceIds.has(w.id));
  
  // Attach current user's role to each workspace
  const enriched = workspaces.map(w => {
    const role = db.getWorkspaceUserRole(w.id, userId);
    const memberCount = db.getWorkspaceMembers().filter(m => m.workspaceId === w.id).length;
    const documentCount = db.getDocuments().filter(d => d.workspaceId === w.id && !d.isTrash).length;
    return {
      ...w,
      currentUserRole: role,
      memberCount,
      documentCount,
    };
  });

  return res.json(enriched);
});

// POST /api/workspaces - create new workspace
workspaceRouter.post('/', requireAuth, (req: AuthRequest, res) => {
  const { name, description, icon } = req.body;
  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'Workspace name is required.' });
  }

  const userId = req.user!.id;
  const newWorkspace: Workspace = {
    id: 'ws_' + uuidv4().slice(0, 8),
    name: name.trim(),
    description: description?.trim() || '',
    ownerId: userId,
    icon: icon || '📁',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.getWorkspaces().push(newWorkspace);

  const newMember: WorkspaceMember = {
    id: uuidv4(),
    workspaceId: newWorkspace.id,
    userId,
    role: 'owner',
    joinedAt: new Date().toISOString(),
  };
  db.getWorkspaceMembers().push(newMember);

  // Create initial Welcome Document
  const welcomeDocId = 'doc_' + uuidv4().slice(0, 8);
  db.getDocuments().push({
    id: welcomeDocId,
    workspaceId: newWorkspace.id,
    folderId: null,
    title: 'Untitled Document',
    icon: '📄',
    content: '<p>Start collaborating by typing here...</p>',
    isFavorite: false,
    isTrash: false,
    createdById: userId,
    lastModifiedById: userId,
    lastModifiedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    version: 1,
  });

  db.addActivity(newWorkspace.id, userId, 'created_workspace', `Created workspace "${newWorkspace.name}"`);
  db.save();

  return res.status(201).json({
    ...newWorkspace,
    currentUserRole: 'owner',
    memberCount: 1,
    documentCount: 1,
  });
});

// GET /api/workspaces/:id - single workspace details
workspaceRouter.get('/:id', requireAuth, requireWorkspaceAccess('viewer'), (req: AuthRequest, res) => {
  const workspaceId = req.params.id;
  const workspace = db.getWorkspaces().find(w => w.id === workspaceId);
  if (!workspace) return res.status(404).json({ error: 'Workspace not found.' });

  const members = db.getWorkspaceMembers()
    .filter(m => m.workspaceId === workspaceId)
    .map(m => {
      const u = db.findUserById(m.userId);
      return {
        ...m,
        user: u ? { id: u.id, name: u.name, email: u.email, avatar: u.avatar, color: u.color } : null,
      };
    });

  const folders = db.getFolders().filter(f => f.workspaceId === workspaceId);
  const documents = db.getDocuments().filter(d => d.workspaceId === workspaceId && !d.isTrash);
  const role = req.workspaceRole;

  return res.json({
    ...workspace,
    currentUserRole: role,
    members,
    folders,
    documents,
  });
});

// PATCH /api/workspaces/:id - update workspace (only owner)
workspaceRouter.patch('/:id', requireAuth, requireWorkspaceAccess('owner'), (req: AuthRequest, res) => {
  const workspaceId = req.params.id;
  const workspace = db.getWorkspaces().find(w => w.id === workspaceId);
  if (!workspace) return res.status(404).json({ error: 'Workspace not found.' });

  const { name, description, icon } = req.body;
  if (name !== undefined) workspace.name = name.trim();
  if (description !== undefined) workspace.description = description.trim();
  if (icon !== undefined) workspace.icon = icon;
  workspace.updatedAt = new Date().toISOString();

  db.addActivity(workspaceId, req.user!.id, 'updated_workspace', `Updated workspace settings for "${workspace.name}"`);
  db.save();

  return res.json(workspace);
});

// DELETE /api/workspaces/:id - delete workspace (only owner)
workspaceRouter.delete('/:id', requireAuth, requireWorkspaceAccess('owner'), (req: AuthRequest, res) => {
  const workspaceId = req.params.id;
  const wsIndex = db.getWorkspaces().findIndex(w => w.id === workspaceId);
  if (wsIndex === -1) return res.status(404).json({ error: 'Workspace not found.' });

  db.getWorkspaces().splice(wsIndex, 1);
  // Cleanup members, documents, folders, comments
  db.save();

  return res.json({ message: 'Workspace deleted successfully.' });
});

// GET /api/workspaces/:id/search?q=query
workspaceRouter.get('/:id/search', requireAuth, requireWorkspaceAccess('viewer'), (req: AuthRequest, res) => {
  const workspaceId = req.params.id;
  const query = (req.query.q as string || '').toLowerCase().trim();

  if (!query) {
    return res.json({ documents: [], folders: [], comments: [], members: [] });
  }

  const documents = db.getDocuments()
    .filter(d => d.workspaceId === workspaceId && !d.isTrash && 
      (d.title.toLowerCase().includes(query) || d.content.toLowerCase().includes(query)))
    .map(d => ({
      id: d.id,
      title: d.title,
      icon: d.icon,
      matchedContent: d.content.replace(/<[^>]*>?/gm, '').slice(0, 100) + '...',
      updatedAt: d.lastModifiedAt,
    }));

  const folders = db.getFolders()
    .filter(f => f.workspaceId === workspaceId && f.name.toLowerCase().includes(query));

  const workspaceMembers = db.getWorkspaceMembers()
    .filter(m => m.workspaceId === workspaceId)
    .map(m => {
      const u = db.findUserById(m.userId);
      return u && (u.name.toLowerCase().includes(query) || u.email.toLowerCase().includes(query))
        ? { id: u.id, name: u.name, email: u.email, avatar: u.avatar, role: m.role }
        : null;
    })
    .filter(Boolean);

  const comments = db.getComments()
    .filter(c => {
      const doc = db.getDocuments().find(d => d.id === c.documentId);
      return doc && doc.workspaceId === workspaceId && c.content.toLowerCase().includes(query);
    })
    .map(c => {
      const doc = db.getDocuments().find(d => d.id === c.documentId);
      const author = db.findUserById(c.userId);
      return {
        id: c.id,
        content: c.content,
        documentId: c.documentId,
        documentTitle: doc?.title || 'Unknown Document',
        authorName: author?.name || 'Collaborator',
        createdAt: c.createdAt,
      };
    });

  return res.json({ documents, folders, members: workspaceMembers, comments });
});

// GET /api/workspaces/:id/activity
workspaceRouter.get('/:id/activity', requireAuth, requireWorkspaceAccess('viewer'), (req: AuthRequest, res) => {
  const workspaceId = req.params.id;
  const activities = db.getActivities()
    .filter(a => a.workspaceId === workspaceId)
    .map(a => {
      const u = db.findUserById(a.userId);
      const doc = a.documentId ? db.getDocuments().find(d => d.id === a.documentId) : null;
      return {
        ...a,
        userName: u?.name || 'Unknown User',
        userAvatar: u?.avatar,
        userColor: u?.color || '#2563eb',
        documentTitle: doc?.title,
      };
    });

  return res.json(activities);
});
