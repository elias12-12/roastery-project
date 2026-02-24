import { SalesDTO } from '../domain/dto/SalesDTO.js';

/**
 * SalesServices - Business logic for sales operations
 * Methods:
 * - getAllSales(): Gets all sales records
 * - getSaleById(id): Gets a sale by ID
 * - createSale(data): Creates a new sale
 * - updateSale(id, data): Updates sale info
 * - deleteSale(id): Removes a sale record
 */
export class SalesServices {
    constructor(salesRepository) {
        this.salesRepository = salesRepository;
    }

    /**
     * Retrieve all sales and return as DTOs
     * @returns {Promise<SalesDTO[]>} Array of sale DTOs
     */
    async getAllSales() {
        try {
            const sales = await this.salesRepository.findAll();
            return sales.map(sale => SalesDTO.fromEntity(sale));
        } catch (error) {
            throw new Error(`Failed to list sales: ${error.message}`);
        }

    }

    /**
     * Get a sale by ID and return DTO, or null if not found
     * @param {number} sale_id - Sale ID
     * @returns {Promise<SalesDTO|null>} Sale DTO or null if not found
     */
    async getSaleById(sale_id) {
        try {
            if (!sale_id || isNaN(sale_id)) {
                throw new Error('Invalid sale ID');
            }
            const sale = await this.salesRepository.findById(sale_id);
            return sale ? SalesDTO.fromEntity(sale) : null;
        } catch (error) {
            throw new Error(`Failed to get sale: ${error.message}`);
        }
    }
    async getTotal(){
        try {
            const total=await this.salesRepository.getTotal();
            return total;
        } catch (error) {
            throw new Error(`Failed to get total: ${error.message}`);
        }
    }
    
