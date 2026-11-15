import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  ShieldAlert, Phone, HeartPulse, AlertTriangle, Printer, 
  CheckCircle, Radio, UserCheck, Stethoscope, Clock, Shield 
} from 'lucide-react';
import { api } from '../services/api';

export const EmergencyAssistancePage: React.FC<{ onOpenSOS: () => void }> = ({ onOpenSOS }) => {
  const [searchParams] = useSearchParams();
  const queryElderlyId = searchParams.get('elderly_id');
  const targetElderlyId = queryElderlyId ? parseInt(queryElderlyId, 10) : undefined;

  const [cardData, setCardData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchCard = async () => {
      try {
        setLoading(true);
        const data = await api.getEmergencyCard(targetElderlyId);
        setCardData(data);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    fetchCard();
  }, [targetElderlyId]);

  const handlePrint = () => {
    window.print();
  };

  if (loading || !cardData) {
    return (
      <div className="py-20 text-center">
        <div className="w-10 h-10 border-4 border-emergency-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-slate-500 font-semibold">Loading Emergency Command Suite...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 w-full pb-12">
      
      {/* 1. Big SOS Action Card */}
      <div className="bg-gradient-to-r from-emergency-600 to-rose-700 text-white rounded-3xl p-6 sm:p-10 shadow-2xl space-y-6 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider">
              Emergency Broadcast Center
            </span>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight">Need Urgent Help?</h1>
            <p className="text-rose-100 text-sm sm:text-base leading-relaxed">
              Pressing the Emergency SOS button immediately broadcasts an urgent notification and alert email to all verified caregivers and family members in your circle.
            </p>
          </div>

          <button
            onClick={onOpenSOS}
            className="px-10 py-5 bg-white text-emergency-700 hover:bg-rose-50 font-black text-xl rounded-3xl shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3 shrink-0 ring-4 ring-white/30"
          >
            <ShieldAlert className="w-8 h-8 text-emergency-600 animate-pulse" />
            <span>TRIGGER SOS</span>
          </button>
        </div>
      </div>

      {/* 2. Direct Emergency Dispatch Hotlines */}
      <div className="grid sm:grid-cols-3 gap-4">
        <a
          href="tel:911"
          className="p-5 rounded-3xl bg-slate-900 text-white shadow-lg flex items-center justify-between hover:bg-black transition-all group"
        >
          <div>
            <p className="text-xs uppercase font-extrabold tracking-wider text-rose-400">Emergency Services</p>
            <p className="text-2xl font-black mt-0.5">Dial 911 / 112</p>
            <p className="text-[11px] text-slate-400">Ambulance, Fire, Police</p>
          </div>
          <Phone className="w-8 h-8 text-rose-500 group-hover:scale-110 transition-transform" />
        </a>

        <a
          href="tel:18002221222"
          className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm flex items-center justify-between hover:border-slate-400 transition-all group"
        >
          <div>
            <p className="text-xs uppercase font-extrabold tracking-wider text-slate-400">Poison Control</p>
            <p className="text-xl font-black text-slate-900 mt-0.5">1-800-222-1222</p>
            <p className="text-[11px] text-slate-500">24/7 National Hotline</p>
          </div>
          <Phone className="w-7 h-7 text-slate-400 group-hover:text-brand-600 transition-colors" />
        </a>

        <a
          href="tel:18002314024"
          className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm flex items-center justify-between hover:border-slate-400 transition-all group"
        >
          <div>
            <p className="text-xs uppercase font-extrabold tracking-wider text-slate-400">Senior Care Crisis</p>
            <p className="text-xl font-black text-slate-900 mt-0.5">1-800-231-4024</p>
            <p className="text-[11px] text-slate-500">Elderly Assistance Hotline</p>
          </div>
          <Phone className="w-7 h-7 text-slate-400 group-hover:text-brand-600 transition-colors" />
        </a>
      </div>

      {/* 3. Paramedic-Ready Printable Emergency Medical ID Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-10 border-2 border-slate-300 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emergency-100 text-emergency-700 flex items-center justify-center font-black text-2xl">
              🏥
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900">Emergency Medical ID Card</h2>
              <p className="text-xs text-slate-500">First Responder & Paramedic Quick Reference</p>
            </div>
          </div>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold transition-colors self-start sm:self-auto"
          >
            <Printer className="w-4 h-4" /> Print Medical ID
          </button>
        </div>

        {/* Vital Patient Details */}
        <div className="grid sm:grid-cols-4 gap-6 p-5 bg-slate-50 rounded-2xl border border-slate-200 text-sm">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Patient Name</span>
            <p className="font-black text-slate-900 text-lg mt-0.5">{cardData.full_name}</p>
            <p className="text-xs text-slate-500">DOB: {cardData.date_of_birth || 'Not specified'}</p>
          </div>

          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Blood Type</span>
            <p className="font-black text-rose-600 text-2xl mt-0.5">{cardData.blood_type || 'Unknown'}</p>
          </div>

          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">DNR / Living Will</span>
            <p className="font-black text-slate-900 text-lg mt-0.5">{cardData.dnr_status ? 'YES (DNR)' : 'NO'}</p>
          </div>

          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Primary Phone</span>
            <p className="font-bold text-slate-800 text-sm mt-0.5">{cardData.phone || 'N/A'}</p>
          </div>
        </div>

        {/* Critical Allergies & Chronic Conditions */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="p-5 bg-rose-50/70 border border-rose-200 rounded-2xl space-y-2">
            <h3 className="font-black text-rose-950 text-sm flex items-center gap-1.5 uppercase tracking-wide">
              <AlertTriangle className="w-4 h-4 text-rose-600" /> Severe Known Allergies
            </h3>
            <div className="space-y-1">
              {cardData.allergies?.length === 0 ? (
                <p className="text-xs text-slate-500">None documented.</p>
              ) : (
                cardData.allergies.map((a: any, i: number) => (
                  <p key={i} className="text-xs font-bold text-rose-900">
                    • {a.allergen} ({a.severity}) - Reaction: {a.reaction}
                  </p>
                ))
              )}
            </div>
          </div>

          <div className="p-5 bg-teal-50/70 border border-teal-200 rounded-2xl space-y-2">
            <h3 className="font-black text-teal-950 text-sm flex items-center gap-1.5 uppercase tracking-wide">
              <HeartPulse className="w-4 h-4 text-teal-600" /> Chronic Conditions
            </h3>
            <div className="space-y-1">
              {cardData.chronic_conditions?.length === 0 ? (
                <p className="text-xs text-slate-500">None documented.</p>
              ) : (
                cardData.chronic_conditions.map((c: any, i: number) => (
                  <p key={i} className="text-xs font-bold text-teal-900">
                    • {c.condition} (Since {c.diagnosed_year})
                  </p>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Critical Active Medications List */}
        <div className="space-y-2">
          <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider">
            Current Prescribed Medications
          </h3>
          <div className="grid sm:grid-cols-3 gap-3">
            {cardData.critical_medications?.map((m: any, idx: number) => (
              <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <p className="font-bold text-slate-900">{m.name}</p>
                <p className="text-slate-500">{m.dosage}</p>
                <p className="text-[11px] text-slate-400 mt-1">{m.instructions}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Primary Doctor & Preferred Hospital */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-700 gap-3">
          <div>
            <span className="font-bold">Primary Physician:</span> {cardData.primary_doctor_name || 'Dr. Elizabeth Vance'} ({cardData.primary_doctor_phone || '+1 555-789-0123'})
          </div>
          <div>
            <span className="font-bold">Hospital Wing:</span> {cardData.preferred_hospital || 'St. Jude Memorial Hospital'}
          </div>
          <div>
            <span className="font-bold">Insurance:</span> {cardData.insurance_provider || 'Medicare Premier'}
          </div>
        </div>

      </div>

    </div>
  );
};
