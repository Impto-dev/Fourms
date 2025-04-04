const User = require('../models/User');
const Thread = require('../models/Thread');
const Post = require('../models/Post');
const { catchAsync } = require('../utils/helpers');
const DiscordService = require('../services/discordService');
const contentFilterService = require('../services/contentFilterService');
const { asyncHandler } = require('../middleware/error');

const discordService = new DiscordService(process.env.DISCORD_WEBHOOK_URL);

// Ban a user
exports.banUser = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const { reason, duration } = req.body;

  const banExpires = duration ? new Date(Date.now() + duration * 24 * 60 * 60 * 1000) : null;

  const user = await User.findByIdAndUpdate(
    userId,
    {
      isBanned: true,
      banReason: reason,
      banExpires
    },
    { new: true }
  );

  // Send Discord notification
  await discordService.sendUserBanned(user, reason, duration);

  res.status(200).json({
    status: 'success',
    data: user
  });
});

// Unban a user
exports.unbanUser = catchAsync(async (req, res) => {
  const { userId } = req.params;

  const user = await User.findByIdAndUpdate(
    userId,
    {
      isBanned: false,
      banReason: null,
      banExpires: null
    },
    { new: true }
  );

  res.status(200).json({
    status: 'success',
    data: user
  });
});

// Get reported content
exports.getReportedContent = catchAsync(async (req, res) => {
  const { type } = req.query;
  let reportedContent;

  if (type === 'threads') {
    reportedContent = await Thread.find({ reportedCount: { $gt: 0 } })
      .sort('-reportedCount')
      .populate('author', 'username');
  } else if (type === 'posts') {
    reportedContent = await Post.find({ reportedCount: { $gt: 0 } })
      .sort('-reportedCount')
      .populate('author', 'username');
  } else {
    reportedContent = await User.find({ reportedCount: { $gt: 0 } })
      .sort('-reportedCount');
  }

  res.status(200).json({
    status: 'success',
    data: reportedContent
  });
});

// Delete content
exports.deleteContent = catchAsync(async (req, res) => {
  const { type, id } = req.params;

  if (type === 'thread') {
    await Thread.findByIdAndDelete(id);
  } else if (type === 'post') {
    await Post.findByIdAndDelete(id);
  }

  res.status(204).json({
    status: 'success',
    data: null
  });
});

// Report content
exports.reportContent = catchAsync(async (req, res) => {
  const { type, id } = req.params;
  const { reason } = req.body;

  let content;
  if (type === 'thread') {
    content = await Thread.findById(id);
    await Thread.findByIdAndUpdate(id, {
      $inc: { reportedCount: 1 },
      $push: { reports: { reason, reportedBy: req.user._id } }
    });
  } else if (type === 'post') {
    content = await Post.findById(id);
    await Post.findByIdAndUpdate(id, {
      $inc: { reportedCount: 1 },
      $push: { reports: { reason, reportedBy: req.user._id } }
    });
  } else if (type === 'user') {
    content = await User.findById(id);
    await User.findByIdAndUpdate(id, {
      $inc: { reportedCount: 1 }
    });
  }

  // Send Discord notification
  await discordService.sendContentReported(
    { type, id: content._id },
    req.user,
    reason
  );

  res.status(200).json({
    status: 'success',
    message: 'Content reported successfully'
  });
});

const moderationController = {
  analyzeContent: asyncHandler(async (req, res) => {
    const { content } = req.body;
    const analysis = await contentFilterService.analyzeContent(content);
    res.json(analysis);
  }),

  getModerationQueue: asyncHandler(async (req, res) => {
    const queue = await contentFilterService.getModerationQueue();
    res.json(queue);
  }),

  bulkModerate: asyncHandler(async (req, res) => {
    const { contentIds, action } = req.body;
    const moderatorId = req.user._id;

    if (!contentIds || !action) {
      return res.status(400).json({ error: 'Content IDs and action are required' });
    }

    const results = await contentFilterService.bulkModerateContent(
      contentIds,
      action,
      moderatorId
    );

    res.json(results);
  }),

  moderateThread: asyncHandler(async (req, res) => {
    const { threadId } = req.params;
    const { action } = req.body;
    const moderatorId = req.user._id;

    const thread = await Thread.findById(threadId);
    if (!thread) {
      return res.status(404).json({ error: 'Thread not found' });
    }

    const result = await contentFilterService.moderateThread(
      thread,
      action,
      moderatorId
    );

    res.json(result);
  }),

  moderatePost: asyncHandler(async (req, res) => {
    const { postId } = req.params;
    const { action } = req.body;
    const moderatorId = req.user._id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const result = await contentFilterService.moderatePost(
      post,
      action,
      moderatorId
    );

    res.json(result);
  }),

  getModerationStats: asyncHandler(async (req, res) => {
    const [threadStats, postStats] = await Promise.all([
      Thread.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]),
      Post.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    res.json({
      threads: threadStats,
      posts: postStats
    });
  })
};

module.exports = moderationController; 