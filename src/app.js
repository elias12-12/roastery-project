import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import expressLayouts from 'express-ejs-layouts';
import session from 'express-session';
import flash from 'connect-flash';
import { healthCheck } from './config/db.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { UsersRoutes } from './routes/usersRoutes.js';
import { ProductsRoutes } from './routes/productsRoutes.js';
import { SalesRoutes } from './routes/SalesRoutes.js';
import { SaleItemsRoutes } from './routes/SaleItemsRoutes.js';
import { InventoryRoutes } from './routes/InventoryRoutes.js';

// NEW: Pages routes
import { pagesRouter } from './routes/pages.routes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const app = express();

// ===== MIDDLEWARE =====
app.use(cors());
app.use(express.json()); // For API
app.use(express.urlencoded({ extended: true })); // For forms

// Session (MUST be before routes)
app.use(session({
  secret: process.env.SESSION_SECRET || 'roastery_secret_2024',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    maxAge: 1000 * 60 * 60 * 24, // 24 hours
    httpOnly: true
  }
}));

app.use(flash());

// ===== EJS SETUP =====
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layouts/main');

// Static files (CSS, JS, images)
app.use(express.static(path.join(__dirname, '..', 'public')));

// Make user and flash messages available to ALL views
app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  res.locals.messages = {
    success: req.flash('success'),
    error: req.flash('error'),
    info: req.flash('info')
  };
  next();
});

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    res.json({ ok: await healthCheck() });
  } catch (e) {
    res.status(500).json({ ok: false });
  }
});

// ===== API ROUTES (existing) =====
app.use('/api/users', UsersRoutes);
app.use('/api/products', ProductsRoutes);
app.use('/api/sales', SalesRoutes);
app.use('/api/sale-items', SaleItemsRoutes);
app.use('/api/inventory', InventoryRoutes);

// ===== FRONTEND PAGES (new) =====
app.use('/', pagesRouter);

// ===== ERROR HANDLERS =====
// 404 handler (must be after all routes)
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ message: 'API endpoint not found' });
  }
  res.status(404).render('404', { 
    title: 'Page Not Found',
    layout: 'layouts/main' 
  });
});

// Global error handler (API routes use existing errorHandler, frontend uses EJS)
app.use((err, req, res, next) => {
  console.error('ERROR:', err);
  
  if (req.path.startsWith('/api')) {
    // Use existing errorHandler for API routes
    return errorHandler(err, req, res, next);
  }
  
  // EJS error page for frontend routes
  res.status(500).render('error', { 
    title: 'Error',
    message: err.message,
    layout: 'layouts/main'
  });
});