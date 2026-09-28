import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

export type WorkspaceRole = 'owner' | 'editor' | 'viewer';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  avatar?: string;
  color: string;
  createdAt: string;
}

export interface Workspace {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  icon?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceMember {
  id: string;
  workspaceId: string;
  userId: string;
  role: WorkspaceRole;
  joinedAt: string;
}

export interface Folder {
  id: string;
  workspaceId: string;
  name: string;
  icon?: string;
  createdAt: string;
}

export interface Document {
  id: string;
  workspaceId: string;
  folderId?: string | null;
  title: string;
  content: string; // HTML / Rich Text
  icon?: string;
  isFavorite: boolean;
  isTrash: boolean;
  createdById: string;
  lastModifiedById: string;
  lastModifiedAt: string;
  createdAt: string;
  version: number;
}

export interface CommentReply {
  id: string;
  commentId: string;
  userId: string;
  content: string;
  createdAt: string;
}

export interface Comment {
  id: string;
  documentId: string;
  userId: string;
  content: string;
  selectedText?: string;
  position?: { from?: number; to?: number; line?: number };
  resolved: boolean;
  createdAt: string;
  updatedAt: string;
  replies: CommentReply[];
}

export interface Activity {
  id: string;
  workspaceId: string;
  documentId?: string | null;
  userId: string;
  action: string;
  details: string;
  timestamp: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  link: string;
  read: boolean;
  type: 'mention' | 'invite' | 'comment' | 'document';
  createdAt: string;
}

export interface Invitation {
  id: string;
  workspaceId: string;
  email: string;
  role: WorkspaceRole;
  token: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
}

export interface DatabaseSchema {
  users: User[];
  workspaces: Workspace[];
  workspaceMembers: WorkspaceMember[];
  folders: Folder[];
  documents: Document[];
  comments: Comment[];
  activities: Activity[];
  notifications: Notification[];
  invitations: Invitation[];
}

const DB_PATH = path.resolve(process.cwd(), 'data', 'workspace_db.json');

const USER_COLORS = [
  '#2563eb', // blue
  '#059669', // emerald
  '#7c3aed', // violet
  '#db2777', // pink
  '#d97706', // amber
  '#0891b2', // cyan
  '#dc2626', // red
  '#4f46e5', // indigo
];

class Database {
  private data: DatabaseSchema = {
    users: [],
    workspaces: [],
    workspaceMembers: [],
    folders: [],
    documents: [],
    comments: [],
    activities: [],
    notifications: [],
    invitations: [],
  };

  private initialized = false;

  constructor() {
    this.init();
  }

  private init() {
    if (this.initialized) return;
    try {
      const dataDir = path.dirname(DB_PATH);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      if (fs.existsSync(DB_PATH)) {
        const raw = fs.readFileSync(DB_PATH, 'utf-8');
        this.data = JSON.parse(raw);
      } else {
        this.seedInitialData();
        this.save();
      }
      this.initialized = true;
    } catch (e) {
      console.error('Error initializing database, using in-memory default:', e);
      this.seedInitialData();
      this.initialized = true;
    }
  }

