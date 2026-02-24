/**
 * PagesController - Handles rendering of EJS pages
 * Reuses existing services - no code duplication
 */
import { UsersServices } from '../services/UsersServices.js';
import { ProductsServices } from '../services/ProductsServices.js';
import { SalesServices } from '../services/SalesServices.js';
import { InventoryServices } from '../services/InventoryServices.js';
import { SaleItemsServices } from '../services/SaleItemsServices.js';
import { WeatherService } from '../services/WeatherService.js';

// Import repositories
import { UsersRepository } from '../domain/repositories/UsersRepository.js';
import { ProductsRepository } from '../domain/repositories/ProductsRepository.js';
import { SalesRepository } from '../domain/repositories/SalesRepository.js';
import { InventoryRepository } from '../domain/repositories/InventoryRepository.js';
import { SaleItemsRepository } from '../domain/repositories/SaleItemsRepository.js';

// Initialize services (reuse existing logic)
const usersService = new UsersServices(new UsersRepository());
const productsService = new ProductsServices(new ProductsRepository());
const salesService = new SalesServices(new SalesRepository());
const inventoryService = new InventoryServices(new InventoryRepository());
const saleItemsService = new SaleItemsServices(new SaleItemsRepository());
const weatherService = new WeatherService();

export class PagesController {
  
  // ===== AUTHENTICATION =====
  
  /**
   * Render the login page
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {void} Renders the login view
   */
  loginPage = (req, res) => {
    res.render('auth/login', { 
      title: 'Login',
      layout: 'layouts/auth'
    });
  };

  /**
   * Handle user login authentication
   * @param {Object} req - Express request object
   * @param {string} req.body.email - User email
   * @param {string} req.body.password - User password
   * @param {Object} res - Express response object
   * @returns {Promise<void>} Redirects to dashboard or login on error
   */
  login = async (req, res) => {
    try {
      const { email, password } = req.body;
      const result = await usersService.loginUser(email, password);
      
      req.session.user = result.user;
      req.flash('success', `Welcome back, ${result.user.first_name}!`);
      
      // Redirect based on role
      if (result.user.role === 'admin') {
        return res.redirect('/admin/dashboard');
      }
      res.redirect('/dashboard');
      
    } catch (error) {
      req.flash('error', error.message);
      res.redirect('/login');
    }
  };
  
  /**
   * Create a guest session for browsing without authentication
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {void} Redirects to products catalog
   */
  guestLogin = (req, res) => {
    // Create guest session (no database needed)
    req.session.user = {
      user_id: null,
      first_name: 'Guest',
      last_name: 'User',
      email: null,
      role: 'guest'
    };
    
    req.flash('info', 'Browsing as guest. Register to place orders.');
    res.redirect('/products');
  };
  
  /**
   * Display detailed product information
   * @param {Object} req - Express request object
   * @param {string} req.params.id - Product ID
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   * @returns {Promise<void>} Renders product details view
   */
  productDetails = async (req, res, next) => {
    try {
      const productId = req.params.id;
      const product = await this.productsService.getProductById(productId);
      
      if (!product) {
        req.flash('error', 'Product not found');
        return res.redirect('/products');
      }
      
      res.render('products/details', {
        title: product.product_name,
        product
      });
      
    } catch (error) {
      next(error);
    }
  };

  /**
   * Render the registration page
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {void} Renders the register view
   */
  registerPage = (req, res) => {
    res.render('auth/register', { 
      title: 'Register',
      layout: 'layouts/auth'
    });
  };

  /**
   * Handle new user registration
   * @param {Object} req - Express request object
   * @param {Object} req.body - User registration data
   * @param {string} req.body.first_name - First name
   * @param {string} req.body.last_name - Last name
   * @param {string} req.body.email - Email address
   * @param {string} req.body.password - Password
   * @param {string} [req.body.phone_number] - Phone number (optional)
   * @param {Object} res - Express response object
   * @returns {Promise<void>} Redirects to login or register on error
   */
  register = async (req, res) => {
    try {
      // Only allow customer or guest registration (no admin)
      const userData = {
        ...req.body,
        role: req.body.role === 'guest' ? 'guest' : 'customer'
      };
      
      await usersService.registerUser(userData);
      req.flash('success', 'Registration successful! Please login.');
      res.redirect('/login');
      
    } catch (error) {
      req.flash('error', error.message);
      res.redirect('/register');
    }
  };

