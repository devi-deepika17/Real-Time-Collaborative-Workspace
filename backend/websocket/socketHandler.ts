import { Server, Socket } from 'socket.io';
import { db } from '../db/store.ts';
import { verifyToken } from '../middleware/auth.ts';

export interface CollaboratorPresence {
  socketId: string;
  userId: string;
  name: string;
  avatar?: string;
  color: string;
  role: string;
  status: 'editing' | 'viewing';
  cursor?: {
    offset?: number;
    line?: number;
    ch?: number;
    x?: number;
    y?: number;
  };
  selection?: {
    start?: number;
    end?: number;
    text?: string;
  };
  lastSeen: number;
}

// Room tracking: documentId -> Map<socketId, CollaboratorPresence>
const documentRooms = new Map<string, Map<string, CollaboratorPresence>>();

interface SocketMetadata {
  userId: string;
  documentId?: string;
  workspaceId?: string;
}

// Socket to user/workspace mapping
const socketMeta = new Map<string, SocketMetadata>();

export function setupWebSocket(io: Server) {
  // Middleware for socket auth
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');
    if (!token) {
      return next(new Error('Authentication token required'));
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return next(new Error('Invalid token'));
    }

    const user = db.findUserById(decoded.id);
    if (!user) {
      return next(new Error('User not found'));
    }

    // Attach user to socket
    (socket as any).user = user;
    next();
  });

  io.on('connection', (socket: Socket) => {
    const user = (socket as any).user;
    const socketId = socket.id;
    socketMeta.set(socketId, { userId: user.id });

    // Join personal user room for direct notifications
    socket.join(`user-room-${user.id}`);

    // Join workspace room for global workspace events/activities
    socket.on('workspace:join', ({ workspaceId }) => {
      if (!workspaceId) return;
      const role = db.getWorkspaceUserRole(workspaceId, user.id);
      if (!role) return;

      socket.join(`workspace-room-${workspaceId}`);
      const meta: SocketMetadata = socketMeta.get(socketId) || { userId: user.id };
      meta.workspaceId = workspaceId;
      socketMeta.set(socketId, meta);
    });

    socket.on('workspace:leave', ({ workspaceId }) => {
      if (workspaceId) {
        socket.leave(`workspace-room-${workspaceId}`);
      }
    });

    // Document Join
    socket.on('document:join', ({ documentId, workspaceId }) => {
      if (!documentId) return;

      const doc = db.getDocuments().find(d => d.id === documentId);
      if (!doc) return;

      const role = db.getWorkspaceUserRole(doc.workspaceId, user.id);
      if (!role) return;

      const roomName = `document-room-${documentId}`;
      socket.join(roomName);

      const meta: SocketMetadata = socketMeta.get(socketId) || { userId: user.id };
      meta.documentId = documentId;
      meta.workspaceId = doc.workspaceId;
      socketMeta.set(socketId, meta);

      if (!documentRooms.has(documentId)) {
        documentRooms.set(documentId, new Map());
      }

      const roomPresences = documentRooms.get(documentId)!;
      const presence: CollaboratorPresence = {
        socketId,
        userId: user.id,
        name: user.name,
        avatar: user.avatar,
        color: user.color,
        role,
        status: role === 'viewer' ? 'viewing' : 'editing',
        lastSeen: Date.now(),
      };

      roomPresences.set(socketId, presence);

      // Send existing peers in this document to the newly joined client
      const activePeers = Array.from(roomPresences.values()).filter(p => p.socketId !== socketId);
      socket.emit('presence:sync', { peers: activePeers });

      // Notify other clients in the document room
      socket.to(roomName).emit('user:online', presence);
    });

    // Document Leave
    socket.on('document:leave', ({ documentId }) => {
      handleDocumentLeave(socket, documentId);
    });

    // Real-Time Document Content Update (collaborative delta sync)
    socket.on('document:update', ({ documentId, content, delta, version }) => {
      if (!documentId) return;

      const doc = db.getDocuments().find(d => d.id === documentId);
      if (!doc) return;

      const role = db.getWorkspaceUserRole(doc.workspaceId, user.id);
      if (!role || role === 'viewer') {
        socket.emit('error', { message: 'Viewers cannot modify document content.' });
        return;
      }

      // Persist in-memory and mark update
      doc.content = content;
      doc.version = (version || doc.version) + 1;
      doc.lastModifiedById = user.id;
      doc.lastModifiedAt = new Date().toISOString();
      db.save();

      const roomName = `document-room-${documentId}`;

      // Broadcast update to all peers in the room except sender
      socket.to(roomName).emit('document:update', {
        documentId,
        content,
        delta,
        version: doc.version,
        userId: user.id,
        userName: user.name,
        lastModifiedAt: doc.lastModifiedAt,
      });

      // Update presence status to 'editing'
      const roomPresences = documentRooms.get(documentId);
      if (roomPresences && roomPresences.has(socketId)) {
        const p = roomPresences.get(socketId)!;
        p.status = 'editing';
        p.lastSeen = Date.now();
        socket.to(roomName).emit('user:status', {
          userId: user.id,
          status: 'editing',
        });
      }
    });

    // Real-Time Cursor Movement
    socket.on('cursor:update', ({ documentId, cursor }) => {
      if (!documentId || !cursor) return;

      const roomPresences = documentRooms.get(documentId);
      if (roomPresences && roomPresences.has(socketId)) {
        const p = roomPresences.get(socketId)!;
        p.cursor = cursor;
        p.lastSeen = Date.now();
      }

      socket.to(`document-room-${documentId}`).emit('cursor:update', {
        userId: user.id,
        name: user.name,
        avatar: user.avatar,
        color: user.color,
        cursor,
      });
    });

    // Real-Time Text Selection
    socket.on('selection:update', ({ documentId, selection }) => {
      if (!documentId) return;

      const roomPresences = documentRooms.get(documentId);
      if (roomPresences && roomPresences.has(socketId)) {
        const p = roomPresences.get(socketId)!;
        p.selection = selection;
        p.lastSeen = Date.now();
      }

      socket.to(`document-room-${documentId}`).emit('selection:update', {
        userId: user.id,
        name: user.name,
        color: user.color,
        selection,
      });
    });

    // User status update (e.g. typing / viewing)
    socket.on('user:status', ({ documentId, status }) => {
      if (!documentId || !status) return;
      const roomPresences = documentRooms.get(documentId);
      if (roomPresences && roomPresences.has(socketId)) {
        const p = roomPresences.get(socketId)!;
        p.status = status;
      }
      socket.to(`document-room-${documentId}`).emit('user:status', {
        userId: user.id,
        status,
      });
    });

    // Comment events broadcast
    socket.on('comment:new', ({ documentId, comment }) => {
      if (!documentId || !comment) return;
      socket.to(`document-room-${documentId}`).emit('comment:created', comment);
    });

    socket.on('comment:update', ({ documentId, comment }) => {
      if (!documentId || !comment) return;
      socket.to(`document-room-${documentId}`).emit('comment:updated', comment);
    });

    socket.on('comment:delete', ({ documentId, commentId }) => {
      if (!documentId || !commentId) return;
      socket.to(`document-room-${documentId}`).emit('comment:deleted', { commentId });
    });

    // Handle Disconnect
    socket.on('disconnect', () => {
      const meta = socketMeta.get(socketId);
      if (meta && meta.documentId) {
        handleDocumentLeave(socket, meta.documentId);
      }
      socketMeta.delete(socketId);
    });
  });

  function handleDocumentLeave(socket: Socket, documentId: string) {
    const socketId = socket.id;
    const roomName = `document-room-${documentId}`;
    socket.leave(roomName);

    const roomPresences = documentRooms.get(documentId);
    if (roomPresences && roomPresences.has(socketId)) {
      const presence = roomPresences.get(socketId)!;
      roomPresences.delete(socketId);
      if (roomPresences.size === 0) {
        documentRooms.delete(documentId);
      }
      socket.to(roomName).emit('user:offline', {
        userId: presence.userId,
        socketId,
      });
    }

    const meta = socketMeta.get(socketId);
    if (meta) {
      delete meta.documentId;
    }
  }

  // Periodic cleanup for stale presences (in case of unexpected network drops)
  setInterval(() => {
    const now = Date.now();
    for (const [documentId, presences] of documentRooms.entries()) {
      for (const [socketId, presence] of presences.entries()) {
        if (now - presence.lastSeen > 60000) { // 60s inactivity
          presences.delete(socketId);
          io.to(`document-room-${documentId}`).emit('user:offline', {
            userId: presence.userId,
            socketId,
          });
        }
      }
      if (presences.size === 0) {
        documentRooms.delete(documentId);
      }
    }
  }, 30000);
}
