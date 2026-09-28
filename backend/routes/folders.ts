import { Router } from 'express';
import { db, Folder } from '../db/store.ts';
import { requireAuth, requireWorkspaceAccess, AuthRequest } from '../middleware/auth.ts';
import { v4 as uuidv4 } from 'uuid';

export const foldersRouter = Router();

// GET /api/workspaces/:id/folders
foldersRouter.get('/workspaces/:id/folders', requireAuth, requireWorkspaceAccess('viewer'), (req: AuthRequest, res) => {
  const workspaceId = req.params.id;
  const folders = db.getFolders().filter(f => f.workspaceId === workspaceId);
  return res.json(folders);
});

// POST /api/workspaces/:id/folders
foldersRouter.post('/workspaces/:id/folders', requireAuth, requireWorkspaceAccess('editor'), (req: AuthRequest, res) => {
  const workspaceId = req.params.id;
  const { name, icon = '📁' } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Folder name is required.' });
  }

  const newFolder: Folder = {
    id: 'fld_' + uuidv4().slice(0, 8),
    workspaceId,
    name: name.trim(),
    icon,
    createdAt: new Date().toISOString(),
  };

  db.getFolders().push(newFolder);
  db.addActivity(workspaceId, req.user!.id, 'created_folder', `Created folder "${newFolder.name}"`);
  db.save();

  return res.status(201).json(newFolder);
});

// PATCH /api/folders/:id
foldersRouter.patch('/folders/:id', requireAuth, (req: AuthRequest, res) => {
  const folderId = req.params.id;
  const folder = db.getFolders().find(f => f.id === folderId);
  if (!folder) return res.status(404).json({ error: 'Folder not found.' });

  const role = db.getWorkspaceUserRole(folder.workspaceId, req.user!.id);
  if (!role || role === 'viewer') {
    return res.status(403).json({ error: 'Insufficient permissions to update folder.' });
  }

  const { name, icon } = req.body;
  if (name) folder.name = name.trim();
  if (icon) folder.icon = icon;
  db.save();

  return res.json(folder);
});

// DELETE /api/folders/:id
foldersRouter.delete('/folders/:id', requireAuth, (req: AuthRequest, res) => {
  const folderId = req.params.id;
  const index = db.getFolders().findIndex(f => f.id === folderId);
  if (index === -1) return res.status(404).json({ error: 'Folder not found.' });

  const folder = db.getFolders()[index];
  const role = db.getWorkspaceUserRole(folder.workspaceId, req.user!.id);
  if (!role || role === 'viewer') {
    return res.status(403).json({ error: 'Insufficient permissions to delete folder.' });
  }

  // Unlink documents in this folder
  db.getDocuments()
    .filter(d => d.folderId === folderId)
    .forEach(d => { d.folderId = null; });

  db.getFolders().splice(index, 1);
  db.addActivity(folder.workspaceId, req.user!.id, 'deleted_folder', `Deleted folder "${folder.name}"`);
  db.save();

  return res.json({ message: 'Folder deleted and contained documents unlinked.' });
});
