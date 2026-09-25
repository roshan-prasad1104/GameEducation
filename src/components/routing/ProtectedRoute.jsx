import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { homeFor } from './roles';

const FullPageSpinner = () => (
  <div className="min-h-screen flex items-center justify-center app-canvas">
    <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
  </div>
);

/**
 * Client-side route guard (the backend enforces the same roles on every API call).
 * Students who have not finished onboarding are sent to /onboarding first.
 */
export const ProtectedRoute = ({ role, allowUnonboarded = false }) => {
  const { status, user } = useApp();
  const location = useLocation();

  if (status === 'loading') return <FullPageSpinner />;
  if (status !== 'authed' || !user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (role && user.role !== role) return <Navigate to={homeFor(user.role)} replace />;
  if (user.role === 'STUDENT' && user.onboarded === false && !allowUnonboarded) {
    return <Navigate to="/onboarding" replace />;
  }
  return <Outlet />;
};

/** Sends already signed-in users away from /login and /register. */
export const GuestRoute = () => {
  const { status, user } = useApp();
  if (status === 'loading') return <FullPageSpinner />;
  if (status === 'authed' && user) return <Navigate to={homeFor(user.role)} replace />;
  return <Outlet />;
};
