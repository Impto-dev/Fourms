const nodemailer = require('nodemailer');
const { Notification } = require('../models/Notification');

class NotificationService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  async sendEmailNotification(user, subject, message) {
    try {
      await this.transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: user.email,
        subject,
        html: message,
      });

      // Save notification to database
      await Notification.create({
        userId: user._id,
        type: 'email',
        title: subject,
        message,
        read: false,
      });

      return true;
    } catch (error) {
      console.error('Error sending email notification:', error);
      return false;
    }
  }

  async sendThreadNotification(thread, action, user) {
    const subject = `Thread Update: ${thread.title}`;
    const message = `
      <h2>${thread.title}</h2>
      <p>${user.username} ${action} the thread.</p>
      <p>Click <a href="${process.env.CLIENT_URL}/thread/${thread._id}">here</a> to view the thread.</p>
    `;

    return this.sendEmailNotification(user, subject, message);
  }

  async sendReplyNotification(thread, reply, user) {
    const subject = `New Reply: ${thread.title}`;
    const message = `
      <h2>${thread.title}</h2>
      <p>${user.username} replied to the thread.</p>
      <p>${reply.content}</p>
      <p>Click <a href="${process.env.CLIENT_URL}/thread/${thread._id}">here</a> to view the reply.</p>
    `;

    return this.sendEmailNotification(user, subject, message);
  }

  async sendMentionNotification(mentionedUser, thread, reply, user) {
    const subject = `You were mentioned in: ${thread.title}`;
    const message = `
      <h2>${thread.title}</h2>
      <p>${user.username} mentioned you in a reply.</p>
      <p>${reply.content}</p>
      <p>Click <a href="${process.env.CLIENT_URL}/thread/${thread._id}">here</a> to view the reply.</p>
    `;

    return this.sendEmailNotification(mentionedUser, subject, message);
  }

  async markNotificationAsRead(notificationId, userId) {
    return Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { read: true },
      { new: true }
    );
  }

  async markAllNotificationsAsRead(userId) {
    return Notification.updateMany(
      { userId, read: false },
      { read: true }
    );
  }

  async getUnreadNotifications(userId) {
    return Notification.find({
      userId,
      read: false,
    }).sort({ createdAt: -1 });
  }

  async getAllNotifications(userId, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    return Notification.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
  }
}

module.exports = new NotificationService(); 