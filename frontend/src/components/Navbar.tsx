import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  HeartHandshake, Bell, ShieldAlert, LogOut, User, 
  Volume2, VolumeX, Eye, Sparkles, CheckCheck, Menu
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAccessibility } from '../context/AccessibilityContext';
import { useNotifications } from '../context/NotificationContext';

interface NavbarProps {
  onOpenSOS?: () => void;
  onToggleSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenSOS, onToggleSidebar }) => {
  const { currentUser, logout, isAuthenticated } = useAuth();
  const { largeFont, toggleLargeFont, highContrast, toggleHighContrast, voiceEnabled, toggleVoiceEnabled } = useAccessibility();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'elderly':
        return <span className="bg-teal-100 text-teal-800 text-xs px-2.5 py-1 rounded-full font-semibold border border-teal-200">Elderly User</span>;
      case 'caregiver':
        return <span className="bg-sky-100 text-sky-800 text-xs px-2.5 py-1 rounded-full font-semibold border border-sky-200">Caregiver</span>;
      case 'family':
        return <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-1 rounded-full font-semibold border border-emerald-200">Family Member</span>;
      case 'admin':
        return <span className="bg-purple-100 text-purple-800 text-xs px-2.5 py-1 rounded-full font-semibold border border-purple-200">Administrator</span>;
      default:
        return null;
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm transition-colors">
      <div className="w-full px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        <div className="flex items-center gap-3">
          {onToggleSidebar && isAuthenticated && (
            <button
              onClick={onToggleSidebar}
              className="md:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              title="Toggle Navigation Menu"
              aria-label="Toggle Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-600 to-primary-600 flex items-center justify-center text-white shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-slate-900 group-hover:text-brand-700 transition-colors">
                Elder<span className="text-brand-600">Care</span>
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs text-slate-400 font-medium border-l border-slate-300 pl-2">
                Healthcare Ecosystem
              </span>
            </div>
          </Link>
        </div>

        {/* Right Section: Accessibility & User Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Accessibility Quick Toggles */}
          <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200">
            <button
              onClick={toggleLargeFont}
              title={largeFont ? "Switch to standard text size" : "Enlarge text size"}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                largeFont ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              A+
            </button>
            <button
              onClick={toggleHighContrast}
              title="Toggle high contrast visibility"
              className={`p-1.5 rounded-lg text-xs transition-all ${
                highContrast ? 'bg-slate-900 text-yellow-300 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={toggleVoiceEnabled}
              title={voiceEnabled ? "Voice assistant audio enabled" : "Voice audio muted"}
              className={`p-1.5 rounded-lg text-xs transition-all ${
                voiceEnabled ? 'bg-primary-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>

          {/* Emergency SOS Button */}
          {onOpenSOS && (
            <button
              onClick={onOpenSOS}
              className="flex items-center gap-1.5 bg-emergency-600 hover:bg-emergency-700 text-white px-3.5 py-1.5 rounded-xl text-sm font-bold shadow-md shadow-emergency-500/30 animate-pulse active:scale-95 transition-all"
              title="Trigger Immediate Emergency Assistance"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>SOS</span>
            </button>
          )}

          {isAuthenticated && (
            <>
              {/* Notification Center Popover */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                  title="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-rose-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-bounce">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 py-3 z-50">
                    <div className="px-4 pb-2 border-b border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">Notifications</span>
                        {unreadCount > 0 && (
                          <span className="bg-brand-100 text-brand-800 text-xs px-2 py-0.5 rounded-full font-semibold">
                            {unreadCount} new
                          </span>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-xs text-brand-600 hover:text-brand-800 flex items-center gap-1 font-medium"
                        >
                          <CheckCheck className="w-3.5 h-3.5" /> Mark all read
                        </button>
                      )}
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                      {notifications.length === 0 ? (
                        <p className="text-center py-6 text-sm text-slate-400">No notifications yet.</p>
                      ) : (
                        notifications.slice(0, 6).map((n) => (
                          <div
                            key={n.id}
                            onClick={() => markAsRead(n.id)}
                            className={`p-3.5 hover:bg-slate-50 cursor-pointer transition-colors ${
                              !n.is_read ? 'bg-teal-50/50' : ''
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <p className={`text-xs font-semibold ${!n.is_read ? 'text-teal-900' : 'text-slate-700'}`}>
                                {n.title}
                              </p>
                              {!n.is_read && (
                                <span className="w-2 h-2 rounded-full bg-teal-500 shrink-0 mt-1" />
                              )}
                            </div>
                            <p className="text-xs text-slate-500 mt-1 line-clamp-2">{n.message}</p>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="px-4 pt-2 border-t border-slate-100 text-center">
                      <Link
                        to="/notifications"
                        onClick={() => setShowNotifications(false)}
                        className="text-xs text-brand-600 font-semibold hover:underline"
                      >
                        View all alerts & history &rarr;
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* User Profile & Role Info */}
              <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
                <div className="hidden md:flex flex-col items-end">
                  <span className="text-sm font-bold text-slate-800 leading-tight">
                    {currentUser?.full_name}
                  </span>
                  {getRoleBadge(currentUser?.role)}
                </div>

                <div className="w-9 h-9 rounded-full bg-slate-200 overflow-hidden ring-2 ring-brand-500/20 shrink-0">
                  {currentUser?.avatar_url ? (
                    <img src={currentUser.avatar_url} alt={currentUser.full_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-brand-100 text-brand-700 font-bold text-sm">
                      {currentUser?.full_name?.charAt(0) || 'U'}
                    </div>
                  )}
                </div>

                <button
                  onClick={handleLogout}
                  title="Sign out securely"
                  className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </>
          )}

          {!isAuthenticated && (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="text-sm font-semibold text-slate-700 hover:text-brand-600 px-3 py-1.5 rounded-xl hover:bg-slate-100 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 px-4 py-1.5 rounded-xl shadow-sm transition-colors"
              >
                Register
              </Link>
            </div>
          )}

        </div>
      </div>
    </header>
  );
};
