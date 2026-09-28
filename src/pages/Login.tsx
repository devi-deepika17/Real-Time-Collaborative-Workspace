import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Lock, Mail, Sparkles, ArrowRight, Zap, Eye, EyeOff, ArrowLeft } from 'lucide-react';

interface LoginProps {
  onNavigateRegister: () => void;
  onNavigateForgotPassword: () => void;
  onNavigateLanding?: () => void;
}

export const Login: React.FC<LoginProps> = ({
  onNavigateRegister,
  onNavigateForgotPassword,
  onNavigateLanding,
}) => {
  const { login, switchUser } = useAuth();
  const { success, error } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    try {
      await login(email.trim(), password);
      success('Welcome back to CollabSpace!');
    } catch (err: any) {
      error(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (demoEmail: string) => {
    setLoading(true);
    try {
      await switchUser(demoEmail);
      success('Logged in as demo collaborator');
    } catch (err: any) {
      error(err.message || 'Quick login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-8 space-y-6">
        {onNavigateLanding && (
          <button
            type="button"
            onClick={onNavigateLanding}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Home</span>
          </button>
        )}

        <div className="text-center space-y-1.5">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20 mb-1">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            Sign In to CollabSpace
          </h1>
          <p className="text-xs text-slate-400">
            Collaborate on documents with your team in real time
          </p>
        </div>

        {/* 1-Click Demo Accounts */}
        <div className="p-3.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60">
          <div className="text-xs font-semibold text-indigo-950 dark:text-indigo-200 flex items-center justify-between mb-2">
            <span className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-indigo-600" />
              <span>1-Click Test Accounts</span>
            </span>
            <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-normal">Instant sign-in</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickDemo('alice@collab.io')}
              className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center hover:border-blue-500 hover:shadow-xs transition-all"
            >
              <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200">Alice</div>
              <div className="text-[9px] text-blue-600 font-semibold uppercase">Owner</div>
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo('bob@collab.io')}
              className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center hover:border-emerald-500 hover:shadow-xs transition-all"
            >
              <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200">Bob</div>
              <div className="text-[9px] text-emerald-600 font-semibold uppercase">Editor</div>
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo('sarah@collab.io')}
              className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center hover:border-pink-500 hover:shadow-xs transition-all"
            >
              <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200">Sarah</div>
              <div className="text-[9px] text-pink-600 font-semibold uppercase">Viewer</div>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="email"
                required
                placeholder="alice@collab.io"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Password
              </label>
              <button
                type="button"
                onClick={onNavigateForgotPassword}
                className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-9 pr-9 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold shadow-md transition-colors"
          >
            <span>{loading ? 'Signing in...' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-2 text-center text-xs text-slate-500 dark:text-slate-400">
          Don't have an account?{' '}
          <button
            type="button"
            onClick={onNavigateRegister}
            className="text-blue-600 dark:text-blue-400 font-semibold hover:underline"
          >
            Create an account
          </button>
        </div>
      </div>
    </div>
  );
};
