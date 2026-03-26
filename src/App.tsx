import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { RoleProvider, useRole } from "@/contexts/RoleContext";
import { AdminLayout } from "@/components/AdminLayout";
import { PatientLayout } from "@/components/PatientLayout";
import Auth from "./pages/Auth";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminPatients from "./pages/admin/Patients";
import AdminDentists from "./pages/admin/Dentists";
import AdminAppointments from "./pages/admin/Appointments";
import AdminMedicalRecords from "./pages/admin/MedicalRecords";
import AdminInsurancePlans from "./pages/admin/InsurancePlans";
import AdminPayments from "./pages/admin/Payments";
import AdminReports from "./pages/admin/Reports";
import MyAppointments from "./pages/portal/MyAppointments";
import NewAppointment from "./pages/portal/NewAppointment";
import MyPayments from "./pages/portal/MyPayments";
import MyProfile from "./pages/portal/MyProfile";
import MyMedicalHistory from "./pages/portal/MyMedicalHistory";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function LoadingScreen() {
  return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Carregando...</div>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { session, loading: authLoading } = useAuth();
  const { loading: roleLoading, isStaff } = useRole();
  if (authLoading || roleLoading) return <LoadingScreen />;
  if (!session) return <Navigate to="/auth" replace />;
  if (!isStaff) return <Navigate to="/portal" replace />;
  return <AdminLayout>{children}</AdminLayout>;
}

function PatientRoute({ children }: { children: React.ReactNode }) {
  const { session, loading: authLoading } = useAuth();
  const { loading: roleLoading, isPatient } = useRole();
  if (authLoading || roleLoading) return <LoadingScreen />;
  if (!session) return <Navigate to="/auth" replace />;
  if (!isPatient) return <Navigate to="/admin" replace />;
  return <PatientLayout>{children}</PatientLayout>;
}

function AuthRoute() {
  const { session, loading: authLoading } = useAuth();
  const { loading: roleLoading, isStaff } = useRole();
  if (authLoading || roleLoading) return <LoadingScreen />;
  if (session) return <Navigate to={isStaff ? "/admin" : "/portal"} replace />;
  return <Auth />;
}

function RootRedirect() {
  const { session, loading: authLoading } = useAuth();
  const { loading: roleLoading, isStaff } = useRole();
  if (authLoading || roleLoading) return <LoadingScreen />;
  if (!session) return <Navigate to="/auth" replace />;
  return <Navigate to={isStaff ? "/admin" : "/portal"} replace />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <AuthProvider>
        <RoleProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<RootRedirect />} />
              <Route path="/auth" element={<AuthRoute />} />

              {/* Admin Portal */}
              <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
              <Route path="/admin/patients" element={<AdminRoute><AdminPatients /></AdminRoute>} />
              <Route path="/admin/dentists" element={<AdminRoute><AdminDentists /></AdminRoute>} />
              <Route path="/admin/appointments" element={<AdminRoute><AdminAppointments /></AdminRoute>} />
              <Route path="/admin/medical-records" element={<AdminRoute><AdminMedicalRecords /></AdminRoute>} />
              <Route path="/admin/insurance-plans" element={<AdminRoute><AdminInsurancePlans /></AdminRoute>} />
              <Route path="/admin/payments" element={<AdminRoute><AdminPayments /></AdminRoute>} />
              <Route path="/admin/reports" element={<AdminRoute><AdminReports /></AdminRoute>} />

              {/* Patient Portal */}
              <Route path="/portal" element={<PatientRoute><MyAppointments /></PatientRoute>} />
              <Route path="/portal/new-appointment" element={<PatientRoute><NewAppointment /></PatientRoute>} />
              <Route path="/portal/payments" element={<PatientRoute><MyPayments /></PatientRoute>} />
              <Route path="/portal/profile" element={<PatientRoute><MyProfile /></PatientRoute>} />
              <Route path="/portal/medical-history" element={<PatientRoute><MyMedicalHistory /></PatientRoute>} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </RoleProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
