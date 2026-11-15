import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import { 
  BarChart3, TrendingUp, AlertTriangle, CheckCircle, Calendar, 
  Printer, ArrowDownRight, Sparkles, Clock 
} from 'lucide-react';
import { api } from '../services/api';

export const AdherenceReportsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const queryElderlyId = searchParams.get('elderly_id');
  const targetElderlyId = queryElderlyId ? parseInt(queryElderlyId, 10) : undefined;

  const [days, setDays] = useState<number>(14);
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchAdherence = async () => {
    try {
      setLoading(true);
      const data = await api.getAdherenceSummary(targetElderlyId, days);
      setReportData(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdherence();
  }, [targetElderlyId, days]);

  const handlePrint = () => {
    window.print();
  };

  if (loading || !reportData) {
    return (
      <div className="py-20 text-center">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-slate-500 font-semibold">Generating Adherence Intelligence Report...</p>
      </div>
    );
  }

  const getBadgeStyle = (category: string) => {
    if (category === 'Excellent') return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    if (category === 'Moderate') return 'bg-amber-100 text-amber-800 border-amber-300';
    return 'bg-rose-100 text-rose-800 border-rose-300';
  };

  return (
    <div className="space-y-8 w-full pb-12">
      
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="bg-brand-100 text-brand-800 text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider">
            Clinical Adherence Analytics
          </span>
          <h1 className="text-3xl font-black text-slate-900 mt-1">Medication Adherence Insights</h1>
          <p className="text-slate-500 text-sm">
            Tracking confirmation fidelity, habit trends, and time-of-day adherence patterns
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-slate-200/70 p-1 rounded-xl">
            <button
              onClick={() => setDays(7)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                days === 7 ? 'bg-white text-brand-800 shadow-xs' : 'text-slate-600'
              }`}
            >
              7 Days
            </button>
            <button
              onClick={() => setDays(14)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                days === 14 ? 'bg-white text-brand-800 shadow-xs' : 'text-slate-600'
              }`}
            >
              14 Days
            </button>
            <button
              onClick={() => setDays(30)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                days === 30 ? 'bg-white text-brand-800 shadow-xs' : 'text-slate-600'
              }`}
            >
              30 Days
            </button>
          </div>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 bg-white hover:bg-slate-100 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold border border-slate-300 shadow-xs"
          >
            <Printer className="w-4 h-4" /> Print Doctor Summary
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Overall Fidelity</span>
          <div className="flex items-baseline gap-2">
            <p className="text-4xl font-black text-slate-900">{reportData.overall_adherence_rate}%</p>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${getBadgeStyle(reportData.score_category)}`}>
              {reportData.score_category}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-2">{reportData.recommendation}</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Confirmed Taken</span>
          <p className="text-4xl font-black text-emerald-600">{reportData.taken_doses}</p>
          <p className="text-xs text-slate-500">Recorded on schedule</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Missed Doses</span>
          <p className="text-4xl font-black text-rose-600">{reportData.missed_doses}</p>
          <p className="text-xs text-slate-500">Unconfirmed past grace window</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Evaluated</span>
          <p className="text-4xl font-black text-slate-800">{reportData.taken_doses + reportData.missed_doses}</p>
          <p className="text-xs text-slate-500">Over past {days} days</p>
        </div>
      </div>

      {/* Recharts Chart 1: Daily Adherence Trend */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-brand-600" /> Daily Medication Adherence Fidelity (%)
            </h3>
            <p className="text-xs text-slate-500">Target clinical adherence threshold: ≥ 85%</p>
          </div>
        </div>

        <div className="h-72 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={reportData.trend_data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="display_date" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={11} tickLine={false} unit="%" />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: '1px solid #cbd5e1', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                formatter={(value: any) => [`${value}%`, 'Adherence Rate']}
              />
              <Legend verticalAlign="top" height={36} />
              <Line 
                type="monotone" 
                dataKey="rate" 
                name="Adherence Fidelity %" 
                stroke="#0d9488" 
                strokeWidth={3} 
                dot={{ r: 4, fill: '#0d9488' }} 
                activeDot={{ r: 6 }} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Two Columns: Time-of-Day Pattern & Frequently Missed Medications */}
      <div className="grid lg:grid-cols-2 gap-6">
        
        {/* Recharts Chart 2: Time-of-Day Breakdown */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-sky-600" /> Time-of-Day Adherence Breakdown
          </h3>
          <p className="text-xs text-slate-500">Comparison of confirmation rates across day slots</p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reportData.time_pattern_summary} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="slot" stroke="#94a3b8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #cbd5e1' }} />
                <Legend />
                <Bar dataKey="taken" name="Taken Doses" fill="#14b8a6" radius={[6, 6, 0, 0]} />
                <Bar dataKey="missed" name="Missed Doses" fill="#f43f5e" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Frequently Missed Items & Clinical Insights */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600" /> Frequently Missed Doses & Patterns
          </h3>
          <p className="text-xs text-slate-500">Identifies specific medications that correlate with non-adherence</p>

          <div className="space-y-3">
            {reportData.frequently_missed.length === 0 ? (
              <div className="p-8 bg-emerald-50 rounded-2xl border border-emerald-200 text-center text-xs text-emerald-800 font-semibold">
                🎉 No frequent missed medications detected. Outstanding consistency!
              </div>
            ) : (
              reportData.frequently_missed.map((item: any) => (
                <div key={item.medication_id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <p className="font-extrabold text-sm text-slate-900">{item.medication_name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Missed {item.missed_count} out of {item.total_scheduled} scheduled doses
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-rose-100 text-rose-800 font-extrabold text-xs rounded-xl">
                    {item.miss_rate}% Miss Rate
                  </span>
                </div>
              ))
            )}
          </div>

          <div className="p-4 bg-brand-50 rounded-2xl border border-brand-200 text-xs text-brand-900 font-medium">
            💡 <strong>Smart Observation:</strong> Evening medications generally exhibit a lower adherence fidelity due to irregular dinner times. Setting an audible reminder 15 minutes before bedtime is recommended.
          </div>
        </div>

      </div>

    </div>
  );
};
