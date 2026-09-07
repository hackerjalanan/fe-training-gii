import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.js';
import AppLayout from './components/auth/AppLayout.jsx';
import ProtectedRoute from './components/auth/ProtectedRoute.jsx';
import Dashboard from './pages/dashboard/DashboardPage.jsx';
import StatistikTraining from './pages/dashboard/StatistikTraining.jsx';
import Statisticsparticipant from './pages/dashboard/StatisticParticipant.jsx';
import StatisticTrainer from './pages/dashboard/StatisticTrainer.jsx';
import ReportType from './pages/report_type/ReportTypePage.jsx';
import StatisticReport from './pages/dashboard/StatisticReport.jsx';
import Login from './pages/auth/Login.jsx';
import Respass from './pages/auth/resetPassword.jsx';
import NotFound from './pages/auth/NotFound.jsx';
import Forbidden from './pages/auth/Forbidden.jsx';
import './App.css';
import './tailwind.css';

//staff
import Staff from './pages/staff/StaffPage.jsx';

//training
import Training from './pages/training/TrainingPage.jsx';
import TrainingParticipant from './pages/training/participant/TrainingParticipant.jsx';
import TrainingSchedule from './pages/training/schedule-meeting/MeetingPage';
import TrainingScheduleReport from './pages/training/schedule-report/ScheduleReportPage.jsx';
import Presensi from './pages/presensi/TrainingPage.jsx';
import PresensiFormn from './pages/presensi/PresensiForm.jsx';

//participant
import Participants from './pages/participant/ParticipantPage.jsx';

// report
import Reports from './pages/report/ReportsPage.jsx';
import ReportInbox from './pages/report/ReportInbox.jsx';

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/reset-password" element={<Respass />} />
          <Route path="/forbidden" element={<Forbidden />} />

          <Route 
            path="/dashboard/training" 
            element={
              <ProtectedRoute requiredRole={['Supervisor', 'Direktur', 'Manager', 'Trainer', 'Admin'] }>
                <AppLayout>
                  <StatistikTraining />
                </AppLayout>
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/training/participant" 
            element={
              <ProtectedRoute requiredRole={['Supervisor', 'Direktur', 'Manager', 'Trainer', 'Admin'] }>
                <AppLayout>
                  <TrainingParticipant />
                </AppLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/training/schedule" 
            element={
              <ProtectedRoute requiredRole={['Supervisor', 'Direktur', 'Manager', 'Trainer', 'Admin'] }>
                <AppLayout>
                  <TrainingSchedule />
                </AppLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/training/schedule-report" 
            element={
              <ProtectedRoute requiredRole={['Supervisor', 'Direktur', 'Manager', 'Trainer' ,'Admin'] }>
                <AppLayout>
                  <TrainingScheduleReport />
                </AppLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/presensi" 
            element={
              <ProtectedRoute requiredRole={['Supervisor', 'Direktur', 'Manager', 'Trainer' ,'Admin'] }>
                <AppLayout>
                  <Presensi />
                </AppLayout>
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/presensi/form" 
            element={
              <ProtectedRoute requiredRole={['Trainer' ] }>
                <AppLayout>
                  <PresensiFormn />
                </AppLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/report" 
            element={
              <ProtectedRoute requiredRole={['Supervisor', 'Direktur', 'Manager', 'Trainer', ' Admin'] }>
                <AppLayout>
                  <StatisticReport />
                </AppLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/participant" 
            element={
              <ProtectedRoute requiredRole={['Supervisor', 'Direktur', 'Manager', 'Trainer','Admin'] }>
                <AppLayout>
                  <Statisticsparticipant />
                </AppLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="dashboard/trainer" 
            element={
              <ProtectedRoute requiredRole={['Supervisor', 'Direktur', 'Manager', 'Trainer'] }>
                <AppLayout>
                  <StatisticTrainer />
                </AppLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute requiredRole={['Supervisor', 'Direktur', 'Manager', 'Trainer','Admin'] }>
                <AppLayout>
                  <Dashboard />
                </AppLayout>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/reports" 
            element={
              <ProtectedRoute requiredRole={[ 'Trainer'] }>
                <AppLayout>
                  <Reports />
                </AppLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/reports/inbox" 
            element={
              <ProtectedRoute requiredRole={['Supervisor', 'Direktur', 'Manager' ,'Admin'] }>
                <AppLayout>
                  <ReportInbox />
                </AppLayout>
              </ProtectedRoute>
            } 
          />


          <Route 
            path="/training" 
            element={
              <ProtectedRoute requiredRole={['Supervisor','Trainer', 'Direktur', 'Manager' ,'Admin'] }>
                <AppLayout>
                  <Training />
                </AppLayout>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/participants" 
            element={
              <ProtectedRoute requiredRole={ ['Supervisor', 'Direktur', 'Manager', 'Trainer','Admin'] }>
                <AppLayout>
                  <Participants />
                </AppLayout>
              </ProtectedRoute>
            } 
          />
          


          {/* stafff route */}
          <Route 
            path="/staff" 
            element={
              <ProtectedRoute requiredRole={['Supervisor', 'Direktur', 'Manager']}>
                <AppLayout>
                  <Staff />
                </AppLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/report-type" 
            element={
              <ProtectedRoute requiredRole={['Supervisor']}>
                <AppLayout>
                  <ReportType />
                </AppLayout>
              </ProtectedRoute>
            } 
          />
          
          {/* Redirect root to dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          
          {/* 404 page */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;