import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'sd_digitals_super_secret_key_12345';

export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[2] ? authHeader.split(' ')[2] : (authHeader && authHeader.split(' ')[1]); 
  // Handle both "Bearer <token>" and direct "<token>" formats

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
}

export function authorizeRole(roles = []) {
  if (typeof roles === 'string') {
    roles = [roles];
  }

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Permission denied: Requires high authorization' });
    }

    next();
  };
}
