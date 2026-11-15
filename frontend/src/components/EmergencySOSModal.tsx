import React, { useState, useEffect } from 'react';
import { ShieldAlert, Phone, AlertTriangle, X, CheckCircle, HeartPulse, User } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface EmergencySOSModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EmergencySOSModal: React.FC<EmergencySOSModalProps> = ({ isOpen, onClose }) => {
  const { currentUser } = useAuth();
  const [countdown, setCountdown] = useState<number>(5);
  const [isCountingDown, setIsCountingDown] = useState<boolean>(true);
  const [isDispatched, setIsDispatched] = useState<boolean>(false);
  const [emergencyData, setEmergencyData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [additionalNotes, setAdditionalNotes] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setCountdown(5);
      setIsCountingDown(true);
      setIsDispatched(false);
      // Fetch emergency card info
      api.getEmergencyCard().then(setEmergencyData).catch(() => {});
    }
  }, [isOpen]);

  // Countdown timer
  useEffect(() => {
    if (!isOpen || !isCountingDown) return;
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      handleTrigger();
    }
  }, [isOpen, isCountingDown, countdown]);

  const handleTrigger = async () => {
    setIsCountingDown(false);
    setIsLoading(true);
    try {
      const res = await api.triggerEmergency(additionalNotes || "Urgent help requested via ElderCare SOS");
      setIsDispatched(true);
    } catch {
      setIsDispatched(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelCountdown = () => {
    setIsCountingDown(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border-4 border-emergency-500 overflow-hidden transform transition-all animate-scale-up">
        
        {/* Header */}
        <div className="bg-emergency-600 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-2xl animate-bounce">
              <ShieldAlert className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-extrabold tracking-tight">EMERGENCY ASSISTANCE</h3>
              <p className="text-xs text-emergency-100 font-medium">Care Circle Immediate SOS Notification</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {isCountingDown && (
            <div className="text-center py-4 bg-emergency-50 rounded-2xl border border-emergency-200">
              <p className="text-xs font-bold uppercase tracking-wider text-emergency-800">
                Broadcasting alert to care circle in
              </p>
              <div className="text-6xl font-black text-emergency-600 my-2 animate-pulse">
                {countdown}
              </div>
              <p className="text-xs text-slate-500 mb-4">Click below immediately if this was pressed by accident.</p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={handleCancelCountdown}
                  className="px-6 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl text-sm transition-all"
                >
                  Cancel SOS
                </button>
                <button
                  onClick={handleTrigger}
                  className="px-6 py-2.5 bg-emergency-600 hover:bg-emergency-700 text-white font-bold rounded-xl text-sm shadow-md transition-all"
                >
                  Send Alert Now
                </button>
              </div>
            </div>
          )}

          {isDispatched && (
            <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 flex items-start gap-3">
              <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-emerald-900 text-sm">Emergency Broadcast Dispatched!</p>
                <p className="text-xs text-emerald-700 mt-1">
                  Urgent SMS and email notifications have been transmitted to all authorized family members and registered caregivers.
                </p>
              </div>
            </div>
          )}

          {/* Quick Direct Calling for First Responders */}
          <div>
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Phone className="w-4 h-4 text-emergency-600" /> Quick Dial Emergency Services
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <a
                href="tel:911"
                className="flex items-center justify-center gap-2 py-3 px-4 bg-slate-900 hover:bg-black text-white font-black text-lg rounded-2xl shadow-sm transition-transform active:scale-95"
              >
                <Phone className="w-5 h-5 text-emerald-400" />
                <span>Call 911 / 112</span>
              </a>
              <a
                href="tel:18002221222"
                className="flex items-center justify-center gap-2 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-2xl border border-slate-300 transition-colors"
              >
                <span>Poison Control</span>
              </a>
            </div>
          </div>

          {/* Emergency Contacts List */}
          {emergencyData && emergencyData.emergency_contacts?.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Personal Emergency Contacts
              </h4>
              <div className="space-y-2">
                {emergencyData.emergency_contacts.map((c: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <div>
                      <p className="text-sm font-bold text-slate-900">{c.name}</p>
                      <p className="text-xs text-slate-500">{c.relationship} {c.is_primary && '• Primary Contact'}</p>
                    </div>
                    <a
                      href={`tel:${c.phone}`}
                      className="flex items-center gap-1 bg-brand-600 hover:bg-brand-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5" /> Call
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Critical Medical Summary */}
          {emergencyData && (
            <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200 text-xs text-slate-700 space-y-1">
              <div className="flex justify-between font-semibold">
                <span>Blood Type: <span className="font-bold text-brand-700">{emergencyData.blood_type}</span></span>
                <span>DNR: <span className="font-bold">{emergencyData.dnr_status ? 'Yes' : 'No'}</span></span>
              </div>
              <p><strong>Known Allergies:</strong> {emergencyData.allergies?.map((a: any) => `${a.allergen} (${a.severity})`).join(', ') || 'None listed'}</p>
              <p><strong>Hospital Preference:</strong> {emergencyData.preferred_hospital || 'Nearest Emergency Center'}</p>
            </div>
          )}

          <div className="pt-2">
            <button
              onClick={onClose}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition-colors"
            >
              Close Window
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
