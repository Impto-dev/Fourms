const auditService = require('../services/auditService');

const auditMiddleware = (options = {}) => {
  return async (req, res, next) => {
    try {
      // Skip if no user is authenticated
      if (!req.user) {
        return next();
      }

      // Get the original response methods
      const originalJson = res.json;
      const originalSend = res.send;
      const originalEnd = res.end;

      // Override response methods to capture the response
      res.json = function(body) {
        // Log the audit event after the response is sent
        process.nextTick(async () => {
          try {
            const action = getActionFromMethod(req.method);
            const entityType = getEntityTypeFromPath(req.path);
            const entityId = getEntityIdFromPath(req.path) || req.body._id;
            const details = {
              method: req.method,
              path: req.path,
              body: req.body,
              params: req.params,
              query: req.query,
              response: body
            };

            await auditService.logEvent(
              req.user._id,
              action,
              entityType,
              entityId,
              details,
              req.ip,
              {
                userAgent: req.get('user-agent'),
                referer: req.get('referer')
              }
            );
          } catch (error) {
            console.error('Error in audit middleware:', error);
          }
        });

        return originalJson.call(this, body);
      };

      res.send = function(body) {
        process.nextTick(async () => {
          try {
            const action = getActionFromMethod(req.method);
            const entityType = getEntityTypeFromPath(req.path);
            const entityId = getEntityIdFromPath(req.path) || req.body._id;
            const details = {
              method: req.method,
              path: req.path,
              body: req.body,
              params: req.params,
              query: req.query,
              response: body
            };

            await auditService.logEvent(
              req.user._id,
              action,
              entityType,
              entityId,
              details,
              req.ip,
              {
                userAgent: req.get('user-agent'),
                referer: req.get('referer')
              }
            );
          } catch (error) {
            console.error('Error in audit middleware:', error);
          }
        });

        return originalSend.call(this, body);
      };

      res.end = function(chunk, encoding) {
        process.nextTick(async () => {
          try {
            const action = getActionFromMethod(req.method);
            const entityType = getEntityTypeFromPath(req.path);
            const entityId = getEntityIdFromPath(req.path) || req.body._id;
            const details = {
              method: req.method,
              path: req.path,
              body: req.body,
              params: req.params,
              query: req.query,
              response: chunk
            };

            await auditService.logEvent(
              req.user._id,
              action,
              entityType,
              entityId,
              details,
              req.ip,
              {
                userAgent: req.get('user-agent'),
                referer: req.get('referer')
              }
            );
          } catch (error) {
            console.error('Error in audit middleware:', error);
          }
        });

        return originalEnd.call(this, chunk, encoding);
      };

      next();
    } catch (error) {
      console.error('Error in audit middleware:', error);
      next();
    }
  };
};

// Helper functions
function getActionFromMethod(method) {
  switch (method.toLowerCase()) {
    case 'post':
      return 'create';
    case 'put':
    case 'patch':
      return 'update';
    case 'delete':
      return 'delete';
    default:
      return 'view';
  }
}

function getEntityTypeFromPath(path) {
  const parts = path.split('/');
  for (const part of parts) {
    if (['users', 'threads', 'posts', 'categories', 'permissions', 'system', 'security'].includes(part)) {
      return part.slice(0, -1); // Remove 's' from plural
    }
  }
  return 'system';
}

function getEntityIdFromPath(path) {
  const parts = path.split('/');
  for (let i = 0; i < parts.length; i++) {
    if (['users', 'threads', 'posts', 'categories', 'permissions', 'system', 'security'].includes(parts[i]) && 
        i + 1 < parts.length && 
        parts[i + 1].match(/^[0-9a-fA-F]{24}$/)) {
      return parts[i + 1];
    }
  }
  return null;
}

module.exports = auditMiddleware; 