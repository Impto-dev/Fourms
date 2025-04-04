const User = require('../models/User');
const twoFactorService = require('../services/twoFactorService');
const { sendEmail } = require('../services/emailService');

const twoFactorController = {
  // Generate 2FA secret and QR code
  async setup2FA(req, res) {
    try {
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      if (user.twoFactorEnabled) {
        return res.status(400).json({ message: '2FA is already enabled' });
      }

      const secret = twoFactorService.generateSecret();
      const qrCode = await twoFactorService.generateQRCode(secret);
      const backupCodes = twoFactorService.generateBackupCodes();

      // Save the secret and backup codes
      user.twoFactorSecret = secret.base32;
      user.twoFactorBackupCodes = backupCodes;
      await user.save();

      res.json({
        secret: secret.base32,
        qrCode,
        backupCodes
      });
    } catch (error) {
      console.error('Error setting up 2FA:', error);
      res.status(500).json({ message: 'Error setting up 2FA' });
    }
  },

  // Verify and enable 2FA
  async verifyAndEnable2FA(req, res) {
    try {
      const { token } = req.body;
      const user = await User.findById(req.user.id);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      if (user.twoFactorEnabled) {
        return res.status(400).json({ message: '2FA is already enabled' });
      }

      const isValid = twoFactorService.verifyToken(user.twoFactorSecret, token);
      if (!isValid) {
        return res.status(400).json({ message: 'Invalid 2FA token' });
      }

      user.twoFactorEnabled = true;
      await user.save();

      res.json({ message: '2FA enabled successfully' });
    } catch (error) {
      console.error('Error verifying 2FA:', error);
      res.status(500).json({ message: 'Error verifying 2FA' });
    }
  },

  // Disable 2FA
  async disable2FA(req, res) {
    try {
      const { token } = req.body;
      const user = await User.findById(req.user.id);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      if (!user.twoFactorEnabled) {
        return res.status(400).json({ message: '2FA is not enabled' });
      }

      const isValid = twoFactorService.verifyToken(user.twoFactorSecret, token);
      if (!isValid) {
        return res.status(400).json({ message: 'Invalid 2FA token' });
      }

      user.twoFactorEnabled = false;
      user.twoFactorSecret = null;
      user.twoFactorBackupCodes = [];
      await user.save();

      res.json({ message: '2FA disabled successfully' });
    } catch (error) {
      console.error('Error disabling 2FA:', error);
      res.status(500).json({ message: 'Error disabling 2FA' });
    }
  },

  // Verify 2FA token during login
  async verify2FAToken(req, res) {
    try {
      const { token, backupCode } = req.body;
      const user = await User.findById(req.user.id).select('+twoFactorSecret +twoFactorBackupCodes');
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      if (!user.twoFactorEnabled) {
        return res.status(400).json({ message: '2FA is not enabled' });
      }

      let isValid = false;
      if (backupCode) {
        isValid = twoFactorService.verifyBackupCode(user.twoFactorBackupCodes, backupCode);
        if (isValid) {
          await user.save(); // Save to persist backup code removal
        }
      } else {
        isValid = twoFactorService.verifyToken(user.twoFactorSecret, token);
      }

      if (!isValid) {
        return res.status(400).json({ message: 'Invalid 2FA token or backup code' });
      }

      // Generate final auth token
      const authToken = user.generateAuthToken();
      res.json({ token: authToken });
    } catch (error) {
      console.error('Error verifying 2FA token:', error);
      res.status(500).json({ message: 'Error verifying 2FA token' });
    }
  },

  // Generate new backup codes
  async generateNewBackupCodes(req, res) {
    try {
      const { token } = req.body;
      const user = await User.findById(req.user.id).select('+twoFactorSecret');
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      if (!user.twoFactorEnabled) {
        return res.status(400).json({ message: '2FA is not enabled' });
      }

      const isValid = twoFactorService.verifyToken(user.twoFactorSecret, token);
      if (!isValid) {
        return res.status(400).json({ message: 'Invalid 2FA token' });
      }

      const backupCodes = twoFactorService.generateBackupCodes();
      user.twoFactorBackupCodes = backupCodes;
      await user.save();

      res.json({ backupCodes });
    } catch (error) {
      console.error('Error generating backup codes:', error);
      res.status(500).json({ message: 'Error generating backup codes' });
    }
  },

  // Generate recovery token
  async generateRecoveryToken(req, res) {
    try {
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const recoveryToken = twoFactorService.generateRecoveryToken();
      user.twoFactorRecoveryToken = twoFactorService.hashRecoveryToken(recoveryToken);
      await user.save();

      // Send recovery token via email
      await sendEmail({
        to: user.email,
        subject: '2FA Recovery Token',
        text: `Your 2FA recovery token is: ${recoveryToken}\n\nThis token can be used to recover your account if you lose access to your 2FA device.`
      });

      res.json({ message: 'Recovery token sent to your email' });
    } catch (error) {
      console.error('Error generating recovery token:', error);
      res.status(500).json({ message: 'Error generating recovery token' });
    }
  },

  // Verify recovery token
  async verifyRecoveryToken(req, res) {
    try {
      const { recoveryToken } = req.body;
      const user = await User.findById(req.user.id).select('+twoFactorRecoveryToken');
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      if (!user.twoFactorRecoveryToken) {
        return res.status(400).json({ message: 'No recovery token found' });
      }

      const isValid = twoFactorService.verifyRecoveryToken(user.twoFactorRecoveryToken, recoveryToken);
      if (!isValid) {
        return res.status(400).json({ message: 'Invalid recovery token' });
      }

      // Disable 2FA and clear recovery token
      user.twoFactorEnabled = false;
      user.twoFactorSecret = null;
      user.twoFactorBackupCodes = [];
      user.twoFactorRecoveryToken = null;
      await user.save();

      res.json({ message: '2FA disabled successfully using recovery token' });
    } catch (error) {
      console.error('Error verifying recovery token:', error);
      res.status(500).json({ message: 'Error verifying recovery token' });
    }
  }
};

module.exports = twoFactorController; 