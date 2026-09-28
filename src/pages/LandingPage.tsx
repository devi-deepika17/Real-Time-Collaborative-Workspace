import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Zap,
  ArrowRight,
  Shield,
  Users,
  MessageSquare,
  FileText,
  Search,
  CheckCircle2,
  Folder,
  Star,
  Lock,
  Eye,
  Edit3,
  Server,
  Database,
  Cpu,
  Layers,
  ChevronRight,
  Play,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Avatar } from '../components/common/Avatar';
import { RoleBadge } from '../components/common/Badge';

interface LandingPageProps {
  onNavigateLogin: () => void;
  onNavigateRegister: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onNavigateLogin,
  onNavigateRegister,
}) => {
  const { switchUser } = useAuth();
  const { success, error } = useToast();
  const [demoLoggingIn, setDemoLoggingIn] = useState<string | null>(null);

  // Interactive live simulation text effect
  const [simText, setSimText] = useState(
    'Our core objective this quarter is delivering a low-latency collaborative document editor.'
  );
  const [simCursorPos, setSimCursorPos] = useState({ x: 280, y: 35 });
  const [bobCursorPos, setBobCursorPos] = useState({ x: 120, y: 85 });

  useEffect(() => {
    const interval = setInterval(() => {
      setSimCursorPos(prev => ({
        x: Math.max(150, Math.min(420, prev.x + (Math.random() * 40 - 20))),
        y: Math.max(25, Math.min(50, prev.y + (Math.random() * 10 - 5))),
      }));
      setBobCursorPos(prev => ({
        x: Math.max(80, Math.min(350, prev.x + (Math.random() * 50 - 25))),
        y: Math.max(75, Math.min(110, prev.y + (Math.random() * 10 - 5))),
      }));
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  const handleQuickDemo = async (email: string) => {
    setDemoLoggingIn(email);
    try {
      await switchUser(email);
      success(`Logged in as demo collaborator!`);
    } catch (err: any) {
      error(err.message || 'Failed to login demo account');
    } finally {
      setDemoLoggingIn(null);
    }
  };

  const demoAccounts = [
    {
      name: 'Alice Chen',
      email: 'alice@collab.io',
      role: 'owner',
      color: '#2563eb',
      title: 'Workspace Owner / Product Lead',
      description: 'Full workspace authority: manage settings, invite members, modify roles, create and delete documents.',
      badge: 'Admin Access',
    },
    {
      name: 'Bob Miller',
      email: 'bob@collab.io',
      role: 'editor',
      color: '#059669',
      title: 'Senior Engineer / Editor',
      description: 'Collaborator privileges: create and edit documents, add inline comments, and co-author live.',
      badge: 'Full Co-Authoring',
    },
    {
      name: 'Sarah Connor',
      email: 'sarah@collab.io',
      role: 'viewer',
      color: '#db2777',
      title: 'Product Designer / Viewer',
      description: 'Read-only document access: view live collaborators, track caret movements, and participate in discussion threads.',
      badge: 'View-Only Permissions',
    },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Navigation Bar */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                CollabSpace
              </span>
              <span className="hidden sm:inline-block ml-2 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900">
                Real-Time SaaS
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-600 dark:text-slate-300">
            <a href="#features" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Features
            </a>
            <a href="#demo" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Live Preview
            </a>
            <a href="#accounts" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Demo Accounts
            </a>
            <a href="#architecture" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Architecture
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={onNavigateLogin}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={onNavigateRegister}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-md shadow-blue-600/20 transition-all hover:scale-105"
            >
              Get Started Free
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28 border-b border-slate-200 dark:border-slate-800">
        <div className="absolute inset-0 bg-radial-[circle_at_top,_var(--tw-gradient-stops)] from-blue-500/10 via-transparent to-transparent pointer-events-none" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300 text-xs font-medium shadow-2xs">
            <Zap className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Sub-50ms Delta Sync via WebSockets & Socket.IO</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50 max-w-4xl mx-auto leading-tight md:leading-none">
            Where Modern Teams Co-Author in{' '}
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent">
              Real Time
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Multiplayer rich-text editing, live cursor telemetry, presence tracking, contextual threaded discussions, and role-based workspace hierarchies.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3.5 max-w-md mx-auto">
            <button
              onClick={() => handleQuickDemo('alice@collab.io')}
              disabled={!!demoLoggingIn}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-600/30 transition-all hover:scale-105"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>{demoLoggingIn ? 'Launching...' : '1-Click Interactive Demo (Alice)'}</span>
            </button>
            <button
              onClick={onNavigateRegister}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-sm rounded-xl transition-colors border border-slate-200 dark:border-slate-700"
            >
              <span>Create Free Account</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Demo Switcher Strip */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-500">
            <span>Instant Demo Switcher:</span>
            <button
              onClick={() => handleQuickDemo('alice@collab.io')}
              className="px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 hover:underline font-semibold"
            >
              Alice (Owner)
            </button>
            <span>•</span>
            <button
              onClick={() => handleQuickDemo('bob@collab.io')}
              className="px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 hover:underline font-semibold"
            >
              Bob (Editor)
            </button>
            <span>•</span>
            <button
              onClick={() => handleQuickDemo('sarah@collab.io')}
              className="px-2.5 py-1 rounded-md bg-pink-50 dark:bg-pink-950 text-pink-600 dark:text-pink-400 hover:underline font-semibold"
            >
              Sarah (Viewer)
            </button>
          </div>
        </div>

        {/* Live Interactive Collaboration Preview Mockup */}
        <div id="demo" className="mt-12 max-w-5xl mx-auto px-4 sm:px-6">
          <div className="rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden">
            {/* Editor Window Header */}
            <div className="h-11 px-4 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500 inline-block" />
                <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
                <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
                <span className="ml-3 font-semibold text-slate-700 dark:text-slate-300">
                  🗺️ 2026 Product Strategy & Collaborative Roadmap
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center -space-x-1.5">
                  <Avatar name="Alice Chen" color="#2563eb" size="sm" status="editing" />
                  <Avatar name="Bob Miller" color="#059669" size="sm" status="editing" />
                  <Avatar name="Sarah Connor" color="#db2777" size="sm" status="viewing" />
                </div>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-bold">
                  3 Collaborators Online
                </span>
              </div>
            </div>

            {/* Simulated Editor Surface */}
            <div className="p-8 md:p-12 relative min-h-[360px] font-sans">
              {/* Alice Floating Caret */}
              <div
                className="absolute transition-all duration-700 ease-out pointer-events-none z-20"
                style={{ left: `${simCursorPos.x}px`, top: `${simCursorPos.y}px` }}
              >
                <div className="w-0.5 h-6 bg-blue-600 rounded-full" />
                <div className="px-1.5 py-0.5 rounded text-[10px] font-bold text-white bg-blue-600 shadow-md whitespace-nowrap -mt-1 -ml-1">
                  Alice (Owner)
                </div>
              </div>

              {/* Bob Floating Caret */}
              <div
                className="absolute transition-all duration-700 ease-out pointer-events-none z-20"
                style={{ left: `${bobCursorPos.x}px`, top: `${bobCursorPos.y}px` }}
              >
                <div className="w-0.5 h-6 bg-emerald-600 rounded-full" />
                <div className="px-1.5 py-0.5 rounded text-[10px] font-bold text-white bg-emerald-600 shadow-md whitespace-nowrap -mt-1 -ml-1">
                  Bob (Editor)
                </div>
              </div>

              {/* Sample Content */}
              <div className="space-y-4 max-w-3xl">
                <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
                  Real-Time Synchronization Specifications
                </h2>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  {simText}{' '}
                  <span className="bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 px-1 py-0.5 rounded border border-amber-300 dark:border-amber-800">
                    Sub-50ms delta broadcast using WebSocket connection rooms.
                  </span>
                </p>

                {/* Simulated Floating Comment Thread */}
                <div className="ml-8 mt-4 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-800/90 shadow-lg max-w-md text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Avatar name="Sarah Connor" color="#db2777" size="sm" />
                      <span className="font-semibold text-slate-800 dark:text-slate-200">Sarah Connor</span>
                      <span className="text-[10px] text-slate-400">2 min ago</span>
                    </div>
                    <span className="text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-semibold px-2 py-0.5 rounded-full">
                      Open Thread
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300">
                    "Should we add reconnection buffering for offline state sync? <span className="text-blue-600 dark:text-blue-400 font-semibold">@bob</span>"
                  </p>
                  <div className="pl-3 border-l-2 border-slate-300 dark:border-slate-600 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <Avatar name="Bob Miller" color="#059669" size="sm" />
                      <span className="font-semibold text-slate-800 dark:text-slate-200">Bob Miller</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 pl-6">
                      "Yes, I'll take care of it. Queueing pending delta changes locally."
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Capabilities Section */}
      <section id="features" className="py-20 bg-slate-50/60 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Engineered for Collaboration
            </h2>
            <h3 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              Everything Your Team Needs to Build Together
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              A comprehensive toolkit for collaborative product development, technical roadmaps, and specification drafting.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-shadow space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Edit3 className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Live Cursors & Caret Tracking
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                See collaborator pointers floating live across the document with distinctive colors, name flags, and real-time selection highlights.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-shadow space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950 flex items-center justify-center text-purple-600 dark:text-purple-400">
                <Shield className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Granular Role-Based Access
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Assign Owner, Editor, or Viewer roles. Protect sensitive specifications while welcoming feedback and discussions from stakeholders.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-shadow space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <MessageSquare className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Contextual Comments & @Mentions
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Select any text passage to anchor a comment thread. Tag teammates with @username to notify them in real time.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-shadow space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <Folder className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Workspaces, Folders & Favorites
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Organize documents into structured folders, star frequent roadmaps for instant access, and recover accidentally deleted items from the Trash.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-shadow space-y-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-100 dark:bg-cyan-950 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
                <Search className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Instant Workspace Search (⌘K)
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Global search bar indexing titles, rich text content, folders, comments, and teammates across the entire workspace in milliseconds.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-shadow space-y-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950 flex items-center justify-center text-rose-600 dark:text-rose-400">
                <Lock className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Autosaving & Conflict Resolution
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Never lose a keystroke with debounced background database saves and deterministic room synchronization across reconnects.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Accounts Evaluation Section */}
      <section id="accounts" className="py-20 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Ready for Evaluation
            </h2>
            <h3 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              Pre-Configured Demo Accounts
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Click any account below or open two browser tabs to immediately experience live collaboration between multiple users.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {demoAccounts.map(account => (
              <div
                key={account.email}
                className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-500 dark:hover:border-blue-500 transition-all flex flex-col justify-between shadow-xs hover:shadow-lg group"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Avatar name={account.name} color={account.color} size="lg" status="online" />
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {account.badge}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {account.name}
                    </h4>
                    <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                      {account.title}
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {account.description}
                  </p>

                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-[11px] font-mono text-slate-500">
                    <div>email: <strong>{account.email}</strong></div>
                    <div>pass: <strong>password123</strong></div>
                  </div>
                </div>

                <button
                  onClick={() => handleQuickDemo(account.email)}
                  disabled={!!demoLoggingIn}
                  className="mt-6 w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>Launch as {account.name.split(' ')[0]}</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack & Architecture */}
      <section id="architecture" className="py-20 bg-slate-50/60 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Modern Full-Stack Architecture
            </h2>
            <h3 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              Built with Industry-Standard Technologies
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Designed from the ground up for high concurrency, low latency, and robust persistent storage.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-1.5">
              <Server className="w-6 h-6 text-blue-600 mx-auto" />
              <div className="font-bold text-sm text-slate-800 dark:text-slate-200">Socket.IO & WS</div>
              <div className="text-[11px] text-slate-400">Room-based Real-Time Sync</div>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-1.5">
              <Database className="w-6 h-6 text-emerald-600 mx-auto" />
              <div className="font-bold text-sm text-slate-800 dark:text-slate-200">PostgreSQL / Prisma</div>
              <div className="text-[11px] text-slate-400">Relational Database Schemas</div>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-1.5">
              <Shield className="w-6 h-6 text-purple-600 mx-auto" />
              <div className="font-bold text-sm text-slate-800 dark:text-slate-200">JWT & Bcrypt</div>
              <div className="text-[11px] text-slate-400">Secure Token Authentication</div>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-1.5">
              <Layers className="w-6 h-6 text-cyan-600 mx-auto" />
              <div className="font-bold text-sm text-slate-800 dark:text-slate-200">React 19 & Tailwind</div>
              <div className="text-[11px] text-slate-400">Responsive Modern UI</div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Footer Banner */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-indigo-700 text-white text-center">
        <div className="max-w-4xl mx-auto px-4 space-y-5">
          <h2 className="text-3xl font-extrabold tracking-tight">
            Ready to experience frictionless real-time collaboration?
          </h2>
          <p className="text-blue-100 text-sm max-w-xl mx-auto">
            Create your account in seconds or try the live demo with pre-loaded roadmaps and active teammates.
          </p>
          <div className="pt-2 flex items-center justify-center gap-3">
            <button
              onClick={onNavigateRegister}
              className="px-6 py-2.5 bg-white text-blue-700 hover:bg-blue-50 font-bold text-xs rounded-xl shadow-md transition-all hover:scale-105"
            >
              Get Started Free
            </button>
            <button
              onClick={onNavigateLogin}
              className="px-6 py-2.5 bg-white/15 hover:bg-white/25 text-white font-semibold text-xs rounded-xl backdrop-blur-xs transition-colors"
            >
              Sign In to CollabSpace
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-blue-600 flex items-center justify-center text-white text-[10px] font-bold">
              C
            </div>
            <span className="font-semibold text-slate-700 dark:text-slate-300">CollabSpace</span>
            <span>— Real-Time Collaborative Workspace</span>
          </div>

          <div className="flex items-center gap-6">
            <button onClick={onNavigateLogin} className="hover:text-slate-600 dark:hover:text-slate-200">
              Login
            </button>
            <button onClick={onNavigateRegister} className="hover:text-slate-600 dark:hover:text-slate-200">
              Register
            </button>
            <span>v1.0.0</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