  /**
   * Handle user logout and destroy session
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {void} Destroys session and redirects to login
   */
  logout = (req, res) => {
    const firstName = req.session.user?.first_name;
    req.session.destroy((err) => {
      if (err) console.error(err);
      res.redirect('/login');
    });
  };

  // ===== DASHBOARDS =====
  
  /**
   * Render admin dashboard with statistics and weather
   * @param {Object} req - Express request object
   * @param {string} [req.query.city] - Optional city for weather (default: 'Beirut, LB')
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   * @returns {Promise<void>} Renders admin dashboard view with stats, sales, inventory, and weather
   */
  adminDashboard = async (req, res, next) => {
    try {
      const [allSales, products, inventory] = await Promise.all([
        salesService.getAllSales(),
        productsService.getAllProducts(),
        inventoryService.getAllInventory()
      ]);

      const city = req.query.city || 'Beirut, LB';
      const weather = await weatherService.fetchCurrentWeather(city);

      const lowStock = await inventoryService.getLowStockProducts(10);

      const stats = {
        totalRevenue: allSales.reduce((sum, s) => sum + parseFloat(s.total_amount || 0), 0),
        totalSales: allSales.length,
        totalProducts: products.length,
        lowStockCount: lowStock.length,
        todaySales: allSales.filter(s => {
          const saleDate = s.sale_date;
          const today = new Date().toLocaleDateString('en-GB').split('/').join('/');
          return saleDate === today;
        }).length
      };

      // Recent sales (last 10)
      const recentSales = allSales.slice(0, 10);

      res.render('dashboard-admin', {
        title: 'Admin Dashboard',
        stats,
        recentSales,
        lowStock: lowStock.slice(0, 5),
        weather: weather.data,
        weatherError: weather.error,
        weatherCity: city
      });
      
    } catch (error) {
      next(error);
    }
  };

  /**
   * Render customer dashboard with personal order history and weather
   * @param {Object} req - Express request object
   * @param {string} [req.query.city] - Optional city for weather (default: 'Beirut, LB')
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   * @returns {Promise<void>} Renders customer dashboard view with personal stats and weather
   */
  customerDashboard = async (req, res, next) => {
    try {
      const userId = req.session.user.user_id;
      
      const allSales = await salesService.getAllSales();
      const mySales = allSales.filter(s => s.user_id === userId);

      const city = req.query.city || 'Beirut, LB';
      const weather = await weatherService.fetchCurrentWeather(city);

      const myStats = {
        totalOrders: mySales.length,
        totalSpent: mySales.reduce((sum, s) => sum + parseFloat(s.total_amount || 0), 0),
        recentOrders: mySales.slice(0, 5)
      };

      res.render('dashboard-customer', {
        title: 'My Dashboard',
        stats: myStats,
        weather: weather.data,
        weatherError: weather.error,
        weatherCity: city
      });
      
    } catch (error) {
      next(error);
    }
  };

  // ===== PRODUCTS =====
  
  /**
   * Display public product catalog (prices hidden for guests)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   * @returns {Promise<void>} Renders products catalog view
   */
  productsCatalog = async (req, res, next) => {
    try {
      const products = await productsService.getAllProducts();
      const availableProducts = products.filter(p => p.status === 'available');
      
      res.render('products/catalog', {
        title: 'Our Products',
        products: availableProducts,
        showPrices: !!req.session.user // Show prices only if logged in
      });
      
    } catch (error) {
      next(error);
    }
  };

