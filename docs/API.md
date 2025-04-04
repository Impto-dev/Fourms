# Forum API Documentation

## Table of Contents
1. [Authentication](#authentication)
2. [Forum Endpoints](#forum-endpoints)
3. [Moderation Endpoints](#moderation-endpoints)
4. [Analytics Endpoints](#analytics-endpoints)
5. [User Management Endpoints](#user-management-endpoints)
6. [Error Handling](#error-handling)
7. [Rate Limiting](#rate-limiting)

## Authentication

### Overview
The API uses JWT (JSON Web Tokens) for authentication. All protected endpoints require a valid JWT token in the Authorization header.

### Authentication Flow
1. Register a new user
2. Login to get JWT token
3. Use token in subsequent requests

### Headers
```http
Authorization: Bearer <your_jwt_token>
```

### Endpoints

#### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "string",
  "email": "string",
  "password": "string"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "string",
  "password": "string"
}
```

#### Refresh Token
```http
POST /api/auth/refresh-token
Content-Type: application/json

{
  "refreshToken": "string"
}
```

## Forum Endpoints

### Threads

#### Get All Threads
```http
GET /api/forum/threads?page=1&limit=10&category=string
```

#### Get Single Thread
```http
GET /api/forum/threads/:id
```

#### Create Thread
```http
POST /api/forum/threads
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "string",
  "content": "string",
  "category": "string"
}
```

#### Update Thread
```http
PUT /api/forum/threads/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "string",
  "content": "string",
  "category": "string"
}
```

#### Delete Thread
```http
DELETE /api/forum/threads/:id
Authorization: Bearer <token>
```

### Posts

#### Get Thread Posts
```http
GET /api/forum/threads/:id/posts?page=1&limit=10
```

#### Create Post
```http
POST /api/forum/threads/:id/posts
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "string"
}
```

#### Update Post
```http
PUT /api/forum/posts/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "string"
}
```

#### Delete Post
```http
DELETE /api/forum/posts/:id
Authorization: Bearer <token>
```

## Moderation Endpoints

### Content Analysis
```http
POST /api/moderation/analyze
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "string"
}
```

### Moderation Queue
```http
GET /api/moderation/queue
Authorization: Bearer <token>
```

### Bulk Moderation
```http
POST /api/moderation/bulk
Authorization: Bearer <token>
Content-Type: application/json

{
  "contentIds": ["string"],
  "action": "approve|reject|delete"
}
```

### Individual Moderation
```http
POST /api/moderation/threads/:threadId
Authorization: Bearer <token>
Content-Type: application/json

{
  "action": "approve|reject|delete"
}
```

```http
POST /api/moderation/posts/:postId
Authorization: Bearer <token>
Content-Type: application/json

{
  "action": "approve|reject|delete"
}
```

### Moderation Statistics
```http
GET /api/moderation/stats
Authorization: Bearer <token>
```

## Analytics Endpoints

### User Activity
```http
GET /api/analytics/user-activity?timeRange=7d
Authorization: Bearer <token>
```

### Content Statistics
```http
GET /api/analytics/content-stats?timeRange=7d
Authorization: Bearer <token>
```

### Performance Metrics
```http
GET /api/analytics/performance
Authorization: Bearer <token>
```

### Dashboard Data
```http
GET /api/analytics/dashboard?timeRange=7d
Authorization: Bearer <token>
```

## User Management Endpoints

### Get User Profile
```http
GET /api/users/profile
Authorization: Bearer <token>
```

### Update User Profile
```http
PUT /api/users/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "username": "string",
  "email": "string",
  "avatar": "string"
}
```

### Change Password
```http
PUT /api/users/change-password
Authorization: Bearer <token>
Content-Type: application/json

{
  "currentPassword": "string",
  "newPassword": "string"
}
```

## Error Handling

### Error Response Format
```json
{
  "error": {
    "message": "string",
    "code": "string",
    "details": {}
  }
}
```

### Common Error Codes
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `429`: Too Many Requests
- `500`: Internal Server Error

## Rate Limiting

### Limits
- Authentication endpoints: 5 requests per minute
- Forum endpoints: 60 requests per minute
- Moderation endpoints: 30 requests per minute
- Analytics endpoints: 20 requests per minute

### Headers
```http
X-RateLimit-Limit: number
X-RateLimit-Remaining: number
X-RateLimit-Reset: timestamp
```

## Pagination

### Query Parameters
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)

### Response Format
```json
{
  "data": [],
  "pagination": {
    "total": number,
    "page": number,
    "pages": number
  }
}
```

## WebSocket Events

### Thread Events
- `newThread`: New thread created
- `updateThread`: Thread updated
- `deleteThread`: Thread deleted

### Post Events
- `newPost`: New post created
- `updatePost`: Post updated
- `deletePost`: Post deleted

### User Events
- `userOnline`: User comes online
- `userOffline`: User goes offline
- `userTyping`: User is typing in a thread

## Best Practices

1. Always include the `Authorization` header for protected endpoints
2. Handle rate limiting by checking response headers
3. Implement exponential backoff for retries
4. Cache responses when appropriate
5. Use WebSocket events for real-time updates
6. Validate input data before sending requests
7. Handle errors gracefully in your application 