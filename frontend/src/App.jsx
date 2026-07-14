import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { Toaster } from 'react-hot-toast';

// Layouts
import AuthLayout from './layouts/AuthLayout';
import DashboardLayout from './layouts/DashboardLayout';

// Guard
import ProtectedRoute from './routes/ProtectedRoute';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import OTPVerification from './pages/OTPVerification';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import MyTasks from './pages/MyTasks';
import Performance from './pages/Performance';
import Reports from './pages/Reports';
import Admin from './pages/Admin';
import Profile from './pages/Profile';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SocketProvider>
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Toaster position="top-right" reverseOrder={false} />
            <Routes>
              
              {/* Public Auth Routes */}
              <Route element={<AuthLayout />}>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/otp-verify" element={<OTPVerification />} />
              </Route>

              {/* Protected Workspace Routes */}
              <Route element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }>
                <Route path="/dashboard" element={<Dashboard />} />
                
                {/* Manager Task board */}
                <Route path="/tasks" element={
                  <ProtectedRoute allowedRoles={['Manager']}>
                    <Tasks />
                  </ProtectedRoute>
                } />

                {/* Employee only tasks checklist */}
                <Route path="/my-tasks" element={
                  <ProtectedRoute allowedRoles={['Employee']}>
                    <MyTasks />
                  </ProtectedRoute>
                } />

                <Route path="/performance" element={<Performance />} />
                
                <Route path="/reports" element={
                  <ProtectedRoute allowedRoles={['Admin', 'Manager']}>
                    <Reports />
                  </ProtectedRoute>
                } />

                <Route path="/admin" element={
                  <ProtectedRoute allowedRoles={['Admin']}>
                    <Admin />
                  </ProtectedRoute>
                } />

                <Route path="/profile" element={<Profile />} />
              </Route>

              {/* Fallback Catch */}
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </BrowserRouter>
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
