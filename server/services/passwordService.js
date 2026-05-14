const bcrypt = require('bcryptjs');
const { PASSWORD_STRENGTH } = require('../constants');

const PASSWORD_RULES = {
  minLength: 8,
  requireUppercase: true,
  requireNumber: true,
  requireSpecial: true,
};

const checkPasswordStrength = (password) => {
  let strength = 0;
  const rules = [];

  if (password.length >= 8) { strength += 1; rules.push('min8chars'); }
  if (password.length >= 12) { strength += 1; rules.push('min12chars'); }
  if (/[A-Z]/.test(password)) { strength += 1; rules.push('uppercase'); }
  if (/[0-9]/.test(password)) { strength += 1; rules.push('number'); }
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) { strength += 1; rules.push('special'); }

  let level = PASSWORD_STRENGTH.WEAK;
  if (strength >= 4) level = PASSWORD_STRENGTH.STRONG;
  else if (strength >= 3) level = PASSWORD_STRENGTH.GOOD;
  else if (strength >= 2) level = PASSWORD_STRENGTH.FAIR;

  return { level, strength: Math.round((strength / 5) * 100), rules };
};

const validatePassword = (password) => {
  const errors = [];
  if (password.length < PASSWORD_RULES.minLength) errors.push(`Min ${PASSWORD_RULES.minLength} characters`);
  if (PASSWORD_RULES.requireUppercase && !/[A-Z]/.test(password)) errors.push('Uppercase letter required');
  if (PASSWORD_RULES.requireNumber && !/[0-9]/.test(password)) errors.push('Number required');
  if (PASSWORD_RULES.requireSpecial && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) errors.push('Special character required');
  return { valid: errors.length === 0, errors };
};

const hashPassword = async (password) => bcrypt.hash(password, 12);

const comparePassword = async (password, hash) => bcrypt.compare(password, hash);

module.exports = {
  checkPasswordStrength,
  validatePassword,
  hashPassword,
  comparePassword,
};
