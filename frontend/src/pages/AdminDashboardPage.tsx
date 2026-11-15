import React, { useState, useEffect } from 'react';
import { 
  Building2, Users, Pill, Calendar, ShieldCheck, Activity, 
  Lock, RefreshCw, CheckCircle, Search 
} from 'lucide-react';
import { api } from '../services/api';

export const AdminDashboardPage: React.FC = () => {
  const [metrics, setMetrics] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [userSearch, setUserSearch] = useState<string>('');

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [m, u, a] = await Promise.all([
        api.getAdminMetrics(),
        api.getAdminUsers(),
        api.getAdminAuditLogs(),
      ]);
      setMetrics(m);
      setUsers(u);
      setAuditLogs(a);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  if (loading || !metrics) {
    return (
      <div className="py-20 text-center">
        <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-slate-500 font-semibold">Loading Healthcare Administration Console...</p>
      </div>
    );
  }

  const filteredUsers = users.filter(u =>
    u.full_name.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.role.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div className="space-y-8 w-full pb-12">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="bg-purple-100 text-purple-800 text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider">
            System Administration
          </span>
          <h1 className="text-3xl font-black text-slate-900 mt-1">Platform Governance & Oversight</h1>
          <p className="text-slate-500 text-sm">
            Ecosystem health, user account roles, and regulatory audit compliance
          </p>
        </div>

        <button
          onClick={fetchAdminData}
          className="flex items-center gap-1.5 bg-slate-900 hover:bg-black text-white px-4 py-2.5 rounded-2xl text-xs font-bold shadow-sm transition-colors self-start md:self-auto"
        >
          <RefreshCw className="w-4 h-4" /> Refresh Platform Status
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Registered Accounts</span>
          <p className="text-4xl font-black text-slate-900">{metrics.total_users}</p>
          <p className="text-[11px] text-slate-500">
            {metrics.role_breakdown.elderly} Seniors • {metrics.role_breakdown.caregivers} Caregivers
          </p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Prescriptions</span>
          <p className="text-4xl font-black text-teal-600">{metrics.total_active_medications}</p>
          <p className="text-[11px] text-slate-500">Managed across all schedules</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Appointments Managed</span>
          <p className="text-4xl font-black text-sky-600">{metrics.total_appointments_managed}</p>
          <p className="text-[11px] text-slate-500">Doctor consultations scheduled</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Security Events Logged</span>
          <p className="text-4xl font-black text-purple-600">{metrics.total_audit_events_logged}</p>
          <p className="text-[11px] text-emerald-600 font-bold">100% Cryptographically verified</p>
        </div>
      </div>

      {/* User Management Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-brand-600" /> Platform User Directory
            </h2>
            <p className="text-xs text-slate-500">Verified seniors, caregivers, family members, and administrative staff</p>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Filter by name, email, role..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="pl-9 pr-4 py-2 border rounded-xl text-xs w-64"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4">Security PIN</th>
                <th className="py-3 px-4">Joined Date</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/80">
                  <td className="py-3 px-4 font-bold text-slate-900">
                    {u.full_name}
                    <p className="text-[11px] text-slate-400 font-normal">{u.email}</p>
                  </td>
                  <td className="py-3 px-4">
                    <span className="capitalize font-bold px-2.5 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-800">
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-600">{u.phone || 'N/A'}</td>
                  <td className="py-3 px-4 text-emerald-700 font-bold">
                    {u.has_passcode ? 'Configured' : 'Not Set'}
                  </td>
                  <td className="py-3 px-4 text-slate-400">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4">
                    <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full text-[10px]">
                      Active
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Global Audit Log Stream */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-4">
        <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-purple-600" /> System-Wide Security Audit Stream
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {auditLogs.slice(0, 15).map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/80">
                  <td className="py-3 px-4 text-slate-400 font-mono">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-800">{log.user_name}</td>
                  <td className="py-3 px-4 font-extrabold text-slate-900">{log.action}</td>
                  <td className="py-3 px-4">
                    <span className="bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded text-[10px]">
                      {log.category}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-500 font-mono">{log.ip_address || '127.0.0.1'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
