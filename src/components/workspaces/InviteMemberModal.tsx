import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { WorkspaceRole } from '../../types';
import { Mail, Shield, Check, Copy } from 'lucide-react';

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
  onMemberInvited?: () => void;
}

export const InviteMemberModal: React.FC<InviteMemberModalProps> = ({
  isOpen,
  onClose,
  workspaceId,
  onMemberInvited,
}) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<WorkspaceRole>('editor');
  const [loading, setLoading] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [inviteResult, setInviteResult] = useState<string | null>(null);

  const { success, error } = useToast();

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    try {
      const res = await api.inviteMember(workspaceId, email.trim(), role);
      success(res.message);
      setInviteResult(res.message);
      setEmail('');
      if (onMemberInvited) onMemberInvited();
    } catch (err: any) {
      error(err.message || 'Failed to invite member');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    const link = `${window.location.origin}/register?workspace=${workspaceId}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
    success('Workspace invite link copied to clipboard!');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Invite Collaborator to Workspace">
      <div className="space-y-4">
        <form onSubmit={handleInvite} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="email"
                required
                placeholder="colleague@company.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-blue-500"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Tip: Existing demo accounts you can invite: <code>bob@collab.io</code>, <code>sarah@collab.io</code>, <code>alice@collab.io</code>.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Role & Permissions
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label
                className={`p-2.5 rounded-lg border cursor-pointer flex flex-col transition-all ${
                  role === 'editor'
                    ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 text-blue-950 dark:text-blue-200'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-blue-600" /> Editor
                  </span>
                  <input
                    type="radio"
                    name="role"
                    value="editor"
                    checked={role === 'editor'}
                    onChange={() => setRole('editor')}
                    className="accent-blue-600"
                  />
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                  Can create, edit documents & comment.
                </span>
              </label>

              <label
                className={`p-2.5 rounded-lg border cursor-pointer flex flex-col transition-all ${
                  role === 'viewer'
                    ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 text-blue-950 dark:text-blue-200'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-slate-500" /> Viewer
                  </span>
                  <input
                    type="radio"
                    name="role"
                    value="viewer"
                    checked={role === 'viewer'}
                    onChange={() => setRole('viewer')}
                    className="accent-blue-600"
                  />
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                  Can read documents & add comments.
                </span>
              </label>
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="px-4 py-2 text-xs font-medium bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition-colors shadow-2xs"
            >
              {loading ? 'Inviting...' : 'Send Invitation'}
            </button>
          </div>
        </form>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200 dark:border-slate-800" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white dark:bg-slate-900 px-2 text-slate-400">Or Share Link</span>
          </div>
        </div>

        <button
          onClick={handleCopyLink}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors"
        >
          {copiedLink ? (
            <>
              <Check className="w-4 h-4 text-emerald-600" />
              <span>Invite Link Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 text-slate-500" />
              <span>Copy Workspace Invite Link</span>
            </>
          )}
        </button>
      </div>
    </Modal>
  );
};
