import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  HeartHandshake, Pill, ShieldCheck, BellRing, Users, Sparkles, 
  ArrowRight, CheckCircle2, Phone, Volume2, BarChart2, Lock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

export const LandingPage: React.FC = () => {
  const { demoLogin, isAuthenticated, currentUser } = useAuth();
  const navigate = useNavigate();

  const handleDemoSignIn = async (role: UserRole) => {
    await demoLogin(role);
    if (role === 'caregiver') navigate('/caregiver/dashboard');
    else if (role === 'family') navigate('/family/dashboard');
    else if (role === 'admin') navigate('/admin');
    else navigate('/elderly/dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28 bg-gradient-to-b from-brand-50/60 via-white to-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Column: Mission & CTAs */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 bg-brand-100/80 border border-brand-200 px-3.5 py-1.5 rounded-full text-brand-800 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-brand-600" />
                Intelligent Healthcare Ecosystem
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.15]">
                Empowering Seniors. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-primary-600">
                  Reassuring Families.
                </span>
              </h1>

              <p className="text-lg sm:text-xl text-slate-600 max-w-2xl font-normal leading-relaxed">
                ElderCare connects elderly individuals, dedicated caregivers, and loving family members in a single, accessible, and secure healthcare network. Intelligent medication tracking, proactive background reminders, and voice-assisted care.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link
                  to="/register"
                  className="px-6 py-3.5 bg-brand-600 hover:bg-brand-700 text-white font-extrabold rounded-2xl shadow-lg shadow-brand-500/25 transition-all flex items-center gap-2 hover:translate-y-[-1px]"
                >
                  <span>Create Free Account</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/login"
                  className="px-6 py-3.5 bg-white hover:bg-slate-100 text-slate-800 font-bold rounded-2xl border border-slate-300 shadow-sm transition-all"
                >
                  Sign In
                </Link>
              </div>

              <div className="flex items-center gap-6 pt-4 text-xs font-semibold text-slate-500">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-brand-600" /> WCAG Accessible UI
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-brand-600" /> HIPAA-Compliant Security
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-brand-600" /> Proactive Scheduler
                </span>
              </div>
            </div>

            {/* Right Column: Instant 1-Click Interactive Persona Switcher */}
            <div className="lg:col-span-5">
              <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h2 className="font-extrabold text-slate-900 text-lg">Experience Role Ecosystem</h2>
                    <p className="text-xs text-slate-500">Select any pre-configured demo account to explore instantly</p>
                  </div>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-1 rounded-full uppercase">
                    Live Demo
                  </span>
                </div>

                <div className="space-y-3">
                  {/* Persona 1: Elderly */}
                  <button
                    onClick={() => handleDemoSignIn('elderly')}
                    className="w-full text-left p-3.5 rounded-2xl border border-slate-200 hover:border-brand-500 hover:bg-brand-50/50 transition-all flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <img 
                        src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face" 
                        alt="Margaret" 
                        className="w-11 h-11 rounded-full object-cover ring-2 ring-brand-200"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-sm text-slate-900 group-hover:text-brand-700">Margaret Davis (78)</p>
                          <span className="bg-teal-100 text-teal-800 text-[10px] font-bold px-2 py-0.5 rounded-full">Senior</span>
                        </div>
                        <p className="text-xs text-slate-500">Large buttons, voice assistant, daily medication schedule</p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-brand-600 group-hover:translate-x-1 transition-all" />
                  </button>

                  {/* Persona 2: Caregiver */}
                  <button
                    onClick={() => handleDemoSignIn('caregiver')}
                    className="w-full text-left p-3.5 rounded-2xl border border-slate-200 hover:border-sky-500 hover:bg-sky-50/50 transition-all flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <img 
                        src="https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=100&h=100&fit=crop&crop=face" 
                        alt="David" 
                        className="w-11 h-11 rounded-full object-cover ring-2 ring-sky-200"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-sm text-slate-900 group-hover:text-sky-700">David Miller, RN</p>
                          <span className="bg-sky-100 text-sky-800 text-[10px] font-bold px-2 py-0.5 rounded-full">Caregiver</span>
                        </div>
                        <p className="text-xs text-slate-500">Caregiver Attention System, adherence monitoring, routines</p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-sky-600 group-hover:translate-x-1 transition-all" />
                  </button>

                  {/* Persona 3: Family */}
                  <button
                    onClick={() => handleDemoSignIn('family')}
                    className="w-full text-left p-3.5 rounded-2xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 transition-all flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <img 
                        src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop&crop=face" 
                        alt="Sarah" 
                        className="w-11 h-11 rounded-full object-cover ring-2 ring-emerald-200"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-sm text-slate-900 group-hover:text-emerald-700">Sarah Davis (Daughter)</p>
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">Family</span>
                        </div>
                        <p className="text-xs text-slate-500">Adherence visibility, appointment notes, shared updates</p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
                  </button>

                  {/* Persona 4: Admin */}
                  <button
                    onClick={() => handleDemoSignIn('admin')}
                    className="w-full text-left p-3.5 rounded-2xl border border-slate-200 hover:border-purple-500 hover:bg-purple-50/50 transition-all flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <img 
                        src="https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=100&h=100&fit=crop&crop=face" 
                        alt="Admin" 
                        className="w-11 h-11 rounded-full object-cover ring-2 ring-purple-200"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-sm text-slate-900 group-hover:text-purple-700">Dr. Robert Sterling</p>
                          <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded-full">Admin</span>
                        </div>
                        <p className="text-xs text-slate-500">Platform health, system metrics, security audit logs</p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
                  </button>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl text-[11px] text-slate-500 text-center border border-slate-200">
                  🔒 Passwords & 6-digit PINs are securely managed. No credit card required.
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Core Innovation Highlights */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold text-brand-600 uppercase tracking-widest mb-2">Designed for Real Healthcare Needs</h2>
            <h3 className="text-3xl font-extrabold text-slate-900">Why ElderCare Goes Beyond Ordinary Reminders</h3>
            <p className="text-slate-600 text-base mt-3">
              Standard reminders fail when seniors lose track or forget confirmations. ElderCare creates an interconnected safety net where the care circle is notified proactively.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            
            {/* Card 1 */}
            <div className="p-8 rounded-3xl bg-slate-50 border border-slate-200 hover:shadow-xl transition-all space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
                <Pill className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-bold text-slate-900">Smart Medication Management</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Color-coded pill indicators, food timing instructions, dosage tracking, and visual timeline. Doses are only marked as taken upon deliberate confirmation.
              </p>
            </div>

            {/* Card 2 */}
            <div className="p-8 rounded-3xl bg-slate-50 border border-slate-200 hover:shadow-xl transition-all space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
                <BellRing className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-bold text-slate-900">Proactive Reminder Engine</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Runs reliably via background scheduler independent of browser state. Detects unconfirmed doses after grace period and alerts family members before doses are missed.
              </p>
            </div>

            {/* Card 3 */}
            <div className="p-8 rounded-3xl bg-slate-50 border border-slate-200 hover:shadow-xl transition-all space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <Users className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-bold text-slate-900">Sovereign Family Collaboration</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Elderly individuals retain sovereign ownership over their data. Grant or revoke viewing and management permissions to caregivers and family at any time.
              </p>
            </div>

            {/* Card 4 */}
            <div className="p-8 rounded-3xl bg-slate-50 border border-slate-200 hover:shadow-xl transition-all space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                <Volume2 className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-bold text-slate-900">Voice-Assisted Navigation</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Seniors can speak natural commands ("Next medicine", "Mark as taken", "Add water") and hear vocal synthesized responses, ideal for those with visual or motor impairments.
              </p>
            </div>

            {/* Card 5 */}
            <div className="p-8 rounded-3xl bg-slate-50 border border-slate-200 hover:shadow-xl transition-all space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                <Phone className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-bold text-slate-900">Emergency SOS & Medical ID</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Instant broadcast to designated guardians with GPS notes. Paramedic-ready emergency ID displays blood group, critical meds, and known allergies.
              </p>
            </div>

            {/* Card 6 */}
            <div className="p-8 rounded-3xl bg-slate-50 border border-slate-200 hover:shadow-xl transition-all space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                <BarChart2 className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-bold text-slate-900">Adherence Insights & Caregiver Alerts</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Identifies missed patterns (e.g. evening forgetfulness) and flags vulnerable seniors on caregiver dashboards without making unsubstantiated clinical diagnoses.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center text-white">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <span className="text-lg font-bold text-white">ElderCare</span>
            <span className="text-xs text-slate-500 ml-2">© 2026 ElderCare Health Platform</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-slate-400">
            <Link to="/security" className="hover:text-white transition-colors">Privacy & Security</Link>
            <Link to="/emergency" className="hover:text-white transition-colors">Emergency Protocol</Link>
            <Link to="/login" className="hover:text-white transition-colors">Sign In</Link>
          </div>
        </div>
      </footer>

    </div>
  );
};
