import { Router } from 'express';
import { db } from '../db/store.ts';
import { requireAuth, AuthRequest } from '../middleware/auth.ts';

export const notificationsRouter = Router();

// GET /api/notifications
notificationsRouter.get('/', requireAuth, (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const notifs = db.getNotifications()
    .filter(n => n.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return res.json(notifs);
});

// PATCH /api/notifications/:id/read
notificationsRouter.patch('/:id/read', requireAuth, (req: AuthRequest, res) => {
  const notifId = req.params.id;
  const notif = db.getNotifications().find(n => n.id === notifId && n.userId === req.user!.id);
  if (!notif) return res.status(404).json({ error: 'Notification not found.' });

  notif.read = true;
  db.save();

  return res.json(notif);
});

// POST /api/notifications/mark-all-read
notificationsRouter.post('/mark-all-read', requireAuth, (req: AuthRequest, res) => {
  const userId = req.user!.id;
  db.getNotifications()
    .filter(n => n.userId === userId)
    .forEach(n => { n.read = true; });

  db.save();
  return res.json({ message: 'All notifications marked as read.' });
});
