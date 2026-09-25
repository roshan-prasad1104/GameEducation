import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { NotificationBanner } from './components/common/NotificationBanner';
import { AppLayout } from './components/layout/AppLayout';
import { GuestRoute, ProtectedRoute } from './components/routing/ProtectedRoute';
import { LoadingState } from './components/ui';

// Original screens (now backed by the real API)
import { LandingPage } from './components/landing/LandingPage';
import { AuthModal } from './components/auth/AuthModal';
import { OnboardingModal } from './components/auth/OnboardingModal';
import { StudentDashboard } from './components/dashboard/StudentDashboard';
import { CourseCatalog } from './components/courses/CourseCatalog';
import { LessonView } from './components/lesson/LessonView';
import { QuizScreen } from './components/quiz/QuizScreen';
import { PendingResultScreen, ResultScreen } from './components/quiz/ResultScreen';
import { AchievementsView } from './components/achievements/AchievementsView';
import { LeaderboardView } from './components/leaderboard/LeaderboardView';
import { ProfileView } from './components/profile/ProfileView';
import { MissionsView } from './components/missions/MissionsView';

// Screens that did not exist before, built with the same design system
import { SubjectPage } from './pages/student/SubjectPage';
import { ChapterPage } from './pages/student/ChapterPage';
import { ForYouPage } from './pages/student/ForYouPage';
import { ProgressPage } from './pages/student/ProgressPage';
import { DownloadsPage } from './pages/student/DownloadsPage';
import { NotFoundPage } from './pages/public/NotFoundPage';

// Teacher and admin screens are online-only, so they are split out of the student bundle.
const named = (loader, name) => lazy(() => loader().then((m) => ({ default: m[name] })));
const TeacherDashboard = named(() => import('./components/teacher/TeacherDashboard'), 'TeacherDashboard');
const StudentDetailPage = named(() => import('./pages/teacher/StudentDetailPage'), 'StudentDetailPage');
const AdminDashboardPage = named(() => import('./pages/admin/AdminDashboardPage'), 'AdminDashboardPage');
const UsersPage = named(() => import('./pages/admin/UsersPage'), 'UsersPage');
const ContentPage = named(() => import('./pages/admin/ContentPage'), 'ContentPage');
const ClassesPage = named(() => import('./pages/admin/ClassesPage'), 'ClassesPage');
const QuizEditorPage = named(() => import('./pages/admin/QuizEditorPage'), 'QuizEditorPage');

const Landing = () => (
  <div className="min-h-screen app-canvas">
    <LandingPage />
  </div>
);

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Suspense fallback={<div className="p-8"><LoadingState rows={2} /></div>}>
          <Routes>
            {/* Public landing; sign-in / sign-up open the original dialog over it */}
            <Route path="/" element={<Landing />} />
            <Route element={<GuestRoute />}>
              <Route path="/login" element={<><Landing /><AuthModal mode="login" /></>} />
              <Route path="/register" element={<><Landing /><AuthModal mode="register" /></>} />
            </Route>
            <Route element={<ProtectedRoute role="STUDENT" allowUnonboarded />}>
              <Route path="/onboarding" element={<><Landing /><OnboardingModal /></>} />
            </Route>

            {/* Student area */}
            <Route path="/student" element={<ProtectedRoute role="STUDENT" />}>
              <Route element={<AppLayout />}>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<StudentDashboard />} />
                <Route path="subjects" element={<CourseCatalog />} />
                <Route path="subjects/:subjectId" element={<SubjectPage />} />
                <Route path="chapters/:chapterId" element={<ChapterPage />} />
                <Route path="lessons/:lessonId" element={<LessonView />} />
                <Route path="quiz/:quizId" element={<QuizScreen />} />
                <Route path="results" element={<Navigate to="/student/progress" replace />} />
                <Route path="results/:attemptId" element={<ResultScreen />} />
                <Route path="results/pending/:clientAttemptId" element={<PendingResultScreen />} />
                <Route path="missions" element={<MissionsView />} />
                <Route path="badges" element={<AchievementsView />} />
                <Route path="leaderboard" element={<LeaderboardView />} />
                <Route path="recommendations" element={<ForYouPage />} />
                <Route path="for-you" element={<Navigate to="/student/recommendations" replace />} />
                <Route path="progress" element={<ProgressPage />} />
                <Route path="downloads" element={<DownloadsPage />} />
                <Route path="profile" element={<ProfileView />} />
                <Route path="*" element={<NotFoundPage />} />
              </Route>
            </Route>

            {/* Teacher area: sidebar routes map to the original dashboard's tabs */}
            <Route path="/teacher" element={<ProtectedRoute role="TEACHER" />}>
              <Route element={<AppLayout />}>
                <Route index element={<Navigate to="dashboard" replace />} />
                {['dashboard', 'classes', 'weak-topics', 'assignments', 'reports'].map((p) => (
                  <Route key={p} path={p} element={<TeacherDashboard />} />
                ))}
                <Route path="students" element={<Navigate to="/teacher/classes" replace />} />
                <Route path="analytics" element={<Navigate to="/teacher/reports" replace />} />
                <Route path="students/:studentId" element={<StudentDetailPage />} />
                <Route path="profile" element={<ProfileView />} />
                <Route path="*" element={<NotFoundPage />} />
              </Route>
            </Route>

            {/* Admin area */}
            <Route path="/admin" element={<ProtectedRoute role="ADMIN" />}>
              <Route element={<AppLayout />}>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<AdminDashboardPage />} />
                <Route path="users" element={<UsersPage />} />
                <Route path="classes" element={<ClassesPage />} />
                <Route path="content" element={<ContentPage />} />
                {['subjects', 'chapters', 'lessons', 'quizzes'].map((p) => (
                  <Route key={p} path={p} element={<Navigate to="/admin/content" replace />} />
                ))}
                <Route path="quizzes/:quizId" element={<QuizEditorPage />} />
                <Route path="profile" element={<ProfileView />} />
                <Route path="*" element={<NotFoundPage />} />
              </Route>
            </Route>

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
        <NotificationBanner />
      </BrowserRouter>
    </AppProvider>
  );
}
