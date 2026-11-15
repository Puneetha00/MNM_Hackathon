import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, Pill, BarChart3, Calendar, FileText, 
  UserCheck, ShieldAlert, Users, Settings, Lock, 
  Heart, Activity, Bell, Sparkles, Building2, X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, onCloseMobile }) => {
  const { currentUser } = useAuth();
  const role = currentUser?.role || 'elderly';

  const getNavItems = () => {
    if (role === 'caregiver') {
      return [
        { to: '/caregiver/dashboard', icon: LayoutDashboard, label: 'Caregiver Hub' },
        { to: '/medications', icon: Pill, label: 'Medications' },
        { to: '/adherence', icon: BarChart3, label: 'Adherence Insights' },
        { to: '/appointments', icon: Calendar, label: 'Appointments' },
        { to: '/records', icon: FileText, label: 'Medical Documents' },
        { to: '/profile', icon: UserCheck, label: 'Patient Profile' },
        { to: '/collaboration', icon: Users, label: 'Family Collaboration' },
        { to: '/emergency', icon: ShieldAlert, label: 'Emergency Info' },
        { to: '/notifications', icon: Bell, label: 'Alerts & Reminders' },
        { to: '/security', icon: Lock, label: 'Audit & Security' },
      ];
    } else if (role === 'family') {
      return [
        { to: '/family/dashboard', icon: LayoutDashboard, label: 'Family Hub' },
        { to: '/medications', icon: Pill, label: 'Medications' },
        { to: '/adherence', icon: BarChart3, label: 'Adherence Progress' },
        { to: '/appointments', icon: Calendar, label: 'Doctor Visits' },
        { to: '/records', icon: FileText, label: 'Medical Vault' },
        { to: '/profile', icon: UserCheck, label: 'Loved One Profile' },
        { to: '/collaboration', icon: Users, label: 'Care Circle' },
        { to: '/emergency', icon: ShieldAlert, label: 'Emergency Card' },
        { to: '/notifications', icon: Bell, label: 'Notifications' },
        { to: '/security', icon: Lock, label: 'Security & Consent' },
      ];
    } else if (role === 'admin') {
      return [
        { to: '/admin', icon: Building2, label: 'Admin Metrics & Users' },
        { to: '/elderly/dashboard', icon: LayoutDashboard, label: 'Senior View' },
        { to: '/caregiver/dashboard', icon: Activity, label: 'Caregiver View' },
        { to: '/family/dashboard', icon: Heart, label: 'Family View' },
        { to: '/medications', icon: Pill, label: 'All Medications' },
        { to: '/adherence', icon: BarChart3, label: 'Adherence Analytics' },
        { to: '/appointments', icon: Calendar, label: 'Appointments' },
        { to: '/records', icon: FileText, label: 'Document Vault' },
        { to: '/security', icon: Lock, label: 'System Audit Logs' },
      ];
    } else {
      // Default: Elderly User
      return [
        { to: '/elderly/dashboard', icon: LayoutDashboard, label: 'My Care Today' },
        { to: '/medications', icon: Pill, label: 'My Medications' },
        { to: '/adherence', icon: BarChart3, label: 'My Adherence' },
        { to: '/appointments', icon: Calendar, label: 'Doctor Visits' },
        { to: '/records', icon: FileText, label: 'Medical Records' },
        { to: '/profile', icon: UserCheck, label: 'My Health Profile' },
        { to: '/emergency', icon: ShieldAlert, label: 'Emergency Help (SOS)' },
        { to: '/collaboration', icon: Users, label: 'My Care Circle' },
        { to: '/notifications', icon: Bell, label: 'Reminders' },
        { to: '/settings', icon: Settings, label: 'My Settings' },
        { to: '/security', icon: Lock, label: 'Privacy & Security' },
      ];
    }
  };

  const navItems = getNavItems();

  const renderNavContent = (isMobile = false) => (
    <>
      <div className="space-y-1">
        <div className="px-3 pb-3 flex items-center justify-between">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            {role.toUpperCase()} PORTAL
          </p>
          {isMobile && onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              title="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={isMobile ? onCloseMobile : undefined}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all ${
                    isActive
                      ? 'bg-brand-50 text-brand-700 font-bold border-l-4 border-brand-600 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`
                }
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Senior Help / Support Box */}
      <div className="bg-brand-50/70 border border-brand-200/60 rounded-2xl p-3.5 mx-1 mt-6 text-center">
        <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center mx-auto mb-2">
          <Sparkles className="w-4 h-4" />
        </div>
        <p className="text-xs font-bold text-brand-900">Need Assistance?</p>
        <p className="text-[11px] text-slate-600 mt-0.5">Voice assistant is listening or call your caregiver anytime.</p>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar (w-64 fixed consistent width) */}
      <aside className="hidden md:flex w-64 bg-white border-r border-slate-200 min-h-[calc(100vh-4rem)] flex-col justify-between py-6 px-3 shrink-0">
        {renderNavContent(false)}
      </aside>

      {/* Mobile Slide-Over Drawer with consistent w-64 width */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex animate-fade-in">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <aside className="relative w-64 bg-white border-r border-slate-200 h-full flex flex-col justify-between py-6 px-3 shadow-2xl z-10 animate-scale-up">
            {renderNavContent(true)}
          </aside>
        </div>
      )}
    </>
  );
};
