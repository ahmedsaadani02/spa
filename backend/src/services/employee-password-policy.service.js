const employeeSimplePasswordMessage = 'Le mot de passe doit contenir au moins 4 caract\u00e8res.';
const otherRolePasswordMessage = 'Le mot de passe doit respecter la politique de s\u00e9curit\u00e9 existante.';

const validateEmployeeAccountPassword = (password, role) => {
  if (typeof password !== 'string') {
    return {
      ok: false,
      message: role === 'employee' ? employeeSimplePasswordMessage : otherRolePasswordMessage
    };
  }

  const normalizedPassword = password.trim();
  if (role === 'employee') {
    return normalizedPassword.length >= 4
      ? { ok: true }
      : { ok: false, message: employeeSimplePasswordMessage };
  }

  if (normalizedPassword.length < 8) {
    return { ok: false, message: otherRolePasswordMessage };
  }

  if (!/[A-Z]/.test(normalizedPassword)) {
    return { ok: false, message: otherRolePasswordMessage };
  }

  if (!/[a-z]/.test(normalizedPassword)) {
    return { ok: false, message: otherRolePasswordMessage };
  }

  if (!/[0-9]/.test(normalizedPassword)) {
    return { ok: false, message: otherRolePasswordMessage };
  }

  if (!/[^A-Za-z0-9]/.test(normalizedPassword)) {
    return { ok: false, message: otherRolePasswordMessage };
  }

  return { ok: true };
};

module.exports = {
  employeeSimplePasswordMessage,
  otherRolePasswordMessage,
  validateEmployeeAccountPassword
};
