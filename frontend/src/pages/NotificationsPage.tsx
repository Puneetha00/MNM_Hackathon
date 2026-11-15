import React, { useState } from 'react';
import { 
  Bell, CheckCheck, Sparkles, AlertTriangle, ShieldAlert, 
  Clock, Calendar, Info, Filter 
} from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { api } from '../services/api';

export const NotificationsPage: React.FC = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, refreshNotifications } = useNotifications();
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [testTriggerLoading, setTestTriggerLoading] = useState<boolean>(false);

  const handleTestTrigger = async () => {
    try {
      setTestTriggerLoading(true);
      await api.triggerTestReminder();
      await refreshNotifications();
    } catch {
      alert("Failed to dispatch test notification");
    } finally {
      setTestTriggerLoading(false);
    }
  };

  const filteredNotifs = notifications.filter(n => {
    if (filterSeverity === 'all') return true;
    if (filterSeverity === 'unread') return !n.is_read;
    return n.severity === filterSeverity;
  });

  const getIcon = (type: string, severity: string) => {
    if (severity === 'critical' || type === 'emergency') return <ShieldAlert className="w-5 h-5 text-rose-600" />;
    if (severity === 'warning' || type === 'missed_dose') return <AlertTriangle className="w-5 h-5 text-amber-600" />;
    if (type === 'appointment') return <Calendar className="w-5 h-5 text-sky-600" />;
    return <Clock className="w-5 h-5 text-teal-600" />;
  };

  return (
    <div className="space-y-8 w-full pb-12">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="bg-teal-100 text-teal-800 text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider">
            Alerts & Reminders
          </span>
          <h1 className="text-3xl font-black text-slate-900 mt-1">Notification Center</h1>
          <p className="text-slate-500 text-sm">
            Proactive dose reminders, missed medication alerts, and care circle updates
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleTestTrigger}
            disabled={testTriggerLoading}
            className="flex items-center gap-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 px-4 py-2 rounded-xl text-xs font-bold border border-brand-200 transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            <span>{testTriggerLoading ? "Triggering..." : "Test Reminder Engine"}</span>
          </button>

          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition-colors"
            >
              <CheckCheck className="w-4 h-4" />
              <span>Mark All Read</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {['all', 'unread', 'critical', 'warning', 'info'].map((f) => (
          <button
            key={f}
            onClick={() => setFilterSeverity(f)}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
              filterSeverity === f
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {f === 'unread' ? `Unread (${unreadCount})` : f}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
        {filteredNotifs.length === 0 ? (
          <div className="py-16 text-center text-slate-400 space-y-2">
            <Bell className="w-10 h-10 mx-auto text-slate-300" />
            <p className="font-bold text-sm">No notifications found</p>
            <p className="text-xs">You're all caught up!</p>
          </div>
        ) : (
          filteredNotifs.map((n) => (
            <div
              key={n.id}
              onClick={() => markAsRead(n.id)}
              className={`p-5 flex items-start gap-4 transition-colors cursor-pointer ${
                !n.is_read ? 'bg-teal-50/40 hover:bg-teal-50/70' : 'hover:bg-slate-50'
              }`}
            >
              <div className="p-2.5 rounded-2xl bg-white border border-slate-200 shrink-0 shadow-xs">
                {getIcon(n.type, n.severity)}
              </div>

              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className={`text-sm font-extrabold ${!n.is_read ? 'text-slate-900 font-black' : 'text-slate-800'}`}>
                      {n.title}
                    </h3>
                    {!n.is_read && (
                      <span className="w-2 h-2 rounded-full bg-brand-500" />
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(n.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">{n.message}</p>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
};