  /**
   * Display standalone weather page with city search functionality
   * @param {Object} req - Express request object
   * @param {string} [req.query.city] - City name for weather lookup (default: 'Beirut, LB')
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   * @returns {Promise<void>} Renders weather view with current weather data
   */
  weatherPage = async (req, res, next) => {
    try {
      const city = req.query.city || 'Beirut, LB';
      const weather = await weatherService.fetchCurrentWeather(city);

      res.render('weather', {
        title: 'Roastery Weather',
        weather: weather.data,
        weatherError: weather.error,
        city
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Display admin product management list
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   * @returns {Promise<void>} Renders products list view for admin
   */
  productsListAdmin = async (req, res, next) => {
    try {
      const products = await productsService.getAllProducts();
      
      res.render('products/list', {
        title: 'Manage Products',
        products
      });
      
    } catch (error) {
      next(error);
    }
  };

  /**
   * Render product creation form
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {void} Renders product creation view
   */
  productsCreatePage = (req, res) => {
    res.render('products/create', {
      title: 'Add New Product'
    });
  };

  /**
   * Handle product creation with optional inventory
   * @param {Object} req - Express request object
   * @param {Object} req.body - Product data
   * @param {string} req.body.product_name - Product name
   * @param {string} [req.body.description] - Product description
   * @param {number} req.body.unit_price - Product price
   * @param {string} req.body.product_type - Product type
   * @param {string} req.body.status - Product status ('available' | 'not available')
   * @param {number} [req.body.quantity_in_stock] - Initial stock quantity
   * @param {Object} res - Express response object
   * @returns {Promise<void>} Creates product and inventory, redirects to product list
   */
  productsCreate = async (req, res) => {
    try {
      // Extract inventory quantity from request body
      const { quantity_in_stock, ...productData } = req.body;
      
      // Step 1: Create the product
      const product = await productsService.createProduct(productData);
      
      // Step 2: Create or update inventory record if quantity is provided
      if (quantity_in_stock !== undefined && quantity_in_stock !== null && quantity_in_stock !== '') {
        const stockQuantity = parseInt(quantity_in_stock) || 0;
        if (stockQuantity >= 0) {
          // Check if inventory already exists for this product
          const existingInventory = await inventoryService.getInventoryByProduct(product.product_id);
          
          if (existingInventory) {
            // Update existing inventory
            await inventoryService.updateInventory(product.product_id, stockQuantity);
          } else {
            // Create new inventory record
            await inventoryService.createInventoryRecord(product.product_id, stockQuantity);
          }
        }
      }
      
      req.flash('success', 'Product and inventory created successfully');
      res.redirect('/admin/products');
    } catch (error) {
      req.flash('error', error.message);
      res.redirect('/admin/products/create');
    }
  };

  /**
   * Render product edit form with existing data
   * @param {Object} req - Express request object
   * @param {string} req.params.id - Product ID
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   * @returns {Promise<void>} Renders product edit view
   */
  productsEditPage = async (req, res, next) => {
    try {
      const product = await productsService.getProductById(req.params.id);
      if (!product) {
        req.flash('error', 'Product not found');
        return res.redirect('/admin/products');
      }
      
      // Get inventory for this product
      const inventory = await inventoryService.getInventoryByProduct(product.product_id);
      
      res.render('products/edit', {
        title: 'Edit Product',
        product,
        inventory
      });
      
    } catch (error) {
      next(error);
    }
  };

  /**
   * Handle product update
   * @param {Object} req - Express request object
   * @param {string} req.params.id - Product ID
   * @param {Object} req.body - Updated product data
   * @param {Object} res - Express response object
   * @returns {Promise<void>} Updates product and redirects to product list
   */
  productsEdit = async (req, res) => {
    try {
      await productsService.updateProduct(req.params.id, req.body);
      req.flash('success', 'Product updated successfully');
      res.redirect('/admin/products');
    } catch (error) {
      req.flash('error', error.message);
      res.redirect(`/admin/products/edit/${req.params.id}`);
    }
  };

  /**
   * Handle product deletion
   * @param {Object} req - Express request object
   * @param {string} req.params.id - Product ID
   * @param {Object} res - Express response object
   * @returns {Promise<void>} Deletes product and redirects to product list
   */
  productsDelete = async (req, res) => {
    try {
      await productsService.deleteProduct(req.params.id);
      req.flash('success', 'Product deleted successfully');
      res.redirect('/admin/products');
    } catch (error) {
      req.flash('error', error.message);
      res.redirect('/admin/products');
    }
  };

  // ===== SALES / ORDERS =====
  
  /**
   * Render order creation page with available products
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   * @returns {Promise<void>} Renders order creation view
   */
  salesCreatePage = async (req, res, next) => {
    try {
      const products = await productsService.getAllProducts();
      const availableProducts = products.filter(p => p.status === 'available');
      
      res.render('sales/create', {
        title: 'Place Order',
        products: availableProducts
      });
      
    } catch (error) {
      next(error);
    }
  };

  /**
   * Handle order creation with items and optional discount
   * @param {Object} req - Express request object
   * @param {Array|string} req.body.items - Cart items [{product_id, quantity, price}]
   * @param {number} [req.body.discount_percentage] - Optional discount percentage
   * @param {Object} res - Express response object
   * @returns {Promise<void>} Creates sale with items and redirects to receipt
   */
  salesCreate = async (req, res) => {
    try {
      const userId = req.session.user.user_id;
      const { items, discount_percentage } = req.body;
      
      // items = [{ product_id, quantity, price }]
      // Parse if it's JSON string
      const cartItems = typeof items === 'string' ? JSON.parse(items) : items;
      
      if (!cartItems || cartItems.length === 0) {
        req.flash('error', 'Please add at least one product');
        return res.redirect('/sales/create');
      }

      // Step 1: Create sale
      const sale = await salesService.createSale(userId);
      
      // Step 2: Add items
      for (const item of cartItems) {
        await saleItemsService.createSaleItem(
          sale.sale_id,
          item.product_id,
          item.quantity,
          item.price
        );
      }

      // Step 3: Apply discount if provided
      if (discount_percentage && discount_percentage > 0) {
        await salesService.applyDiscount(sale.sale_id, parseFloat(discount_percentage));
      }

      req.flash('success', 'Order placed successfully!');
      res.redirect(`/sales/${sale.sale_id}`);
      
    } catch (error) {
      req.flash('error', error.message);
      res.redirect('/sales/create');
    }
  };

  /**
   * Display customer's personal order history
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   * @returns {Promise<void>} Renders customer's orders view
   */
  myOrders = async (req, res, next) => {
    try {
      const userId = req.session.user.user_id;
      const allSales = await salesService.getAllSales();
      const mySales = allSales.filter(s => s.user_id === userId);
      
      res.render('sales/my-orders', {
        title: 'My Orders',
        sales: mySales
      });
      
    } catch (error) {
      next(error);
    }
  };

  /**
   * Display all orders with optional date range and user filtering (admin only)
   * @param {Object} req - Express request object
   * @param {string} [req.query.startDate] - Start date filter (YYYY-MM-DD format)
   * @param {string} [req.query.endDate] - End date filter (YYYY-MM-DD format)
   * @param {string} [req.query.userId] - User ID filter
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   * @returns {Promise<void>} Renders all orders view with filtering
   */
  allOrders = async (req, res, next) => {
    try {
      const { startDate: startDateRaw, endDate: endDateRaw, userId } = req.query;

      // Normalize date input from <input type="date"> (YYYY-MM-DD) to DD/MM/YYYY expected by service
      const toDDMMYYYY = (isoDate) => {
        if (!isoDate) return null;
        const parts = isoDate.split('-');
        if (parts.length === 3) {
          const [yyyy, mm, dd] = parts;
          return `${dd}/${mm}/${yyyy}`;
        }
        return isoDate; // if already in DD/MM/YYYY
      };


      // Require both dates if one is provided
      if ((startDateRaw && !endDateRaw) || (!startDateRaw && endDateRaw)) {
        req.flash('error', 'Please provide both start and end dates to filter by range.');
        return res.redirect('/admin/sales');
      }

      const startDate = toDDMMYYYY(startDateRaw);
      const endDate = toDDMMYYYY(endDateRaw);

      let sales = [];
      if (startDate && endDate) {
        sales = await salesService.getSalesBetweenDates(startDate, endDate);
      } else {
        sales = await salesService.getAllSales();
      }

      // Optional filter by user ID
      if (userId) {
        const userIdNumber = parseInt(userId, 10);
        if (Number.isNaN(userIdNumber)) {
          req.flash('error', 'User ID must be a number.');
          return res.redirect('/admin/sales');
        }
        sales = sales.filter((s) => Number(s.user_id) === userIdNumber);
      }

      res.render('sales/all-orders', {
        title: 'All Orders',
        sales,
        filters: {
          startDate: startDateRaw || '',
          endDate: endDateRaw || '',
          userId: userId || ''
        }
      });
      
    } catch (error) {
      next(error);
    }
  };

  /**
   * Display order details and receipt
   * @param {Object} req - Express request object
   * @param {string} req.params.id - Sale/Order ID
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   * @returns {Promise<void>} Renders order receipt view with items
   */
  saleDetails = async (req, res, next) => {
    try {
      const saleId = req.params.id;
      const userId = req.session.user.user_id;
      const isAdmin = req.session.user.role === 'admin';
      
      const sale = await salesService.getSaleById(saleId);
      if (!sale) {
        req.flash('error', 'Order not found');
        return res.redirect('/sales');
      }

      // Check permission: customer can only view own sales
      if (!isAdmin && sale.user_id !== userId) {
        return res.status(403).render('403', { title: 'Access Denied' });
      }

      const saleItems = await saleItemsService.getSaleItemsBySaleId(saleId);
      
      res.render('sales/receipt', {
        title: `Order #${saleId}`,
        sale,
        items: saleItems
      });
      
    } catch (error) {
      next(error);
    }
  };

  /**
   * Apply discount to an existing order (admin only)
   * @param {Object} req - Express request object
   * @param {string} req.params.sale_id - Sale/Order ID
   * @param {number} req.body.discount_percentage - Discount percentage to apply
   * @param {Object} res - Express response object
   * @returns {Promise<void>} Applies discount and redirects to order details
   */
  applyOrderDiscount = async (req, res) => {
    try {
      const { sale_id } = req.params;
      const { discount_percentage } = req.body;
      
      await salesService.applyDiscount(sale_id, parseFloat(discount_percentage));
      req.flash('success', `Discount of ${discount_percentage}% applied to order successfully`);
      res.redirect(`/sales/${sale_id}`);
    } catch (error) {
      req.flash('error', error.message);
      res.redirect(`/sales/${req.params.sale_id}`);
    }
  };

  // ===== INVENTORY (Admin Only) =====
  
  /**
   * Display complete inventory list with product details (admin only)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   * @returns {Promise<void>} Renders inventory management view
   */
  inventoryList = async (req, res, next) => {
    try {
      // Use getAllWithDetails to get product names
      const inventory = await inventoryService.getAllWithDetails();
      
      res.render('inventory/list', {
        title: 'Inventory Management',
        inventory
      });
      
    } catch (error) {
      next(error);
    }
  };

  /**
   * Display low stock alert page with products below threshold
   * @param {Object} req - Express request object
   * @param {number} [req.query.threshold=10] - Stock threshold for low stock alert
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   * @returns {Promise<void>} Renders low stock alert view
   */
  inventoryLowStock = async (req, res, next) => {
    try {
      const threshold = req.query.threshold || 10;
      const lowStock = await inventoryService.getLowStockProducts(threshold);
      
      res.render('inventory/low-stock', {
        title: 'Low Stock Alert',
        lowStock,
        threshold
      });
      
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update inventory quantity for a product (admin only)
   * @param {Object} req - Express request object
   * @param {string} req.params.product_id - Product ID
   * @param {number} req.body.quantity_in_stock - New stock quantity
   * @param {Object} res - Express response object
   * @returns {Promise<void>} Updates inventory and redirects to inventory list
   */
  inventoryUpdate = async (req, res) => {
    try {
      const { product_id } = req.params;
      const { quantity_in_stock } = req.body;
      
      await inventoryService.updateInventory(product_id, parseInt(quantity_in_stock));
      req.flash('success', 'Inventory updated');
      res.redirect('/admin/inventory');
      
    } catch (error) {
      req.flash('error', error.message);
      res.redirect('/admin/inventory');
    }
  };

  // ===== USERS (Admin Only) =====
  
  /**
   * Display all users in the system (admin only)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   * @returns {Promise<void>} Renders user management view
   */
  usersList = async (req, res, next) => {
    try {
      const users = await usersService.listUsers();
      
      res.render('users/list', {
        title: 'User Management',
        users
      });
      
    } catch (error) {
      next(error);
    }
  };

  // ===== PROFILE =====
  
  /**
   * Display logged-in user's profile information
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   * @returns {Promise<void>} Renders user profile view
   */
  profile = async (req, res, next) => {
    try {
      const userId = req.session.user.user_id;
      const user = await usersService.getUserById(userId);
      
      res.render('profile', {
        title: 'My Profile',
        user
      });
      
    } catch (error) {
      next(error);
    }
  };
}