/**
 * LegacyScreenRoute — temporary wrapper that hosts the existing prototype screens
 * inside the new router. Existing screens still depend on `useApp().activeTab` /
 * `setActiveTab` to switch tabs; we sync the URL to that state so navigation works.
 *
 * Once each screen is migrated to React Router natively, this file goes away.
 */
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';

const TAB_TO_PATH = {
  dashboard:     '/student/dashboard',
  courses:       '/student/subjects',
  lesson:        '/student/lesson',
  quiz:          '/student/quiz',
  achievements:  '/student/badges',
  leaderboard:   '/student/leaderboard',
  profile:       '/student/profile',
  teacher:       '/teacher/dashboard',
};

const PATH_TO_TAB = Object.fromEntries(Object.entries(TAB_TO_PATH).map(([k, v]) => [v, k]));

export const LegacyScreenRoute = ({ tab, children }) => {
  const { activeTab, setActiveTab } = useApp();
  const location = useLocation();
  const navigate = useNavigate();

  // Sync URL � activeTab
  useEffect(() => {
    const tabForUrl = PATH_TO_TAB[location.pathname];
    if (tabForUrl && tabForUrl !== activeTab) {
      setActiveTab(tabForUrl);
    } else if (!tabForUrl && activeTab !== tab) {
      // Direct deep-link without a known tab path: drive to the requested one.
      setActiveTab(tab);
    }
  }, [location.pathname]);

  // When the screen requests navigation, follow it.
  useEffect(() => {
    const path = TAB_TO_PATH[activeTab];
    if (path && location.pathname !== path && !location.pathname.startsWith('/student/lesson') && !location.pathname.startsWith('/student/quiz')) {
      navigate(path, { replace: true });
    }
  }, [activeTab]);

  return children;
};
