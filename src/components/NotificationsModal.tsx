import React from 'react';
import { X, Bell, CheckCheck, Trash2 } from 'lucide-react';
import type { AppNotification, AppTheme } from '../types';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
  theme?: AppTheme;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAllAsRead,
  onClearAll,
  theme = 'weeknd',
}) => {
  if (!isOpen) return null;
  const isPurple = theme === 'purple';

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="glass-panel w-full max-w-md rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] cursor-default"
      >
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center text-white ${
                isPurple ? 'bg-purple-600/30 text-purple-400' : 'bg-rose-600/30 text-rose-400'
              }`}
            >
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white font-heading">Activity & Notifications</h3>
              <p className="text-[10px] text-zinc-400">Updates from your ledger and flatmates</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content list */}
        <div className="p-4 overflow-y-auto space-y-2 flex-1">
          {notifications.length === 0 ? (
            <div className="text-center py-10 text-zinc-500 text-xs space-y-2">
              <Bell className="w-8 h-8 mx-auto opacity-30 text-zinc-400" />
              <p>No new notifications yet.</p>
              <p className="text-[10px] text-zinc-600">Activity will appear here as expenses and settlements are logged.</p>
            </div>
          ) : (
            notifications.map((n) => {
              const timeFormatted = new Date(n.timestamp).toLocaleDateString('en-IN', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={n.id}
                  className={`p-3 rounded-xl border transition-all text-xs ${
                    n.read
                      ? 'bg-zinc-900/40 border-white/5 text-zinc-400'
                      : 'bg-zinc-900/90 border-white/10 text-zinc-200 shadow-md'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-white text-xs">{n.title}</span>
                    <span className="text-[10px] text-zinc-500 shrink-0 font-mono">{timeFormatted}</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-1">{n.message}</p>
                </div>
              );
            })
          )}
        </div>

        {/* Actions footer */}
        {notifications.length > 0 && (
          <div className="p-3 border-t border-white/10 bg-black/40 flex items-center justify-between text-xs">
            <button
              onClick={onMarkAllAsRead}
              className="flex items-center gap-1.5 text-zinc-400 hover:text-white transition-all cursor-pointer"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Mark all read</span>
            </button>
            <button
              onClick={onClearAll}
              className="flex items-center gap-1.5 text-rose-400 hover:text-rose-300 transition-all cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear all</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
