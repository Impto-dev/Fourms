# Modern Forum Project

A full-featured forum platform built with Node.js, Express, MongoDB, and React, featuring real-time updates, advanced moderation tools, analytics, and comprehensive security measures.

## Features

### Core Functionality
- User authentication with JWT and social login options
- Thread and post management with rich text editing
- File attachments and media handling
- Real-time updates using Socket.io
- Advanced search functionality
- User profiles and settings

### Security
- JWT-based authentication
- Role-based access control
- XSS/CSRF protection
- Rate limiting
- Input validation
- Security event logging
- Real-time threat detection

### Moderation
- Automated content filtering
- User behavior analysis
- Moderation queue
- Bulk moderation actions
- Discord integration for notifications

### Analytics
- User activity tracking
- Content statistics
- Performance metrics
- Real-time monitoring
- Custom dashboards

### Performance
- Response time optimization
- Database query optimization
- Caching system
- Load balancing ready
- Comprehensive testing suite

## Prerequisites

- Node.js (v18 or higher)
- MongoDB (v6 or higher)
- Redis (v7 or higher)
- npm or yarn
- Git

## Quick Start (Development)

1. Clone the repository:
```bash
git clone https://github.com/yourusername/forum-project.git
cd forum-project
```

2. Install dependencies:
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

3. Configure environment variables:
```bash
# Backend (.env)
cp .env.example .env
# Edit .env with your configuration

# Frontend (.env)
cp .env.example .env
# Edit .env with your configuration
```

4. Start development servers:
```bash
# Start backend (from backend directory)
npm run dev

# Start frontend (from frontend directory)
npm start
```

## Testing

```bash
# Run unit tests
npm test

# Run integration tests
npm run test:integration

# Run load tests
npm run test:load

# Generate coverage report
npm run test:coverage
```

## Project Structure

```
backend/
├── src/
│   ├── config/      # Configuration files
│   ├── controllers/ # Route controllers
│   ├── middleware/  # Custom middleware
│   ├── models/      # Database models
│   ├── routes/      # API routes
│   ├── services/    # Business logic
│   └── utils/       # Helper functions
└── tests/          # Test files

frontend/
├── src/
│   ├── components/  # React components
│   ├── pages/       # Page components
│   ├── services/    # API services
│   ├── utils/       # Helper functions
│   ├── context/     # React context
│   └── hooks/       # Custom hooks
└── public/         # Static files
```

## API Documentation

API documentation is available at `/api-docs` when running the server. It includes:
- Endpoint descriptions
- Request/response examples
- Authentication requirements
- Error responses

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, please open an issue in the GitHub repository or contact the maintainers. 