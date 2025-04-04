import React, { useState, useEffect } from 'react';
import {
  TextField,
  Button,
  Grid,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  useMediaQuery,
  useTheme,
  IconButton,
  Drawer,
  InputAdornment,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Search = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState({
    threads: [],
    posts: [],
    users: [],
    tags: []
  });
  const [results, setResults] = useState({
    threads: [],
    posts: [],
    users: [],
    total: 0,
    pagination: {
      page: 1,
      limit: 10,
      totalPages: 0
    }
  });
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState('all');
  const [sortBy, setSortBy] = useState('relevance');
  const [filters, setFilters] = useState({
    category: '',
    author: '',
    dateRange: {
      start: '',
      end: ''
    },
    tags: []
  });
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  const navigate = useNavigate();

  // Fetch suggestions
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (query.length < 2) return;

      try {
        const response = await axios.get(`/api/search/suggestions?query=${query}`);
        setSuggestions(response.data);
      } catch (error) {
        console.error('Error fetching suggestions:', error);
      }
    };

    const debounceTimer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounceTimer);
  }, [query]);

  // Perform search
  const handleSearch = async (page = 1) => {
    if (!query) return;

    setLoading(true);
    try {
      const response = await axios.get('/api/search', {
        params: {
          query,
          type,
          page,
          limit: 10,
          sortBy,
          filters: JSON.stringify(filters)
        }
      });
      setResults(response.data);
    } catch (error) {
      console.error('Error performing search:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (type, item) => {
    if (type === 'threads') {
      navigate(`/thread/${item._id}`);
    } else if (type === 'users') {
      navigate(`/profile/${item.username}`);
    } else if (type === 'tags') {
      setFilters(prev => ({
        ...prev,
        tags: [...prev.tags, item]
      }));
      setQuery('');
    }
  };

  const toggleFilterDrawer = () => {
    setFilterDrawerOpen(!filterDrawerOpen);
  };

  const FilterDrawer = () => (
    <Drawer
      anchor="right"
      open={filterDrawerOpen}
      onClose={toggleFilterDrawer}
      sx={{
        '& .MuiDrawer-paper': {
          width: '100%',
          maxWidth: '400px',
          p: 2,
        },
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6">Filters</Typography>
        <IconButton onClick={toggleFilterDrawer}>
          <ClearIcon />
        </IconButton>
      </Box>
      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>Type</InputLabel>
        <Select
          value={type}
          onChange={(e) => setType(e.target.value)}
          label="Type"
        >
          <MenuItem value="all">All</MenuItem>
          <MenuItem value="threads">Threads</MenuItem>
          <MenuItem value="posts">Posts</MenuItem>
          <MenuItem value="users">Users</MenuItem>
        </Select>
      </FormControl>
      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>Sort By</InputLabel>
        <Select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          label="Sort By"
        >
          <MenuItem value="relevance">Relevance</MenuItem>
          <MenuItem value="newest">Newest</MenuItem>
          <MenuItem value="oldest">Oldest</MenuItem>
          <MenuItem value="popular">Popular</MenuItem>
        </Select>
      </FormControl>
      <Button
        variant="contained"
        fullWidth
        onClick={() => {
          handleSearch();
          toggleFilterDrawer();
        }}
      >
        Apply Filters
      </Button>
    </Drawer>
  );

  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <Paper elevation={3} sx={{ p: 2 }}>
          <TextField
            fullWidth
            label="Search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={toggleFilterDrawer}>
                    <FilterIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          {/* Active Filters */}
          {filters.tags.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2">Active Filters:</Typography>
              {filters.tags.map((tag, index) => (
                <Chip
                  key={index}
                  label={tag}
                  onDelete={() => {
                    setFilters(prev => ({
                      ...prev,
                      tags: prev.tags.filter(t => t !== tag)
                    }));
                  }}
                  sx={{ m: 0.5 }}
                />
              ))}
            </Box>
          )}
        </Paper>
      </Grid>

      {/* Suggestions */}
      {query.length >= 2 && (
        <Grid item xs={12}>
          <Paper elevation={3} sx={{ p: 2 }}>
            <Typography variant="h6">Suggestions</Typography>
            <List>
              {suggestions.threads.map((thread) => (
                <ListItem
                  key={thread._id}
                  button
                  onClick={() => handleSuggestionClick('threads', thread)}
                >
                  <ListItemText primary={thread.title} />
                </ListItem>
              ))}
              {suggestions.users.map((user) => (
                <ListItem
                  key={user._id}
                  button
                  onClick={() => handleSuggestionClick('users', user)}
                >
                  <ListItemText primary={user.username} />
                </ListItem>
              ))}
              {suggestions.tags.map((tag, index) => (
                <ListItem
                  key={index}
                  button
                  onClick={() => handleSuggestionClick('tags', tag)}
                >
                  <ListItemText primary={`#${tag}`} />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
      )}

      {/* Results */}
      {results.total > 0 && (
        <Grid item xs={12}>
          <Paper elevation={3} sx={{ p: 2 }}>
            <Typography variant="h6">
              Results ({results.total})
            </Typography>

            {/* Thread Results */}
            {results.threads.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle1">Threads</Typography>
                <List>
                  {results.threads.map((thread) => (
                    <ListItem
                      key={thread._id}
                      button
                      onClick={() => navigate(`/thread/${thread._id}`)}
                    >
                      <ListItemText
                        primary={thread.title}
                        secondary={`By ${thread.author.username} in ${thread.category.name}`}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}

            {/* Post Results */}
            {results.posts.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle1">Posts</Typography>
                <List>
                  {results.posts.map((post) => (
                    <ListItem
                      key={post._id}
                      button
                      onClick={() => navigate(`/thread/${post.thread._id}`)}
                    >
                      <ListItemText
                        primary={post.content.substring(0, 100) + '...'}
                        secondary={`By ${post.author.username} in ${post.thread.title}`}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}

            {/* User Results */}
            {results.users.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle1">Users</Typography>
                <List>
                  {results.users.map((user) => (
                    <ListItem
                      key={user._id}
                      button
                      onClick={() => navigate(`/profile/${user.username}`)}
                    >
                      <ListItemText
                        primary={user.username}
                        secondary={user.bio || 'No bio available'}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}

            {/* Pagination */}
            {results.pagination.totalPages > 1 && (
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                {Array.from({ length: results.pagination.totalPages }, (_, i) => (
                  <Button
                    key={i}
                    onClick={() => handleSearch(i + 1)}
                    disabled={results.pagination.page === i + 1}
                    sx={{ mx: 0.5 }}
                  >
                    {i + 1}
                  </Button>
                ))}
              </Box>
            )}
          </Paper>
        </Grid>
      )}

      <FilterDrawer />
    </Grid>
  );
};

export default Search; 