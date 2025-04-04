const searchService = require('../services/searchService');

// Perform search
exports.search = async (req, res) => {
  try {
    const { query, type, page, limit, sortBy, filters } = req.query;

    const results = await searchService.search(query, {
      type,
      page: parseInt(page),
      limit: parseInt(limit),
      sortBy,
      filters: filters ? JSON.parse(filters) : {}
    });

    res.json(results);
  } catch (error) {
    console.error('Error in search controller:', error);
    res.status(500).json({ error: 'Failed to perform search' });
  }
};

// Get search suggestions
exports.getSuggestions = async (req, res) => {
  try {
    const { query } = req.query;

    const suggestions = await searchService.getSuggestions(query);

    res.json(suggestions);
  } catch (error) {
    console.error('Error getting suggestions:', error);
    res.status(500).json({ error: 'Failed to get suggestions' });
  }
}; 