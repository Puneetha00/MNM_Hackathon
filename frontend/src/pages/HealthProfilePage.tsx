import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  UserCheck, ShieldAlert, Heart, Activity, AlertTriangle, 
  Stethoscope, Phone, Edit3, Plus, Trash2, Check, X 
} from 'lucide-react';
import { api } from '../services/api';
import { HealthProfile } from '../types';

export const HealthProfilePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const queryElderlyId = searchParams.get('elderly_id');
  const targetElderlyId = queryElderlyId ? parseInt(queryElderlyId, 10) : undefined;

  const [profile, setProfile] = useState<HealthProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isEditing, setIsEditing] = useState<boolean>(false);

  // Edit form state
  const [bloodType, setBloodType] = useState('O+');
  const [dob, setDob] = useState('1948-04-12');
  const [gender, setGender] = useState('Female');
  const [height, setHeight] = useState('162');
  const [weight, setWeight] = useState('68.5');
  const [primaryDoc, setPrimaryDoc] = useState('');
  const [docPhone, setDocPhone] = useState('');
  const [docHospital, setDocHospital] = useState('');
  const [dnr, setDnr] = useState(false);
  const [preferredHospital, setPreferredHospital] = useState('');
  const [specialNotes, setSpecialNotes] = useState('');
  const [allergies, setAllergies] = useState<Array<{ allergen: string; severity: string; reaction: string }>>([]);
  const [conditions, setConditions] = useState<Array<{ condition: string; diagnosed_year: string; notes: string }>>([]);
  const [contacts, setContacts] = useState<Array<{ name: string; relationship: string; phone: string; is_primary: boolean }>>([]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await api.getHealthProfile(targetElderlyId);
      setProfile(data);
      setBloodType(data.blood_type || 'O+');
      setDob(data.date_of_birth || '');
      setGender(data.gender || 'Female');
      setHeight(data.height_cm ? String(data.height_cm) : '');
      setWeight(data.weight_kg ? String(data.weight_kg) : '');
      setPrimaryDoc(data.primary_doctor_name || '');
      setDocPhone(data.primary_doctor_phone || '');
      setDocHospital(data.primary_doctor_hospital || '');
      setDnr(data.dnr_status || false);
      setPreferredHospital(data.preferred_hospital || '');
      setSpecialNotes(data.special_care_notes || '');
      setAllergies(data.allergies || []);
      setConditions(data.conditions || []);
      setContacts(data.emergency_contacts || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [targetElderlyId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        date_of_birth: dob,
        gender,
        blood_type: bloodType,
        height_cm: height ? parseFloat(height) : undefined,
        weight_kg: weight ? parseFloat(weight) : undefined,
        primary_doctor_name: primaryDoc,
        primary_doctor_phone: docPhone,
        primary_doctor_hospital: docHospital,
        dnr_status: dnr,
        preferred_hospital: preferredHospital,
        special_care_notes: specialNotes,
        allergies,
        conditions,
        emergency_contacts: contacts,
      };

      await api.updateHealthProfile(payload, targetElderlyId);
      setIsEditing(false);
      await fetchProfile();
    } catch (err: any) {
      alert(err.message || "Failed to update profile");
    }
  };

  const handleAddAllergy = () => {
    setAllergies([...allergies, { allergen: '', severity: 'Moderate', reaction: '' }]);
  };

  const handleRemoveAllergy = (index: number) => {
    setAllergies(allergies.filter((_, i) => i !== index));
  };

  const handleAddCondition = () => {
    setConditions([...conditions, { condition: '', diagnosed_year: new Date().getFullYear().toString(), notes: '' }]);
  };

  const handleRemoveCondition = (index: number) => {
    setConditions(conditions.filter((_, i) => i !== index));
  };

  if (loading || !profile) {
    return (
      <div className="py-20 text-center">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-slate-500 font-semibold">Loading Health Profile...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 w-full pb-12">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="bg-teal-100 text-teal-800 text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider">
            Comprehensive Medical Passport
          </span>
          <h1 className="text-3xl font-black text-slate-900 mt-1">Health Profile & Clinical Background</h1>
          <p className="text-slate-500 text-sm">
            Allergies, chronic conditions, primary physician, and verified emergency contacts
          </p>
        </div>

        <button
          onClick={() => setIsEditing(!isEditing)}
          className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-5 py-2.5 rounded-2xl text-sm font-bold shadow-md shadow-brand-500/20 transition-all self-start md:self-auto"
        >
          <Edit3 className="w-4 h-4" />
          <span>{isEditing ? "Cancel Editing" : "Edit Health Profile"}</span>
        </button>
      </div>

      {isEditing ? (
        /* Edit Mode */
        <form onSubmit={handleSave} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6 text-sm">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg font-black text-slate-900">Demographics & Emergency Directives</h2>
          </div>

          <div className="grid sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Blood Type</label>
              <select
                value={bloodType}
                onChange={(e) => setBloodType(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl"
              >
                {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Date of Birth</label>
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Height (cm)</label>
              <input
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Weight (kg)</label>
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl"
              />
            </div>
          </div>

          {/* Primary Doctor & Hospital */}
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Primary Doctor Name</label>
              <input
                type="text"
                value={primaryDoc}
                onChange={(e) => setPrimaryDoc(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Doctor Phone</label>
              <input
                type="tel"
                value={docPhone}
                onChange={(e) => setDocPhone(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Hospital / Clinic</label>
              <input
                type="text"
                value={docHospital}
                onChange={(e) => setDocHospital(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl"
              />
            </div>
          </div>

          {/* Allergies Editor */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Known Allergies</label>
              <button
                type="button"
                onClick={handleAddAllergy}
                className="text-xs font-bold text-brand-600 hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Allergen
              </button>
            </div>
            {allergies.map((a, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Allergen (e.g. Penicillin)"
                  value={a.allergen}
                  onChange={(e) => {
                    const copy = [...allergies];
                    copy[i].allergen = e.target.value;
                    setAllergies(copy);
                  }}
                  className="flex-1 px-3 py-1.5 border rounded-lg text-xs"
                />
                <select
                  value={a.severity}
                  onChange={(e) => {
                    const copy = [...allergies];
                    copy[i].severity = e.target.value;
                    setAllergies(copy);
                  }}
                  className="px-3 py-1.5 border rounded-lg text-xs"
                >
                  <option value="Mild">Mild</option>
                  <option value="Moderate">Moderate</option>
                  <option value="Severe">Severe</option>
                </select>
                <input
                  type="text"
                  placeholder="Reaction (e.g. Anaphylaxis)"
                  value={a.reaction}
                  onChange={(e) => {
                    const copy = [...allergies];
                    copy[i].reaction = e.target.value;
                    setAllergies(copy);
                  }}
                  className="flex-1 px-3 py-1.5 border rounded-lg text-xs"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveAllergy(i)}
                  className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-5 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-md"
            >
              Save Profile Changes
            </button>
          </div>
        </form>
      ) : (
        /* View Mode */
        <div className="space-y-6">
          {/* Top Quick Vitals Card */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Blood Group</span>
              <p className="text-3xl font-black text-rose-600 mt-1">{profile.blood_type || 'O+'}</p>
              <p className="text-xs text-slate-500">Universal donor compatible</p>
            </div>
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Date of Birth</span>
              <p className="text-xl font-black text-slate-900 mt-1">{profile.date_of_birth || '1948-04-12'}</p>
              <p className="text-xs text-slate-500">{profile.gender || 'Female'}</p>
            </div>
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Height & Weight</span>
              <p className="text-xl font-black text-slate-900 mt-1">{profile.height_cm} cm • {profile.weight_kg} kg</p>
              <p className="text-xs text-slate-500">BMI: 26.1 (Normal)</p>
            </div>
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">DNR Directive</span>
              <p className="text-xl font-black text-slate-900 mt-1">{profile.dnr_status ? 'Active (Yes)' : 'No (Resuscitate)'}</p>
              <p className="text-xs text-slate-500">Living Will on File</p>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            
            {/* Known Allergies */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-600" /> Documented Allergies & Drug Reactions
              </h3>

              <div className="space-y-2.5">
                {profile.allergies.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No allergies recorded.</p>
                ) : (
                  profile.allergies.map((a, i) => (
                    <div key={i} className="p-4 bg-rose-50/60 border border-rose-200 rounded-2xl flex items-center justify-between text-xs">
                      <div>
                        <p className="font-black text-rose-950 text-sm">{a.allergen}</p>
                        <p className="text-rose-700 mt-0.5">Reaction: {a.reaction}</p>
                      </div>
                      <span className="bg-rose-200 text-rose-900 font-extrabold px-2.5 py-1 rounded-full uppercase text-[10px]">
                        {a.severity}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Chronic Medical Conditions */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Heart className="w-5 h-5 text-teal-600" /> Existing Medical Conditions
              </h3>

              <div className="space-y-2.5">
                {profile.conditions.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No conditions recorded.</p>
                ) : (
                  profile.conditions.map((c, i) => (
                    <div key={i} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="font-extrabold text-slate-900 text-sm">{c.condition}</p>
                        <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                          Since {c.diagnosed_year}
                        </span>
                      </div>
                      <p className="text-slate-600">{c.notes}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

          {/* Primary Doctor & Hospital Preference */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-sky-600" /> Primary Care Physician
              </h3>
              <p className="text-lg font-bold text-slate-900">{profile.primary_doctor_name || 'Dr. Elizabeth Vance, MD'}</p>
              <p className="text-xs text-slate-500">{profile.primary_doctor_hospital || 'St. Jude Geriatric Medical Center'}</p>
              {profile.primary_doctor_phone && (
                <a href={`tel:${profile.primary_doctor_phone}`} className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-600 hover:underline pt-1">
                  <Phone className="w-3.5 h-3.5" /> {profile.primary_doctor_phone}
                </a>
              )}
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-600" /> Preferred Emergency Hospital
              </h3>
              <p className="text-lg font-bold text-slate-900">{profile.preferred_hospital || 'St. Jude Memorial Hospital, Emergency Wing'}</p>
              <p className="text-xs text-slate-500">Insurance: {profile.insurance_provider || 'Medicare Premier'}</p>
              <p className="text-xs text-slate-500">Policy: {profile.insurance_policy_number || 'MED-7829-0149-X'}</p>
            </div>
          </div>

          {/* Emergency Contacts List */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Phone className="w-5 h-5 text-emerald-600" /> Designated Emergency Responders & Contacts
            </h3>

            <div className="grid sm:grid-cols-3 gap-4">
              {profile.emergency_contacts.map((c, idx) => (
                <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-extrabold text-sm text-slate-900">{c.name}</p>
                    {c.is_primary && (
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                        Primary
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">{c.relationship}</p>
                  <a
                    href={`tel:${c.phone}`}
                    className="flex items-center justify-center gap-1.5 w-full py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5" /> Call {c.phone}
                  </a>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
