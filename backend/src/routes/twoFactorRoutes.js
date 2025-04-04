const express = require('express');
const router = express.Router();
const twoFactorController = require('../controllers/twoFactorController');
const auth = require('../middleware/auth');
const {
  setup2FALimiter,
  verify2FALimiter,
  backupCodesLimiter,
  recoveryTokenLimiter,
  disable2FALimiter
} = require('../middleware/rateLimiter');

// 2FA setup routes
router.post('/setup', [auth, setup2FALimiter], twoFactorController.setup2FA);
router.post('/verify', [auth, verify2FALimiter], twoFactorController.verifyAndEnable2FA);
router.post('/disable', [auth, disable2FALimiter], twoFactorController.disable2FA);

// 2FA verification during login
router.post('/verify-token', [auth, verify2FALimiter], twoFactorController.verify2FAToken);

// Backup codes
router.post('/backup-codes', [auth, backupCodesLimiter], twoFactorController.generateNewBackupCodes);

// Recovery token
router.post('/recovery-token', [auth, recoveryTokenLimiter], twoFactorController.generateRecoveryToken);
router.post('/verify-recovery', [auth, recoveryTokenLimiter], twoFactorController.verifyRecoveryToken);

module.exports = router; 