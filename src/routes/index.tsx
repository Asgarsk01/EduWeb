import type { ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router'
import { Dashboard } from '../pages/Dashboard'
import { Insights } from '../pages/Insights'
import { Insights as OfficerInsights } from '../pages/officer/Insights'
import { Login } from '../pages/Login'
import { ForgotPassword } from '../pages/ForgotPassword'
import { PrivacyPolicy } from '../pages/PrivacyPolicy'
import { ProblemAreas } from '../pages/ProblemAreas'
import { Institution } from '../pages/admin/Institution'
import { Department } from '../pages/admin/Department'
import { AcademicYear } from '../pages/admin/AcademicYear'
import { SeatMatrix } from '../pages/admin/SeatMatrix'
import { DocumentMaster } from '../pages/admin/DocumentMaster'
import { UserManagement } from '../pages/admin/UserManagement'
import { Applicants } from '../pages/officer/Applicants'
import { ProblemAreas as OfficerProblemAreas } from '../pages/officer/ProblemAreas'
import { canAccessApplicants, canAccessSettings, getCurrentUserRole, getDefaultRouteForRole, isAuthenticated } from '../lib/session'

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

export const AppRoutes = () => {
  const role = getCurrentUserRole()
  const authenticated = isAuthenticated()

  return (
    <Routes>
      <Route
        path="/login"
        element={authenticated ? <Navigate to={getDefaultRouteForRole(role)} replace /> : <Login />}
      />
      <Route
        path="/forgot-password"
        element={<ForgotPassword />}
      />
      <Route
        path="/privacy-policy"
        element={<PrivacyPolicy />}
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            {role === 'ADMIN' ? <Navigate to={getDefaultRouteForRole(role)} replace /> : <Dashboard />}
          </ProtectedRoute>
        }
      />
      <Route
        path="/insights"
        element={
          <ProtectedRoute>
            {role === 'MANAGEMENT' ? <Insights /> : (role === 'OFFICER' ? <OfficerInsights /> : <Navigate to={getDefaultRouteForRole(role)} replace />)}
          </ProtectedRoute>
        }
      />
      <Route
        path="/problems"
        element={
          <ProtectedRoute>
            {role === 'MANAGEMENT' ? <ProblemAreas /> : (role === 'OFFICER' ? <OfficerProblemAreas /> : <Navigate to={getDefaultRouteForRole(role)} replace />)}
          </ProtectedRoute>
        }
      />
      <Route
        path="/applicants"
        element={
          <ProtectedRoute>
            {canAccessApplicants(role)
              ? <Applicants />
              : <Navigate to={getDefaultRouteForRole(role)} replace />}
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/institution"
        element={
          <ProtectedRoute>
            {canAccessSettings(role) ? <Institution /> : <Navigate to={getDefaultRouteForRole(role)} replace />}
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/department"
        element={
          <ProtectedRoute>
            {canAccessSettings(role) ? <Department /> : <Navigate to={getDefaultRouteForRole(role)} replace />}
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/academic-year"
        element={
          <ProtectedRoute>
            {canAccessSettings(role) ? <AcademicYear /> : <Navigate to={getDefaultRouteForRole(role)} replace />}
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/seat-matrix"
        element={
          <ProtectedRoute>
            {canAccessSettings(role) ? <SeatMatrix /> : <Navigate to={getDefaultRouteForRole(role)} replace />}
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/document-master"
        element={
          <ProtectedRoute>
            {canAccessSettings(role) ? <DocumentMaster /> : <Navigate to={getDefaultRouteForRole(role)} replace />}
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            {canAccessSettings(role) ? <UserManagement /> : <Navigate to={getDefaultRouteForRole(role)} replace />}
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to={authenticated ? getDefaultRouteForRole(role) : '/login'} replace />} />
    </Routes>
  )
}
