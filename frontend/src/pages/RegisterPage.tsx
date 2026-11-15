import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HeartHandshake, ShieldCheck, UserCheck, Users, Activity, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

export const RegisterPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState<UserRole>('elderly');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [passcode, setPasscode] = useState('');
  const [consentAgreed, setConsentAgreed] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consentAgreed) {
      setError("Please accept the healthcare privacy and consent terms to proceed.");
      return;
    }
    setError(null);
    setLoading(true);

    try {
      const res = await api.register({
        email,
        password,
        full_name: fullName,
        role,
        phone,
        passcode: passcode || undefined
      });
      login(res.access_token, res.user);

      if (role === 'caregiver') navigate('/caregiver/dashboard');
      else if (role === 'family') navigate('/family/dashboard');
      else navigate('/elderly/dashboard');
    } catch (err: any) {
      setError(err.message || "Registration failed. Please check details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2 group mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-600 to-primary-600 flex items-center justify-center text-white shadow-md">
            <HeartHandshake className="w-6 h-6" />
          </div>
          <span className="text-2xl font-black text-slate-900">
            Elder<span className="text-brand-600">Care</span>
          </span>
        </Link>
        <h2 className="text-2xl font-black text-slate-900">Create your account</h2>
        <p className="mt-1 text-sm text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-brand-600 hover:text-brand-500">
            Sign in here
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg px-4">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-xl border border-slate-200 rounded-3xl space-y-6">
          
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2 text-rose-700 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Role Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Select Your Healthcare Role
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('elderly')}
                  className={`p-3 rounded-2xl border text-center transition-all ${
                    role === 'elderly'
                      ? 'bg-teal-50 border-teal-500 text-teal-800 font-bold ring-2 ring-teal-200'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <UserCheck className="w-5 h-5 mx-auto mb-1 text-teal-600" />
                  <span className="text-xs">Elderly User</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('caregiver')}
                  className={`p-3 rounded-2xl border text-center transition-all ${
                    role === 'caregiver'
                      ? 'bg-sky-50 border-sky-500 text-sky-800 font-bold ring-2 ring-sky-200'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Activity className="w-5 h-5 mx-auto mb-1 text-sky-600" />
                  <span className="text-xs">Caregiver</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('family')}
                  className={`p-3 rounded-2xl border text-center transition-all ${
                    role === 'family'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-800 font-bold ring-2 ring-emerald-200'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Users className="w-5 h-5 mx-auto mb-1 text-emerald-600" />
                  <span className="text-xs">Family Member</span>
                </button>
              </div>
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Margaret Davis"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
              />
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
              />
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Phone Number (For Reminders & Emergency SOS)
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Password
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
              />
            </div>

            {/* Optional 6-digit Quick Passcode */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Optional 4-6 Digit Quick Passcode (For Quick PIN Login)
              </label>
              <input
                type="text"
                maxLength={6}
                value={passcode}
                onChange={(e) => setPasscode(e.target.value.replace(/\D/g, ''))}
                placeholder="e.g. 123456"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm tracking-widest font-mono"
              />
            </div>

            {/* Consent Agreement */}
            <div className="flex items-start gap-2 pt-2">
              <input
                type="checkbox"
                id="consent"
                checked={consentAgreed}
                onChange={(e) => setConsentAgreed(e.target.checked)}
                className="w-4 h-4 text-brand-600 rounded border-slate-300 focus:ring-brand-500 mt-1"
              />
              <label htmlFor="consent" className="text-xs text-slate-600">
                I authorize ElderCare to store health routines, send proactive medication alerts, and share authorized records exclusively with invited care circle members.
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-2xl shadow-lg shadow-brand-500/25 transition-all text-sm disabled:opacity-50"
            >
              {loading ? "Creating Account..." : "Complete Registration"}
            </button>

          </form>

        </div>
      </div>
    </div>
  );
};
