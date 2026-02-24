import session from 'express-session';

// Attach current user from session if present (no-op for viewless API)
export function attachCurrentUser(req, res, next) {
  if (req.session && req.session.user) {
    res.locals.currentUser = req.session.user;
  } else {
    res.locals.currentUser = null;
  }
  next();
}

// Require a logged-in user
export function requireLoggedIn(req, res, next) {
  if (req.session && req.session.user) return next();
  return res.status(401).json({ message: 'Authentication required' });
}

// Require a specific role (or array of roles)
export function requireRole(roleOrRoles) {
  const roles = Array.isArray(roleOrRoles) ? roleOrRoles : [roleOrRoles];
  return (req, res, next) => {
    const user = req.session && req.session.user;
    if (!user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    if (!roles.includes(user.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    return next();
  };
}

// Session middleware factory
export function sessionMiddleware(options = {}) {
  const secret = options.secret || process.env.SESSION_SECRET || 'dev_secret_change_me';
  return session({
    secret,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // secure should be true in production with HTTPS
  });
}
