import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Shield, Trash2, Check, AlertCircle } from 'lucide-react';
import { Workspace, WorkspaceMember, WorkspaceRole } from '../types';
import { api } from '../services/api';
import { Avatar } from '../components/common/Avatar';
import { RoleBadge } from '../components/common/Badge';
import { InviteMemberModal } from '../components/workspaces/InviteMemberModal';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

interface MembersPageProps {
  workspace: Workspace | null;
}

export const MembersPage: React.FC<MembersPageProps> = ({ workspace }) => {
  const { user } = useAuth();
  const { success, error } = useToast();
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  const currentUserRole = workspace?.currentUserRole || 'viewer';
  const isOwner = currentUserRole === 'owner';

  const loadMembers = async () => {
    if (!workspace) return;
    try {
      setLoading(true);
      const res = await api.getMembers(workspace.id);
      setMembers(res);
    } catch (err: any) {
      error(err.message || 'Failed to load members');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, [workspace?.id]);

  const handleRoleChange = async (memberUserId: string, newRole: WorkspaceRole) => {
    if (!workspace) return;
    try {
      await api.updateMemberRole(workspace.id, memberUserId, newRole);
      success('Member role updated successfully');
      loadMembers();
    } catch (err: any) {
      error(err.message || 'Failed to update member role');
    }
  };

  const handleRemoveMember = async (memberUserId: string, memberName: string) => {
    if (!workspace) return;
    if (!confirm(`Are you sure you want to remove ${memberName} from this workspace?`)) return;

    try {
      await api.removeMember(workspace.id, memberUserId);
      success(`${memberName} removed from workspace`);
      loadMembers();
    } catch (err: any) {
      error(err.message || 'Failed to remove member');
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 bg-white dark:bg-slate-900">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            <span>Workspace Members</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage collaborators and their access roles for <strong className="text-slate-700 dark:text-slate-300">{workspace?.name}</strong>.
          </p>
        </div>

        {isOwner && (
          <button
            onClick={() => setIsInviteOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            <span>Invite Collaborator</span>
          </button>
        )}
      </div>

      {/* Role explanation cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl border border-purple-200 dark:border-purple-900/50 bg-purple-50/50 dark:bg-purple-950/20 text-xs">
          <div className="font-semibold text-purple-900 dark:text-purple-300 flex items-center gap-1.5 mb-1">
            <RoleBadge role="owner" />
          </div>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Full workspace administration, invite/remove members, role management, and document controls.
          </p>
        </div>

        <div className="p-3.5 rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-950/20 text-xs">
          <div className="font-semibold text-blue-900 dark:text-blue-300 flex items-center gap-1.5 mb-1">
            <RoleBadge role="editor" />
          </div>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Can create, edit, duplicate documents, reply to comments, and co-author in real time.
          </p>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-xs">
          <div className="font-semibold text-slate-800 dark:text-slate-300 flex items-center gap-1.5 mb-1">
            <RoleBadge role="viewer" />
          </div>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Read-only document access. Can view live collaborators and leave discussion comments.
          </p>
        </div>
      </div>

      {/* Members Table */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase tracking-wider font-semibold">
            <tr>
              <th className="p-3.5">Member</th>
              <th className="p-3.5">Role</th>
              <th className="p-3.5 hidden sm:table-cell">Joined</th>
              {isOwner && <th className="p-3.5 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {loading ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-slate-400">Loading members...</td>
              </tr>
            ) : (
              members.map(member => {
                const isCurrentUser = member.userId === user?.id;
                const isWorkspaceOwner = workspace?.ownerId === member.userId;

                return (
                  <tr key={member.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="p-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar
                          name={member.name}
                          avatar={member.avatar}
                          color={member.color}
                          size="md"
                          status="online"
                        />
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                            <span>{member.name}</span>
                            {isCurrentUser && (
                              <span className="text-[10px] text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-1.5 rounded font-normal">
                                You
                              </span>
                            )}
                          </div>
                          <div className="text-slate-400 text-[11px]">{member.email}</div>
                        </div>
                      </div>
                    </td>

                    <td className="p-3.5">
                      {isOwner && !isWorkspaceOwner ? (
                        <select
                          value={member.role}
                          onChange={e => handleRoleChange(member.userId, e.target.value as WorkspaceRole)}
                          className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-slate-800 dark:text-slate-200 focus:outline-hidden font-medium"
                        >
                          <option value="owner">Owner</option>
                          <option value="editor">Editor</option>
                          <option value="viewer">Viewer</option>
                        </select>
                      ) : (
                        <RoleBadge role={member.role} />
                      )}
                    </td>

                    <td className="p-3.5 text-slate-400 hidden sm:table-cell">
                      {new Date(member.joinedAt).toLocaleDateString()}
                    </td>

                    {isOwner && (
                      <td className="p-3.5 text-right">
                        {!isWorkspaceOwner && !isCurrentUser && (
                          <button
                            onClick={() => handleRemoveMember(member.userId, member.name)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-colors"
                            title="Remove member"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {workspace && (
        <InviteMemberModal
          isOpen={isInviteOpen}
          onClose={() => setIsInviteOpen(false)}
          workspaceId={workspace.id}
          onMemberInvited={loadMembers}
        />
      )}
    </div>
  );
};
