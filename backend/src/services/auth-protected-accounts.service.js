const PROTECTED_ACCOUNT_EMAILS = Object.freeze([
  'ahmedsaadani02@gmail.com',
  'saadani.karim@planet.tn'
]);

const normalizeEmail = (value) => (typeof value === 'string' ? value.trim().toLowerCase() : '');

const isProtectedEmail = (value) => PROTECTED_ACCOUNT_EMAILS.includes(normalizeEmail(value));

const PROTECTED_ACCOUNTS = Object.freeze([
  {
    id: 'protected-developer',
    nom: 'Developpeur',
    email: 'ahmedsaadani02@gmail.com',
    username: 'developer',
    role: 'developer'
  },
  {
    id: 'protected-owner',
    nom: 'Chef Entreprise',
    email: 'saadani.karim@planet.tn',
    username: 'owner',
    role: 'owner'
  }
]);

module.exports = {
  PROTECTED_ACCOUNT_EMAILS,
  PROTECTED_ACCOUNTS,
  normalizeEmail,
  isProtectedEmail
};
