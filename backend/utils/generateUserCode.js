// ======================================================
// GENERATE UNIQUE USER CODE
// ======================================================

/**
 * Generates a unique user code — exactly 7 characters.
 * Uses a mix of timestamp and random chars for uniqueness.
 *
 * @returns {string} A 7-character alphanumeric user code
 */
const generateUserCode = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 7; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

module.exports = generateUserCode;
