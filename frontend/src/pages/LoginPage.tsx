import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { HeartHandshake, AlertCircle, ArrowRight, Sparkles, Lock } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

export const LoginPage: React.FC = () => {
  const { login, demoLogin } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(
    searchParams.get('expired') ? 'Your session expired. Please sign in again.' : null
  );
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
  const res = await api.login({ email, password });

  console.log('Login response:', {
    hasToken: !!res?.access_token,
    user: res?.user
  });

  if (!res?.access_token || !res?.user?.role) {
    throw new Error('Invalid login response from server. Please try again.');
  }

  login(res.access_token, res.user);

  if (res.user.role === 'caregiver') {
    navigate('/caregiver/dashboard');
  } else if (res.user.role === 'family') {
    navigate('/family/dashboard');
  } else if (res.user.role === 'admin') {
    navigate('/admin');
  } else {
    navigate('/elderly/dashboard');
  }
} catch (err: any) {
  setError(err.message || 'Invalid email or password.');
} finally {
  setLoading(false);
}
  };

  const handleDemoSignIn = async (role: UserRole) => {
    setLoading(true);
    try {
      await demoLogin(role);
      if (role === 'caregiver') navigate('/caregiver/dashboard');
      else if (role === 'family') navigate('/family/dashboard');
      else if (role === 'admin') navigate('/admin');
      else navigate('/elderly/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed demo sign-in.');
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
        <h2 className="text-2xl font-black text-slate-900">Sign in to your care portal</h2>
        <p className="mt-1 text-sm text-slate-500">
          New to ElderCare?{' '}
          <Link to="/register" className="font-bold text-brand-600 hover:text-brand-500">
            Create an account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg px-4 space-y-6">
        
        {/* Quick 1-Click Demo Logins Banner */}
        <div className="bg-gradient-to-r from-brand-50 to-primary-50 p-5 rounded-3xl border border-brand-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-brand-800 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-brand-600" /> Instant Demo Access
            </span>
            <span className="text-[11px] bg-white px-2 py-0.5 rounded-full font-bold text-brand-700 shadow-xs border border-brand-200">
              One-Click
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => handleDemoSignIn('elderly')}
              className="p-2.5 bg-white hover:bg-teal-50 border border-slate-200 hover:border-teal-400 rounded-xl font-bold text-slate-800 flex items-center justify-between transition-colors shadow-xs"
            >
              <span>👵 Senior (Margaret)</span>
              <ArrowRight className="w-3.5 h-3.5 text-teal-600" />
            </button>
            <button
              onClick={() => handleDemoSignIn('caregiver')}
              className="p-2.5 bg-white hover:bg-sky-50 border border-slate-200 hover:border-sky-400 rounded-xl font-bold text-slate-800 flex items-center justify-between transition-colors shadow-xs"
            >
              <span>👨‍⚕️ Nurse (David)</span>
              <ArrowRight className="w-3.5 h-3.5 text-sky-600" />
            </button>
            <button
              onClick={() => handleDemoSignIn('family')}
              className="p-2.5 bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-400 rounded-xl font-bold text-slate-800 flex items-center justify-between transition-colors shadow-xs"
            >
              <span>👩 Family (Sarah)</span>
              <ArrowRight className="w-3.5 h-3.5 text-emerald-600" />
            </button>
            <button
              onClick={() => handleDemoSignIn('admin')}
              className="p-2.5 bg-white hover:bg-purple-50 border border-slate-200 hover:border-purple-400 rounded-xl font-bold text-slate-800 flex items-center justify-between transition-colors shadow-xs"
            >
              <span>🛡️ Admin (Dr. Sterling)</span>
              <ArrowRight className="w-3.5 h-3.5 text-purple-600" />
            </button>
          </div>
        </div>

        {/* Standard Login Box */}
        <div className="bg-white py-8 px-6 sm:px-10 shadow-xl border border-slate-200 rounded-3xl space-y-6">
          
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2 text-rose-700 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Password
                </label>
                <Link to="/verify-passcode" className="text-xs text-brand-600 font-semibold hover:underline">
                  Use PIN/Passcode?
                </Link>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-2xl shadow-lg shadow-brand-500/25 transition-all text-sm disabled:opacity-50"
            >
              {loading ? "Authenticating..." : "Sign In Securely"}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
};
