/** Landing route for each role after sign-in. */
export const homeFor = (role) => ({
  STUDENT: '/student/dashboard',
  TEACHER: '/teacher/dashboard',
  ADMIN: '/admin/dashboard',
}[role] ?? '/login');
