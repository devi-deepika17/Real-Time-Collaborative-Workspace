import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db, User, WorkspaceRole } from '../db/store.ts';

const JWT_SECRET = process.env.JWT_SECRET || 'collabspace-super-secret-jwt-key-2026';

export interface AuthRequest extends Request {
  user?: User;
  workspaceRole?: WorkspaceRole;
}

export function generateToken(user: User): string {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function verifyToken(token: string): { id: string; email: string; name: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { id: string; email: string; name: string };
  } catch {
    return null;
  }
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. No Bearer token provided.' });
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }

  const user = db.findUserById(decoded.id);
  if (!user) {
    return res.status(401).json({ error: 'User not found.' });
  }

  req.user = user;
  next();
}

/**
 * Middleware to verify that the authenticated user belongs to the workspace
 * and has at least the required role ('viewer' <= 'editor' <= 'owner')
 */
export function requireWorkspaceAccess(minRole: WorkspaceRole = 'viewer') {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    const workspaceId = (req.params.workspaceId || req.params.id || req.body.workspaceId) as string;
    if (!workspaceId) {
      return res.status(400).json({ error: 'Workspace ID is required.' });
    }

    const role = db.getWorkspaceUserRole(workspaceId, req.user.id);
    if (!role) {
      return res.status(403).json({ error: 'You do not have access to this workspace.' });
    }

    const roleWeights: Record<WorkspaceRole, number> = {
      viewer: 1,
      editor: 2,
      owner: 3,
    };

    if (roleWeights[role] < roleWeights[minRole]) {
      return res.status(403).json({ 
        error: `Insufficient permissions. Requires '${minRole}' role, but your role is '${role}'.` 
      });
    }

    req.workspaceRole = role;
    next();
  };
}