    /**
     * Get sales between two dates (DD/MM/YYYY) and return DTOs
     */
    async getSalesBetweenDates(startDate, endDate) {
    try {
        if (!startDate || !endDate) {
            throw new Error('Start date and end date are required');
        }

        const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
        if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
            throw new Error('Invalid date format. Use DD/MM/YYYY');
        }

        const sales = await this.salesRepository.findBetweenDates(startDate, endDate);
        return sales.map(sale => SalesDTO.fromEntity(sale));
        
    } catch (error) {
        throw new Error(`Failed to get sales: ${error.message}`);
    }

    }
    /**
     * Get sales for a specific customer (user_id) and return DTOs
     */
    async getSalesByCustomer(user_id) {
        try {
            if (!user_id || isNaN(user_id)) {
                throw new Error('Invalid user ID');
            }
            const sales = await this.salesRepository.findByCustomer(user_id);
            return sales.map(sale => SalesDTO.fromEntity(sale));
        } catch (error) {
            throw new Error(`Failed to get sales by customer: ${error.message}`);
        }

    }
    async getCount(){
        try {
            const count=await this.salesRepository.getCount();
            return count;
            
        } catch (error) {
            throw new Error('Failed to get all sales counts');
        }
    }

    /**
     * Create a new sale for a given user_id and return DTO
     * @param {number} user_id - User ID
     * @returns {Promise<SalesDTO>} Created sale DTO
     */
    async createSale(user_id) {
        try {
            if (!user_id || isNaN(user_id)) {
                throw new Error('Invalid user ID');
            }
            const sale = await this.salesRepository.create({ user_id });
            return SalesDTO.fromEntity(sale);
        } catch (error) {
            throw new Error(`Failed to create sale: ${error.message}`);
        }

    }

    /**
     * Create a sale with items atomically using database transaction
     * This ensures all operations (sale creation, item creation, inventory updates) succeed or fail together
     * @param {number} user_id - User ID
     * @param {Array} items - Array of sale items { product_id, quantity, price_at_sale }
     * @param {number} [discount_percentage=0] - Optional discount percentage (0-100)
     * @returns {Promise<SalesDTO>} Created sale DTO with calculated totals
     */
    async createSaleWithItems(user_id, items, discount_percentage = 0) {
        const { pool } = await import('../config/db.js');
        const client = await pool.connect();
        
        try {
            await client.query('BEGIN');
            
            // Validate inputs
            if (!user_id || isNaN(user_id)) {
                throw new Error('Invalid user ID');
            }
            if (!items || !Array.isArray(items) || items.length === 0) {
                throw new Error('Sale must have at least one item');
            }
            if (discount_percentage < 0 || discount_percentage > 100) {
                throw new Error('Discount percentage must be between 0 and 100');
            }
            
            // 1. Create sale record
            const saleResult = await client.query(
                `INSERT INTO sales (user_id, subtotal, discount_percentage, discount_amount, total_amount)
                 VALUES ($1, 0, 0, 0, 0)
                 RETURNING sale_id, user_id, TO_CHAR(sale_date, 'DD/MM/YYYY') as sale_date, subtotal, discount_percentage, discount_amount, total_amount`,
                [user_id]
            );
            const sale = saleResult.rows[0];
            const sale_id = sale.sale_id;
            
            let subtotal = 0;
            
            // 2. Create sale items and update inventory atomically
            for (const item of items) {
                const { product_id, quantity, price_at_sale } = item;
                
                if (!product_id || !quantity || !price_at_sale) {
                    throw new Error('Each item must have product_id, quantity, and price_at_sale');
                }
                
                // Lock inventory row
                const invResult = await client.query(
                    `SELECT quantity_in_stock FROM inventory WHERE product_id = $1 FOR UPDATE`,
                    [product_id]
                );
                
                if (invResult.rowCount === 0) {
                    throw new Error(`Inventory record for product ${product_id} not found`);
                }
                
                const availableStock = parseInt(invResult.rows[0].quantity_in_stock, 10);
                if (availableStock < quantity) {
                    throw new Error(`Insufficient stock for product ${product_id}. Available: ${availableStock}, Requested: ${quantity}`);
                }
                
                // Insert sale item
                await client.query(
                    `INSERT INTO sale_items (sale_id, product_id, quantity, price_at_sale)
                     VALUES ($1, $2, $3, $4)`,
                    [sale_id, product_id, quantity, price_at_sale]
                );
                
                // Update inventory
                await client.query(
                    `UPDATE inventory 
                     SET quantity_in_stock = quantity_in_stock - $1, last_updated = CURRENT_TIMESTAMP
                     WHERE product_id = $2`,
                    [quantity, product_id]
                );
                
                subtotal += parseFloat(price_at_sale) * parseInt(quantity);
            }
            
            // 3. Calculate discount and total
            const discount_amount = (subtotal * discount_percentage) / 100;
            const total_amount = subtotal - discount_amount;
            
            // 4. Update sale with calculated totals
            const updatedSaleResult = await client.query(
                `UPDATE sales 
                 SET subtotal = $1, discount_percentage = $2, discount_amount = $3, total_amount = $4
                 WHERE sale_id = $5
                 RETURNING sale_id, user_id, subtotal, discount_percentage, discount_amount, total_amount, TO_CHAR(sale_date, 'DD/MM/YYYY') as sale_date`,
                [subtotal, discount_percentage, discount_amount, total_amount, sale_id]
            );
            
            await client.query('COMMIT');
            
            return SalesDTO.fromEntity(updatedSaleResult.rows[0]);
            
        } catch (error) {
            await client.query('ROLLBACK');
            throw new Error(`Failed to create sale with items: ${error.message}`);
        } finally {
            client.release();
        }
    }

    /**
     * Update the total amount for a sale and return updated DTO
     */
    async updateSaleTotal(sale_id, total_amount) {
        try {
            if (!sale_id || isNaN(sale_id)) {
                throw new Error('Invalid sale ID');
            }
            if (total_amount == null || isNaN(total_amount)) {
                throw new Error('Invalid total amount');
            }
            const sale = await this.salesRepository.updateTotalAmount(sale_id, total_amount);
            return sale ? SalesDTO.fromEntity(sale) : null;
        } catch (error) {
            throw new Error(`Failed to update sale total: ${error.message}`);
        }

     }

         /**
          * Apply a discount percentage to a sale and update totals; return updated DTO
          */
         async applyDiscount(sale_id, discount_percentage) {
        try {
            if (!sale_id || isNaN(sale_id)) {
                throw new Error('Invalid sale ID');
            }
            if (discount_percentage == null || isNaN(discount_percentage)) {
                throw new Error('Invalid discount percentage');
            }
            if (discount_percentage < 0 || discount_percentage > 100) {
                throw new Error('Discount percentage must be between 0 and 100');
            }

            const currentSale = await this.salesRepository.findById(sale_id);
            if (!currentSale) {
                throw new Error('Sale not found');
            }

            const sale = await this.salesRepository.updateWithDiscount(sale_id, currentSale.subtotal, discount_percentage);
            return sale ? SalesDTO.fromEntity(sale) : null;
        } catch (error) {
            throw new Error(`Failed to apply discount: ${error.message}`);
        }

    }

    /**
     * Delete a sale by ID; returns true if deleted
     */
    async deleteSale(sale_id) {
        try {
            if (!sale_id || isNaN(sale_id)) {
                throw new Error('Invalid sale ID');
            }
            return await this.salesRepository.delete(sale_id);
        } catch (error) {
            throw new Error(`Failed to delete sale: ${error.message}`);
        }
    } 
}
