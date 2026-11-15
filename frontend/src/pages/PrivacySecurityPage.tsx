import React, { useState, useEffect } from 'react';
import { 
  Lock, Shield, Download, Trash2, Key, History, 
  CheckCircle, AlertTriangle, Eye, RefreshCw 
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const PrivacySecurityPage: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState<boolean>(true);
  const [exportLoading, setExportLoading] = useState<boolean>(false);
  const [passcode, setPasscode] = useState('');
  const [passcodeMsg, setPasscodeMsg] = useState<string | null>(null);

  const fetchAuditLogs = async () => {
    try {
      setLoadingLogs(true);
      const data = await api.getAuditLogs(30);
      setAuditLogs(data);
    } catch {
      // ignore
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const handleUpdatePasscode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode.length < 4) {
      alert("Passcode must be between 4 and 6 digits");
      return;
    }
    try {
      await api.updateMe({ passcode });
      setPasscodeMsg("Passcode updated successfully!");
      setPasscode('');
      setTimeout(() => setPasscodeMsg(null), 3000);
    } catch {
      alert("Failed to update passcode");
    }
  };

  const handleExportData = async () => {
    setExportLoading(true);
    try {
      const data = await api.exportUserData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `eldercare_medical_export_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Failed to generate export file");
    } finally {
      setExportLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (confirm("WARNING: Are you sure you want to permanently delete your account and revoke all access? This action is irreversible.")) {
      try {
        await api.deleteAccount();
        alert("Account deactivated.");
        logout();
      } catch {
        alert("Failed to delete account");
      }
    }
  };

  return (
    <div className="space-y-8 w-full pb-12">
      
      {/* Header */}
      <div>
        <span className="bg-purple-100 text-purple-800 text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider">
          HIPAA & Cybersecurity Guardrails
        </span>
        <h1 className="text-3xl font-black text-slate-900 mt-1">Privacy & Security Governance</h1>
        <p className="text-slate-500 text-sm">
          Audit trail verification, cryptographic passcode management, and GDPR/HIPAA patient data export
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* Passcode & Access Security */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <Key className="w-5 h-5 text-brand-600" /> Security PIN / Passcode
          </h2>
          <p className="text-xs text-slate-500">
            Set or update your 4-6 digit numeric passcode for rapid elderly tablet unlock or caregiver verification.
          </p>

          {passcodeMsg && (
            <div className="p-3 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-xl">
              {passcodeMsg}
            </div>
          )}

          <form onSubmit={handleUpdatePasscode} className="space-y-3">
            <input
              type="password"
              maxLength={6}
              placeholder="Enter new 4-6 digit PIN"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value.replace(/\D/g, ''))}
              className="w-full px-3 py-2.5 border rounded-xl text-sm font-mono tracking-widest text-center text-lg"
            />
            <button
              type="submit"
              className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl text-xs shadow-xs"
            >
              Update Passcode
            </button>
          </form>
        </div>

        {/* Data Portability Export */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <Download className="w-5 h-5 text-emerald-600" /> Patient Data Portability
          </h2>
          <p className="text-xs text-slate-500">
            Export a full machine-readable JSON package containing your complete health history, medication logs, and doctor visits.
          </p>

          <button
            onClick={handleExportData}
            disabled={exportLoading}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{exportLoading ? "Generating Export Package..." : "Export My Medical Data (.JSON)"}</span>
          </button>
        </div>

        {/* Account Deletion */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-lg font-black text-rose-700 flex items-center gap-2">
            <Trash2 className="w-5 h-5" /> Account Eradication
          </h2>
          <p className="text-xs text-slate-500">
            Permanently deactivate your account, unbind all caregiver links, and erase active reminders.
          </p>

          <button
            onClick={handleDeleteAccount}
            className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl text-xs border border-rose-200 transition-colors"
          >
            Request Account Deletion
          </button>
        </div>

      </div>

      {/* Security Audit Trail Log Table (#10 Security Requirement) */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <History className="w-5 h-5 text-purple-600" /> Tamper-Evident Audit Trail
            </h2>
            <p className="text-xs text-slate-500">
              Immutable logging of all authentication events, confidential document reads, and medication updates
            </p>
          </div>

          <button
            onClick={fetchAuditLogs}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors"
            title="Refresh Audit Logs"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Event Category</th>
                <th className="py-3 px-4">Security Action</th>
                <th className="py-3 px-4">IP Address</th>
                <th className="py-3 px-4">Context Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/80">
                  <td className="py-3 px-4 text-slate-400 font-mono">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="py-3 px-4">
                    <span className="bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded text-[10px]">
                      {log.category}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-extrabold text-slate-900">
                    {log.action}
                  </td>
                  <td className="py-3 px-4 text-slate-500 font-mono">
                    {log.ip_address || '127.0.0.1'}
                  </td>
                  <td className="py-3 px-4 text-slate-600 max-w-xs truncate font-mono text-[11px]">
                    {JSON.stringify(log.details)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
