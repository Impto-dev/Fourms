const mongoose = require('mongoose');
const Thread = require('../models/Thread');
const Post = require('../models/Post');
const User = require('../models/User');

class SearchService {
  constructor() {
    this.searchFields = {
      thread: ['title', 'content', 'tags', 'category'],
      post: ['content', 'tags'],
      user: ['username', 'email', 'bio']
    };
  }

  // Perform advanced search
  async search(query, options = {}) {
    const {
      type = 'all',
      page = 1,
      limit = 10,
      sortBy = 'relevance',
      filters = {}
    } = options;

    try {
      let results = {
        threads: [],
        posts: [],
        users: [],
        total: 0,
        pagination: {
          page,
          limit,
          totalPages: 0
        }
      };

      // Build search query
      const searchQuery = this.buildSearchQuery(query, filters);

      // Search based on type
      if (type === 'all' || type === 'threads') {
        const threadResults = await this.searchThreads(searchQuery, page, limit, sortBy);
        results.threads = threadResults.results;
        results.total += threadResults.total;
      }

      if (type === 'all' || type === 'posts') {
        const postResults = await this.searchPosts(searchQuery, page, limit, sortBy);
        results.posts = postResults.results;
        results.total += postResults.total;
      }

      if (type === 'all' || type === 'users') {
        const userResults = await this.searchUsers(searchQuery, page, limit, sortBy);
        results.users = userResults.results;
        results.total += userResults.total;
      }

      // Calculate total pages
      results.pagination.totalPages = Math.ceil(results.total / limit);

      return results;
    } catch (error) {
      console.error('Error in search service:', error);
      throw error;
    }
  }

  // Build search query
  buildSearchQuery(query, filters) {
    const searchQuery = {
      $or: []
    };

    // Add text search
    if (query) {
      searchQuery.$or.push(
        { $text: { $search: query } }
      );
    }

    // Add filters
    if (filters.category) {
      searchQuery.category = filters.category;
    }

    if (filters.author) {
      searchQuery.author = filters.author;
    }

    if (filters.dateRange) {
      searchQuery.createdAt = {
        $gte: new Date(filters.dateRange.start),
        $lte: new Date(filters.dateRange.end)
      };
    }

    if (filters.tags && filters.tags.length > 0) {
      searchQuery.tags = { $in: filters.tags };
    }

    return searchQuery;
  }

  // Search threads
  async searchThreads(query, page, limit, sortBy) {
    const skip = (page - 1) * limit;
    const sortOptions = this.getSortOptions(sortBy);

    const [results, total] = await Promise.all([
      Thread.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .populate('author', 'username')
        .populate('category', 'name')
        .lean(),
      Thread.countDocuments(query)
    ]);

    return {
      results,
      total
    };
  }

  // Search posts
  async searchPosts(query, page, limit, sortBy) {
    const skip = (page - 1) * limit;
    const sortOptions = this.getSortOptions(sortBy);

    const [results, total] = await Promise.all([
      Post.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .populate('author', 'username')
        .populate('thread', 'title')
        .lean(),
      Post.countDocuments(query)
    ]);

    return {
      results,
      total
    };
  }

  // Search users
  async searchUsers(query, page, limit, sortBy) {
    const skip = (page - 1) * limit;
    const sortOptions = this.getSortOptions(sortBy);

    const [results, total] = await Promise.all([
      User.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .select('username email bio createdAt')
        .lean(),
      User.countDocuments(query)
    ]);

    return {
      results,
      total
    };
  }

  // Get sort options
  getSortOptions(sortBy) {
    switch (sortBy) {
      case 'newest':
        return { createdAt: -1 };
      case 'oldest':
        return { createdAt: 1 };
      case 'popular':
        return { views: -1 };
      case 'relevance':
        return { score: { $meta: 'textScore' } };
      default:
        return { createdAt: -1 };
    }
  }

  // Get search suggestions
  async getSuggestions(query) {
    try {
      const suggestions = {
        threads: [],
        posts: [],
        users: [],
        tags: []
      };

      if (!query) return suggestions;

      // Get thread suggestions
      suggestions.threads = await Thread.find(
        { $text: { $search: query } },
        { score: { $meta: 'textScore' } }
      )
        .sort({ score: { $meta: 'textScore' } })
        .limit(5)
        .select('title')
        .lean();

      // Get post suggestions
      suggestions.posts = await Post.find(
        { $text: { $search: query } },
        { score: { $meta: 'textScore' } }
      )
        .sort({ score: { $meta: 'textScore' } })
        .limit(5)
        .select('content')
        .lean();

      // Get user suggestions
      suggestions.users = await User.find(
        { $text: { $search: query } },
        { score: { $meta: 'textScore' } }
      )
        .sort({ score: { $meta: 'textScore' } })
        .limit(5)
        .select('username')
        .lean();

      // Get tag suggestions
      const threads = await Thread.find(
        { tags: { $regex: query, $options: 'i' } }
      )
        .limit(10)
        .select('tags')
        .lean();

      const tags = new Set();
      threads.forEach(thread => {
        thread.tags.forEach(tag => {
          if (tag.toLowerCase().includes(query.toLowerCase())) {
            tags.add(tag);
          }
        });
      });

      suggestions.tags = Array.from(tags).slice(0, 5);

      return suggestions;
    } catch (error) {
      console.error('Error getting suggestions:', error);
      throw error;
    }
  }
}

module.exports = new SearchService(); 