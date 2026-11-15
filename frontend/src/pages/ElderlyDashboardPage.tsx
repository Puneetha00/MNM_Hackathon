import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Pill, CheckCircle, Clock, AlertTriangle, Calendar, ShieldAlert, 
  Volume2, Droplets, Footprints, Moon, Smile, Sparkles, Check, ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useAccessibility } from '../context/AccessibilityContext';
import { DoseLog, Appointment, WellnessData } from '../types';

export const ElderlyDashboardPage: React.FC<{ onOpenSOS: () => void }> = ({ onOpenSOS }) => {
  const { currentUser } = useAuth();
  const { speak } = useAccessibility();

  const [todaySchedule, setTodaySchedule] = useState<DoseLog[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [wellness, setWellness] = useState<WellnessData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [scheduleData, apptsData, wellnessData] = await Promise.all([
        api.getTodaySchedule(),
        api.getAppointments(undefined, 'upcoming'),
        api.getTodayWellness(),
      ]);
      setTodaySchedule(scheduleData);
      setAppointments(apptsData);
      setWellness(wellnessData);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleMarkTaken = async (dose: DoseLog) => {
    try {
      setActionLoading(dose.id);
      await api.markDoseStatus(dose.id, 'taken');
      
      // Confetti burst for rewarding senior adherence!
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 }
      });

      const message = `Excellent! You've marked ${dose.medication_name} as taken.`;
      speak(message);

      // Refresh schedule
      await fetchData();
    } catch {
      alert("Could not update dose status. Please try again.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleIncrementWater = async () => {
    if (!wellness) return;
    const newGlasses = wellness.water_glasses + 1;
    setWellness(prev => prev ? { ...prev, water_glasses: newGlasses } : null);
    try {
      await api.updateTodayWellness({ water_glasses: newGlasses });
      speak(`Logged glass of water. ${newGlasses} glasses total.`);
    } catch {
      // ignore
    }
  };

  const handleToggleTask = async (taskId: number) => {
    if (!wellness) return;
    const updatedTasks = wellness.tasks.map(t => t.id === taskId ? { ...t, done: !t.done } : t);
    setWellness(prev => prev ? { ...prev, tasks: updatedTasks } : null);
    try {
      await api.updateTodayWellness({ tasks: updatedTasks });
    } catch {
      // ignore
    }
  };

  // Find next upcoming dose
  const nextDose = todaySchedule.find(d => d.status === 'upcoming');

  // Adherence progress for today
  const totalDoses = todaySchedule.length;
  const takenDoses = todaySchedule.filter(d => d.status === 'taken').length;
  const progressPercent = totalDoses > 0 ? Math.round((takenDoses / totalDoses) * 100) : 100;

  return (
    <div className="space-y-8 w-full pb-12">
      
      {/* 1. Warm Greeting & Emergency SOS Header Banner */}
      <div className="bg-gradient-to-r from-teal-700 via-brand-700 to-primary-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-white/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5 text-yellow-300" /> Today's Care Dashboard
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
              Welcome back, {currentUser?.full_name?.split(' ')[0] || 'Friend'}!
            </h1>
            <p className="text-teal-100 text-sm sm:text-base mt-1">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>

          <button
            onClick={onOpenSOS}
            className="flex items-center justify-center gap-3 bg-emergency-600 hover:bg-emergency-700 text-white px-7 py-4 rounded-2xl text-lg font-black shadow-2xl shadow-black/40 ring-4 ring-white/30 animate-pulse active:scale-95 transition-all self-start md:self-auto"
          >
            <ShieldAlert className="w-7 h-7" />
            <span>EMERGENCY SOS</span>
          </button>
        </div>
      </div>

      {/* 2. Next Medication Countdown Card */}
      {nextDose ? (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-lg border-2 border-brand-300 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-widest text-brand-700 flex items-center gap-2">
              <Clock className="w-4 h-4 text-brand-600 animate-spin" /> Next Scheduled Medication
            </span>
            <span className="bg-teal-100 text-teal-900 font-extrabold text-sm px-3.5 py-1 rounded-full">
              Scheduled: {nextDose.scheduled_time}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 font-black text-2xl shadow-sm">
                💊
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-900">{nextDose.medication_name}</h3>
                <p className="text-base text-slate-600 font-semibold">{nextDose.dosage} • {nextDose.form}</p>
                <p className="text-sm text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-md inline-block mt-1 font-medium">
                  {nextDose.instructions}
                </p>
              </div>
            </div>

            <button
              onClick={() => handleMarkTaken(nextDose)}
              disabled={actionLoading === nextDose.id}
              className="py-4 px-8 bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-lg rounded-2xl shadow-lg shadow-brand-500/30 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
            >
              <CheckCircle className="w-6 h-6" />
              <span>{actionLoading === nextDose.id ? "Recording..." : "I've Taken This Pill"}</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-emerald-50 rounded-3xl p-6 sm:p-8 border border-emerald-200 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <CheckCircle className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-xl font-black text-emerald-900">All Medications Up to Date for Today!</h3>
            <p className="text-sm text-emerald-700 mt-0.5">
              Great job! You have completed all scheduled medication doses for today. Rest well!
            </p>
          </div>
        </div>
      )}

      {/* 3. Today's Medication Schedule Timeline */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900">Today's Medication Schedule</h2>
            <p className="text-xs text-slate-500">Track and confirm each dose individually</p>
          </div>
          <div className="text-right">
            <span className="text-xs font-bold text-slate-400">Today's Progress</span>
            <div className="flex items-center gap-2">
              <div className="w-32 bg-slate-100 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-brand-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className="text-sm font-black text-brand-700">{progressPercent}%</span>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {todaySchedule.map((dose) => (
            <div
              key={dose.id}
              className={`p-5 rounded-2xl border transition-all ${
                dose.status === 'taken'
                  ? 'bg-emerald-50/60 border-emerald-300'
                  : dose.status === 'missed'
                  ? 'bg-rose-50/60 border-rose-300'
                  : 'bg-white border-slate-200 hover:border-brand-400 shadow-xs'
              }`}
            >
              <div className="flex items-start justify-between">
                <span className="text-xs font-black tracking-wider text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
                  {dose.scheduled_time}
                </span>

                {dose.status === 'taken' && (
                  <span className="flex items-center gap-1 text-xs font-extrabold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                    <Check className="w-3.5 h-3.5" /> Taken
                  </span>
                )}
                {dose.status === 'missed' && (
                  <span className="flex items-center gap-1 text-xs font-extrabold text-rose-700 bg-rose-100 px-2.5 py-0.5 rounded-full">
                    <AlertTriangle className="w-3.5 h-3.5" /> Missed
                  </span>
                )}
                {dose.status === 'upcoming' && (
                  <span className="text-xs font-bold text-teal-800 bg-teal-100 px-2.5 py-0.5 rounded-full">
                    Upcoming
                  </span>
                )}
              </div>

              <div className="mt-3">
                <h4 className="text-lg font-black text-slate-900">{dose.medication_name}</h4>
                <p className="text-xs text-slate-500 font-semibold">{dose.dosage} • {dose.instructions}</p>
              </div>

              {dose.status === 'upcoming' && (
                <button
                  onClick={() => handleMarkTaken(dose)}
                  disabled={actionLoading === dose.id}
                  className="mt-4 w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl text-sm transition-all shadow-xs"
                >
                  Mark as Taken
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 4. Two Columns: Upcoming Doctor Visit & Daily Wellness Checklist */}
      <div className="grid md:grid-cols-2 gap-6">
        
        {/* Doctor Visits */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-brand-600" /> Upcoming Doctor Visits
            </h3>
            <Link to="/appointments" className="text-xs font-bold text-brand-600 hover:underline">
              View All &rarr;
            </Link>
          </div>

          {appointments.length === 0 ? (
            <p className="text-sm text-slate-400 py-6 text-center">No upcoming appointments scheduled.</p>
          ) : (
            appointments.slice(0, 2).map((appt) => (
              <div key={appt.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <p className="font-extrabold text-sm text-slate-900">{appt.doctor_name}</p>
                  <span className="text-xs font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-md">
                    {appt.specialty}
                  </span>
                </div>
                <p className="text-xs text-slate-600">{appt.hospital_clinic}</p>
                <p className="text-xs font-bold text-slate-800">
                  📅 {new Date(appt.appointment_datetime).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                </p>
                <p className="text-xs text-slate-500 italic">{appt.purpose}</p>
              </div>
            ))
          )}
        </div>

        {/* Daily Wellness Tracker (#11 E) */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <Smile className="w-5 h-5 text-emerald-600" /> Daily Health & Routine Checklist
            </h3>
            <span className="text-xs font-bold text-slate-400">Non-Clinical Wellness</span>
          </div>

          {wellness && (
            <div className="space-y-4">
              {/* Quick Metrics */}
              <div className="grid grid-cols-3 gap-2 text-center">
                
                {/* Water Glasses */}
                <div className="p-3 bg-sky-50 rounded-2xl border border-sky-100">
                  <Droplets className="w-5 h-5 text-sky-600 mx-auto mb-1" />
                  <p className="text-xs font-bold text-slate-500">Water</p>
                  <p className="text-base font-black text-sky-900">{wellness.water_glasses} / {wellness.water_target}</p>
                  <button
                    onClick={handleIncrementWater}
                    className="mt-1 text-[11px] font-bold text-sky-700 bg-sky-200/60 hover:bg-sky-200 px-2 py-0.5 rounded-lg"
                  >
                    + Add Glass
                  </button>
                </div>

                {/* Steps */}
                <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100">
                  <Footprints className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
                  <p className="text-xs font-bold text-slate-500">Walking</p>
                  <p className="text-base font-black text-emerald-900">{wellness.steps_count.toLocaleString()}</p>
                  <p className="text-[10px] text-emerald-700 mt-1">Goal: {wellness.steps_target}</p>
                </div>

                {/* Sleep */}
                <div className="p-3 bg-indigo-50 rounded-2xl border border-indigo-100">
                  <Moon className="w-5 h-5 text-indigo-600 mx-auto mb-1" />
                  <p className="text-xs font-bold text-slate-500">Sleep</p>
                  <p className="text-base font-black text-indigo-900">{wellness.sleep_hours} hrs</p>
                  <p className="text-[10px] text-indigo-700 mt-1">Restful</p>
                </div>

              </div>

              {/* Daily Wellness Tasks */}
              <div className="space-y-2">
                <p className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Daily Routines</p>
                {wellness.tasks.map((task) => (
                  <button
                    key={task.id}
                    onClick={() => handleToggleTask(task.id)}
                    className={`w-full text-left p-3 rounded-xl border flex items-center justify-between text-xs transition-colors ${
                      task.done ? 'bg-slate-50 border-slate-200 text-slate-400 line-through' : 'bg-white border-slate-200 text-slate-800 font-semibold hover:bg-slate-50'
                    }`}
                  >
                    <span>{task.task}</span>
                    <span className={`w-5 h-5 rounded-md flex items-center justify-center border ${task.done ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300'}`}>
                      {task.done && <Check className="w-3.5 h-3.5" />}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
