import React, { useState } from 'react';
import { Mail, ArrowLeft, CheckCircle2, Sparkles } from 'lucide-react';
import { useToast } from '../context/ToastContext';

interface ForgotPasswordProps {
  onNavigateLogin: () => void;
  onNavigateLanding?: () => void;
}

export const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onNavigateLogin, onNavigateLanding }) => {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const { success } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSent(true);
    success(`Reset instructions sent to ${email}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-8 space-y-6">
        <div className="text-center space-y-1.5">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600 text-white shadow-md mb-2">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            Reset Password
          </h1>
          <p className="text-xs text-slate-400">
            Enter your email to receive recovery instructions
          </p>
        </div>

        {sent ? (
          <div className="text-center space-y-4 py-4">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
            <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Check your inbox
            </div>
            <p className="text-xs text-slate-400">
              We've dispatched recovery instructions to <strong>{email}</strong>. For demo purposes, you can log in with password: <code>password123</code>.
            </p>
            <button
              onClick={onNavigateLogin}
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold"
            >
              Back to Sign In
            </button>
          </div>
        ) : (
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

            <button
              type="submit"
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-md transition-colors"
            >
              Send Reset Link
            </button>

            <button
              type="button"
              onClick={onNavigateLogin}
              className="w-full flex items-center justify-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 hover:underline pt-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Login</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
