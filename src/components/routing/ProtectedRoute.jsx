import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Loader2 } from 'lucide-react';

/**
 * ProtectedRoute — role-based access guard.
 *
 * Uses `sessionStatus` / `sessionUser` from AppContext (backed by IndexedDB auth)
 * rather than the legacy `user` object which may be INITIAL_USER during load.
 *
 *   <Route element={<ProtectedRoute allow="student" />}>
 *     <Route path="/student/*" element={...} />
 *   </Route>
 */
export const ProtectedRoute = ({ allow }) => {
  const { sessionStatus, sessionUser } = useApp();
  const location = useLocation();

  // While the session is resolving from IndexedDB, show a spinner.
  if (sessionStatus === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center app-canvas">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
      </div>
    );
  }

  // Not authenticated — redirect to landing (which surfaces the login modal).
  if (sessionStatus === 'anon' || !sessionUser) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  // Authenticated but wrong role — redirect to their own dashboard.
  if (allow && sessionUser.role !== allow) {
    return <Navigate to={dashboardFor(sessionUser.role)} replace />;
  }

  // Render the child routes via Outlet (replaces the old `return null` pattern).
  return <Outlet />;
};

const dashboardFor = (role) =>
  role === 'teacher' ? '/teacher/dashboard'
  : role === 'admin'  ? '/admin/dashboard'
  : '/student/dashboard';
