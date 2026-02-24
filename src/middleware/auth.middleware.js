/**
 * Authentication Middleware
 * Provides role-based access control for EJS frontend routes
 */

// Check if user is logged in
export const isAuthenticated = (req, res, next) => {
  if (req.session.user) {
    return next();
  }
  req.flash('error', 'Please login to access this page');
  res.redirect('/login');
};

// Redirect logged-in users away from login/register
export const isNotAuthenticated = (req, res, next) => {
  if (!req.session.user) {
    return next();
  }
  // Redirect based on role
  if (req.session.user.role === 'admin') {
    return res.redirect('/admin/dashboard');
  }
  res.redirect('/dashboard');
};

// Admin-only access
export const isAdmin = (req, res, next) => {
  if (req.session.user && req.session.user.role === 'admin') {
    return next();
  }
  res.status(403).render('403', { 
    title: 'Access Denied',
    layout: 'layouts/main'
  });
};

// Customer or Admin (blocks guests)
export const isCustomerOrAdmin = (req, res, next) => {
  if (req.session.user && 
     (req.session.user.role === 'customer' || req.session.user.role === 'admin')) {
    return next();
  }
  res.status(403).render('403', { 
    title: 'Access Denied',
    layout: 'layouts/main'
  });
};