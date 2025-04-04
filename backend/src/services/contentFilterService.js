const { Thread, Post, User } = require('../models');
const redis = require('../config/redis');
const natural = require('natural');
const { BadWordsFilter } = require('bad-words');

class ContentFilterService {
  constructor() {
    this.tokenizer = new natural.WordTokenizer();
    this.tfidf = new natural.TfIdf();
    this.badWordsFilter = new BadWordsFilter();
    this.redis = redis;
  }

  async analyzeContent(content) {
    const tokens = this.tokenizer.tokenize(content.toLowerCase());
    const analysis = {
      hasBadWords: this.badWordsFilter.isProfane(content),
      wordCount: tokens.length,
      uniqueWords: new Set(tokens).size,
      sentiment: this.analyzeSentiment(content),
      spamScore: await this.calculateSpamScore(content),
      toxicityScore: await this.calculateToxicityScore(content)
    };

    return analysis;
  }

  analyzeSentiment(content) {
    const analyzer = new natural.SentimentAnalyzer('English', natural.PorterStemmer, 'afinn');
    const tokens = this.tokenizer.tokenize(content);
    return analyzer.getSentiment(tokens);
  }

  async calculateSpamScore(content) {
    // Check against common spam patterns
    const spamPatterns = [
      /http[s]?:\/\/[^\s]+/g, // URLs
      /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/g, // Email addresses
      /[0-9]{10,}/g, // Long number sequences
      /\b(?:free|win|prize|click|offer|limited)\b/gi // Common spam words
    ];

    let score = 0;
    spamPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) score += matches.length;
    });

    return Math.min(score / 5, 1); // Normalize score between 0 and 1
  }

  async calculateToxicityScore(content) {
    // This would typically call an external API for toxicity analysis
    // For now, using a simple implementation based on bad words and sentiment
    const hasBadWords = this.badWordsFilter.isProfane(content);
    const sentiment = this.analyzeSentiment(content);
    
    let score = 0;
    if (hasBadWords) score += 0.5;
    if (sentiment < -0.5) score += 0.5;
    
    return score;
  }

  async shouldFlagContent(content) {
    const analysis = await this.analyzeContent(content);
    return {
      shouldFlag: analysis.hasBadWords || 
                 analysis.spamScore > 0.7 || 
                 analysis.toxicityScore > 0.7,
      analysis
    };
  }

  async getModerationQueue() {
    const cacheKey = 'moderation_queue';
    const cachedQueue = await this.redis.get(cacheKey);

    if (cachedQueue) {
      return JSON.parse(cachedQueue);
    }

    const [flaggedThreads, flaggedPosts] = await Promise.all([
      Thread.find({ status: 'flagged' }).limit(10),
      Post.find({ status: 'flagged' }).limit(10)
    ]);

    const queue = {
      threads: flaggedThreads,
      posts: flaggedPosts,
      lastUpdated: new Date()
    };

    await this.redis.set(cacheKey, JSON.stringify(queue), 'EX', 300); // Cache for 5 minutes
    return queue;
  }

  async bulkModerateContent(contentIds, action, moderatorId) {
    const [threads, posts] = await Promise.all([
      Thread.find({ _id: { $in: contentIds } }),
      Post.find({ _id: { $in: contentIds } })
    ]);

    const results = {
      threads: [],
      posts: []
    };

    for (const thread of threads) {
      const result = await this.moderateThread(thread, action, moderatorId);
      results.threads.push(result);
    }

    for (const post of posts) {
      const result = await this.moderatePost(post, action, moderatorId);
      results.posts.push(result);
    }

    return results;
  }

  async moderateThread(thread, action, moderatorId) {
    switch (action) {
      case 'approve':
        thread.status = 'approved';
        thread.moderatedBy = moderatorId;
        thread.moderatedAt = new Date();
        break;
      case 'reject':
        thread.status = 'rejected';
        thread.moderatedBy = moderatorId;
        thread.moderatedAt = new Date();
        break;
      case 'delete':
        thread.status = 'deleted';
        thread.moderatedBy = moderatorId;
        thread.moderatedAt = new Date();
        break;
    }

    await thread.save();
    return thread;
  }

  async moderatePost(post, action, moderatorId) {
    switch (action) {
      case 'approve':
        post.status = 'approved';
        post.moderatedBy = moderatorId;
        post.moderatedAt = new Date();
        break;
      case 'reject':
        post.status = 'rejected';
        post.moderatedBy = moderatorId;
        post.moderatedAt = new Date();
        break;
      case 'delete':
        post.status = 'deleted';
        post.moderatedBy = moderatorId;
        post.moderatedAt = new Date();
        break;
    }

    await post.save();
    return post;
  }
}

module.exports = new ContentFilterService(); 