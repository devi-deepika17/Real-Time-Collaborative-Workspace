import { DocumentItem, Folder, Workspace, WorkspaceMember, CommentItem, ActivityItem, NotificationItem, User } from '../types';

const API_BASE = '/api';

class ApiService {
  private getToken(): string | null {
    return localStorage.getItem('collab_token');
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data.error || `HTTP error ${res.status}`);
    }

    return data as T;
  }

  // Auth
  async login(email: string, password: string) {
    return this.request<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(name: string, email: string, password: string) {
    return this.request<{ token: string; user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
  }

  async getMe() {
    return this.request<{ user: User }>('/auth/me');
  }

  async getDemoUsers() {
    return this.request<User[]>('/auth/demo-users');
  }

  // Workspaces
  async getWorkspaces() {
    return this.request<Workspace[]>('/workspaces');
  }

  async getWorkspace(id: string) {
    return this.request<Workspace & { members: any[]; folders: Folder[]; documents: DocumentItem[] }>(`/workspaces/${id}`);
  }

  async createWorkspace(data: { name: string; description?: string; icon?: string }) {
    return this.request<Workspace>('/workspaces', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateWorkspace(id: string, data: { name?: string; description?: string; icon?: string }) {
    return this.request<Workspace>(`/workspaces/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteWorkspace(id: string) {
    return this.request<{ message: string }>(`/workspaces/${id}`, {
      method: 'DELETE',
    });
  }

  async getWorkspaceActivity(workspaceId: string) {
    return this.request<ActivityItem[]>(`/workspaces/${workspaceId}/activity`);
  }

  async searchWorkspace(workspaceId: string, q: string) {
    return this.request<{
      documents: any[];
      folders: Folder[];
      members: any[];
      comments: any[];
    }>(`/workspaces/${workspaceId}/search?q=${encodeURIComponent(q)}`);
  }

  // Members
  async getMembers(workspaceId: string) {
    return this.request<WorkspaceMember[]>(`/workspaces/${workspaceId}/members`);
  }

  async inviteMember(workspaceId: string, email: string, role: string) {
    return this.request<{ message: string; member?: WorkspaceMember; inviteLink?: string }>(`/workspaces/${workspaceId}/invite`, {
      method: 'POST',
      body: JSON.stringify({ email, role }),
    });
  }

  async updateMemberRole(workspaceId: string, userId: string, role: string) {
    return this.request<{ message: string; member: WorkspaceMember }>(`/workspaces/${workspaceId}/members/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
  }

  async removeMember(workspaceId: string, userId: string) {
    return this.request<{ message: string }>(`/workspaces/${workspaceId}/members/${userId}`, {
      method: 'DELETE',
    });
  }

  // Documents
  async getDocuments(workspaceId: string, includeTrash = false) {
    return this.request<DocumentItem[]>(`/workspaces/${workspaceId}/documents?trash=${includeTrash}`);
  }

  async getDocument(id: string) {
    return this.request<DocumentItem>(`/documents/${id}`);
  }

  async createDocument(workspaceId: string, data: { title?: string; folderId?: string | null; icon?: string; content?: string }) {
    return this.request<DocumentItem>(`/workspaces/${workspaceId}/documents`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateDocument(id: string, data: Partial<DocumentItem>) {
    return this.request<DocumentItem>(`/documents/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteDocument(id: string) {
    return this.request<{ message: string }>(`/documents/${id}`, {
      method: 'DELETE',
    });
  }

  async duplicateDocument(id: string) {
    return this.request<DocumentItem>(`/documents/${id}/duplicate`, {
      method: 'POST',
    });
  }

  // Folders
  async getFolders(workspaceId: string) {
    return this.request<Folder[]>(`/workspaces/${workspaceId}/folders`);
  }

  async createFolder(workspaceId: string, name: string, icon = '📁') {
    return this.request<Folder>(`/workspaces/${workspaceId}/folders`, {
      method: 'POST',
      body: JSON.stringify({ name, icon }),
    });
  }

  async deleteFolder(folderId: string) {
    return this.request<{ message: string }>(`/folders/${folderId}`, {
      method: 'DELETE',
    });
  }

  // Comments
  async getComments(documentId: string) {
    return this.request<CommentItem[]>(`/documents/${documentId}/comments`);
  }

  async createComment(documentId: string, data: { content: string; selectedText?: string; position?: any }) {
    return this.request<CommentItem>(`/documents/${documentId}/comments`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateComment(commentId: string, data: { resolved?: boolean; content?: string }) {
    return this.request<CommentItem>(`/comments/${commentId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteComment(commentId: string) {
    return this.request<{ message: string }>(`/comments/${commentId}`, {
      method: 'DELETE',
    });
  }

  async replyComment(commentId: string, content: string) {
    return this.request<any>(`/comments/${commentId}/replies`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  }

  // Notifications
  async getNotifications() {
    return this.request<NotificationItem[]>('/notifications');
  }

  async markNotificationRead(id: string) {
    return this.request<NotificationItem>(`/notifications/${id}/read`, {
      method: 'PATCH',
    });
  }

  async markAllNotificationsRead() {
    return this.request<{ message: string }>('/notifications/mark-all-read', {
      method: 'POST',
    });
  }
}

export const api = new ApiService();
