export type WorkspaceRole = 'owner' | 'editor' | 'viewer';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  color: string;
  createdAt?: string;
  demoPassword?: string;
}

export interface Workspace {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  ownerId: string;
  currentUserRole?: WorkspaceRole;
  memberCount?: number;
  documentCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceMember {
  id: string;
  workspaceId: string;
  userId: string;
  role: WorkspaceRole;
  joinedAt: string;
  name: string;
  email: string;
  avatar?: string;
  color: string;
}

export interface Folder {
  id: string;
  workspaceId: string;
  name: string;
  icon?: string;
  createdAt: string;
}

export interface DocumentItem {
  id: string;
  workspaceId: string;
  folderId?: string | null;
  title: string;
  content: string;
  icon?: string;
  isFavorite: boolean;
  isTrash: boolean;
  createdById: string;
  lastModifiedById: string;
  lastModifiedAt: string;
  createdAt: string;
  version: number;
  currentUserRole?: WorkspaceRole;
  authorName?: string;
  modifierName?: string;
}

export interface CommentReply {
  id: string;
  commentId: string;
  userId: string;
  content: string;
  createdAt: string;
  authorName?: string;
  authorAvatar?: string;
  authorColor?: string;
}

export interface CommentItem {
  id: string;
  documentId: string;
  userId: string;
  content: string;
  selectedText?: string;
  position?: { from?: number; to?: number; line?: number };
  resolved: boolean;
  createdAt: string;
  updatedAt: string;
  authorName?: string;
  authorAvatar?: string;
  authorColor?: string;
  replies: CommentReply[];
}

export interface ActivityItem {
  id: string;
  workspaceId: string;
  documentId?: string | null;
  userId: string;
  action: string;
  details: string;
  timestamp: string;
  userName?: string;
  userAvatar?: string;
  userColor?: string;
  documentTitle?: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  link: string;
  read: boolean;
  type: 'mention' | 'invite' | 'comment' | 'document';
  createdAt: string;
}

export interface RemoteCursor {
  userId: string;
  name: string;
  avatar?: string;
  color: string;
  cursor?: {
    offset?: number;
    line?: number;
    ch?: number;
    x?: number;
    y?: number;
  };
}

export interface RemoteSelection {
  userId: string;
  name: string;
  color: string;
  selection?: {
    start?: number;
    end?: number;
    text?: string;
  };
}

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
  lastSeen?: number;
}
