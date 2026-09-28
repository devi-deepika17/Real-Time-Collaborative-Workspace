import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db/store.ts';
import { generateToken, requireAuth, AuthRequest } from '../middleware/auth.ts';

export const authRouter = Router();

// POST /api/auth/register
authRouter.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    const existing = db.findUserByEmail(email);
    if (existing) {
      return res.status(409).json({ error: 'A user with this email already exists.' });
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    const newUser = db.createUser({
      name,
      email: email.toLowerCase().trim(),
      passwordHash,
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
    });

    // Create a default workspace for the new user
    const defaultWorkspaceId = 'ws_' + Math.random().toString(36).substring(2, 9);
    const newWorkspace = {
      id: defaultWorkspaceId,
      name: `${name}'s Workspace`,
      description: 'Personal and collaborative workspace',
      ownerId: newUser.id,
      icon: '✨',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.getWorkspaces().push(newWorkspace);
    db.getWorkspaceMembers().push({
      id: Math.random().toString(36).substring(2, 11),
      workspaceId: defaultWorkspaceId,
      userId: newUser.id,
      role: 'owner',
      joinedAt: new Date().toISOString(),
    });

    // Create a starter document
    const starterDocId = 'doc_' + Math.random().toString(36).substring(2, 9);
    db.getDocuments().push({
      id: starterDocId,
      workspaceId: defaultWorkspaceId,
      folderId: null,
      title: 'Getting Started with Your Workspace',
      icon: '📝',
      content: `<h2>Welcome, ${name}!</h2>
<p>This is your personal collaborative document. You can:</p>
<ul>
  <li>Invite teammates to this workspace and edit together in real time.</li>
  <li>Organize your ideas into folders.</li>
  <li>Add comments and reply to discussion threads.</li>
</ul>`,
      isFavorite: true,
      isTrash: false,
      createdById: newUser.id,
      lastModifiedById: newUser.id,
      lastModifiedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      version: 1,
    });

    db.addActivity(defaultWorkspaceId, newUser.id, 'created_workspace', `Created workspace "${newWorkspace.name}"`);
    db.save();

    const token = generateToken(newUser);
    const { passwordHash: _, ...safeUser } = newUser;
    return res.status(201).json({ token, user: safeUser });
  } catch (error: any) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Failed to register user.' });
  }
});

// POST /api/auth/login
authRouter.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = db.findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isValid = bcrypt.compareSync(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = generateToken(user);
    const { passwordHash: _, ...safeUser } = user;
    return res.json({ token, user: safeUser });
  } catch (error: any) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Failed to log in.' });
  }
});

// POST /api/auth/logout
authRouter.post('/logout', (_req, res) => {
  return res.json({ message: 'Successfully logged out.' });
});

// GET /api/auth/me
authRouter.get('/me', requireAuth, (req: AuthRequest, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  const { passwordHash: _, ...safeUser } = req.user;
  return res.json({ user: safeUser });
});

// GET /api/auth/demo-users (helpful for 1-click login and fast testing across accounts)
authRouter.get('/demo-users', (_req, res) => {
  const safeUsers = db.getUsers().map(({ passwordHash: _, ...u }) => ({
    ...u,
    demoPassword: 'password123',
  }));
  return res.json(safeUsers);
});
