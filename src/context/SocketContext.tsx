import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { CollaboratorPresence, RemoteCursor, RemoteSelection } from '../types';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  activePeers: CollaboratorPresence[];
  remoteCursors: Map<string, RemoteCursor>;
  remoteSelections: Map<string, RemoteSelection>;
  joinDocumentRoom: (documentId: string, workspaceId: string) => void;
  leaveDocumentRoom: (documentId: string) => void;
  updateCursor: (documentId: string, cursor: any) => void;
  updateSelection: (documentId: string, selection: any) => void;
  updateDocumentContent: (documentId: string, content: string, delta?: any) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [activePeers, setActivePeers] = useState<CollaboratorPresence[]>([]);
  const [remoteCursors, setRemoteCursors] = useState<Map<string, RemoteCursor>>(new Map());
  const [remoteSelections, setRemoteSelections] = useState<Map<string, RemoteSelection>>(new Map());
  const currentDocRef = useRef<string | null>(null);

  useEffect(() => {
    if (!token || !user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    const s = io(window.location.origin, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    s.on('connect', () => {
      setIsConnected(true);
      if (currentDocRef.current) {
        s.emit('document:join', { documentId: currentDocRef.current });
      }
    });

    s.on('disconnect', () => {
      setIsConnected(false);
    });

    // Presence events
    s.on('presence:sync', ({ peers }: { peers: CollaboratorPresence[] }) => {
      setActivePeers(peers);
    });

    s.on('user:online', (peer: CollaboratorPresence) => {
      setActivePeers(prev => {
        const filtered = prev.filter(p => p.socketId !== peer.socketId && p.userId !== peer.userId);
        return [...filtered, peer];
      });
    });

    s.on('user:offline', ({ userId, socketId }: { userId: string; socketId: string }) => {
      setActivePeers(prev => prev.filter(p => p.socketId !== socketId && p.userId !== userId));
      setRemoteCursors(prev => {
        const next = new Map(prev);
        next.delete(userId);
        return next;
      });
      setRemoteSelections(prev => {
        const next = new Map(prev);
        next.delete(userId);
        return next;
      });
    });

    s.on('cursor:update', (data: RemoteCursor) => {
      if (data.userId === user.id) return;
      setRemoteCursors(prev => {
        const next = new Map(prev);
        next.set(data.userId, data);
        return next;
      });
    });

    s.on('selection:update', (data: RemoteSelection) => {
      if (data.userId === user.id) return;
      setRemoteSelections(prev => {
        const next = new Map(prev);
        next.set(data.userId, data);
        return next;
      });
    });

    s.on('user:status', ({ userId, status }: { userId: string; status: 'editing' | 'viewing' }) => {
      setActivePeers(prev =>
        prev.map(p => (p.userId === userId ? { ...p, status } : p))
      );
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, [token, user?.id]);

  const joinDocumentRoom = (documentId: string, workspaceId: string) => {
    currentDocRef.current = documentId;
    setActivePeers([]);
    setRemoteCursors(new Map());
    setRemoteSelections(new Map());
    if (socket && isConnected) {
      socket.emit('document:join', { documentId, workspaceId });
    }
  };

  const leaveDocumentRoom = (documentId: string) => {
    if (currentDocRef.current === documentId) {
      currentDocRef.current = null;
    }
    if (socket && isConnected) {
      socket.emit('document:leave', { documentId });
    }
    setActivePeers([]);
    setRemoteCursors(new Map());
    setRemoteSelections(new Map());
  };

  const updateCursor = (documentId: string, cursor: any) => {
    if (socket && isConnected) {
      socket.emit('cursor:update', { documentId, cursor });
    }
  };

  const updateSelection = (documentId: string, selection: any) => {
    if (socket && isConnected) {
      socket.emit('selection:update', { documentId, selection });
    }
  };

  const updateDocumentContent = (documentId: string, content: string, delta?: any) => {
    if (socket && isConnected) {
      socket.emit('document:update', { documentId, content, delta });
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        activePeers,
        remoteCursors,
        remoteSelections,
        joinDocumentRoom,
        leaveDocumentRoom,
        updateCursor,
        updateSelection,
        updateDocumentContent,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used within a SocketProvider');
  return ctx;
};
