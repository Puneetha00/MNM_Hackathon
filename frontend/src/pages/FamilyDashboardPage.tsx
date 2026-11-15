import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Heart, Pill, Calendar, Clock, CheckCircle, AlertTriangle, 
  Phone, UserPlus, Users, ChevronRight, ShieldCheck, Sparkles 
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const FamilyDashboardPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [familyData, setFamilyData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [inviteCode, setInviteCode] = useState<string>('');
  const [passcode, setPasscode] = useState<string>('');
  const [showLinkModal, setShowLinkModal] = useState<boolean>(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [linkSuccess, setLinkSuccess] = useState<string | null>(null);

  const fetchFamilyData = async () => {
    try {
      setLoading(true);
      const data = await api.getFamilyDashboard();
      setFamilyData(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFamilyData();
  }, []);

  const handleAcceptInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setLinkError(null);
    setLinkSuccess(null);
    try {
      const res = await api.acceptInvitation({
        invite_code: inviteCode.trim(),
        passcode: passcode.trim()
      });
      setLinkSuccess(res.message);
      setInviteCode('');
      setPasscode('');
      await fetchFamilyData();
      setTimeout(() => setShowLinkModal(false), 2000);
    } catch (err: any) {
      setLinkError(err.message || "Failed to link with care profile.");
    }
  };

  if (loading || !familyData) {
    return (
      <div className="py-20 text-center">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-slate-500 font-semibold">Loading Family Care Portal...</p>
      </div>
    );
  }

  const seniors = familyData.seniors || [];

  return (
    <div className="space-y-8 w-full pb-12">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="bg-emerald-100 text-emerald-800 text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider">
            Family Care Portal
          </span>
          <h1 className="text-3xl font-black text-slate-900 mt-1">Loved Ones Healthcare Circle</h1>
          <p className="text-slate-500 text-sm">
            Welcome, {currentUser?.full_name} • Keeping you closely informed of your family member's health routine
          </p>
        </div>

        <button
          onClick={() => setShowLinkModal(true)}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-2xl text-sm font-bold shadow-md shadow-emerald-500/20 transition-all self-start md:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Link Another Senior</span>
        </button>
      </div>

      {/* Link Senior Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-lg font-black text-slate-900">Enter Care Circle Invite Code</h3>
            <p className="text-xs text-slate-500">
              Enter the unique invite code and designated passcode provided by your family member.
            </p>

            {linkError && (
              <div className="p-3 bg-rose-50 text-rose-700 rounded-xl text-xs font-semibold">
                {linkError}
              </div>
            )}
            {linkSuccess && (
              <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-semibold">
                {linkSuccess}
              </div>
            )}

            <form onSubmit={handleAcceptInvite} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Invite Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. EC-A1B2C3"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  className="w-full px-3 py-2.5 border rounded-xl text-sm uppercase tracking-wider font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Passcode (Provided Privately)</label>
                <input
                  type="password"
                  required
                  placeholder="6-digit passcode"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  className="w-full px-3 py-2.5 border rounded-xl text-sm tracking-widest font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLinkModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm"
                >
                  Link Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Seniors List */}
      {seniors.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm max-w-lg mx-auto space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <Heart className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-extrabold text-slate-900">No Linked Seniors Yet</h3>
          <p className="text-sm text-slate-500">
            Ask your senior loved one or caregiver to generate an invite code from their "Care Circle" page, then enter it here.
          </p>
          <button
            onClick={() => setShowLinkModal(true)}
            className="px-6 py-3 bg-emerald-600 text-white font-bold rounded-2xl text-sm shadow-md"
          >
            Enter Invitation Code
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {seniors.map((senior: any) => (
            <div key={senior.senior_id} className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
              
              {/* Senior Overview Bar */}
              <div className="p-6 sm:p-8 bg-gradient-to-r from-emerald-700 to-teal-800 text-white flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <img
                    src={senior.avatar_url || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&h=120&fit=crop&crop=face"}
                    alt={senior.senior_name}
                    className="w-16 h-16 rounded-full object-cover ring-4 ring-white/30"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-2xl font-black">{senior.senior_name}</h2>
                      <span className="bg-white/20 text-white text-xs px-2.5 py-0.5 rounded-full font-semibold">
                        Your {senior.relationship_label}
                      </span>
                    </div>
                    <p className="text-emerald-100 text-xs mt-0.5">
                      Sovereign permissions granted • Read access active
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-xs uppercase tracking-wider text-emerald-200 font-bold">Weekly Adherence</span>
                    <p className="text-2xl font-black text-white">{senior.adherence_rate}%</p>
                  </div>
                  <Link
                    to={`/adherence?elderly_id=${senior.senior_id}`}
                    className="bg-white hover:bg-emerald-50 text-emerald-800 font-extrabold px-4 py-2.5 rounded-xl text-xs shadow-md transition-all"
                  >
                    View Charts &rarr;
                  </Link>
                </div>
              </div>

              {/* Senior Today Doses & Upcoming Visits */}
              <div className="p-6 sm:p-8 grid lg:grid-cols-12 gap-8">
                
                {/* Left: Today's Medication Tracker */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                      <Pill className="w-5 h-5 text-teal-600" /> Today's Doses for {senior.senior_name}
                    </h3>
                    {senior.today_meds && (
                      <span className="text-xs font-bold text-slate-500">
                        {senior.today_meds.taken} / {senior.today_meds.total} Taken
                      </span>
                    )}
                  </div>

                  {senior.today_meds ? (
                    <div className="space-y-2">
                      {senior.today_meds.doses.map((d: any, idx: number) => (
                        <div
                          key={idx}
                          className={`p-3.5 rounded-2xl border flex items-center justify-between text-xs transition-all ${
                            d.status === 'taken'
                              ? 'bg-emerald-50/70 border-emerald-200'
                              : d.status === 'missed'
                              ? 'bg-rose-50/70 border-rose-200'
                              : 'bg-slate-50 border-slate-200'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-slate-600 bg-white px-2 py-1 rounded-lg border border-slate-200">
                              {d.time}
                            </span>
                            <div>
                              <p className="font-extrabold text-slate-900">{d.medication_name}</p>
                              <p className="text-slate-500">{d.dosage}</p>
                            </div>
                          </div>

                          <span className={`px-2.5 py-1 rounded-full font-extrabold uppercase text-[10px] ${
                            d.status === 'taken' ? 'bg-emerald-200/60 text-emerald-800' :
                            d.status === 'missed' ? 'bg-rose-200/60 text-rose-800' : 'bg-slate-200 text-slate-700'
                          }`}>
                            {d.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">Medication viewing not permitted by senior.</p>
                  )}
                </div>

                {/* Right: Upcoming Doctor Appointments & Quick Contact */}
                <div className="lg:col-span-5 space-y-4">
                  <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-sky-600" /> Upcoming Doctor Appointments
                  </h3>

                  {senior.upcoming_appointments && senior.upcoming_appointments.length > 0 ? (
                    <div className="space-y-2.5">
                      {senior.upcoming_appointments.map((a: any) => (
                        <div key={a.id} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <p className="font-extrabold text-slate-900">{a.doctor_name}</p>
                            <span className="bg-sky-100 text-sky-800 font-bold px-2 py-0.5 rounded text-[10px]">
                              {a.specialty}
                            </span>
                          </div>
                          <p className="text-slate-600">{a.hospital}</p>
                          <p className="font-bold text-slate-800">
                            📅 {new Date(a.datetime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 text-center text-xs text-slate-400">
                      No upcoming visits scheduled in the next 30 days.
                    </div>
                  )}

                  <div className="pt-2">
                    <Link
                      to={`/emergency?elderly_id=${senior.senior_id}`}
                      className="w-full flex items-center justify-center gap-2 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 transition-colors"
                    >
                      <span>View Emergency Card & Direct Contacts</span>
                    </Link>
                  </div>
                </div>

              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
};
