import { Router } from 'express';
import { db, WorkspaceRole } from '../db/store.ts';
import { requireAuth, requireWorkspaceAccess, AuthRequest } from '../middleware/auth.ts';
import { v4 as uuidv4 } from 'uuid';

export const membersRouter = Router({ mergeParams: true });

// GET /api/workspaces/:id/members
membersRouter.get('/:id/members', requireAuth, requireWorkspaceAccess('viewer'), (req: AuthRequest, res) => {
  const workspaceId = req.params.id;
  const members = db.getWorkspaceMembers()
    .filter(m => m.workspaceId === workspaceId)
    .map(m => {
      const u = db.findUserById(m.userId);
      return {
        id: m.id,
        workspaceId: m.workspaceId,
        userId: m.userId,
        role: m.role,
        joinedAt: m.joinedAt,
        name: u?.name || 'Unknown',
        email: u?.email || '',
        avatar: u?.avatar,
        color: u?.color || '#2563eb',
      };
    });

  return res.json(members);
});

// POST /api/workspaces/:id/invite
membersRouter.post('/:id/invite', requireAuth, requireWorkspaceAccess('owner'), (req: AuthRequest, res) => {
  const workspaceId = req.params.id;
  const { email, role = 'editor' } = req.body;

  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'Valid email address is required.' });
  }

  const validRoles: WorkspaceRole[] = ['owner', 'editor', 'viewer'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ error: 'Role must be owner, editor, or viewer.' });
  }

  const workspace = db.getWorkspaces().find(w => w.id === workspaceId);
  if (!workspace) return res.status(404).json({ error: 'Workspace not found.' });

  // Check if user already exists
  const existingUser = db.findUserByEmail(email.trim());

  if (existingUser) {
    const existingMember = db.getWorkspaceMembers().find(
      m => m.workspaceId === workspaceId && m.userId === existingUser.id
    );

    if (existingMember) {
      return res.status(409).json({ error: 'User is already a member of this workspace.' });
    }

    // Add user directly as member
    const newMember = {
      id: uuidv4(),
      workspaceId,
      userId: existingUser.id,
      role: role as WorkspaceRole,
      joinedAt: new Date().toISOString(),
    };
    db.getWorkspaceMembers().push(newMember);

    db.addNotification(
      existingUser.id,
      'Workspace Invitation',
      `You were added to "${workspace.name}" as an ${role}`,
      `/workspace/${workspaceId}`,
      'invite'
    );

    db.addActivity(workspaceId, req.user!.id, 'invited_member', `Invited ${existingUser.name} (${existingUser.email}) as ${role}`);
    db.save();

    return res.status(201).json({
      message: `${existingUser.name} added to workspace as ${role}.`,
      member: {
        ...newMember,
        name: existingUser.name,
        email: existingUser.email,
        avatar: existingUser.avatar,
        color: existingUser.color,
      },
    });
  }

  // If user doesn't exist yet, create invitation record
  const token = uuidv4();
  const invitation = {
    id: uuidv4(),
    workspaceId,
    email: email.trim().toLowerCase(),
    role: role as WorkspaceRole,
    token,
    status: 'pending' as const,
    createdAt: new Date().toISOString(),
  };

  db.getInvitations().push(invitation);
  db.addActivity(workspaceId, req.user!.id, 'sent_invitation', `Sent workspace invitation to ${email} as ${role}`);
  db.save();

  return res.status(201).json({
    message: `Invitation generated for ${email}.`,
    invitation,
    inviteLink: `/register?invite=${token}&email=${encodeURIComponent(email)}`,
  });
});

// PATCH /api/workspaces/:id/members/:userId - change member role
membersRouter.patch('/:id/members/:userId', requireAuth, requireWorkspaceAccess('owner'), (req: AuthRequest, res) => {
  const { id: workspaceId, userId } = req.params;
  const { role } = req.body;

  const validRoles: WorkspaceRole[] = ['owner', 'editor', 'viewer'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ error: 'Invalid role specified.' });
  }

  const workspace = db.getWorkspaces().find(w => w.id === workspaceId);
  if (!workspace) return res.status(404).json({ error: 'Workspace not found.' });

  if (workspace.ownerId === userId && role !== 'owner') {
    return res.status(400).json({ error: 'Workspace owner role cannot be downgraded directly. Transfer ownership first.' });
  }

  const member = db.getWorkspaceMembers().find(m => m.workspaceId === workspaceId && m.userId === userId);
  if (!member) {
    return res.status(404).json({ error: 'Member not found in this workspace.' });
  }

  member.role = role;
  const targetUser = db.findUserById(userId);

  db.addNotification(
    userId,
    'Role Updated',
    `Your role in "${workspace.name}" was changed to ${role}`,
    `/workspace/${workspaceId}`,
    'invite'
  );

  db.addActivity(
    workspaceId,
    req.user!.id,
    'updated_member_role',
    `Updated ${targetUser?.name || 'user'}'s role to ${role}`
  );

  db.save();
  return res.json({ message: 'Role updated successfully', member });
});

// DELETE /api/workspaces/:id/members/:userId - remove member from workspace
membersRouter.delete('/:id/members/:userId', requireAuth, requireWorkspaceAccess('owner'), (req: AuthRequest, res) => {
  const { id: workspaceId, userId } = req.params;

  const workspace = db.getWorkspaces().find(w => w.id === workspaceId);
  if (!workspace) return res.status(404).json({ error: 'Workspace not found.' });

  if (workspace.ownerId === userId) {
    return res.status(400).json({ error: 'Cannot remove the primary owner of the workspace.' });
  }

  const index = db.getWorkspaceMembers().findIndex(m => m.workspaceId === workspaceId && m.userId === userId);
  if (index === -1) {
    return res.status(404).json({ error: 'Member not found in workspace.' });
  }

  const removed = db.getWorkspaceMembers().splice(index, 1)[0];
  const targetUser = db.findUserById(userId);

  db.addActivity(workspaceId, req.user!.id, 'removed_member', `Removed ${targetUser?.name || 'user'} from workspace`);
  db.save();

  return res.json({ message: 'Member removed from workspace.', removed });
});
