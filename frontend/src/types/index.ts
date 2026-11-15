export type UserRole = 'elderly' | 'caregiver' | 'family' | 'admin';

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
  phone?: string;
  avatar_url?: string;
  mfa_enabled: boolean;
  is_active: boolean;
  has_passcode: boolean;
  inactivity_timeout_minutes: number;
  accessibility_mode: boolean;
  large_font: boolean;
  high_contrast: boolean;
  voice_enabled: boolean;
  email_notifications: boolean;
  push_notifications: boolean;
  sound_alerts: boolean;
  reminder_advance_minutes: number;
  created_at: string;
}

export interface Medication {
  id: number;
  user_id: number;
  name: string;
  generic_name?: string;
  dosage: string;
  form: string;
  frequency: string;
  timings: string[];
  instructions: string;
  start_date: string;
  end_date?: string;
  color: string;
  pill_shape: string;
  prescribing_doctor?: string;
  refill_remaining: number;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DoseLog {
  id: number;
  medication_id: number;
  medication_name: string;
  dosage: string;
  instructions: string;
  form: string;
  color: string;
  pill_shape: string;
  scheduled_date: string;
  scheduled_time: string;
  status: 'upcoming' | 'taken' | 'missed' | 'skipped';
  taken_at?: string;
  notes?: string;
  marked_by_name?: string;
}

export interface Appointment {
  id: number;
  user_id: number;
  doctor_name: string;
  specialty: string;
  hospital_clinic: string;
  location_address?: string;
  appointment_datetime: string;
  purpose: string;
  status: 'upcoming' | 'completed' | 'cancelled' | 'rescheduled';
  reminder_sent: boolean;
  transportation_needed: boolean;
  accompanied_by?: string;
  doctor_notes?: string;
  preparation_instructions?: string;
  created_at: string;
}

export interface MedicalRecord {
  id: number;
  user_id: number;
  title: string;
  record_type: string;
  file_path: string;
  file_name: string;
  file_size_kb: number;
  mime_type: string;
  doctor_name?: string;
  hospital_clinic?: string;
  record_date: string;
  notes?: string;
  created_at: string;
}

export interface HealthProfile {
  id: number;
  user_id: number;
  date_of_birth?: string;
  gender?: string;
  blood_type?: string;
  height_cm?: number;
  weight_kg?: number;
  allergies: Array<{ allergen: string; severity: string; reaction: string }>;
  conditions: Array<{ condition: string; diagnosed_year: string; notes: string }>;
  primary_doctor_name?: string;
  primary_doctor_phone?: string;
  primary_doctor_hospital?: string;
  emergency_contacts: Array<{ name: string; relationship: string; phone: string; is_primary: boolean }>;
  dnr_status: boolean;
  preferred_hospital?: string;
  insurance_provider?: string;
  insurance_policy_number?: string;
  special_care_notes?: string;
  updated_at?: string;
}

export interface WellnessData {
  id: number;
  user_id: number;
  log_date: string;
  water_glasses: number;
  water_target: number;
  steps_count: number;
  steps_target: number;
  sleep_hours: number;
  mood: string;
  tasks: Array<{ id: number; task: string; done: boolean }>;
  notes?: string;
}

export interface NotificationItem {
  id: number;
  title: string;
  message: string;
  type: 'medication_reminder' | 'missed_dose' | 'caregiver_alert' | 'appointment' | 'emergency' | 'system';
  severity: 'info' | 'warning' | 'critical';
  is_read: boolean;
  metadata: Record<string, any>;
  created_at: string;
}

export interface CaregiverLink {
  id: number;
  elderly_id: number;
  elderly_name: string;
  elderly_email: string;
  member_id: number;
  member_name: string;
  member_email: string;
  relationship_type: string;
  relationship_label: string;
  status: string;
  can_view_medications: boolean;
  can_manage_medications: boolean;
  can_view_adherence: boolean;
  can_view_appointments: boolean;
  can_manage_appointments: boolean;
  can_view_records: boolean;
  can_receive_emergency_alerts: boolean;
  can_receive_missed_dose_alerts: boolean;
  created_at: string;
}
