import React, { useState } from 'react';
import { 
  Settings, Bell, Volume2, Eye, Shield, Clock, 
  User, CheckCircle, Save, Sparkles 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAccessibility } from '../context/AccessibilityContext';

export const UserSettingsPage: React.FC = () => {
  const { currentUser, updateUserPreferences } = useAuth();
  const { 
    largeFont, toggleLargeFont, 
    highContrast, toggleHighContrast, 
    voiceEnabled, toggleVoiceEnabled 
  } = useAccessibility();

  const [fullName, setFullName] = useState(currentUser?.full_name || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [emailNotifs, setEmailNotifs] = useState(currentUser?.email_notifications ?? true);
  const [pushNotifs, setPushNotifs] = useState(currentUser?.push_notifications ?? true);
  const [soundAlerts, setSoundAlerts] = useState(currentUser?.sound_alerts ?? true);
  const [reminderMinutes, setReminderMinutes] = useState(currentUser?.reminder_advance_minutes || 15);
  const [inactivityMinutes, setInactivityMinutes] = useState(currentUser?.inactivity_timeout_minutes || 15);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateUserPreferences({
        full_name: fullName,
        phone,
        email_notifications: emailNotifs,
        push_notifications: pushNotifs,
        sound_alerts: soundAlerts,
        reminder_advance_minutes: reminderMinutes,
        inactivity_timeout_minutes: inactivityMinutes,
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch {
      alert("Failed to save settings");
    }
  };

  return (
    <div className="space-y-8 w-full pb-12">
      
      {/* Header */}
      <div>
        <span className="bg-slate-200 text-slate-800 text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider">
          Personal Preferences
        </span>
        <h1 className="text-3xl font-black text-slate-900 mt-1">Application Settings</h1>
        <p className="text-slate-500 text-sm">
          Customize notifications, reminder timing, accessibility modes, and security timeouts
        </p>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center gap-2 text-emerald-800 text-sm font-bold animate-fade-in">
          <CheckCircle className="w-5 h-5 text-emerald-600" />
          <span>Your preferences have been successfully updated!</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6 text-sm">
        
        {/* Profile Details */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <User className="w-5 h-5 text-brand-600" /> Personal Account Information
          </h2>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2.5 border rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number (For SMS & SOS)</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2.5 border rounded-xl"
              />
            </div>
          </div>
        </div>

        {/* Proactive Reminder System Preferences */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <Bell className="w-5 h-5 text-brand-600" /> Proactive Reminder & Alert Engine
          </h2>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Advance Medication Reminder Lead Time
              </label>
              <select
                value={reminderMinutes}
                onChange={(e) => setReminderMinutes(parseInt(e.target.value, 10))}
                className="w-full sm:w-64 px-3 py-2.5 border rounded-xl"
              >
                <option value={10}>10 minutes before</option>
                <option value={15}>15 minutes before (Recommended)</option>
                <option value={30}>30 minutes before</option>
                <option value={60}>1 hour before</option>
              </select>
            </div>

            <div className="pt-2 space-y-2">
              <label className="flex items-center gap-3 p-3 bg-slate-50 border rounded-2xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={emailNotifs}
                  onChange={(e) => setEmailNotifs(e.target.checked)}
                  className="w-4 h-4 text-brand-600 rounded"
                />
                <div>
                  <p className="font-bold text-xs text-slate-800">Email Alerts</p>
                  <p className="text-[11px] text-slate-500">Receive formatted email reminders before scheduled medication times</p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 bg-slate-50 border rounded-2xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={pushNotifs}
                  onChange={(e) => setPushNotifs(e.target.checked)}
                  className="w-4 h-4 text-brand-600 rounded"
                />
                <div>
                  <p className="font-bold text-xs text-slate-800">Push & In-App Notifications</p>
                  <p className="text-[11px] text-slate-500">Show notification toasts and bell badges</p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 bg-slate-50 border rounded-2xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={soundAlerts}
                  onChange={(e) => setSoundAlerts(e.target.checked)}
                  className="w-4 h-4 text-brand-600 rounded"
                />
                <div>
                  <p className="font-bold text-xs text-slate-800">Audible Reminders</p>
                  <p className="text-[11px] text-slate-500">Play chime sound and vocal announcements when a medication is due</p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Accessibility Preferences */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <Eye className="w-5 h-5 text-teal-600" /> Accessibility & Visual Comfort
          </h2>

          <div className="grid sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={toggleLargeFont}
              className={`p-4 rounded-2xl border text-left space-y-1 transition-all ${
                largeFont ? 'bg-teal-50 border-teal-500 text-teal-900 font-bold ring-2 ring-teal-200' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <span className="text-base font-black">A+ Large Text</span>
              <p className="text-xs text-slate-500">Enlarges typography across all pages</p>
            </button>

            <button
              type="button"
              onClick={toggleHighContrast}
              className={`p-4 rounded-2xl border text-left space-y-1 transition-all ${
                highContrast ? 'bg-slate-900 text-yellow-300 font-bold ring-2 ring-yellow-400' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <span className="text-base font-black">High Contrast</span>
              <p className="text-xs text-slate-400">High visual clarity and bold borders</p>
            </button>

            <button
              type="button"
              onClick={toggleVoiceEnabled}
              className={`p-4 rounded-2xl border text-left space-y-1 transition-all ${
                voiceEnabled ? 'bg-primary-50 border-primary-500 text-primary-900 font-bold ring-2 ring-primary-200' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <span className="text-base font-black">Voice Assistant</span>
              <p className="text-xs text-slate-500">Speaks medication alerts aloud</p>
            </button>
          </div>
        </div>

        {/* Session Security Inactivity Timeout */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-purple-600" /> Security & Inactivity Session Control
          </h2>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Automatic Logout Inactivity Timeout
            </label>
            <select
              value={inactivityMinutes}
              onChange={(e) => setInactivityMinutes(parseInt(e.target.value, 10))}
              className="w-full sm:w-64 px-3 py-2.5 border rounded-xl"
            >
              <option value={5}>5 minutes (Maximum Security)</option>
              <option value={15}>15 minutes (Standard HIPAA)</option>
              <option value={30}>30 minutes</option>
              <option value={60}>1 hour</option>
            </select>
            <p className="text-xs text-slate-400 mt-1">Protects patient records if the browser is left unattended.</p>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-bold px-8 py-3.5 rounded-2xl shadow-lg shadow-brand-500/25 transition-all text-sm"
          >
            <Save className="w-4 h-4" />
            <span>Save All Preferences</span>
          </button>
        </div>

      </form>

    </div>
  );
};
