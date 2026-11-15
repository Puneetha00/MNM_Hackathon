import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AccessibilityProvider } from './context/AccessibilityContext';
import { NotificationProvider } from './context/NotificationContext';

// Components
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { EmergencySOSModal } from './components/EmergencySOSModal';
import { VoiceAssistant } from './components/VoiceAssistant';

// 18 Pages
import { LandingPage } from './pages/LandingPage';
import { RegisterPage } from './pages/RegisterPage';
import { LoginPage } from './pages/LoginPage';
import { PasscodeVerifyPage } from './pages/PasscodeVerifyPage';
import { ElderlyDashboardPage } from './pages/ElderlyDashboardPage';
import { CaregiverDashboardPage } from './pages/CaregiverDashboardPage';
import { FamilyDashboardPage } from './pages/FamilyDashboardPage';
import { MedicationsPage } from './pages/MedicationsPage';
import { AdherenceReportsPage } from './pages/AdherenceReportsPage';
import { AppointmentsPage } from './pages/AppointmentsPage';
import { MedicalRecordsPage } from './pages/MedicalRecordsPage';
import { HealthProfilePage } from './pages/HealthProfilePage';
import { EmergencyAssistancePage } from './pages/EmergencyAssistancePage';
import { NotificationsPage } from './pages/NotificationsPage';
import { CollaborationPage } from './pages/CollaborationPage';
import { UserSettingsPage } from './pages/UserSettingsPage';
import { PrivacySecurityPage } from './pages/PrivacySecurityPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';

const ProtectedLayout: React.FC<{ children: React.ReactNode; onOpenSOS: () => void }> = ({ children, onOpenSOS }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  React.useEffect(() => {
    setMobileSidebarOpen(false);
  }, [location.pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar onOpenSOS={onOpenSOS} onToggleSidebar={() => setMobileSidebarOpen(prev => !prev)} />
      <div className="flex-1 flex w-full min-w-0">
        <Sidebar mobileOpen={mobileSidebarOpen} onCloseMobile={() => setMobileSidebarOpen(false)} />
        <main className="flex-1 min-w-0 w-full p-4 sm:p-6 lg:p-8 overflow-y-auto overflow-x-hidden">
          {children}
        </main>
      </div>
      <VoiceAssistant />
    </div>
  );
};

export const AppContent: React.FC = () => {
  const [isSOSOpen, setIsSOSOpen] = useState(false);

  return (
    <>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/verify-passcode" element={<PasscodeVerifyPage />} />

        {/* Protected Healthcare Routes */}
        <Route
          path="/elderly/dashboard"
          element={
            <ProtectedLayout onOpenSOS={() => setIsSOSOpen(true)}>
              <ElderlyDashboardPage onOpenSOS={() => setIsSOSOpen(true)} />
            </ProtectedLayout>
          }
        />
        <Route
          path="/caregiver/dashboard"
          element={
            <ProtectedLayout onOpenSOS={() => setIsSOSOpen(true)}>
              <CaregiverDashboardPage />
            </ProtectedLayout>
          }
        />
        <Route
          path="/family/dashboard"
          element={
            <ProtectedLayout onOpenSOS={() => setIsSOSOpen(true)}>
              <FamilyDashboardPage />
            </ProtectedLayout>
          }
        />
        <Route
          path="/medications"
          element={
            <ProtectedLayout onOpenSOS={() => setIsSOSOpen(true)}>
              <MedicationsPage />
            </ProtectedLayout>
          }
        />
        <Route
          path="/adherence"
          element={
            <ProtectedLayout onOpenSOS={() => setIsSOSOpen(true)}>
              <AdherenceReportsPage />
            </ProtectedLayout>
          }
        />
        <Route
          path="/appointments"
          element={
            <ProtectedLayout onOpenSOS={() => setIsSOSOpen(true)}>
              <AppointmentsPage />
            </ProtectedLayout>
          }
        />
        <Route
          path="/records"
          element={
            <ProtectedLayout onOpenSOS={() => setIsSOSOpen(true)}>
              <MedicalRecordsPage />
            </ProtectedLayout>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedLayout onOpenSOS={() => setIsSOSOpen(true)}>
              <HealthProfilePage />
            </ProtectedLayout>
          }
        />
        <Route
          path="/emergency"
          element={
            <ProtectedLayout onOpenSOS={() => setIsSOSOpen(true)}>
              <EmergencyAssistancePage onOpenSOS={() => setIsSOSOpen(true)} />
            </ProtectedLayout>
          }
        />
        <Route
          path="/notifications"
          element={
            <ProtectedLayout onOpenSOS={() => setIsSOSOpen(true)}>
              <NotificationsPage />
            </ProtectedLayout>
          }
        />
        <Route
          path="/collaboration"
          element={
            <ProtectedLayout onOpenSOS={() => setIsSOSOpen(true)}>
              <CollaborationPage />
            </ProtectedLayout>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedLayout onOpenSOS={() => setIsSOSOpen(true)}>
              <UserSettingsPage />
            </ProtectedLayout>
          }
        />
        <Route
          path="/security"
          element={
            <ProtectedLayout onOpenSOS={() => setIsSOSOpen(true)}>
              <PrivacySecurityPage />
            </ProtectedLayout>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedLayout onOpenSOS={() => setIsSOSOpen(true)}>
              <AdminDashboardPage />
            </ProtectedLayout>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <EmergencySOSModal isOpen={isSOSOpen} onClose={() => setIsSOSOpen(false)} />
    </>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AccessibilityProvider>
          <NotificationProvider>
            <AppContent />
          </NotificationProvider>
        </AccessibilityProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
