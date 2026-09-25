import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { NotificationBanner } from './components/common/NotificationBanner';
import { AppLayout } from './components/layout/AppLayout';
import { GuestRoute, ProtectedRoute } from './components/routing/ProtectedRoute';

import { LandingPage } from './pages/public/LandingPage';
import { LoginPage } from './pages/public/LoginPage';
import { RegisterPage } from './pages/public/RegisterPage';
import { OnboardingPage } from './pages/public/OnboardingPage';
import { NotFoundPage } from './pages/public/NotFoundPage';
import { ProfilePage } from './pages/shared/ProfilePage';

import { DashboardPage } from './pages/student/DashboardPage';
import { SubjectsPage } from './pages/student/SubjectsPage';
import { SubjectPage } from './pages/student/SubjectPage';
import { ChapterPage } from './pages/student/ChapterPage';
import { LessonPage } from './pages/student/LessonPage';
import { QuizPage } from './pages/student/QuizPage';
import { PendingResultPage, ResultPage } from './pages/student/ResultPage';
import { ForYouPage } from './pages/student/ForYouPage';
import { ProgressPage } from './pages/student/ProgressPage';
import { BadgesPage } from './pages/student/BadgesPage';
import { LeaderboardPage } from './pages/student/LeaderboardPage';
import { DownloadsPage } from './pages/student/DownloadsPage';

import { LoadingState } from './components/ui';

// Teacher and admin screens are online-only, so they are split out of the student bundle.
const named = (loader, name) => lazy(() => loader().then((m) => ({ default: m[name] })));
const TeacherDashboardPage = named(() => import('./pages/teacher/TeacherDashboardPage'), 'TeacherDashboardPage');
const StudentsPage = named(() => import('./pages/teacher/StudentsPage'), 'StudentsPage');
const StudentDetailPage = named(() => import('./pages/teacher/StudentDetailPage'), 'StudentDetailPage');
const WeakTopicsPage = named(() => import('./pages/teacher/WeakTopicsPage'), 'WeakTopicsPage');
const AssignmentsPage = named(() => import('./pages/teacher/AssignmentsPage'), 'AssignmentsPage');
const AdminDashboardPage = named(() => import('./pages/admin/AdminDashboardPage'), 'AdminDashboardPage');
const UsersPage = named(() => import('./pages/admin/UsersPage'), 'UsersPage');
const ContentPage = named(() => import('./pages/admin/ContentPage'), 'ContentPage');
const QuizEditorPage = named(() => import('./pages/admin/QuizEditorPage'), 'QuizEditorPage');

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Suspense fallback={<div className="p-8"><LoadingState rows={2} /></div>}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route element={<GuestRoute />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Route>

          <Route element={<ProtectedRoute role="STUDENT" allowUnonboarded />}>
            <Route path="/onboarding" element={<OnboardingPage />} />
          </Route>

          <Route path="/student" element={<ProtectedRoute role="STUDENT" />}>
            <Route element={<AppLayout />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="subjects" element={<SubjectsPage />} />
              <Route path="subjects/:subjectId" element={<SubjectPage />} />
              <Route path="chapters/:chapterId" element={<ChapterPage />} />
              <Route path="lessons/:lessonId" element={<LessonPage />} />
              <Route path="quiz/:quizId" element={<QuizPage />} />
              <Route path="results" element={<Navigate to="/student/progress" replace />} />
              <Route path="results/:attemptId" element={<ResultPage />} />
              <Route path="results/pending/:clientAttemptId" element={<PendingResultPage />} />
              <Route path="for-you" element={<ForYouPage />} />
              <Route path="progress" element={<ProgressPage />} />
              <Route path="badges" element={<BadgesPage />} />
              <Route path="leaderboard" element={<LeaderboardPage />} />
              <Route path="downloads" element={<DownloadsPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Route>

          <Route path="/teacher" element={<ProtectedRoute role="TEACHER" />}>
            <Route element={<AppLayout />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<TeacherDashboardPage />} />
              <Route path="students" element={<StudentsPage />} />
              <Route path="students/:studentId" element={<StudentDetailPage />} />
              <Route path="weak-topics" element={<WeakTopicsPage />} />
              <Route path="assignments" element={<AssignmentsPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Route>

          <Route path="/admin" element={<ProtectedRoute role="ADMIN" />}>
            <Route element={<AppLayout />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboardPage />} />
              <Route path="users" element={<UsersPage />} />
              <Route path="content" element={<ContentPage />} />
              <Route path="quizzes/:quizId" element={<QuizEditorPage />} />
              <Route path="profile" element={<ProfilePage />} />
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
