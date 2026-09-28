import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider, useSocket } from './context/SocketContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider, useToast } from './context/ToastContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { RichTextEditor } from './components/editor/RichTextEditor';
import { CommentsDrawer } from './components/comments/CommentsDrawer';
import { SearchModal } from './components/common/SearchModal';
import { NewWorkspaceModal } from './components/workspaces/NewWorkspaceModal';
import { NewFolderModal } from './components/workspaces/NewFolderModal';
import { Dashboard } from './pages/Dashboard';
import { WorkspaceView } from './pages/WorkspaceView';
import { MembersPage } from './pages/MembersPage';
import { WorkspaceSettingsPage } from './pages/WorkspaceSettingsPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { ProfilePage } from './pages/ProfilePage';
import { LandingPage } from './pages/LandingPage';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ForgotPassword } from './pages/ForgotPassword';
import { api } from './services/api';
import { Workspace, DocumentItem, Folder } from './types';

function AppContent() {
  const { user, isLoading } = useAuth();
  const { socket, joinDocumentRoom, leaveDocumentRoom } = useSocket();
  const { success, error } = useToast();

  // Navigation states
  const [authView, setAuthView] = useState<'landing' | 'login' | 'register' | 'forgot-password'>('landing');
  const [activeView, setActiveView] = useState<string>('dashboard');
  const [activeDocId, setActiveDocId] = useState<string | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

  // Data states
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [activeDocument, setActiveDocument] = useState<DocumentItem | null>(null);

  // Modals & Panels
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNewWorkspaceOpen, setIsNewWorkspaceOpen] = useState(false);
  const [isNewFolderOpen, setIsNewFolderOpen] = useState(false);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [initialCommentText, setInitialCommentText] = useState('');

  // Global keyboard shortcuts (Cmd+K for search)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fetch initial workspaces on user load
  const loadWorkspaces = async () => {
    if (!user) return;
    try {
      const wsList = await api.getWorkspaces();
      setWorkspaces(wsList);
      if (wsList.length > 0) {
        if (!currentWorkspace || !wsList.some(w => w.id === currentWorkspace.id)) {
          setCurrentWorkspace(wsList[0]);
        }
      }
    } catch (err: any) {
      console.error('Failed to load workspaces:', err);
    }
  };

  useEffect(() => {
    loadWorkspaces();
  }, [user?.id]);

  // Load workspace documents and folders whenever currentWorkspace changes
  const loadWorkspaceContent = async () => {
    if (!currentWorkspace) return;
    try {
      const [docs, flds] = await Promise.all([
        api.getDocuments(currentWorkspace.id, true),
        api.getFolders(currentWorkspace.id),
      ]);
      setDocuments(docs);
      setFolders(flds);
    } catch (err) {
      console.error('Failed to load workspace content:', err);
    }
  };

  useEffect(() => {
    loadWorkspaceContent();
    if (socket && currentWorkspace) {
      socket.emit('workspace:join', { workspaceId: currentWorkspace.id });
    }
  }, [currentWorkspace?.id, socket]);

  // Handle document room joining/leaving
  useEffect(() => {
    if (activeDocId && currentWorkspace) {
      joinDocumentRoom(activeDocId, currentWorkspace.id);
      api
        .getDocument(activeDocId)
        .then(doc => setActiveDocument(doc))
        .catch(err => {
          console.error(err);
          error('Failed to open document');
        });
    } else {
      if (activeDocId) {
        leaveDocumentRoom(activeDocId);
      }
      setActiveDocument(null);
    }

    return () => {
      if (activeDocId) {
        leaveDocumentRoom(activeDocId);
      }
    };
  }, [activeDocId, currentWorkspace?.id]);

  // Document creation helper
  const handleCreateDocument = async (folderId?: string | null) => {
    if (!currentWorkspace) return;
    try {
      const newDoc = await api.createDocument(currentWorkspace.id, {
        title: 'Untitled Document',
        folderId: folderId || null,
        icon: '📄',
        content: '<p>Start collaborating by typing here...</p>',
      });
      setDocuments(prev => [newDoc, ...prev]);
      setActiveDocId(newDoc.id);
      setActiveDocument(newDoc);
      setActiveView('document');
      success('Created new document');
    } catch (err: any) {
      error(err.message || 'Failed to create document');
    }
  };

  // Document select helper
  const handleSelectDocument = (docId: string) => {
    setActiveDocId(docId);
    setActiveView('document');
  };

  // Workspace select helper
  const handleSelectWorkspace = (wsId: string) => {
    const ws = workspaces.find(w => w.id === wsId);
    if (ws) {
      setCurrentWorkspace(ws);
      setActiveDocId(null);
      setSelectedFolderId(null);
      setActiveView('dashboard');
    }
  };

  // Navigation dispatcher
  const handleNavigate = (view: string, id?: string) => {
    if (view === 'document' && id) {
      handleSelectDocument(id);
      return;
    }
    if (view === 'workspace' && id) {
      handleSelectWorkspace(id);
      return;
    }
    setActiveView(view);
    if (view !== 'document') {
      setActiveDocId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-500">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium">Initializing CollabSpace...</span>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    if (authView === 'landing') {
      return (
        <LandingPage
          onNavigateLogin={() => setAuthView('login')}
          onNavigateRegister={() => setAuthView('register')}
        />
      );
    }
    if (authView === 'register') {
      return (
        <Register
          onNavigateLogin={() => setAuthView('login')}
          onNavigateLanding={() => setAuthView('landing')}
        />
      );
    }
    if (authView === 'forgot-password') {
      return (
        <ForgotPassword
          onNavigateLogin={() => setAuthView('login')}
          onNavigateLanding={() => setAuthView('landing')}
        />
      );
    }
    return (
      <Login
        onNavigateRegister={() => setAuthView('register')}
        onNavigateForgotPassword={() => setAuthView('forgot-password')}
        onNavigateLanding={() => setAuthView('landing')}
      />
    );
  }

  // If authenticated user selects Landing Page preview
  if (activeView === 'landing') {
    return (
      <div className="relative">
        <div className="sticky top-0 z-50 bg-indigo-600 text-white px-4 py-2 text-xs flex items-center justify-between shadow-md">
          <span>You are viewing the Landing Page while logged in as <strong>{user.name}</strong>.</span>
          <button
            onClick={() => setActiveView('dashboard')}
            className="px-3 py-1 bg-white text-indigo-700 font-bold rounded-md hover:bg-indigo-50 transition-colors shadow-2xs"
          >
            ← Return to Workspace
          </button>
        </div>
        <LandingPage
          onNavigateLogin={() => setActiveView('dashboard')}
          onNavigateRegister={() => setActiveView('dashboard')}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
      {/* Top Header */}
      <Header
        currentWorkspace={currentWorkspace}
        workspaces={workspaces}
        onSelectWorkspace={handleSelectWorkspace}
        onOpenSearch={() => setIsSearchOpen(true)}
        onNavigate={handleNavigate}
      />

      {/* Main Body: Sidebar + Active View (+ Comments Drawer if active) */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar
          workspace={currentWorkspace}
          documents={documents}
          folders={folders}
          activeDocumentId={activeDocId}
          activeView={activeView}
          selectedFolderId={selectedFolderId}
          onSelectDocument={handleSelectDocument}
          onSelectFolder={folderId => {
            setSelectedFolderId(folderId);
            setActiveView('workspace');
          }}
          onNavigate={handleNavigate}
          onCreateDocument={handleCreateDocument}
          onCreateFolder={() => setIsNewFolderOpen(true)}
        />

        {/* Center Content View Area */}
        <main className="flex-1 flex flex-col overflow-hidden relative">
          {activeView === 'dashboard' && (
            <Dashboard
              currentWorkspace={currentWorkspace}
              workspaces={workspaces}
              onSelectDocument={handleSelectDocument}
              onSelectWorkspace={handleSelectWorkspace}
              onCreateDocument={() => handleCreateDocument()}
              onCreateWorkspace={() => setIsNewWorkspaceOpen(true)}
              onNavigate={handleNavigate}
            />
          )}

          {activeView === 'workspace' && (
            <WorkspaceView
              workspace={currentWorkspace}
              documents={documents}
              folders={folders}
              selectedFolderId={selectedFolderId}
              isTrashView={false}
              onSelectDocument={handleSelectDocument}
              onCreateDocument={handleCreateDocument}
              onRefreshDocuments={loadWorkspaceContent}
            />
          )}

          {activeView === 'trash' && (
            <WorkspaceView
              workspace={currentWorkspace}
              documents={documents}
              folders={folders}
              selectedFolderId={null}
              isTrashView={true}
              onSelectDocument={handleSelectDocument}
              onCreateDocument={handleCreateDocument}
              onRefreshDocuments={loadWorkspaceContent}
            />
          )}

          {activeView === 'document' && activeDocument && (
            <RichTextEditor
              document={activeDocument}
              onUpdateTitle={newTitle => {
                setActiveDocument(prev => (prev ? { ...prev, title: newTitle } : null));
                setDocuments(prev =>
                  prev.map(d => (d.id === activeDocument.id ? { ...d, title: newTitle } : d))
                );
              }}
              onOpenComments={() => setIsCommentsOpen(true)}
              onRequestAddComment={selectedText => {
                setInitialCommentText(selectedText);
                setIsCommentsOpen(true);
              }}
            />
          )}

          {activeView === 'members' && <MembersPage workspace={currentWorkspace} />}

          {activeView === 'settings' && (
            <WorkspaceSettingsPage
              workspace={currentWorkspace}
              onWorkspaceUpdated={updated => {
                setCurrentWorkspace(updated);
                setWorkspaces(prev => prev.map(w => (w.id === updated.id ? updated : w)));
              }}
              onWorkspaceDeleted={deletedId => {
                const remaining = workspaces.filter(w => w.id !== deletedId);
                setWorkspaces(remaining);
                setCurrentWorkspace(remaining[0] || null);
                setActiveView('dashboard');
              }}
            />
          )}

          {activeView === 'notifications' && (
            <NotificationsPage onNavigate={handleNavigate} />
          )}

          {activeView === 'profile' && <ProfilePage />}
        </main>

        {/* Right Comments Drawer (Available in document view or toggleable) */}
        {activeView === 'document' && activeDocument && currentWorkspace && (
          <CommentsDrawer
            isOpen={isCommentsOpen}
            onClose={() => setIsCommentsOpen(false)}
            documentId={activeDocument.id}
            workspaceId={currentWorkspace.id}
            initialSelectedText={initialCommentText}
            onClearInitialSelectedText={() => setInitialCommentText('')}
          />
        )}
      </div>

      {/* Global Modals */}
      {currentWorkspace && (
        <SearchModal
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
          workspaceId={currentWorkspace.id}
          onSelectDocument={handleSelectDocument}
          onSelectFolder={fId => {
            setSelectedFolderId(fId);
            setActiveView('workspace');
          }}
        />
      )}

      <NewWorkspaceModal
        isOpen={isNewWorkspaceOpen}
        onClose={() => setIsNewWorkspaceOpen(false)}
        onWorkspaceCreated={ws => {
          setWorkspaces(prev => [ws, ...prev]);
          setCurrentWorkspace(ws);
          setActiveView('dashboard');
        }}
      />

      {currentWorkspace && (
        <NewFolderModal
          isOpen={isNewFolderOpen}
          onClose={() => setIsNewFolderOpen(false)}
          workspaceId={currentWorkspace.id}
          onFolderCreated={f => {
            setFolders(prev => [...prev, f]);
          }}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <SocketProvider>
            <AppContent />
          </SocketProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