  public save() {
    try {
      const dataDir = path.dirname(DB_PATH);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      fs.writeFileSync(DB_PATH, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to persist database to disk:', err);
    }
  }

  public seedInitialData() {
    const salt = bcrypt.genSaltSync(10);
    const defaultPasswordHash = bcrypt.hashSync('password123', salt);

    const userAlice: User = {
      id: 'usr_alice',
      email: 'alice@collab.io',
      passwordHash: defaultPasswordHash,
      name: 'Alice Chen',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      color: '#2563eb',
      createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    };

    const userBob: User = {
      id: 'usr_bob',
      email: 'bob@collab.io',
      passwordHash: defaultPasswordHash,
      name: 'Bob Miller',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      color: '#059669',
      createdAt: new Date(Date.now() - 25 * 86400000).toISOString(),
    };

    const userSarah: User = {
      id: 'sarah@collab.io',
      email: 'sarah@collab.io',
      passwordHash: defaultPasswordHash,
      name: 'Sarah Connor',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
      color: '#db2777',
      createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
    };

    const workspace1: Workspace = {
      id: 'ws_product_eng',
      name: 'Acme Product & Engineering',
      description: 'Collaborative hub for core product specs, real-time architecture, and quarterly roadmaps.',
      ownerId: userAlice.id,
      icon: '🚀',
      createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const workspace2: Workspace = {
      id: 'ws_design_sys',
      name: 'Design Systems & Brand',
      description: 'Component libraries, design tokens, and user research guidelines.',
      ownerId: userSarah.id,
      icon: '🎨',
      createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const members: WorkspaceMember[] = [
      { id: uuidv4(), workspaceId: workspace1.id, userId: userAlice.id, role: 'owner', joinedAt: new Date(Date.now() - 15 * 86400000).toISOString() },
      { id: uuidv4(), workspaceId: workspace1.id, userId: userBob.id, role: 'editor', joinedAt: new Date(Date.now() - 14 * 86400000).toISOString() },
      { id: uuidv4(), workspaceId: workspace1.id, userId: userSarah.id, role: 'viewer', joinedAt: new Date(Date.now() - 10 * 86400000).toISOString() },
      
      { id: uuidv4(), workspaceId: workspace2.id, userId: userSarah.id, role: 'owner', joinedAt: new Date(Date.now() - 10 * 86400000).toISOString() },
      { id: uuidv4(), workspaceId: workspace2.id, userId: userAlice.id, role: 'editor', joinedAt: new Date(Date.now() - 9 * 86400000).toISOString() },
    ];

    const folder1: Folder = {
      id: 'fld_roadmap',
      workspaceId: workspace1.id,
      name: 'Quarterly Roadmaps',
      icon: '📁',
      createdAt: new Date(Date.now() - 12 * 86400000).toISOString(),
    };

    const folder2: Folder = {
      id: 'fld_architecture',
      workspaceId: workspace1.id,
      name: 'Technical Architecture',
      icon: '⚡',
      createdAt: new Date(Date.now() - 11 * 86400000).toISOString(),
    };

    const doc1: Document = {
      id: 'doc_roadmap_2026',
      workspaceId: workspace1.id,
      folderId: folder1.id,
      title: '2026 Product Strategy & Real-Time Collaboration Roadmap',
      icon: '🗺️',
      isFavorite: true,
      isTrash: false,
      createdById: userAlice.id,
      lastModifiedById: userBob.id,
      lastModifiedAt: new Date(Date.now() - 10 * 60000).toISOString(),
      createdAt: new Date(Date.now() - 8 * 86400000).toISOString(),
      version: 1,
      content: `<h2>Executive Summary</h2>
<p>Our key priority for this quarter is delivering a low-latency, conflict-free <strong>collaborative workspace</strong> that empowers teams to brainstorm, draft specifications, and review documents together seamlessly.</p>

<h3>Core Pillars</h3>
<ul>
  <li><strong>Instant State Synchronization:</strong> Sub-50ms delta broadcast using WebSocket connection rooms.</li>
  <li><strong>Live Presence & Telemetry:</strong> Colored user avatars, live caret cursors, and active selection highlights.</li>
  <li><strong>Contextual Discussions:</strong> Inline comment threads with @mentions and notification delivery.</li>
  <li><strong>Role-Based Access Control:</strong> Fine-grained permissions separating Owners, Editors, and Viewers.</li>
</ul>

<h3>Key Deliverables & Milestones</h3>
<table>
  <thead>
    <tr>
      <th>Milestone</th>
      <th>Lead</th>
      <th>Status</th>
      <th>Target Date</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>CRDT / Real-Time Delta Protocol</td>
      <td>Bob Miller</td>
      <td>In Review</td>
      <td>Oct 15, 2026</td>
    </tr>
    <tr>
      <td>Multi-Cursor Rendering Engine</td>
      <td>Alice Chen</td>
      <td>Active</td>
      <td>Oct 28, 2026</td>
    </tr>
    <tr>
      <td>Comment Threads & @Mentions</td>
      <td>Sarah Connor</td>
      <td>Completed</td>
      <td>Nov 10, 2026</td>
    </tr>
  </tbody>
</table>

<blockquote>Note: Ensure seamless backward compatibility with REST endpoints and full autosaving to the persistent storage layer.</blockquote>

<p>Feel free to jump in and edit this document in real time! You will see other participants' cursors move live as changes happen.</p>`,
    };

    const doc2: Document = {
      id: 'doc_arch_sync',
      workspaceId: workspace1.id,
      folderId: folder2.id,
      title: 'Real-Time Sync Protocol & Room Architecture',
      icon: '📐',
      isFavorite: true,
      isTrash: false,
      createdById: userBob.id,
      lastModifiedById: userAlice.id,
      lastModifiedAt: new Date(Date.now() - 45 * 60000).toISOString(),
      createdAt: new Date(Date.now() - 6 * 86400000).toISOString(),
      version: 1,
      content: `<h2>1. Synchronization Overview</h2>
<p>Each document maps to an isolated WebSocket room identified as <code>document-room-{documentId}</code>. Clients dispatch incremental updates with operation sequence IDs to ensure deterministic state convergence.</p>

<pre><code>// Client sends action -> Server validates role -> Server broadcasts to peers
socket.emit('document:update', {
  documentId: 'doc_roadmap_2026',
  delta: { html: updatedContent },
  cursor: { offset: 142 }
});
</code></pre>

<h3>2. Presence Awareness & Selection Bounds</h3>
<p>When any collaborator focuses or moves their cursor inside the editor, an event <code>cursor:update</code> is broadcast containing the absolute position and current range selection. Remote viewports render colored badges corresponding to each user's assigned palette.</p>`,
    };

    const doc3: Document = {
      id: 'doc_welcome',
      workspaceId: workspace1.id,
      folderId: null,
      title: 'Welcome to CollabSpace & Quickstart Guide',
      icon: '👋',
      isFavorite: false,
      isTrash: false,
      createdById: userAlice.id,
      lastModifiedById: userAlice.id,
      lastModifiedAt: new Date(Date.now() - 120 * 60000).toISOString(),
      createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
      version: 1,
      content: `<h2>Welcome to your new Collaborative Workspace!</h2>
<p>This workspace is designed for real-time multiplayer co-authoring. Here is how you can test everything right away:</p>
<ol>
  <li><strong>Open two browser windows:</strong> Log into window #1 as <em>Alice Chen</em> and window #2 as <em>Bob Miller</em>.</li>
  <li><strong>Navigate to the same document:</strong> Watch both user avatars illuminate green in the top right presence bar!</li>
  <li><strong>Type simultaneously:</strong> Notice how text syncs instantly across windows without conflicting or losing characters.</li>
  <li><strong>Move your mouse or cursor:</strong> See live cursor flags with the user's name moving across paragraphs.</li>
  <li><strong>Leave an inline comment:</strong> Select any text, click "Comment", and tag <code>@bob</code>. Bob receives a notification immediately.</li>
</ol>`,
    };

    const comment1: Comment = {
      id: 'comment_1',
      documentId: doc1.id,
      userId: userSarah.id,
      content: 'Should we update this section to include offline sync buffering as well? @bob',
      selectedText: 'Sub-50ms delta broadcast using WebSocket connection rooms.',
      resolved: false,
      createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 3600000).toISOString(),
      replies: [
        {
          id: uuidv4(),
          commentId: 'comment_1',
          userId: userBob.id,
          content: "Yes, I'll take care of it. Adding client queueing for reconnects.",
          createdAt: new Date(Date.now() - 1 * 3600000).toISOString(),
        },
      ],
    };

    const comment2: Comment = {
      id: 'comment_2',
      documentId: doc1.id,
      userId: userBob.id,
      content: 'The milestone dates look solid! I will finalize the RFC by Friday.',
      selectedText: 'Key Deliverables & Milestones',
      resolved: true,
      createdAt: new Date(Date.now() - 5 * 3600000).toISOString(),
      updatedAt: new Date(Date.now() - 4 * 3600000).toISOString(),
      replies: [],
    };

    const activities: Activity[] = [
      {
        id: uuidv4(),
        workspaceId: workspace1.id,
        documentId: doc1.id,
        userId: userBob.id,
        action: 'edited_document',
        details: 'Updated milestone dates in 2026 Product Strategy',
        timestamp: new Date(Date.now() - 10 * 60000).toISOString(),
      },
      {
        id: uuidv4(),
        workspaceId: workspace1.id,
        documentId: doc1.id,
        userId: userSarah.id,
        action: 'added_comment',
        details: 'Commented on 2026 Product Strategy',
        timestamp: new Date(Date.now() - 2 * 3600000).toISOString(),
      },
      {
        id: uuidv4(),
        workspaceId: workspace1.id,
        documentId: doc2.id,
        userId: userAlice.id,
        action: 'created_document',
        details: 'Created Real-Time Sync Protocol & Room Architecture',
        timestamp: new Date(Date.now() - 6 * 86400000).toISOString(),
      },
    ];

    const notifications: Notification[] = [
      {
        id: uuidv4(),
        userId: userAlice.id,
        title: 'New comment mention',
        message: 'Sarah mentioned @bob in "2026 Product Strategy"',
        link: `/workspace/${workspace1.id}/document/${doc1.id}`,
        read: false,
        type: 'mention',
        createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
      },
      {
        id: uuidv4(),
        userId: userAlice.id,
        title: 'Workspace update',
        message: 'Bob Miller joined Acme Product & Engineering as Editor',
        link: `/workspace/${workspace1.id}`,
        read: true,
        type: 'invite',
        createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
      },
    ];

    this.data = {
      users: [userAlice, userBob, userSarah],
      workspaces: [workspace1, workspace2],
      workspaceMembers: members,
      folders: [folder1, folder2],
      documents: [doc1, doc2, doc3],
      comments: [comment1, comment2],
      activities: activities,
      notifications: notifications,
      invitations: [],
    };
  }

  // Getters
  public getUsers() { return this.data.users; }
  public getWorkspaces() { return this.data.workspaces; }
  public getWorkspaceMembers() { return this.data.workspaceMembers; }
  public getFolders() { return this.data.folders; }
  public getDocuments() { return this.data.documents; }
  public getComments() { return this.data.comments; }
  public getActivities() { return this.data.activities; }
  public getNotifications() { return this.data.notifications; }
  public getInvitations() { return this.data.invitations; }

  // Helpers
  public findUserById(id: string) {
    return this.data.users.find(u => u.id === id);
  }

  public findUserByEmail(email: string) {
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  public createUser(user: Omit<User, 'id' | 'color' | 'createdAt'>): User {
    const color = USER_COLORS[this.data.users.length % USER_COLORS.length];
    const newUser: User = {
      ...user,
      id: 'usr_' + uuidv4().slice(0, 8),
      color,
      createdAt: new Date().toISOString(),
    };
    this.data.users.push(newUser);
    this.save();
    return newUser;
  }

  public getWorkspaceUserRole(workspaceId: string, userId: string): WorkspaceRole | null {
    const ws = this.data.workspaces.find(w => w.id === workspaceId);
    if (!ws) return null;
    if (ws.ownerId === userId) return 'owner';
    const member = this.data.workspaceMembers.find(m => m.workspaceId === workspaceId && m.userId === userId);
    return member ? member.role : null;
  }

  public addActivity(workspaceId: string, userId: string, action: string, details: string, documentId?: string | null) {
    const act: Activity = {
      id: uuidv4(),
      workspaceId,
      documentId: documentId || null,
      userId,
      action,
      details,
      timestamp: new Date().toISOString(),
    };
    this.data.activities.unshift(act);
    // Keep max 500 activities
    if (this.data.activities.length > 500) {
      this.data.activities.pop();
    }
    this.save();
    return act;
  }

  public addNotification(userId: string, title: string, message: string, link: string, type: Notification['type']) {
    const notif: Notification = {
      id: uuidv4(),
      userId,
      title,
      message,
      link,
      read: false,
      type,
      createdAt: new Date().toISOString(),
    };
    this.data.notifications.unshift(notif);
    this.save();
    return notif;
  }
}

export const db = new Database();
