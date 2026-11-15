import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Delete, Check, AlertCircle, ArrowLeft } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const PasscodeVerifyPage: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleKeyPress = (num: string) => {
    if (passcode.length < 6) {
      setPasscode(prev => prev + num);
      setError(null);
    }
  };

  const handleDelete = () => {
    setPasscode(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    setPasscode('');
    setError(null);
  };

  const handleVerify = async () => {
    if (passcode.length < 4) {
      setError("Please enter your complete 4-6 digit passcode");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      await api.verifyPasscode(passcode);
      // Navigate to respective dashboard
      if (currentUser?.role === 'caregiver') navigate('/caregiver/dashboard');
      else if (currentUser?.role === 'family') navigate('/family/dashboard');
      else if (currentUser?.role === 'admin') navigate('/admin');
      else navigate('/elderly/dashboard');
    } catch (err: any) {
      setError(err.message || "Invalid security passcode");
      setPasscode('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center py-12 px-4">
      <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-200 max-w-sm w-full space-y-6 text-center">
        
        <div className="w-14 h-14 bg-brand-100 text-brand-700 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
          <Lock className="w-7 h-7" />
        </div>

        <div>
          <h2 className="text-2xl font-black text-slate-900">Security Passcode</h2>
          <p className="text-xs text-slate-500 mt-1">
            Enter your 6-digit PIN to authenticate (Demo: 123456)
          </p>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-center gap-1.5 text-rose-700 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* PIN Dots Display */}
        <div className="flex justify-center gap-3 py-2">
          {[0, 1, 2, 3, 4, 5].map((idx) => (
            <div
              key={idx}
              className={`w-4 h-4 rounded-full transition-all ${
                passcode.length > idx
                  ? 'bg-brand-600 scale-125'
                  : 'bg-slate-200 border border-slate-300'
              }`}
            />
          ))}
        </div>

        {/* Big Accessible Keypad */}
        <div className="grid grid-cols-3 gap-3 pt-2">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handleKeyPress(num)}
              className="py-4 bg-slate-50 hover:bg-brand-50 text-slate-900 hover:text-brand-700 font-extrabold text-2xl rounded-2xl border border-slate-200 transition-all active:scale-95 shadow-xs"
            >
              {num}
            </button>
          ))}
          <button
            type="button"
            onClick={handleClear}
            className="py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs uppercase rounded-2xl border border-slate-200 transition-all active:scale-95"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={() => handleKeyPress('0')}
            className="py-4 bg-slate-50 hover:bg-brand-50 text-slate-900 hover:text-brand-700 font-extrabold text-2xl rounded-2xl border border-slate-200 transition-all active:scale-95 shadow-xs"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl border border-slate-200 flex items-center justify-center transition-all active:scale-95"
          >
            <Delete className="w-6 h-6" />
          </button>
        </div>

        <button
          onClick={handleVerify}
          disabled={loading || passcode.length < 4}
          className="w-full py-3.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-2xl shadow-lg shadow-brand-500/25 transition-all text-sm disabled:opacity-40 flex items-center justify-center gap-2"
        >
          <Check className="w-4 h-4" />
          <span>{loading ? "Verifying..." : "Confirm Passcode"}</span>
        </button>

        <button
          onClick={() => navigate('/login')}
          className="text-xs text-slate-400 hover:text-slate-600 font-medium inline-flex items-center gap-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Standard Login
        </button>

      </div>
    </div>
  );
};
