import React from 'react';

interface AvatarProps {
  name: string;
  avatar?: string;
  color?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  status?: 'online' | 'editing' | 'viewing' | 'offline';
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  name,
  avatar,
  color = '#2563eb',
  size = 'md',
  status,
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-xs',
    lg: 'w-10 h-10 text-sm font-semibold',
    xl: 'w-14 h-14 text-lg font-bold',
  };

  const getInitials = (n: string) => {
    return n
      .split(' ')
      .map(part => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <div className={`relative inline-flex shrink-0 ${className}`}>
      {avatar ? (
        <img
          src={avatar}
          alt={name}
          className={`${sizeClasses[size]} rounded-full object-cover border border-slate-200 dark:border-slate-700 shadow-sm`}
          style={{ borderColor: color }}
        />
      ) : (
        <div
          className={`${sizeClasses[size]} rounded-full flex items-center justify-center text-white font-medium shadow-sm`}
          style={{ backgroundColor: color }}
        >
          {getInitials(name || 'User')}
        </div>
      )}

      {status && (
        <span
          className={`absolute bottom-0 right-0 block rounded-full ring-2 ring-white dark:ring-slate-900 ${
            size === 'sm' ? 'w-2 h-2' : 'w-2.5 h-2.5'
          } ${
            status === 'editing'
              ? 'bg-amber-500 animate-pulse'
              : status === 'viewing' || status === 'online'
              ? 'bg-emerald-500'
              : 'bg-slate-400'
          }`}
          title={`${name} is ${status}`}
        />
      )}
    </div>
  );
};
