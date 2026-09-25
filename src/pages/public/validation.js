/** Reusable client-side validation (the backend re-validates everything). */
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateRegistration = (form, t) => {
  const errors = {};
  if (!form.name?.trim()) errors.name = t('validation.nameRequired');
  if (!form.email?.trim()) errors.email = t('validation.emailRequired');
  else if (!EMAIL_RE.test(form.email.trim())) errors.email = t('validation.emailInvalid');
  if (!form.password) errors.password = t('validation.passwordRequired');
  else if (form.password.length < 8) errors.password = t('validation.passwordHint');
  if (form.confirm !== undefined && form.confirm !== form.password) errors.confirm = t('validation.passwordMismatch');
  return errors;
};
