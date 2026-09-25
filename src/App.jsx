import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { AppProvider } from './context/AppContext';
import { AuthModal } from './components/auth/AuthModal';
import { NotificationBanner } from './components/common/NotificationBanner';
import { AppLayout } from './components/layout/AppLayout';
import { ProtectedRoute } from './components/routing/ProtectedRoute';
import { LegacyScreenRoute } from './components/routing/LegacyScreenRoute';
import { ready } from './services/api';
import { Loader2 } from 'lucide-react';

// Existing prototype screens (will be re-platformed to React Router natives later)
import { LandingPage } from './components/landing/LandingPage';
import { StudentDashboard } from './components/dashboard/StudentDashboard';
import { CourseCatalog } from './components/courses/CourseCatalog';
import { LessonView } from './components/lesson/LessonView';
import { QuizScreen } from './components/quiz/QuizScreen';
import { AchievementsView } from './components/achievements/AchievementsView';
import { LeaderboardView } from './components/leaderboard/LeaderboardView';
import { ProfileView } from './components/profile/ProfileView';
import { TeacherDashboard } from './components/teacher/TeacherDashboard';

export default function App() {
  const [booted, setBooted] = useState(false);

  useEffect(() => {
    let mounted = true;
    ready().then(() => mounted && setBooted(true));
    return () => { mounted = false; };
  }, []);

  if (!booted) {
    return (
      <div className="min-h-screen flex items-center justify-center app-canvas">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <div className="h-10 w-10 rounded-2xl brand-gradient flex items-center justify-center text-white shadow-sm">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
          <p className="text-sm">Loading ShikshaSetu…</p>
        </div>
      </div>
    );
  }

  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          {/* Public landing */}
          <Route
            path="/"
            element={
              <div className="min-h-screen app-canvas">
                <LandingPage />
              </div>
            }
          />

          {/* Authenticated student area */}
          <Route element={<ProtectedRoute allow="student" />}>
            <Route element={<AppLayout />}>
              <Route path="/student/dashboard" element={
                <LegacyScreenRoute tab="dashboard"><StudentDashboard /></LegacyScreenRoute>
              } />
              <Route path="/student/subjects" element={
                <LegacyScreenRoute tab="courses"><CourseCatalog /></LegacyScreenRoute>
              } />
              <Route path="/student/lesson" element={
                <LegacyScreenRoute tab="lesson"><LessonView /></LegacyScreenRoute>
              } />
              <Route path="/student/quiz" element={
                <LegacyScreenRoute tab="quiz"><QuizScreen /></LegacyScreenRoute>
              } />
              <Route path="/student/badges" element={
                <LegacyScreenRoute tab="achievements"><AchievementsView /></LegacyScreenRoute>
              } />
              <Route path="/student/leaderboard" element={
                <LegacyScreenRoute tab="leaderboard"><LeaderboardView /></LegacyScreenRoute>
              } />
              <Route path="/student/profile" element={
                <LegacyScreenRoute tab="profile"><ProfileView /></LegacyScreenRoute>
              } />
              {/* Future native routes will go here */}
            </Route>
          </Route>

          {/* Authenticated teacher area */}
          <Route element={<ProtectedRoute allow="teacher" />}>
            <Route element={<AppLayout />}>
              <Route path="/teacher/dashboard" element={
                <LegacyScreenRoute tab="teacher"><TeacherDashboard /></LegacyScreenRoute>
              } />
              {/* Future teacher routes */}
            </Route>
          </Route>

          {/* Admin area (placeholder) */}
          <Route element={<ProtectedRoute allow="admin" />}>
            <Route element={<AppLayout />}>
              <Route path="/admin/dashboard" element={<AdminPlaceholder />} />
            </Route>
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        <AuthModal />
        <NotificationBanner />
      </BrowserRouter>
    </AppProvider>
  );
}

const AdminPlaceholder = () => (
  <div className="card p-8 max-w-xl">
    <h2 className="text-lg font-semibold">Admin console</h2>
    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
      Coming online after Phase 10 (Admin module). Sign in as an admin to preview.
    </p>
  </div>
);
