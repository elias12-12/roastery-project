/**
 * Pages Routes - Frontend EJS routes
 * Handles all page rendering (not API endpoints)
 */
import { Router } from 'express';
import { PagesController } from '../controllers/PagesController.js';
import { 
  isAuthenticated, 
  isNotAuthenticated, 
  isAdmin,
  isCustomerOrAdmin 
} from '../middleware/auth.middleware.js';

const c = new PagesController();
export const pagesRouter = Router();

// ===== PUBLIC ROUTES =====
pagesRouter.get('/', (req, res) => {
  if (req.session.user) {
    if (req.session.user.role === 'admin') {
      return res.redirect('/admin/dashboard');
    }
    return res.redirect('/dashboard');
  }
  res.redirect('/login');
});

pagesRouter.get('/login', isNotAuthenticated, c.loginPage);
pagesRouter.post('/login', isNotAuthenticated, c.login);
pagesRouter.get('/register', isNotAuthenticated, c.registerPage);
pagesRouter.post('/register', isNotAuthenticated, c.register);
pagesRouter.get('/guest-login', c.guestLogin);
pagesRouter.get('/logout', c.logout);

// Products catalog (public, but prices hidden for guests)
pagesRouter.get('/products', c.productsCatalog);
pagesRouter.get('/products/:id', c.productDetails);
pagesRouter.get('/weather', c.weatherPage);

// ===== CUSTOMER ROUTES =====
pagesRouter.get('/dashboard', isCustomerOrAdmin, c.customerDashboard);
pagesRouter.get('/profile', isAuthenticated, c.profile);

// Sales (customer can create and view own)
pagesRouter.get('/sales/create', isCustomerOrAdmin, c.salesCreatePage);
pagesRouter.post('/sales/create', isCustomerOrAdmin, c.salesCreate);
pagesRouter.get('/sales/my-orders', isCustomerOrAdmin, c.myOrders);
pagesRouter.get('/sales/:id', isAuthenticated, c.saleDetails);

// ===== ADMIN ROUTES =====
pagesRouter.get('/admin/dashboard', isAdmin, c.adminDashboard);

// Products management
pagesRouter.get('/admin/products', isAdmin, c.productsListAdmin);
pagesRouter.get('/admin/products/create', isAdmin, c.productsCreatePage);
pagesRouter.post('/admin/products/create', isAdmin, c.productsCreate);
pagesRouter.get('/admin/products/edit/:id', isAdmin, c.productsEditPage);
pagesRouter.post('/admin/products/edit/:id', isAdmin, c.productsEdit);
pagesRouter.post('/admin/products/delete/:id', isAdmin, c.productsDelete);

// All sales
pagesRouter.get('/admin/sales', isAdmin, c.allOrders);
pagesRouter.post('/admin/sales/:sale_id/discount', isAdmin, c.applyOrderDiscount);

// Inventory
pagesRouter.get('/admin/inventory', isAdmin, c.inventoryList);
pagesRouter.get('/admin/inventory/low-stock', isAdmin, c.inventoryLowStock);
pagesRouter.post('/admin/inventory/update/:product_id', isAdmin, c.inventoryUpdate);

// Users
pagesRouter.get('/admin/users', isAdmin, c.usersList);