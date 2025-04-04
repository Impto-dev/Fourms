const passwordPolicy = (req, res, next) => {
  const { password } = req.body;

  if (!password) {
    return next();
  }

  // Password requirements
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const hasNoSpaces = !/\s/.test(password);

  const errors = [];

  if (password.length < minLength) {
    errors.push(`Password must be at least ${minLength} characters long`);
  }
  if (!hasUpperCase) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!hasLowerCase) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!hasNumbers) {
    errors.push('Password must contain at least one number');
  }
  if (!hasSpecialChar) {
    errors.push('Password must contain at least one special character');
  }
  if (!hasNoSpaces) {
    errors.push('Password cannot contain spaces');
  }

  // Check for common passwords
  const commonPasswords = [
    'password', '123456', 'qwerty', 'admin', 'welcome',
    'letmein', 'monkey', 'dragon', 'baseball', 'football'
  ];
  
  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push('Password is too common and easily guessable');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Password does not meet requirements',
      errors
    });
  }

  next();
};

module.exports = passwordPolicy; 