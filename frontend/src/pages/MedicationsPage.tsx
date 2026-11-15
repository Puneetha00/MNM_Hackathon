import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Pill, Plus, Edit2, Trash2, Clock, CheckCircle, AlertTriangle, 
  Search, Filter, Calendar, X, Check, Info, Sparkles 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useAccessibility } from '../context/AccessibilityContext';
import { Medication, DoseLog } from '../types';

export const MedicationsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { speak } = useAccessibility();
  const [searchParams] = useSearchParams();
  const queryElderlyId = searchParams.get('elderly_id');
  const targetElderlyId = queryElderlyId ? parseInt(queryElderlyId, 10) : undefined;

  const [activeTab, setActiveTab] = useState<'schedule' | 'medications'>('schedule');
  const [medications, setMedications] = useState<Medication[]>([]);
  const [schedule, setSchedule] = useState<DoseLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Add / Edit Modal state
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingMedId, setEditingMedId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    generic_name: '',
    dosage: '',
    form: 'Tablet',
    frequency: 'Once Daily',
    timings: '08:00',
    instructions: 'Take after food with water',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    color: 'teal',
    pill_shape: 'round',
    prescribing_doctor: '',
    refill_remaining: 3,
    notes: '',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [medsData, schedData] = await Promise.all([
        api.getMedications(targetElderlyId),
        api.getTodaySchedule(targetElderlyId),
      ]);
      setMedications(medsData);
      setSchedule(schedData);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [targetElderlyId]);

  const handleMarkDose = async (dose: DoseLog, status: string) => {
    try {
      await api.markDoseStatus(dose.id, status);
      if (status === 'taken') {
        confetti({ particleCount: 60, spread: 55, origin: { y: 0.6 } });
        speak(`Marked ${dose.medication_name} as taken.`);
      }
      await fetchData();
    } catch {
      alert("Failed to update status.");
    }
  };

  const handleOpenAdd = () => {
    setEditingMedId(null);
    setFormData({
      name: '',
      generic_name: '',
      dosage: '',
      form: 'Tablet',
      frequency: 'Once Daily',
      timings: '08:00',
      instructions: 'Take after food with water',
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      color: 'teal',
      pill_shape: 'round',
      prescribing_doctor: '',
      refill_remaining: 3,
      notes: '',
    });
    setShowModal(true);
  };

  const handleOpenEdit = (med: Medication) => {
    setEditingMedId(med.id);
    setFormData({
      name: med.name,
      generic_name: med.generic_name || '',
      dosage: med.dosage,
      form: med.form,
      frequency: med.frequency,
      timings: med.timings.join(', '),
      instructions: med.instructions,
      start_date: med.start_date,
      end_date: med.end_date || '',
      color: med.color,
      pill_shape: med.pill_shape,
      prescribing_doctor: med.prescribing_doctor || '',
      refill_remaining: med.refill_remaining,
      notes: med.notes || '',
    });
    setShowModal(true);
  };

  const handleSaveMedication = async (e: React.FormEvent) => {
    e.preventDefault();
    const timingsArr = formData.timings
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const payload = {
      ...formData,
      timings: timingsArr.length > 0 ? timingsArr : ['08:00'],
      end_date: formData.end_date || null,
      user_id: targetElderlyId,
    };

    try {
      if (editingMedId) {
        await api.updateMedication(editingMedId, payload);
      } else {
        await api.createMedication(payload);
      }
      setShowModal(false);
      await fetchData();
    } catch (err: any) {
      alert(err.message || 'Error saving medication');
    }
  };

  const handleDeleteMedication = async (id: number) => {
    if (confirm('Are you sure you want to discontinue and archive this medication?')) {
      try {
        await api.deleteMedication(id);
        await fetchData();
      } catch {
        alert('Could not archive medication');
      }
    }
  };

  const filteredMeds = medications.filter(
    (m) =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.generic_name && m.generic_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-8 w-full pb-12">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="bg-brand-100 text-brand-800 text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider">
            Smart Medication Hub
          </span>
          <h1 className="text-3xl font-black text-slate-900 mt-1">Medication Management</h1>
          <p className="text-slate-500 text-sm">
            {targetElderlyId ? `Managing care recipient #${targetElderlyId}` : "Your complete daily dosage routine and active prescriptions"}
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-5 py-2.5 rounded-2xl text-sm font-bold shadow-md shadow-brand-500/20 transition-all self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Medication</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => setActiveTab('schedule')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'schedule'
              ? 'border-brand-600 text-brand-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Today's Live Tracker ({schedule.length} doses)</span>
        </button>

        <button
          onClick={() => setActiveTab('medications')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'medications'
              ? 'border-brand-600 text-brand-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Pill className="w-4 h-4" />
          <span>Active Prescriptions ({medications.length})</span>
        </button>
      </div>

      {/* TAB 1: Live Schedule Tracker */}
      {activeTab === 'schedule' && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {schedule.map((dose) => (
              <div
                key={dose.id}
                className={`p-6 rounded-3xl border transition-all ${
                  dose.status === 'taken'
                    ? 'bg-emerald-50/70 border-emerald-300'
                    : dose.status === 'missed'
                    ? 'bg-rose-50/70 border-rose-300'
                    : 'bg-white border-slate-200 shadow-sm hover:border-brand-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs text-slate-700 bg-slate-100 px-3 py-1 rounded-xl">
                    ⏰ {dose.scheduled_time}
                  </span>

                  <span
                    className={`text-xs font-black px-3 py-0.5 rounded-full uppercase tracking-wider ${
                      dose.status === 'taken'
                        ? 'bg-emerald-200 text-emerald-900'
                        : dose.status === 'missed'
                        ? 'bg-rose-200 text-rose-900'
                        : 'bg-teal-100 text-teal-800'
                    }`}
                  >
                    {dose.status}
                  </span>
                </div>

                <div className="mt-4">
                  <h3 className="text-xl font-black text-slate-900">{dose.medication_name}</h3>
                  <p className="text-sm text-slate-600 font-semibold">{dose.dosage} • {dose.form}</p>
                  <p className="text-xs text-slate-500 mt-1 bg-white/80 p-2 rounded-xl border border-slate-200/60">
                    💡 {dose.instructions}
                  </p>
                </div>

                {dose.taken_at && (
                  <p className="text-[11px] text-emerald-700 font-medium mt-2">
                    Confirmed taken at {new Date(dose.taken_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {dose.marked_by_name && ` by ${dose.marked_by_name}`}
                  </p>
                )}

                {/* Status action buttons */}
                <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center gap-2">
                  {dose.status !== 'taken' && (
                    <button
                      onClick={() => handleMarkDose(dose, 'taken')}
                      className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors shadow-xs flex items-center justify-center gap-1.5"
                    >
                      <Check className="w-4 h-4" /> Mark Taken
                    </button>
                  )}
                  {dose.status === 'upcoming' && (
                    <button
                      onClick={() => handleMarkDose(dose, 'missed')}
                      className="py-2.5 px-3 bg-slate-100 hover:bg-rose-100 text-slate-600 hover:text-rose-700 font-bold rounded-xl text-xs transition-colors"
                      title="Flag as Missed"
                    >
                      Missed
                    </button>
                  )}
                  {dose.status === 'taken' && (
                    <button
                      onClick={() => handleMarkDose(dose, 'upcoming')}
                      className="text-xs text-slate-400 hover:text-slate-600 underline"
                    >
                      Undo
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: All Active Medications List */}
      {activeTab === 'medications' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                placeholder="Search medications by brand or generic name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <span className="text-xs text-slate-500 font-bold">
              Showing {filteredMeds.length} prescription(s)
            </span>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[11px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-4 px-6">Medication</th>
                    <th className="py-4 px-6">Dosage & Form</th>
                    <th className="py-4 px-6">Scheduled Timings</th>
                    <th className="py-4 px-6">Instructions</th>
                    <th className="py-4 px-6">Doctor / Refills</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredMeds.map((med) => (
                    <tr key={med.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-lg">
                            💊
                          </div>
                          <div>
                            <p className="font-extrabold text-slate-900">{med.name}</p>
                            {med.generic_name && (
                              <p className="text-xs text-slate-400 italic">{med.generic_name}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <span className="font-bold text-slate-800">{med.dosage}</span>
                        <p className="text-xs text-slate-500">{med.form} • {med.frequency}</p>
                      </td>

                      <td className="py-4 px-6">
                        <div className="flex flex-wrap gap-1">
                          {med.timings.map((t, idx) => (
                            <span key={idx} className="bg-slate-100 text-slate-700 text-xs px-2 py-0.5 rounded-md font-mono font-bold">
                              {t}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <p className="text-xs text-slate-700 max-w-xs">{med.instructions}</p>
                      </td>

                      <td className="py-4 px-6">
                        <p className="text-xs font-bold text-slate-800">{med.prescribing_doctor || 'Primary Care'}</p>
                        <span className="text-[11px] text-brand-700 font-semibold">{med.refill_remaining} refills left</span>
                      </td>

                      <td className="py-4 px-6 text-right space-x-2">
                        <button
                          onClick={() => handleOpenEdit(med)}
                          className="p-2 text-slate-500 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                          title="Edit Medication"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteMedication(med.id)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Archive / Discontinue"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Medication Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-xl font-black text-slate-900">
                {editingMedId ? "Edit Medication Details" : "Add Medication to Schedule"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMedication} className="space-y-4 text-sm">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Medication Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Metformin"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2.5 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Generic Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Metformin HCl"
                    value={formData.generic_name}
                    onChange={(e) => setFormData({ ...formData, generic_name: e.target.value })}
                    className="w-full px-3 py-2.5 border rounded-xl"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Dosage *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 500 mg"
                    value={formData.dosage}
                    onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                    className="w-full px-3 py-2.5 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Form</label>
                  <select
                    value={formData.form}
                    onChange={(e) => setFormData({ ...formData, form: e.target.value })}
                    className="w-full px-3 py-2.5 border rounded-xl"
                  >
                    <option value="Tablet">Tablet</option>
                    <option value="Capsule">Capsule</option>
                    <option value="Liquid">Liquid</option>
                    <option value="Inhaler">Inhaler</option>
                    <option value="Drops">Drops</option>
                    <option value="Injection">Injection</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Frequency</label>
                  <select
                    value={formData.frequency}
                    onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                    className="w-full px-3 py-2.5 border rounded-xl"
                  >
                    <option value="Once Daily">Once Daily</option>
                    <option value="Twice Daily">Twice Daily</option>
                    <option value="Three Times Daily">Three Times Daily</option>
                    <option value="Every 8 Hours">Every 8 Hours</option>
                    <option value="As Needed (PRN)">As Needed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Specific Dose Times (Comma-separated 24h format e.g. 08:00, 20:00) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="08:00, 20:00"
                  value={formData.timings}
                  onChange={(e) => setFormData({ ...formData, timings: e.target.value })}
                  className="w-full px-3 py-2.5 border rounded-xl font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Meal & Drinking Instructions</label>
                <input
                  type="text"
                  placeholder="e.g. Take immediately after breakfast with full glass of water"
                  value={formData.instructions}
                  onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                  className="w-full px-3 py-2.5 border rounded-xl"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-3 py-2.5 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">End Date (Optional)</label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full px-3 py-2.5 border rounded-xl"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Prescribing Doctor</label>
                  <input
                    type="text"
                    placeholder="Dr. Elizabeth Vance"
                    value={formData.prescribing_doctor}
                    onChange={(e) => setFormData({ ...formData, prescribing_doctor: e.target.value })}
                    className="w-full px-3 py-2.5 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Refills Remaining</label>
                  <input
                    type="number"
                    min={0}
                    value={formData.refill_remaining}
                    onChange={(e) => setFormData({ ...formData, refill_remaining: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-3 py-2.5 border rounded-xl"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-md"
                >
                  Save Medication
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
