import { UserRole } from '../models/auth.models';

const OTHER_ROLE_PASSWORD_MESSAGE = 'Le mot de passe doit respecter la politique de s\u00e9curit\u00e9 existante.';
const EMPLOYEE_SIMPLE_PASSWORD_MESSAGE = 'Le mot de passe doit contenir au moins 4 caract\u00e8res.';

export const getEmployeeAccountPasswordError = (
  password: string | null | undefined,
  role: UserRole | null | undefined,
  options: { optional?: boolean } = {}
): string | null => {
  const normalizedPassword = typeof password === 'string' ? password.trim() : '';
  if (!normalizedPassword) {
    return options.optional ? null : role === 'employee' ? EMPLOYEE_SIMPLE_PASSWORD_MESSAGE : OTHER_ROLE_PASSWORD_MESSAGE;
  }

  if (role === 'employee') {
    return normalizedPassword.length >= 4 ? null : EMPLOYEE_SIMPLE_PASSWORD_MESSAGE;
  }

  if (normalizedPassword.length < 8) {
    return OTHER_ROLE_PASSWORD_MESSAGE;
  }

  if (!/[A-Z]/.test(normalizedPassword)) {
    return OTHER_ROLE_PASSWORD_MESSAGE;
  }

  if (!/[a-z]/.test(normalizedPassword)) {
    return OTHER_ROLE_PASSWORD_MESSAGE;
  }

  if (!/[0-9]/.test(normalizedPassword)) {
    return OTHER_ROLE_PASSWORD_MESSAGE;
  }

  if (!/[^A-Za-z0-9]/.test(normalizedPassword)) {
    return OTHER_ROLE_PASSWORD_MESSAGE;
  }

  return null;
};
