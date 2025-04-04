const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const crypto = require('crypto');

class TwoFactorService {
  constructor() {
    this.secretLength = 32;
    this.algorithm = 'sha1';
    this.digits = 6;
    this.step = 30;
    this.window = 1;
  }

  // Generate a new 2FA secret
  generateSecret() {
    return speakeasy.generateSecret({
      length: this.secretLength,
      name: 'Forum App',
      issuer: 'Forum App'
    });
  }

  // Generate QR code for the secret
  async generateQRCode(secret) {
    try {
      return await QRCode.toDataURL(secret.otpauth_url);
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw new Error('Failed to generate QR code');
    }
  }

  // Verify a 2FA token
  verifyToken(secret, token) {
    return speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: token,
      algorithm: this.algorithm,
      digits: this.digits,
      step: this.step,
      window: this.window
    });
  }

  // Generate backup codes
  generateBackupCodes(count = 5) {
    const codes = [];
    for (let i = 0; i < count; i++) {
      codes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
    }
    return codes;
  }

  // Verify backup code
  verifyBackupCode(backupCodes, code) {
    const index = backupCodes.indexOf(code);
    if (index !== -1) {
      backupCodes.splice(index, 1);
      return true;
    }
    return false;
  }

  // Check if 2FA is required for the user
  is2FARequired(user) {
    return user.twoFactorEnabled && user.twoFactorSecret;
  }

  // Generate a recovery token
  generateRecoveryToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  // Hash a recovery token
  hashRecoveryToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  // Verify a recovery token
  verifyRecoveryToken(hashedToken, token) {
    return hashedToken === this.hashRecoveryToken(token);
  }
}

module.exports = new TwoFactorService(); 