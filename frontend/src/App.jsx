import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/layout/Layout'
import LoginPage from './pages/auth/LoginPage'
import Dashboard from './pages/dashboard/Dashboard'
import PatientsPage from './pages/patients/PatientsPage'
import PatientDetail from './pages/patients/PatientDetail'
import { RendezvousPage } from './pages/appointments/RendezvousPage'
import DossiersPage from './pages/records/DossiersPage'
import PaiementsPage from './pages/payments/PaiementsPage'
import EmployesPage from './pages/employees/EmployesPage'
import MessagesPage from './pages/messages/MessagesPage'
import CongesPage from './pages/hr/CongesPage'
// Patient portal
import PortalHome from './pages/portal/PortalHome'
import PortalRendezvous from './pages/portal/PortalRendezvous'
import PortalDossier from './pages/portal/PortalDossier'
import PortalFactures from './pages/portal/PortalFactures'
import PortalSchema from './pages/portal/PortalSchema'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )
  return user ? children : <Navigate to="/login" replace />
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  return user ? <Navigate to="/" replace /> : children
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          {/* Staff routes */}
          <Route index element={<Dashboard />} />
          <Route path="patients" element={<PatientsPage />} />
          <Route path="patients/:id" element={<PatientDetail />} />
          <Route path="rendezvous" element={<RendezvousPage />} />
          <Route path="dossiers" element={<DossiersPage />} />
          <Route path="paiements" element={<PaiementsPage />} />
          <Route path="employes" element={<EmployesPage />} />
          <Route path="messages" element={<MessagesPage />} />
          <Route path="conges" element={<CongesPage />} />
          {/* Patient portal routes */}
          <Route path="espace-patient" element={<PortalHome />} />
          <Route path="espace-patient/rendezvous" element={<PortalRendezvous />} />
          <Route path="espace-patient/dossier" element={<PortalDossier />} />
          <Route path="espace-patient/factures" element={<PortalFactures />} />
          <Route path="espace-patient/schema" element={<PortalSchema />} />
        </Route>
      </Routes>
    </AuthProvider>
  )
}
