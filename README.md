# Zeina Roastery Management System
**CSIS 228 - Advances in Computer Science - Final Project**

A full-stack web application built with Node.js, Express, and EJS for managing a coffee roastery business. Features role-based access control, product management, sales tracking, inventory monitoring, and real-time weather integration.

---

## Table of Contents
1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Project Setup Instructions](#project-setup-instructions)
4. [Database Schema](#database-schema)
5. [API Endpoints & Usage](#api-endpoints--usage)
6. [Frontend Routes](#frontend-routes)
7. [Technical Documentation](#technical-documentation)
8. [Third-Party Libraries & Tools](#third-party-libraries--tools)
9. [External API Integration](#external-api-integration)
10. [Error Handling](#error-handling)
11. [Running and Testing](#running-and-testing)

---

## Project Overview

The Zeina Roastery Management System is a comprehensive web application that demonstrates proficiency in modern web development practices using Node.js and Express framework with EJS templating engine.

### Key Features
- **User Authentication**: Secure login/registration with session management
- **Role-Based Access Control**: Admin, Customer, and Guest roles with different permissions
- **Product Management**: CRUD operations for coffee products
- **Sales Management**: Create and track customer orders
- **Inventory Tracking**: Monitor stock levels with low-stock alerts
- **Weather Integration**: Real-time weather data from OpenWeatherMap API
- **Responsive Design**: Bootstrap-powered UI with custom CSS styling

---

## Technology Stack

### Backend
- **Node.js** (v14+): JavaScript runtime environment
- **Express.js** (v4.18.2): Web application framework
- **PostgreSQL**: Primary database (via `pg` package)

### Frontend
- **EJS** (v3.1.9): Templating engine for dynamic content rendering
- **express-ejs-layouts** (v2.5.1): Layout support for EJS
- **Bootstrap 5.3.0**: CSS framework for responsive design
- **Bootstrap Icons**: Icon library
- **Custom CSS**: Additional styling in `public/css/style.css`

### Security & Validation
- **bcrypt** (v6.0.0): Password hashing
- **express-session** (v1.17.3): Session management
- **express-validator** (v7.3.1): Request validation

### Additional Tools
- **dotenv** (v16.3.1): Environment variable management
- **connect-flash** (v0.1.1): Flash messages for user feedback
- **cors** (v2.8.5): Cross-origin resource sharing
- **nodemon** (v3.0.1): Development auto-reload

---

## Project Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- npm (Node Package Manager)
- PostgreSQL database server

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/elias12-12/zeina.git
   cd RMGproject
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Database Setup**
   - Create a PostgreSQL database
   - Run the schema from `database/schema.sql`:
     ```bash
     psql -U your_username -d your_database -f database/schema.sql
     ```

4. **Environment Configuration**
   Create a `.env` file in the project root:
   ```env
   PORT=4000
   SESSION_SECRET=your_super_secret_key_here
   WEATHER_API_KEY=your_openweathermap_api_key
   NODE_ENV=development
   
   # Database Configuration
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=roastery_db
   DB_USER=postgres
   DB_PASSWORD=your_password
   ```

5. **Get OpenWeatherMap API Key** (Optional but recommended)
   - Visit [OpenWeatherMap](https://openweathermap.org/api)
   - Sign up for a free account
   - Generate an API key
   - Add it to your `.env` file

6. **Start the application**
   - Development mode (with auto-reload):
     ```bash
     npm run dev
     ```
   - Production mode:
     ```bash
     npm start
     ```

7. **Access the application**
   - Open your browser and navigate to: `http://localhost:4000`
   - Default admin credentials (if seeded): Check with your database setup

---

## Database Schema

The application uses PostgreSQL with the following schema:

### Users Table
```sql
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT UNIQUE,
    phone_number TEXT,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'customer', 'guest'))
);
```
**Description**: Stores user information with role-based access control.

### Products Table
```sql
CREATE TABLE products (
    product_id SERIAL PRIMARY KEY,
    product_name VARCHAR(100) NOT NULL,
    description TEXT,
    unit_price NUMERIC(10,2) NOT NULL,
    product_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('available', 'not available'))
);
```
**Description**: Contains coffee product catalog with pricing and availability.

### Sales Table
```sql
CREATE TABLE sales (
    sale_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
    sale_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    total_amount NUMERIC(10,2)
);
```
**Description**: Tracks customer orders/sales transactions.

### Sale Items Table
```sql
CREATE TABLE sale_items (
    sale_item_id SERIAL PRIMARY KEY,
    sale_id INTEGER NOT NULL REFERENCES sales(sale_id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(product_id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price_at_sale DECIMAL(10,2) NOT NULL CHECK (price_at_sale >= 0)
);
```
**Description**: Line items for each sale, capturing product details at time of purchase.

### Inventory Table
```sql
CREATE TABLE inventory (
    inventory_id SERIAL PRIMARY KEY,
    product_id INTEGER UNIQUE NOT NULL REFERENCES products(product_id) ON DELETE CASCADE,
    quantity_in_stock INTEGER NOT NULL CHECK (quantity_in_stock >= 0),
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```
**Description**: Monitors stock levels for each product with update tracking.

---

## API Endpoints & Usage

All API endpoints return JSON responses and follow REST conventions.

### Authentication Endpoints

#### POST `/api/users/login`
**Description**: Authenticate a user and create a session  
**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```
**Response**: `200 OK`
```json
{
  "message": "Login successful",
  "user": {
    "user_id": 1,
    "first_name": "John",
    "last_name": "Doe",
    "email": "user@example.com",
    "role": "customer"
  }
}
```

#### POST `/api/users/register`
**Description**: Register a new customer account  
**Request Body**:
```json
{
  "first_name": "Jane",
  "last_name": "Smith",
  "email": "jane@example.com",
  "password": "securepass",
  "phone_number": "1234567890"
}
```
**Response**: `201 Created`

### User Management (Admin Only)

#### GET `/api/users`
**Description**: Retrieve all users  
**Authorization**: Admin only  
**Response**: `200 OK` - Array of user objects

#### PATCH `/api/users/:user_id`
**Description**: Update user information  
**Parameters**: `user_id` (integer)  
**Request Body**: Partial user object  
**Response**: `201 Updated`

#### DELETE `/api/users/:user_id`
**Description**: Delete a user  
**Parameters**: `user_id` (integer)  
**Response**: `204 No Content`

### Products Endpoints

#### GET `/api/products`
**Description**: Retrieve all products  
**Response**: `200 OK` - Array of product objects

#### GET `/api/products/:product_id`
**Description**: Get a single product by ID  
**Parameters**: `product_id` (integer)  
**Response**: `200 OK` or `404 Not Found`

#### POST `/api/products`
**Description**: Create a new product (Admin only)  
**Request Body**:
```json
{
  "product_name": "Ethiopian Yirgacheffe",
  "description": "Light roast with floral notes",
  "unit_price": 18.50,
  "product_type": "Coffee Beans",
  "status": "available"
}
```
**Response**: `201 Created`

#### PUT `/api/products/:product_id`
**Description**: Update a product (Admin only)  
**Parameters**: `product_id` (integer)  
**Request Body**: Partial product object  
**Response**: `200 OK` or `404 Not Found`

#### DELETE `/api/products/:product_id`
**Description**: Delete a product (Admin only)  
**Parameters**: `product_id` (integer)  
**Response**: `204 No Content`

### Sales Endpoints

#### GET `/api/sales`
**Description**: Retrieve all sales (Admin sees all, customers see their own)  
**Response**: `200 OK` - Array of sale objects

#### GET `/api/sales/:sale_id`
**Description**: Get a specific sale by ID  
**Parameters**: `sale_id` (integer)  
**Response**: `200 OK` or `404 Not Found`

#### POST `/api/sales`
**Description**: Create a new sale  
**Request Body**:
```json
{
  "user_id": 5,
  "items": [
    {
      "product_id": 2,
      "quantity": 2
    }
  ]
}
```
**Response**: `201 Created`

### Inventory Endpoints

#### GET `/api/inventory`
**Description**: Retrieve all inventory records  
**Response**: `200 OK` - Array of inventory objects

#### GET `/api/inventory/low-stock`
**Description**: Get products with low stock levels  
**Query Parameters**: `threshold` (optional, default 10)  
**Response**: `200 OK`

#### PUT `/api/inventory/:product_id`
**Description**: Update inventory quantity  
**Parameters**: `product_id` (integer)  
**Request Body**:
```json
{
  "quantity_in_stock": 50
}
```
**Response**: `200 OK`

### Health Check

#### GET `/health`
**Description**: Check application and database health  
**Response**: `200 OK`
```json
{
  "ok": true
}
```

---

## Frontend Routes

The application serves EJS-rendered pages with role-based access control.

### Public Routes
- `GET /` - Home/landing page
- `GET /login` - Login page
- `GET /register` - Registration page
- `GET /guest-login` - Guest access (browse only)
- `GET /products` - Public product catalog
- `GET /weather` - Weather information page

### Customer Routes (Authentication Required)
- `GET /dashboard` - Customer dashboard with order stats
- `GET /profile` - User profile page
- `GET /products` - Browse products
- `GET /sales/create` - Create new order
- `GET /sales/my-orders` - View personal orders
- `GET /sales/:sale_id` - Order details/receipt

### Admin Routes (Admin Role Required)
- `GET /admin/dashboard` - Admin dashboard with analytics
- `GET /admin/products` - Product management list
- `GET /admin/products/create` - Add new product form
- `GET /admin/products/edit/:product_id` - Edit product form
- `POST /admin/products/delete/:product_id` - Delete product
- `GET /admin/sales` - View all customer orders
- `GET /admin/inventory` - Inventory management
- `GET /admin/inventory/low-stock` - Low stock alerts
- `GET /admin/users` - User management

### Logout
- `GET /logout` - End user session

---

## Technical Documentation

This section provides detailed method documentation for all services.

### UsersServices

#### `registerUser(userData)`
**Description**: Create a new user account with hashed password  
**Parameters**:
- `userData` (Object): User registration data
  - `first_name` (string, required)
  - `last_name` (string, required)
  - `email` (string, required, unique)
  - `password` (string, required, min 6 characters)
  - `phone_number` (string, optional)
  - `role` (string, default 'customer')

**Returns**: Promise<Object> - Created user object (without password)  
**Throws**: Error if email already exists or validation fails

#### `loginUser(email, password)`
**Description**: Authenticate user credentials and generate session  
**Parameters**:
- `email` (string, required): User email address
- `password` (string, required): Plain text password

**Returns**: Promise<Object>
```javascript
{
  message: "Login successful",
  user: { user_id, first_name, last_name, email, role }
}
```
**Throws**: Error with message "Invalid credentials" if authentication fails

#### `listUsers()`
**Description**: Retrieve all users from database  
**Parameters**: None  
**Returns**: Promise<Array<Object>> - Array of user objects  
**Throws**: Error if database query fails

#### `getUsers(user_id)`
**Description**: Get a specific user by ID  
**Parameters**:
- `user_id` (number, required): User ID

**Returns**: Promise<Object|null> - User object or null if not found  
**Throws**: Error if user_id is invalid

#### `updateUsers(user_id, updates)`
**Description**: Update user information  
**Parameters**:
- `user_id` (number, required): User ID
- `updates` (Object): Fields to update (partial user object)

**Returns**: Promise<Object> - Updated user object  
**Throws**: Error if update fails or user not found

#### `deleteUsers(user_id)`
**Description**: Delete a user from the system  
**Parameters**:
- `user_id` (number, required): User ID

**Returns**: Promise<boolean> - true if deleted successfully  
**Throws**: Error if user not found or deletion fails

---

### ProductsServices

#### `createProduct(productData)`
**Description**: Create a new product in the catalog  
**Parameters**:
- `productData` (Object, required):
  - `product_name` (string, required)
  - `description` (string, optional)
  - `unit_price` (number, required, > 0)
  - `product_type` (string, required)
  - `status` (string, required, 'available' | 'not available')

**Returns**: Promise<Object> - Created product with product_id  
**Throws**: Error if required fields missing or validation fails

#### `getAllProducts()`
**Description**: Retrieve all products from the catalog  
**Parameters**: None  
**Returns**: Promise<Array<Object>> - Array of product objects  
**Throws**: Error if database query fails

#### `getProductById(product_id)`
**Description**: Get a single product by its ID  
**Parameters**:
- `product_id` (number, required): Product ID

**Returns**: Promise<Object|null> - Product object or null if not found  
**Throws**: Error if product_id is invalid (non-numeric)

#### `updateProduct(product_id, updates)`
**Description**: Update product information  
**Parameters**:
- `product_id` (number, required): Product ID
- `updates` (Object, required): Fields to update

**Returns**: Promise<Object> - Updated product object  
**Throws**: Error if product not found or no data provided

#### `deleteProduct(product_id)`
**Description**: Remove a product from the catalog  
**Parameters**:
- `product_id` (number, required): Product ID

**Returns**: Promise<boolean> - true if successfully deleted  
**Throws**: Error if product not found or has dependencies

---

### SalesServices

#### `getAllSales()`
**Description**: Retrieve all sales records  
**Parameters**: None  
**Returns**: Promise<Array<SalesDTO>> - Array of sales data transfer objects  
**Throws**: Error if query fails

#### `getSaleById(sale_id)`
**Description**: Get a specific sale by ID  
**Parameters**:
- `sale_id` (number, required): Sale ID

**Returns**: Promise<SalesDTO|null> - Sale DTO or null  
**Throws**: Error if sale_id is invalid

#### `createSale(user_id)`
**Description**: Create a new sale record for a user  
**Parameters**:
- `user_id` (number, required): Customer user ID

**Returns**: Promise<Object> - Created sale with sale_id and timestamp  
**Throws**: Error if user_id is invalid or creation fails

#### `getSalesByCustomer(user_id)`
**Description**: Get all sales for a specific customer  
**Parameters**:
- `user_id` (number, required): Customer user ID

**Returns**: Promise<Array<SalesDTO>> - Array of customer's sales  
**Throws**: Error if user_id is invalid

#### `getSalesBetweenDates(startDate, endDate)`
**Description**: Retrieve sales within a date range  
**Parameters**:
- `startDate` (string, required): Format "DD/MM/YYYY"
- `endDate` (string, required): Format "DD/MM/YYYY"

**Returns**: Promise<Array<SalesDTO>> - Filtered sales  
**Throws**: Error if date format is invalid

#### `getTotal()`
**Description**: Calculate total revenue from all sales  
**Parameters**: None  
**Returns**: Promise<number> - Total sales amount  
**Throws**: Error if calculation fails

#### `getCount()`
**Description**: Get total count of all sales  
**Parameters**: None  
**Returns**: Promise<number> - Number of sales  
**Throws**: Error if query fails

---

### InventoryServices

#### `getAllInventory()`
**Description**: Retrieve all inventory records with product details  
**Parameters**: None  
**Returns**: Promise<Array<Object>> - Array of inventory items with product info  
**Throws**: Error if query fails

#### `getInventoryByProduct(product_id)`
**Description**: Get inventory record for a specific product  
**Parameters**:
- `product_id` (number, required): Product ID

**Returns**: Promise<Object|null> - Inventory record or null  
**Throws**: Error if product_id is invalid

#### `updateInventory(product_id, updates)`
**Description**: Update inventory quantity for a product  
**Parameters**:
- `product_id` (number, required): Product ID
- `updates` (Object, required):
  - `quantity_in_stock` (number, required, >= 0)

**Returns**: Promise<Object> - Updated inventory record  
**Throws**: Error if quantity is negative or update fails

#### `getLowStockProducts(threshold = 10)`
**Description**: Get products with stock below threshold  
**Parameters**:
- `threshold` (number, optional, default 10): Minimum stock level

**Returns**: Promise<Array<Object>> - Low stock products  
**Throws**: Error if query fails

---

### SaleItemsServices

#### `createSaleItem(sale_id, product_id, quantity, price_at_sale)`
**Description**: Add an item to a sale order  
**Parameters**:
- `sale_id` (number, required): Parent sale ID
- `product_id` (number, required): Product being purchased
- `quantity` (number, required, > 0): Number of units
- `price_at_sale` (number, required, >= 0): Price at time of sale

**Returns**: Promise<Object> - Created sale item with sale_item_id  
**Throws**: Error if validation fails or insufficient inventory

#### `getSaleItemsBySale(sale_id)`
**Description**: Get all items for a specific sale  
**Parameters**:
- `sale_id` (number, required): Sale ID

**Returns**: Promise<Array<Object>> - Array of sale items with product details  
**Throws**: Error if sale_id is invalid

---

### WeatherService

#### `fetchCurrentWeather(city = 'Beirut, LB')`
**Description**: Fetch current weather data from OpenWeatherMap API  
**Parameters**:
- `city` (string, optional, default 'Beirut, LB'): City name with country code

**Returns**: Promise<Object>
```javascript
{
  data: {
    city: "Beirut",
    country: "LB",
    description: "clear sky",
    icon: "01d",
    temperature: 22,
    feelsLike: 21,
    humidity: 65,
    tempMin: 20,
    tempMax: 24,
    windSpeed: 3.5,
    updatedAt: Date
  },
  error: null
}
```
Or if error:
```javascript
{
  data: null,
  error: "Error message"
}
```
**Throws**: Never throws - errors returned in response object  
**Notes**: 
- Requires `WEATHER_API_KEY` in environment
- Gracefully degrades if API key missing
- 8-second timeout for API requests

---

### PagesController

#### `loginPage(req, res)`
**Description**: Render login page  
**Parameters**: Express req, res objects  
**Returns**: Rendered EJS template 'auth/login'

#### `login(req, res)`
**Description**: Process login form submission  
**Parameters**: Express req, res objects  
**Request Body**: email, password  
**Returns**: Redirect to dashboard or admin panel  
**Side Effects**: Creates session, sets flash messages

#### `register(req, res)`
**Description**: Process registration form  
**Parameters**: Express req, res objects  
**Request Body**: first_name, last_name, email, password, phone_number  
**Returns**: Redirect to login on success  
**Side Effects**: Creates new user, sets flash message

#### `logout(req, res)`
**Description**: End user session  
**Parameters**: Express req, res objects  
**Returns**: Redirect to login page  
**Side Effects**: Destroys session

#### `adminDashboard(req, res, next)`
**Description**: Render admin dashboard with analytics  
**Parameters**: Express req, res, next objects  
**Returns**: Rendered 'dashboard-admin' template with:
- `stats`: { totalRevenue, totalSales, totalProducts, lowStockCount, todaySales }
- `recentSales`: Last 10 sales
- `lowStock`: Products with low inventory
- `weather`: Current weather data
**Throws**: Passes errors to error handler

#### `customerDashboard(req, res, next)`
**Description**: Render customer dashboard with personal stats  
**Parameters**: Express req, res, next objects  
**Returns**: Rendered 'dashboard-customer' template with:
- `stats`: { totalOrders, totalSpent, recentOrders }
- `weather`: Current weather data
**Throws**: Passes errors to error handler

#### `weatherPage(req, res, next)`
**Description**: Render standalone weather page  
**Parameters**: Express req, res, next objects  
**Query Parameters**: city (optional)  
**Returns**: Rendered 'weather' template with weather data  
**Throws**: Passes errors to error handler

---

## Third-Party Libraries & Tools

### Server Dependencies
- **express** (v4.18.2): Fast, unopinionated web framework for Node.js
- **express-session** (v1.17.3): Session middleware for Express
- **express-ejs-layouts** (v2.5.1): Layout support for EJS templates
- **cors** (v2.8.5): Enable Cross-Origin Resource Sharing
- **dotenv** (v16.3.1): Load environment variables from .env file
- **connect-flash** (v0.1.1): Flash message middleware

### Database
- **pg** (v8.16.3): PostgreSQL client for Node.js

### Security & Validation
- **bcrypt** (v6.0.0): Password hashing library
- **express-validator** (v7.3.1): Request validation middleware

### Frontend
- **ejs** (v3.1.9): Embedded JavaScript templating
- **Bootstrap 5.3.0** (CDN): CSS framework for responsive design
- **Bootstrap Icons 1.11.0** (CDN): Icon library

### Development
- **nodemon** (v3.0.1): Auto-restart server on file changes

---

## External API Integration

### OpenWeatherMap API

**Purpose**: Provides real-time weather information integrated into the application.

**Implementation**:
- Service file: `src/services/WeatherService.js`
- API endpoint: `https://api.openweathermap.org/data/2.5/weather`
- Default location: Beirut, Lebanon
- Response format: JSON with current weather conditions

**Features**:
- Temperature (Celsius)
- Weather description and icon
- Humidity and wind speed
- Feels-like temperature
- Min/max temperatures

**Integration Points**:
1. **Admin Dashboard**: Weather widget in header
2. **Customer Dashboard**: Weather widget in header
3. **Dedicated Weather Page**: Full weather display at `/weather`

**Configuration**:
```env
WEATHER_API_KEY=your_api_key_here
```

**Error Handling**:
- Graceful degradation when API key is missing
- 8-second timeout for API requests
- User-friendly error messages
- Never crashes the application

**Example Usage**:
```javascript
const weatherService = new WeatherService();
const { data, error } = await weatherService.fetchCurrentWeather('Paris, FR');

if (error) {
  console.log('Weather unavailable:', error);
} else {
  console.log(`Temperature: ${data.temperature}°C`);
}
```

---

## Error Handling

The application implements comprehensive error handling across multiple layers.

### Server-Side Error Handling

#### API Error Handler (`src/middlewares/errorHandler.js`)
**Description**: Centralized error handling middleware for API routes  
**Signature**: `errorHandler(err, req, res, next)`

**Handles**:
1. **Validation Errors** (400)
   - Express-validator errors
   - Returns structured validation messages

2. **Database Connection Errors** (503)
   - Connection refused
   - Host not found
   - Returns service unavailable

3. **Database Constraint Violations** (400)
   - PostgreSQL constraint errors (codes starting with '23')
   - Foreign key violations
   - Unique constraint violations

4. **Generic Server Errors** (500)
   - Unexpected errors
   - Includes error details in development mode

**Example Response**:
```json
{
  "message": "Validation Error",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

#### Frontend Error Handler (in `src/app.js`)
**Description**: Renders user-friendly error pages for frontend routes

**404 Handler**:
- Detects missing routes
- Renders `views/404.ejs` for page routes
- Returns JSON for API routes

**500 Handler**:
- Catches unhandled errors
- Renders `views/error.ejs` with error message
- Logs errors to console for debugging

### Client-Side Error Handling

#### Flash Messages (`src/views/partials/_flash.ejs`)
**Description**: User-friendly notifications for operations  
**Types**:
- Success (green): Successful operations
- Error (red): Failed operations
- Info (blue): Informational messages

**Usage in Controllers**:
```javascript
req.flash('success', 'Product created successfully');
req.flash('error', 'Failed to create product');
req.flash('info', 'Please login to continue');
```

#### Form Validation
- Client-side HTML5 validation
- Server-side express-validator rules
- Clear error messages displayed to users

### Service Layer Error Handling

All service methods wrap operations in try-catch blocks:
```javascript
async createProduct(productData) {
  try {
    // Validation
    if (!productData.product_name) {
      throw new Error("Product name is required");
    }
    // Operation
    return await this.repository.create(productData);
  } catch (error) {
    throw new Error(`Failed to create product: ${error.message}`);
  }
}
```

### Best Practices Implemented
 Never expose sensitive error details to users  
 Log all errors server-side for debugging  
 Provide helpful error messages  
 Graceful degradation (e.g., weather widget)  
 Proper HTTP status codes  
 Validation at multiple layers  

---

## Running and Testing

### Starting the Application

**Development Mode** (recommended for testing):
```bash
npm run dev
```
- Uses nodemon for auto-reload
- Detailed error messages
- Hot reloading on file changes

**Production Mode**:
```bash
npm start
```
- Runs with Node.js directly
- Optimized for performance

### Testing the Application

#### 1. Health Check
```bash
# Test if server and database are running
curl http://localhost:4000/health
# Expected: {"ok": true}
```

#### 2. Manual Testing Workflow

**A. Test User Registration**
1. Navigate to `http://localhost:4000/register`
2. Fill in the registration form
3. Submit and verify redirect to login
4. Check database: `SELECT * FROM users WHERE email='your_email';`

**B. Test User Login**
1. Go to `http://localhost:4000/login`
2. Enter credentials
3. Verify redirect to appropriate dashboard (admin/customer)
4. Check session in browser dev tools

**C. Test Admin Features** (requires admin account)
1. Login as admin
2. Visit `/admin/dashboard` - check statistics display
3. Visit `/admin/products` - view product list
4. Click "Add New Product" - test creation form
5. Edit a product - test update functionality
6. Try deleting a product - confirm modal appears
7. Visit `/admin/inventory` - check stock levels
8. Visit `/admin/users` - view user management

**D. Test Customer Features**
1. Login as customer
2. Visit `/dashboard` - view personal stats
3. Visit `/products` - browse catalog
4. Visit `/sales/create` - create an order
5. Visit `/sales/my-orders` - verify order appears
6. Click on an order - view receipt

**E. Test Guest Access**
1. Click "Continue as Guest"
2. Verify limited access (can browse products)
3. Attempt to create order - should be blocked

**F. Test Weather Integration**
1. Visit `/weather`
2. Test with default city (Beirut, LB)
3. Change city to "Paris, FR" and submit
4. Verify weather data updates
5. Test with invalid city - check error handling

#### 3. API Testing with curl

**User Login**:
```bash
curl -X POST http://localhost:4000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

**Get All Products**:
```bash
curl http://localhost:4000/api/products
```

**Create Product** (requires admin):
```bash
curl -X POST http://localhost:4000/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "product_name":"Colombian Supreme",
    "description":"Medium roast",
    "unit_price":16.99,
    "product_type":"Coffee Beans",
    "status":"available"
  }'
```

**Get Low Stock Inventory**:
```bash
curl http://localhost:4000/api/inventory/low-stock?threshold=15
```

#### 4. Browser Testing Checklist

- [ ] Navigation menu displays correctly for each role
- [ ] All links work and navigate properly
- [ ] Forms validate input correctly
- [ ] Flash messages appear and dismiss
- [ ] Responsive design works on mobile
- [ ] Images and icons load properly
- [ ] Bootstrap styles render correctly
- [ ] Session persists across page refreshes
- [ ] Logout clears session

#### 5. Error Testing

**Test 404 Handling**:
- Visit `http://localhost:4000/nonexistent-page`
- Should show custom 404 page

**Test Error Page**:
- Temporarily break a route to trigger 500 error
- Verify error page displays

**Test Validation**:
- Submit empty forms
- Enter invalid email formats
- Try negative prices
- Verify error messages appear

### Troubleshooting

**Problem**: Server won't start  
**Solution**: 
- Check if port 4000 is already in use
- Verify PostgreSQL is running
- Check .env file configuration

**Problem**: Database connection error  
**Solution**:
- Verify PostgreSQL service is running
- Check database credentials in .env
- Ensure database exists: `psql -l`

**Problem**: Weather widget shows error  
**Solution**:
- Verify WEATHER_API_KEY in .env
- Check API key is valid on OpenWeatherMap
- Test API key directly: `curl "https://api.openweathermap.org/data/2.5/weather?q=Beirut,LB&appid=YOUR_KEY"`

**Problem**: Login fails  
**Solution**:
- Check if user exists in database
- Verify password is correctly hashed
- Check session configuration

**Problem**: 403 Forbidden errors  
**Solution**:
- Verify user role permissions
- Check authentication middleware
- Ensure session is active

---

## Project Structure

```
RMGproject/
├── database/
│   └── schema.sql              # Database schema definition
├── public/
│   ├── css/
│   │   └── style.css           # Custom CSS styling
│   ├── js/
│   │   └── main.js             # Client-side JavaScript
│   └── site.webmanifest        # PWA manifest
├── src/
│   ├── config/
│   │   └── db.js               # Database configuration
│   ├── controllers/            # Request handlers
│   │   ├── InventoryControllers.js
│   │   ├── PagesController.js  # Frontend page controllers
│   │   ├── ProductsController.js
│   │   ├── SaleItemsControllers.js
│   │   ├── SalesControllers.js
│   │   └── UsersController.js
│   ├── domain/
│   │   ├── dto/                # Data Transfer Objects
│   │   ├── entities/           # Domain entities
│   │   └── repositories/       # Database access layer
│   ├── middleware/             # Custom middleware
│   │   └── auth.middleware.js  # Authentication
│   ├── middlewares/
│   │   ├── auth.js
│   │   └── errorHandler.js     # Error handling
│   ├── routes/                 # Route definitions
│   │   ├── index.js
│   │   ├── InventoryRoutes.js
│   │   ├── pages.routes.js     # Frontend routes
│   │   ├── productsRoutes.js
│   │   ├── SaleItemsRoutes.js
│   │   ├── salesRoutes.js
│   │   └── usersRoutes.js
│   ├── services/               # Business logic
│   │   ├── InventoryServices.js
│   │   ├── ProductsServices.js
│   │   ├── SaleItemsServices.js
│   │   ├── SalesServices.js
│   │   ├── UsersServices.js
│   │   └── WeatherService.js   # Weather API integration
│   ├── validators/             # Request validation rules
│   ├── views/                  # EJS templates
│   │   ├── layouts/            # Page layouts
│   │   │   ├── auth.ejs
│   │   │   └── main.ejs
│   │   ├── partials/           # Reusable components
│   │   │   ├── _flash.ejs
│   │   │   ├── _footer.ejs
│   │   │   └── _navbar.ejs
│   │   ├── auth/               # Authentication pages
│   │   ├── inventory/          # Inventory pages
│   │   ├── products/           # Product pages
│   │   ├── sales/              # Sales pages
│   │   └── users/              # User management
│   ├── app.js                  # Express app configuration
│   └── server.js               # Server entry point
├── .env                        # Environment variables (create this)
├── package.json                # Dependencies and scripts
└── README.md                   # This file
```

---

## EJS Templating & Modularity

The application demonstrates excellent use of EJS templating with a modular, component-based structure.

### Layouts
- **main.ejs**: Primary layout with navbar, flash messages, footer
- **auth.ejs**: Clean layout for login/register pages

### Partials (Reusable Components)
- **_navbar.ejs**: Dynamic navigation based on user role
- **_footer.ejs**: Consistent footer across all pages
- **_flash.ejs**: Flash message display component

### Dynamic Content Rendering
- Data passed from controllers to views via `res.render()`
- EJS expressions `<%= variable %>` for escaped output
- EJS scriptlets `<% logic %>` for control flow
- Conditional rendering based on user roles
- Looping through arrays of products, sales, users

### Code Reusability Examples
```ejs
<!-- Partial inclusion -->
<%- include('../partials/_navbar') %>

<!-- Conditional rendering by role -->
<% if (currentUser.role === 'admin') { %>
  <!-- Admin-only content -->
<% } %>

<!-- Looping through data -->
<% products.forEach(product => { %>
  <div class="product-card">
    <%= product.product_name %>
  </div>
<% }) %>
```

---

## Security Features

-  Password hashing with bcrypt
-  Session-based authentication
-  Role-based access control
-  CSRF protection via session
-  Input validation with express-validator
-  SQL injection prevention (parameterized queries)
-  HTTP-only cookies
-  Environment variable protection

---

## Development Team

- **Developer**: Elias Saab
- **Course**: CSIS 228 - Advances in Computer Science
- **Institution**: University of Balamand - Faculty of Arts & Sciences
- **Repository**: [github.com/elias12-12/zeina](https://github.com/elias12-12/zeina)

---

## License

This project is developed for educational purposes as part of CSIS 228 coursework.

---

**Last Updated**: December 7, 2025
- Password hashing (handled by backend)
- Role-based route protection
- CSRF protection (via session)
- Input validation
- SQL injection prevention (handled by backend)

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Troubleshooting

### Frontend won't start
- Check if port 3000 is available
- Verify Node.js version (v18+)
- Run `npm install` to ensure all dependencies are installed

### Cannot connect to backend API
- Verify backend is running on port 4000
- Check `API_BASE_URL` in `.env` file
- Check backend CORS settings

### Weather widget not showing
- Verify `WEATHER_API_KEY` is set in `.env`
- Check API key is valid
- Weather API has rate limits on free tier

### Session not persisting
- Check `SESSION_SECRET` in `.env`
- Clear browser cookies
- Verify session middleware is configured correctly

### 403 Access Denied errors
- Verify user role in database
- Check middleware configuration
- Ensure user is logged in

### Products/Sales not loading
- Verify backend API is running
- Check API endpoint URLs
- Check browser console for errors
- Verify database connection in backend

## Development

### Adding New Features

1. **Create Route**: Add route handler in `routes/` directory
2. **Create View**: Add EJS template in `views/pages/` directory
3. **Add API Helper**: Add API call function in `utils/apiHelper.js`
4. **Update Navigation**: Add link in `views/partials/header.ejs` (if needed)

### Code Style

- Use async/await (no callbacks)
- Consistent naming conventions (camelCase for variables, PascalCase for classes)
- Proper indentation (2 spaces)
- Comments for complex logic
- Error handling in all routes

## Testing Checklist

After installation, verify the following:

- [ ] Backend API running on port 4000
- [ ] Frontend server running on port 3000
- [ ] Can register a new customer
- [ ] Can login as customer
- [ ] Dashboard displays correctly
- [ ] Can view products
- [ ] Can create a sale (customer)
- [ ] Can view own sales only (customer)
- [ ] Can logout
- [ ] Can login as admin
- [ ] Can create/edit/delete products (admin)
- [ ] Can view inventory (admin)
- [ ] Can view low stock alerts (admin)
- [ ] Can view all users (admin)
- [ ] Can view all sales (admin)
- [ ] Customer cannot access admin pages (403 error)

## Author

Roastery Management System - Frontend Application - ELIAS SAAB

