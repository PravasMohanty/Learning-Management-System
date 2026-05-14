const validateObjectId = (id) => /^[a-f0-9]{24}$/i.test(id);

const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const validateUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

const validatePhoneNumber = (phone) => /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/i.test(phone);

module.exports = {
  validateObjectId,
  validateEmail,
  validateUrl,
  validatePhoneNumber,
};
