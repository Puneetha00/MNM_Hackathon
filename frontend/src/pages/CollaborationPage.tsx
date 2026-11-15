import React, { useState, useEffect } from 'react';
import { 
  Users, UserPlus, Shield, Check, X, Trash2, KeyRound, 
  Mail, Heart, Activity, AlertCircle, Copy, CheckCheck 
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { CaregiverLink } from '../types';

export const CollaborationPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [collaborators, setCollaborators] = useState<CaregiverLink[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showInviteModal, setShowInviteModal] = useState<boolean>(false);
  const [showAcceptModal, setShowAcceptModal] = useState<boolean>(false);

  // Invite Form
  const [recipientEmail, setRecipientEmail] = useState('');
  const [relationshipType, setRelationshipType] = useState('family');
  const [relationshipLabel, setRelationshipLabel] = useState('Family Member');
  const [invitePasscode, setInvitePasscode] = useState('123456');
  const [permissions, setPermissions] = useState({
    can_view_medications: true,
    can_manage_medications: false,
    can_view_adherence: true,
    can_view_appointments: true,
    can_manage_appointments: false,
    can_view_records: true,
    can_receive_emergency_alerts: true,
    can_receive_missed_dose_alerts: true,
  });
  const [inviteResult, setInviteResult] = useState<any>(null);

  // Accept Form
  const [acceptCode, setAcceptCode] = useState('');
  const [acceptPasscode, setAcceptPasscode] = useState('');
  const [acceptMsg, setAcceptMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchCollaborators = async () => {
    try {
      setLoading(true);
      const data = await api.getCollaborators();
      setCollaborators(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollaborators();
  }, []);

  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.createInvitation({
        recipient_email: recipientEmail,
        relationship_type: relationshipType,
        relationship_label: relationshipLabel,
        passcode: invitePasscode,
        ...permissions
      });
      setInviteResult(res);
      await fetchCollaborators();
    } catch (err: any) {
      alert(err.message || "Failed to create invitation");
    }
  };

  const handleAcceptInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.acceptInvitation({
        invite_code: acceptCode.trim(),
        passcode: acceptPasscode.trim(),
      });
      setAcceptMsg(res.message);
      await fetchCollaborators();
      setTimeout(() => setShowAcceptModal(false), 2000);
    } catch (err: any) {
      alert(err.message || "Invalid invitation code or passcode");
    }
  };

  const handleTogglePerm = async (link: CaregiverLink, permKey: string) => {
    const currentVal = (link as any)[permKey];
    try {
      await api.updatePermissions(link.id, { [permKey]: !currentVal });
      await fetchCollaborators();
    } catch {
      alert("Only the elderly user can adjust collaborator permissions.");
    }
  };

  const handleRevoke = async (linkId: number) => {
    if (confirm("Are you sure you want to revoke this collaborator's access?")) {
      try {
        await api.revokeAccess(linkId);
        await fetchCollaborators();
      } catch {
        alert("Failed to revoke access");
      }
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 w-full pb-12">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="bg-emerald-100 text-emerald-800 text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider">
            Collaborative Care Circle
          </span>
          <h1 className="text-3xl font-black text-slate-900 mt-1">Care Circle & Permissions</h1>
          <p className="text-slate-500 text-sm">
            Control who can view or manage your medications, appointments, records, and emergency alerts
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => { setShowAcceptModal(true); setAcceptMsg(null); }}
            className="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-800 rounded-2xl text-xs font-bold border border-slate-300 shadow-xs"
          >
            Enter Invitation Code
          </button>
          <button
            onClick={() => { setShowInviteModal(true); setInviteResult(null); }}
            className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-5 py-2.5 rounded-2xl text-sm font-bold shadow-md shadow-brand-500/20"
          >
            <UserPlus className="w-4 h-4" />
            <span>Invite to Circle</span>
          </button>
        </div>
      </div>

      {/* Active Care Circle Members List */}
      <div className="space-y-4">
        <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
          <Users className="w-5 h-5 text-brand-600" /> Active Circle Members ({collaborators.length})
        </h2>

        {collaborators.length === 0 ? (
          <div className="p-12 bg-white rounded-3xl border border-slate-200 text-center space-y-3">
            <Users className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="font-extrabold text-slate-700 text-base">No Collaborators in Your Circle</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Invite family members or professional caregivers to share medication adherence tracking and emergency notifications.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {collaborators.map((c) => (
              <div key={c.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-brand-100 text-brand-700 font-black text-lg flex items-center justify-center">
                      {c.member_name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-base text-slate-900">{c.member_name}</h3>
                      <p className="text-xs text-slate-500">{c.relationship_label} • {c.member_email}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRevoke(c.id)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                    title="Revoke Collaborator Access"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Fine-Grained Sovereignty Permissions (#8 & #10) */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                    Sovereign Access Permissions
                  </p>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      onClick={() => handleTogglePerm(c, 'can_view_medications')}
                      className={`p-2 rounded-xl border text-left flex items-center justify-between ${
                        c.can_view_medications ? 'bg-teal-50 border-teal-300 text-teal-900 font-bold' : 'bg-slate-50 border-slate-200 text-slate-400 line-through'
                      }`}
                    >
                      <span>View Meds</span>
                      {c.can_view_medications ? <Check className="w-3.5 h-3.5 text-teal-600" /> : <X className="w-3.5 h-3.5" />}
                    </button>

                    <button
                      onClick={() => handleTogglePerm(c, 'can_manage_medications')}
                      className={`p-2 rounded-xl border text-left flex items-center justify-between ${
                        c.can_manage_medications ? 'bg-teal-50 border-teal-300 text-teal-900 font-bold' : 'bg-slate-50 border-slate-200 text-slate-400 line-through'
                      }`}
                    >
                      <span>Edit Meds</span>
                      {c.can_manage_medications ? <Check className="w-3.5 h-3.5 text-teal-600" /> : <X className="w-3.5 h-3.5" />}
                    </button>

                    <button
                      onClick={() => handleTogglePerm(c, 'can_view_adherence')}
                      className={`p-2 rounded-xl border text-left flex items-center justify-between ${
                        c.can_view_adherence ? 'bg-teal-50 border-teal-300 text-teal-900 font-bold' : 'bg-slate-50 border-slate-200 text-slate-400 line-through'
                      }`}
                    >
                      <span>Adherence Stats</span>
                      {c.can_view_adherence ? <Check className="w-3.5 h-3.5 text-teal-600" /> : <X className="w-3.5 h-3.5" />}
                    </button>

                    <button
                      onClick={() => handleTogglePerm(c, 'can_view_appointments')}
                      className={`p-2 rounded-xl border text-left flex items-center justify-between ${
                        c.can_view_appointments ? 'bg-teal-50 border-teal-300 text-teal-900 font-bold' : 'bg-slate-50 border-slate-200 text-slate-400 line-through'
                      }`}
                    >
                      <span>Appointments</span>
                      {c.can_view_appointments ? <Check className="w-3.5 h-3.5 text-teal-600" /> : <X className="w-3.5 h-3.5" />}
                    </button>

                    <button
                      onClick={() => handleTogglePerm(c, 'can_view_records')}
                      className={`p-2 rounded-xl border text-left flex items-center justify-between ${
                        c.can_view_records ? 'bg-teal-50 border-teal-300 text-teal-900 font-bold' : 'bg-slate-50 border-slate-200 text-slate-400 line-through'
                      }`}
                    >
                      <span>Medical Files</span>
                      {c.can_view_records ? <Check className="w-3.5 h-3.5 text-teal-600" /> : <X className="w-3.5 h-3.5" />}
                    </button>

                    <button
                      onClick={() => handleTogglePerm(c, 'can_receive_emergency_alerts')}
                      className={`p-2 rounded-xl border text-left flex items-center justify-between ${
                        c.can_receive_emergency_alerts ? 'bg-rose-50 border-rose-300 text-rose-900 font-bold' : 'bg-slate-50 border-slate-200 text-slate-400 line-through'
                      }`}
                    >
                      <span>SOS Broadcast</span>
                      {c.can_receive_emergency_alerts ? <Check className="w-3.5 h-3.5 text-rose-600" /> : <X className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Invite Member Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto text-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-xl font-black text-slate-900">Invite Care Circle Member</h3>
              <button onClick={() => setShowInviteModal(false)} className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            {inviteResult ? (
              <div className="p-5 bg-emerald-50 rounded-2xl border border-emerald-300 space-y-3">
                <p className="font-extrabold text-emerald-900 text-base">Invitation Generated & Sent!</p>
                <div className="bg-white p-3 rounded-xl border border-emerald-200 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-slate-400 font-bold">INVITE CODE:</span>
                    <p className="text-xl font-black text-brand-700 tracking-wider font-mono">{inviteResult.invite_code}</p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(inviteResult.invite_code)}
                    className="p-2 text-brand-600 hover:bg-brand-50 rounded-lg flex items-center gap-1 text-xs font-bold"
                  >
                    {copied ? <CheckCheck className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    <span>{copied ? "Copied" : "Copy"}</span>
                  </button>
                </div>
                <p className="text-xs text-slate-600">
                  Share this code with your loved one along with your designated security passcode ({invitePasscode}).
                </p>
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreateInvite} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Recipient Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="sarah.davis@example.com"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    className="w-full px-3 py-2.5 border rounded-xl"
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Relationship Type</label>
                    <select
                      value={relationshipType}
                      onChange={(e) => setRelationshipType(e.target.value)}
                      className="w-full px-3 py-2.5 border rounded-xl"
                    >
                      <option value="family">Family Member</option>
                      <option value="caregiver">Professional Caregiver</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Relationship Label</label>
                    <input
                      type="text"
                      placeholder="e.g. Daughter, Home Nurse, Son"
                      value={relationshipLabel}
                      onChange={(e) => setRelationshipLabel(e.target.value)}
                      className="w-full px-3 py-2.5 border rounded-xl"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Designated Security Passcode *</label>
                  <input
                    type="text"
                    required
                    placeholder="6-digit passcode"
                    value={invitePasscode}
                    onChange={(e) => setInvitePasscode(e.target.value)}
                    className="w-full px-3 py-2.5 border rounded-xl font-mono tracking-widest text-xs"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Recipient must provide this passcode to accept your invite.</p>
                </div>

                {/* Initial Permissions */}
                <div className="space-y-2 pt-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Grant Permissions</label>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {Object.entries(permissions).map(([key, val]) => (
                      <label key={key} className="flex items-center gap-2 p-2 bg-slate-50 border rounded-lg cursor-pointer">
                        <input
                          type="checkbox"
                          checked={val}
                          onChange={(e) => setPermissions({ ...permissions, [key]: e.target.checked })}
                          className="rounded text-brand-600"
                        />
                        <span className="capitalize">{key.replace('can_', '').replace(/_/g, ' ')}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    className="px-5 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-md"
                  >
                    Dispatch Invitation
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Accept Modal */}
      {showAcceptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-sm">
            <h3 className="text-xl font-black text-slate-900">Accept Care Circle Invite</h3>
            {acceptMsg && <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-bold">{acceptMsg}</div>}
            <form onSubmit={handleAcceptInvite} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Invite Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. EC-A1B2C3"
                  value={acceptCode}
                  onChange={(e) => setAcceptCode(e.target.value)}
                  className="w-full px-3 py-2.5 border rounded-xl uppercase font-mono tracking-wider"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Security Passcode</label>
                <input
                  type="password"
                  required
                  placeholder="6-digit passcode"
                  value={acceptPasscode}
                  onChange={(e) => setAcceptPasscode(e.target.value)}
                  className="w-full px-3 py-2.5 border rounded-xl font-mono tracking-widest"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAcceptModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold"
                >
                  Join Circle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
