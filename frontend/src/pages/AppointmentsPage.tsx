import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Calendar, Plus, Clock, MapPin, User, Stethoscope, 
  X, Check, AlertCircle, Ban, RefreshCw 
} from 'lucide-react';
import { api } from '../services/api';
import { Appointment } from '../types';

export const AppointmentsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const queryElderlyId = searchParams.get('elderly_id');
  const targetElderlyId = queryElderlyId ? parseInt(queryElderlyId, 10) : undefined;

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingApptId, setEditingApptId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    doctor_name: '',
    specialty: 'General Physician',
    hospital_clinic: '',
    location_address: '',
    appointment_datetime: '',
    purpose: '',
    transportation_needed: false,
    accompanied_by: '',
    preparation_instructions: '',
  });

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const data = await api.getAppointments(targetElderlyId);
      setAppointments(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [targetElderlyId]);

  const handleOpenAdd = () => {
    setEditingApptId(null);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);

    setFormData({
      doctor_name: '',
      specialty: 'General Physician',
      hospital_clinic: '',
      location_address: '',
      appointment_datetime: tomorrow.toISOString().slice(0, 16),
      purpose: '',
      transportation_needed: false,
      accompanied_by: '',
      preparation_instructions: '',
    });
    setShowModal(true);
  };

  const handleSaveAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        appointment_datetime: new Date(formData.appointment_datetime).toISOString(),
        user_id: targetElderlyId,
      };

      if (editingApptId) {
        await api.updateAppointment(editingApptId, payload);
      } else {
        await api.createAppointment(payload);
      }
      setShowModal(false);
      await fetchAppointments();
    } catch (err: any) {
      alert(err.message || "Failed to schedule appointment");
    }
  };

  const handleCancelAppointment = async (id: number) => {
    if (confirm("Are you sure you want to cancel this appointment?")) {
      try {
        await api.deleteAppointment(id);
        await fetchAppointments();
      } catch {
        alert("Failed to cancel appointment");
      }
    }
  };

  const upcomingAppts = appointments.filter(a => a.status === 'upcoming');
  const pastAppts = appointments.filter(a => a.status !== 'upcoming');

  return (
    <div className="space-y-8 w-full pb-12">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="bg-sky-100 text-sky-800 text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider">
            Clinical Care Coordination
          </span>
          <h1 className="text-3xl font-black text-slate-900 mt-1">Medical Appointments</h1>
          <p className="text-slate-500 text-sm">
            Coordinate doctor consultations, hospital checkups, and family accompaniment
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white px-5 py-2.5 rounded-2xl text-sm font-bold shadow-md shadow-sky-500/20 transition-all self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Schedule New Appointment</span>
        </button>
      </div>

      {/* Upcoming Visits */}
      <div className="space-y-4">
        <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-sky-600" /> Upcoming Consultations ({upcomingAppts.length})
        </h2>

        {upcomingAppts.length === 0 ? (
          <div className="p-10 bg-white rounded-3xl border border-slate-200 text-center text-slate-400">
            No upcoming appointments scheduled.
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {upcomingAppts.map((appt) => (
              <div key={appt.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:border-sky-300 transition-all space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-200 text-sky-700 flex items-center justify-center font-bold">
                      <Stethoscope className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-base text-slate-900">{appt.doctor_name}</h3>
                      <span className="text-[11px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded">
                        {appt.specialty}
                      </span>
                    </div>
                  </div>

                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                    Confirmed
                  </span>
                </div>

                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-1 text-xs text-slate-700">
                  <p className="font-extrabold text-slate-900 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-sky-600" />
                    {new Date(appt.appointment_datetime).toLocaleString('en-US', {
                      weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
                    })}
                  </p>
                  <p className="flex items-center gap-1.5 text-slate-600">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {appt.hospital_clinic}
                  </p>
                  {appt.location_address && (
                    <p className="text-[11px] text-slate-400 pl-5">{appt.location_address}</p>
                  )}
                </div>

                <div>
                  <p className="text-xs font-semibold text-slate-800">Purpose:</p>
                  <p className="text-xs text-slate-600 mt-0.5">{appt.purpose}</p>
                </div>

                {appt.preparation_instructions && (
                  <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900">
                    ⚠️ <strong>Prep:</strong> {appt.preparation_instructions}
                  </div>
                )}

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500">
                    {appt.accompanied_by ? `Accompanied by: ${appt.accompanied_by}` : 'Solo visit'}
                  </span>
                  <button
                    onClick={() => handleCancelAppointment(appt.id)}
                    className="text-rose-600 hover:text-rose-800 font-bold"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Past Appointment History */}
      {pastAppts.length > 0 && (
        <div className="space-y-4 pt-6">
          <h2 className="text-xl font-extrabold text-slate-900">Appointment History</h2>
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[11px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-4 px-6">Doctor & Specialty</th>
                    <th className="py-4 px-6">Hospital / Clinic</th>
                    <th className="py-4 px-6">Date</th>
                    <th className="py-4 px-6">Purpose / Outcome</th>
                    <th className="py-4 px-6">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {pastAppts.map((appt) => (
                    <tr key={appt.id} className="hover:bg-slate-50">
                      <td className="py-4 px-6 font-bold text-slate-900">
                        {appt.doctor_name}
                        <p className="text-[11px] text-slate-400 font-normal">{appt.specialty}</p>
                      </td>
                      <td className="py-4 px-6 text-slate-700">{appt.hospital_clinic}</td>
                      <td className="py-4 px-6 font-bold text-slate-800">
                        {new Date(appt.appointment_datetime).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-6 text-slate-600 max-w-sm">
                        {appt.doctor_notes || appt.purpose}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-2.5 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                          appt.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                        }`}>
                          {appt.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Appointment Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto text-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-xl font-black text-slate-900">Schedule Doctor Appointment</h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAppointment} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Doctor Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Elizabeth Vance"
                    value={formData.doctor_name}
                    onChange={(e) => setFormData({ ...formData, doctor_name: e.target.value })}
                    className="w-full px-3 py-2.5 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Specialty</label>
                  <input
                    type="text"
                    placeholder="e.g. Geriatric Medicine, Cardiology"
                    value={formData.specialty}
                    onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                    className="w-full px-3 py-2.5 border rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Hospital / Clinic Center *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. St. Jude Geriatric Medical Center"
                  value={formData.hospital_clinic}
                  onChange={(e) => setFormData({ ...formData, hospital_clinic: e.target.value })}
                  className="w-full px-3 py-2.5 border rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Date & Time *</label>
                <input
                  type="datetime-local"
                  required
                  value={formData.appointment_datetime}
                  onChange={(e) => setFormData({ ...formData, appointment_datetime: e.target.value })}
                  className="w-full px-3 py-2.5 border rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Visit Purpose *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Quarterly Diabetic Review & Blood Pressure check"
                  value={formData.purpose}
                  onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                  className="w-full px-3 py-2.5 border rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Preparation Instructions (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. 12-hour fasting for blood test, bring previous reports"
                  value={formData.preparation_instructions}
                  onChange={(e) => setFormData({ ...formData, preparation_instructions: e.target.value })}
                  className="w-full px-3 py-2.5 border rounded-xl"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Accompanying Person</label>
                  <input
                    type="text"
                    placeholder="e.g. Daughter Sarah"
                    value={formData.accompanied_by}
                    onChange={(e) => setFormData({ ...formData, accompanied_by: e.target.value })}
                    className="w-full px-3 py-2.5 border rounded-xl"
                  />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="transport"
                    checked={formData.transportation_needed}
                    onChange={(e) => setFormData({ ...formData, transportation_needed: e.target.checked })}
                    className="w-4 h-4 text-sky-600 rounded"
                  />
                  <label htmlFor="transport" className="text-xs font-bold text-slate-700">
                    Wheelchair / Transport Needed
                  </label>
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
                  className="px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl shadow-md"
                >
                  Confirm Appointment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
