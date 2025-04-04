const axios = require('axios');

class DiscordService {
  constructor(webhookUrl) {
    this.webhookUrl = webhookUrl;
  }

  async sendMessage(embed) {
    try {
      await axios.post(this.webhookUrl, {
        embeds: [embed]
      });
    } catch (error) {
      console.error('Error sending Discord webhook:', error);
    }
  }

  // User related notifications
  async sendUserRegistration(user) {
    await this.sendMessage({
      title: 'New User Registration',
      description: `A new user has registered: ${user.username}`,
      color: 0x00ff00,
      fields: [
        {
          name: 'Username',
          value: user.username,
          inline: true
        },
        {
          name: 'Email',
          value: user.email,
          inline: true
        }
      ],
      timestamp: new Date().toISOString()
    });
  }

  // Payment related notifications
  async sendPaymentSuccess(payment) {
    await this.sendMessage({
      title: 'Payment Successful',
      description: `A payment has been processed successfully`,
      color: 0x00ff00,
      fields: [
        {
          name: 'User',
          value: payment.user.username,
          inline: true
        },
        {
          name: 'Amount',
          value: `${payment.amount} ${payment.currency}`,
          inline: true
        },
        {
          name: 'Type',
          value: payment.subscription.type,
          inline: true
        }
      ],
      timestamp: new Date().toISOString()
    });
  }

  async sendPaymentFailed(payment, error) {
    await this.sendMessage({
      title: 'Payment Failed',
      description: `A payment has failed`,
      color: 0xff0000,
      fields: [
        {
          name: 'User',
          value: payment.user.username,
          inline: true
        },
        {
          name: 'Amount',
          value: `${payment.amount} ${payment.currency}`,
          inline: true
        },
        {
          name: 'Error',
          value: error.message,
          inline: false
        }
      ],
      timestamp: new Date().toISOString()
    });
  }

  // Moderation related notifications
  async sendUserBanned(user, reason, duration) {
    await this.sendMessage({
      title: 'User Banned',
      description: `A user has been banned`,
      color: 0xff0000,
      fields: [
        {
          name: 'User',
          value: user.username,
          inline: true
        },
        {
          name: 'Reason',
          value: reason,
          inline: true
        },
        {
          name: 'Duration',
          value: duration ? `${duration} days` : 'Permanent',
          inline: true
        }
      ],
      timestamp: new Date().toISOString()
    });
  }

  async sendContentReported(content, reporter, reason) {
    await this.sendMessage({
      title: 'Content Reported',
      description: `Content has been reported`,
      color: 0xffa500,
      fields: [
        {
          name: 'Content Type',
          value: content.type,
          inline: true
        },
        {
          name: 'Reporter',
          value: reporter.username,
          inline: true
        },
        {
          name: 'Reason',
          value: reason,
          inline: false
        }
      ],
      timestamp: new Date().toISOString()
    });
  }

  // Security related notifications
  async sendSecurityAlert(event) {
    await this.sendMessage({
      title: 'Security Alert',
      description: `A security event has been detected`,
      color: 0xff0000,
      fields: [
        {
          name: 'Event Type',
          value: event.type,
          inline: true
        },
        {
          name: 'IP Address',
          value: event.ip,
          inline: true
        },
        {
          name: 'Details',
          value: event.details,
          inline: false
        }
      ],
      timestamp: new Date().toISOString()
    });
  }
}

module.exports = DiscordService; 