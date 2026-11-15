import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, Activity, AlertTriangle, CheckCircle, Clock, Calendar, 
  Pill, Phone, Plus, Bell, ChevronRight, ShieldCheck, Heart
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const CaregiverDashboardPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const data = await api.getCaregiverDashboard();
      setDashboardData(data);
      if (data.patients && data.patients.length > 0) {
        setSelectedPatientId(data.patients[0].id);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading || !dashboardData) {
    return (
      <div className="py-20 text-center">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-slate-500 font-semibold">Loading Caregiver Monitoring Hub...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 w-full pb-12">
      
      {/* 1. Header & Metric Cards */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="bg-sky-100 text-sky-800 text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider">
            Professional Care Hub
          </span>
          <h1 className="text-3xl font-black text-slate-900 mt-1">Caregiver Command Center</h1>
          <p className="text-slate-500 text-sm">
            Logged in as {currentUser?.full_name} • Monitoring {dashboardData.total_patients} registered seniors
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/medications"
            className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" /> Add Medication
          </Link>
          <Link
            to="/appointments"
            className="flex items-center gap-1.5 bg-white hover:bg-slate-100 text-slate-800 px-4 py-2.5 rounded-xl text-sm font-bold border border-slate-300 shadow-sm transition-all"
          >
            <Calendar className="w-4 h-4" /> Schedule Visit
          </Link>
        </div>
      </div>

      {/* Top 4 KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Assigned Seniors</span>
            <Users className="w-5 h-5 text-sky-600" />
          </div>
          <p className="text-3xl font-black text-slate-900">{dashboardData.total_patients}</p>
          <p className="text-[11px] text-slate-500 font-medium">Under active care oversight</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Adherence Rate</span>
            <Activity className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-3xl font-black text-emerald-700">{dashboardData.overall_adherence_rate}%</p>
          <p className="text-[11px] text-emerald-600 font-medium">Across all scheduled doses</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Missed Doses Today</span>
            <AlertTriangle className="w-5 h-5 text-rose-600" />
          </div>
          <p className="text-3xl font-black text-rose-700">{dashboardData.missed_medications_today}</p>
          <p className="text-[11px] text-rose-600 font-medium">Unconfirmed past grace limit</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Attention Flags</span>
            <Heart className="w-5 h-5 text-amber-600" />
          </div>
          <p className="text-3xl font-black text-amber-700">{dashboardData.attention_alerts.length}</p>
          <p className="text-[11px] text-amber-600 font-medium">Seniors needing friendly check-in</p>
        </div>
      </div>

      {/* 2. Caregiver Attention System (#11 B) */}
      {dashboardData.attention_alerts.length > 0 && (
        <div className="bg-amber-50/80 border-2 border-amber-300 rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-amber-200 text-amber-800 rounded-xl">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-amber-950 text-base">
                  Caregiver Attention System – Priority Check-in List
                </h3>
                <p className="text-xs text-amber-800">
                  Identified based on missed dose confirmations or unacknowledged reminders
                </p>
              </div>
            </div>
            <span className="text-xs font-bold bg-amber-200 text-amber-900 px-3 py-1 rounded-full uppercase">
              Action Recommended
            </span>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            {dashboardData.attention_alerts.map((alert: any) => (
              <div key={alert.patient_id} className="bg-white p-4 rounded-2xl border border-amber-200 shadow-xs flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden shrink-0">
                    {alert.avatar_url ? (
                      <img src={alert.avatar_url} alt={alert.patient_name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-bold text-slate-700">
                        {alert.patient_name[0]}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-extrabold text-sm text-slate-900">{alert.patient_name}</p>
                    <ul className="text-xs text-rose-600 font-medium list-disc list-inside mt-0.5">
                      {alert.reasons.map((r: string, i: number) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <a
                  href={`tel:${alert.phone || ''}`}
                  className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-sm transition-colors"
                >
                  <Phone className="w-3.5 h-3.5" /> Call
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Patients Overview Cards */}
      <div className="space-y-4">
        <h3 className="text-xl font-extrabold text-slate-900">Seniors Under Care</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {dashboardData.patients.map((p: any) => (
            <div
              key={p.id}
              className={`p-6 rounded-3xl border transition-all ${
                p.needs_attention ? 'bg-amber-50/40 border-amber-300' : 'bg-white border-slate-200'
              } shadow-sm hover:shadow-md`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img src={p.avatar_url} alt={p.full_name} className="w-12 h-12 rounded-full object-cover ring-2 ring-brand-200" />
                  <div>
                    <h4 className="font-extrabold text-base text-slate-900">{p.full_name}</h4>
                    <p className="text-xs text-slate-500">{p.phone || p.email}</p>
                  </div>
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${p.adherence_rate >= 85 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                  {p.adherence_rate}% adherence
                </span>
              </div>

              {/* Today's Dose Summary */}
              <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
                <div>
                  <span className="text-slate-400 font-medium">Taken</span>
                  <p className="font-black text-emerald-700 text-sm">{p.today_status.taken}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Missed</span>
                  <p className="font-black text-rose-700 text-sm">{p.today_status.missed}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Upcoming</span>
                  <p className="font-black text-teal-700 text-sm">{p.today_status.upcoming}</p>
                </div>
              </div>

              {p.next_dose && (
                <div className="mt-3 text-xs bg-white p-2.5 rounded-xl border border-slate-200 flex items-center justify-between">
                  <span className="text-slate-500">Next: <strong>{p.next_dose.medication_name}</strong></span>
                  <span className="font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded">{p.next_dose.time}</span>
                </div>
              )}

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <Link
                  to={`/adherence?elderly_id=${p.id}`}
                  className="text-xs font-bold text-brand-600 hover:underline flex items-center gap-1"
                >
                  View Full Adherence Report &rarr;
                </Link>
                <Link
                  to={`/medications?elderly_id=${p.id}`}
                  className="text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 px-3 py-1.5 rounded-lg"
                >
                  Manage Meds
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Two Columns: Upcoming Appointments & Recent Activity Timeline */}
      <div className="grid lg:grid-cols-2 gap-6">
        
        {/* Upcoming Appointments */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-sky-600" /> Upcoming Visits for Patients
            </h3>
            <Link to="/appointments" className="text-xs font-bold text-brand-600 hover:underline">
              All Appointments &rarr;
            </Link>
          </div>

          <div className="space-y-3">
            {dashboardData.upcoming_appointments.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">No upcoming appointments scheduled.</p>
            ) : (
              dashboardData.upcoming_appointments.map((a: any) => (
                <div key={a.id} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-extrabold text-sm text-slate-900">{a.patient_name}</p>
                      <span className="text-[10px] font-bold text-sky-700 bg-sky-100 px-2 py-0.5 rounded-md">
                        {a.specialty}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">Dr. {a.doctor_name} • {a.hospital}</p>
                    <p className="text-xs font-bold text-slate-800 mt-1">
                      {new Date(a.datetime).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Healthcare Activity Feed */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-emerald-600" /> Recent Adherence Log Feed
            </h3>
            <span className="text-xs font-bold text-slate-400">Live Timeline</span>
          </div>

          <div className="space-y-2.5">
            {dashboardData.recent_activities.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">No recent dose actions recorded.</p>
            ) : (
              dashboardData.recent_activities.slice(0, 5).map((act: any) => (
                <div key={act.id} className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-900">{act.patient_name}: </span>
                    <span className="text-slate-700">{act.medication_name} ({act.dosage})</span>
                    <p className="text-[11px] text-slate-500">{act.date} at {act.time}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full font-bold text-[11px] ${
                    act.status === 'taken' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {act.status.toUpperCase()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
