import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  FileText, UploadCloud, Download, Trash2, Eye, Plus, 
  Calendar, Stethoscope, X, AlertCircle, FileSpreadsheet, Lock 
} from 'lucide-react';
import { api } from '../services/api';
import { MedicalRecord } from '../types';

export const MedicalRecordsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const queryElderlyId = searchParams.get('elderly_id');
  const targetElderlyId = queryElderlyId ? parseInt(queryElderlyId, 10) : undefined;

  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [previewRecord, setPreviewRecord] = useState<MedicalRecord | null>(null);

  // Upload Form
  const [title, setTitle] = useState('');
  const [recordType, setRecordType] = useState('Prescription');
  const [recordDate, setRecordDate] = useState(new Date().toISOString().split('T')[0]);
  const [doctorName, setDoctorName] = useState('');
  const [hospitalClinic, setHospitalClinic] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const data = await api.getMedicalRecords(
        targetElderlyId,
        selectedType === 'all' ? undefined : selectedType
      );
      setRecords(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [targetElderlyId, selectedType]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      alert("Please select a document file (PDF or Image) to upload.");
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('record_type', recordType);
      formData.append('record_date', recordDate);
      if (doctorName) formData.append('doctor_name', doctorName);
      if (hospitalClinic) formData.append('hospital_clinic', hospitalClinic);
      if (notes) formData.append('notes', notes);
      if (targetElderlyId) formData.append('elderly_id', targetElderlyId.toString());
      formData.append('file', selectedFile);

      await api.uploadMedicalRecord(formData);
      setShowUploadModal(false);
      setTitle('');
      setSelectedFile(null);
      await fetchRecords();
    } catch (err: any) {
      alert(err.message || "Failed to upload document");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to permanently delete this medical document?")) {
      try {
        await api.deleteMedicalRecord(id);
        await fetchRecords();
      } catch {
        alert("Failed to delete record");
      }
    }
  };

  const categories = [
    { id: 'all', label: 'All Documents' },
    { id: 'Prescription', label: 'Prescriptions' },
    { id: 'Lab Report', label: 'Lab Reports' },
    { id: 'Radiology / Scan', label: 'Scans & Imaging' },
    { id: 'Discharge Summary', label: 'Discharge Summaries' },
  ];

  return (
    <div className="space-y-8 w-full pb-12">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="bg-purple-100 text-purple-800 text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider">
            Confidential Document Vault
          </span>
          <h1 className="text-3xl font-black text-slate-900 mt-1">Medical Records & Reports</h1>
          <p className="text-slate-500 text-sm">
            Encrypted repository for prescriptions, clinical lab tests, and hospital summaries
          </p>
        </div>

        <button
          onClick={() => setShowUploadModal(true)}
          className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-5 py-2.5 rounded-2xl text-sm font-bold shadow-md shadow-brand-500/20 transition-all self-start md:self-auto"
        >
          <UploadCloud className="w-4 h-4" />
          <span>Upload Medical File</span>
        </button>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedType(cat.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              selectedType === cat.id
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Records Grid */}
      {records.length === 0 ? (
        <div className="p-16 bg-white rounded-3xl border border-slate-200 text-center space-y-3">
          <FileText className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-extrabold text-slate-700 text-base">No Medical Documents Found</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Upload diagnostic blood panels, doctor prescriptions, or radiology scans to maintain an organized health archive.
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {records.map((rec) => (
            <div key={rec.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:border-brand-300 transition-all space-y-4">
              <div className="flex items-start justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-brand-800 bg-brand-50 px-2.5 py-1 rounded-lg">
                  {rec.record_type}
                </span>
                <span className="text-xs font-bold text-slate-400">
                  {rec.file_size_kb} KB
                </span>
              </div>

              <div>
                <h3 className="font-extrabold text-base text-slate-900 line-clamp-1">{rec.title}</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Dr. {rec.doctor_name || 'Medical Specialist'} • {rec.hospital_clinic || 'Clinic'}
                </p>
              </div>

              {rec.notes && (
                <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 line-clamp-2">
                  {rec.notes}
                </p>
              )}

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-400">📅 {rec.record_date}</span>
                <div className="flex items-center gap-1">
                  <a
                    href={api.getRecordDownloadUrl(rec.id)}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 text-brand-600 hover:bg-brand-50 rounded-lg"
                    title="Download / View Original File"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                  <button
                    onClick={() => handleDelete(rec.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                    title="Delete File"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto text-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-xl font-black text-slate-900">Upload Healthcare Record</h3>
              <button onClick={() => setShowUploadModal(false)} className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Document Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Complete Blood Count (CBC) Lab Report"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2.5 border rounded-xl"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Document Type</label>
                  <select
                    value={recordType}
                    onChange={(e) => setRecordType(e.target.value)}
                    className="w-full px-3 py-2.5 border rounded-xl"
                  >
                    <option value="Prescription">Prescription</option>
                    <option value="Lab Report">Lab Report</option>
                    <option value="Radiology / Scan">Radiology / Scan</option>
                    <option value="Discharge Summary">Discharge Summary</option>
                    <option value="Other">Other Medical File</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Record Date</label>
                  <input
                    type="date"
                    required
                    value={recordDate}
                    onChange={(e) => setRecordDate(e.target.value)}
                    className="w-full px-3 py-2.5 border rounded-xl"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Doctor Name</label>
                  <input
                    type="text"
                    placeholder="Dr. Elizabeth Vance"
                    value={doctorName}
                    onChange={(e) => setDoctorName(e.target.value)}
                    className="w-full px-3 py-2.5 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Hospital / Lab</label>
                  <input
                    type="text"
                    placeholder="St. Jude Hospital"
                    value={hospitalClinic}
                    onChange={(e) => setHospitalClinic(e.target.value)}
                    className="w-full px-3 py-2.5 border rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Physician Notes / Key Findings</label>
                <textarea
                  rows={2}
                  placeholder="Key test results, normal parameters, follow-up advice..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2.5 border rounded-xl"
                />
              </div>

              {/* File Attachment */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select File (PDF, PNG, JPG - Max 15MB) *</label>
                <input
                  type="file"
                  required
                  accept=".pdf,.png,.jpg,.jpeg,.webp"
                  onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)}
                  className="w-full text-xs text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-md disabled:opacity-50"
                >
                  {uploading ? "Encrypting & Uploading..." : "Upload Securely"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
