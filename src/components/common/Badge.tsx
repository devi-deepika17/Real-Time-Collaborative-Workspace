import React from 'react';
import { WorkspaceRole } from '../../types';

interface RoleBadgeProps {
  role: WorkspaceRole | string;
}

export const RoleBadge: React.FC<RoleBadgeProps> = ({ role }) => {
  const styles: Record<string, string> = {
    owner: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800',
    editor: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    viewer: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
  };

  const currentStyle = styles[role.toLowerCase()] || styles.viewer;

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border uppercase tracking-wider ${currentStyle}`}>
      {role}
    </span>
  );
};
