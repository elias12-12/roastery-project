import { SaleItemsDTO } from '../domain/dto/SaleItemsDTO.js';
import { pool } from "../config/db.js";

/**
 * SaleItemsServices - Business logic for sale items operations
 * Provides methods to list, create, update and delete sale items.
 */
export class SaleItemsServices {
    constructor(saleItemsRepository) {
        this.saleItemsRepository = saleItemsRepository;
    }

    /**
     * Get all sale items and return DTOs
     */
    async getAllSaleItems() {
        try {
            const items = await this.saleItemsRepository.findAll();
            return items.map(item => SaleItemsDTO.fromEntity(item));
        } catch (error) {
            throw new Error(`Failed to list sale items: ${error.message}`);
        }
    }

    /**
     * Get a sale item by ID and return DTO, or null if not found
     */
    async getSaleItemById(sale_item_id) {
        try {
            if (!sale_item_id || isNaN(sale_item_id)) {
                throw new Error('Invalid sale item ID');
            }
            const item = await this.saleItemsRepository.findById(sale_item_id);
            return item ? SaleItemsDTO.fromEntity(item) : null;
        } catch (error) {
            throw new Error(`Failed to get sale item: ${error.message}`);
        }
    }

    /**
     * Get all sale items for a given sale_id and return DTOs
     */
    async getSaleItemsBySaleId(sale_id) {
        try {
            if (!sale_id || isNaN(sale_id)) {
                throw new Error('Invalid sale ID');
            }
            const items = await this.saleItemsRepository.findBySaleId(sale_id);
            return items.map(item => SaleItemsDTO.fromEntity(item));
        } catch (error) {
            throw new Error(`Failed to get sale items by sale: ${error.message}`);
        }
    }

    /*
    // legacy/simple implementation (kept commented):
    async createSaleItem(sale_id, product_id, quantity, price_at_sale) {
        try {
            if (!sale_id || isNaN(sale_id)) {
                throw new Error('Invalid sale ID');
            }
            if (!product_id || isNaN(product_id)) {
                throw new Error('Invalid product ID');
            }
            if (!quantity || isNaN(quantity) || quantity <= 0) {
                throw new Error('Quantity must be a positive number');
            }
            if (price_at_sale == null || isNaN(price_at_sale) || price_at_sale < 0) {
                throw new Error('Price at sale must be a non-negative number');
            }

            const item = await this.saleItemsRepository.create({ sale_id, product_id, quantity, price_at_sale });
            return SaleItemsDTO.fromEntity(item);
        } catch (error) {
            throw new Error(`Failed to create sale item: ${error.message}`);
        }
    }
    */

    /**
     * Create a sale item transactionally:
     * - validate sale exists
     * - lock and validate inventory
     * - insert sale_item
     * - decrement inventory
     * - recompute sale subtotal and totals (respecting any discount)
     */
    async createSaleItem(sale_id, product_id, quantity, price_at_sale) {
        // validation
        if (!sale_id || isNaN(sale_id)) throw new Error('Invalid sale ID');
        if (!product_id || isNaN(product_id)) throw new Error('Invalid product ID');
        if (!quantity || isNaN(quantity) || quantity <= 0) throw new Error('Quantity must be positive');
        if (price_at_sale == null || isNaN(price_at_sale) || price_at_sale < 0) throw new Error('Invalid price');

        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            // 1) Check sale exists and lock it
            const saleRes = await client.query(
                `SELECT sale_id, discount_percentage FROM sales WHERE sale_id = $1 FOR UPDATE`,
                [sale_id]
            );
            if (saleRes.rowCount === 0) {
                throw new Error(`Sale with id ${sale_id} not found`);
            }
            const currentDiscount = parseFloat(saleRes.rows[0].discount_percentage) || 0;

            // 2) Lock inventory row for the product
            const invRes = await client.query(
                `SELECT inventory_id, quantity_in_stock FROM inventory WHERE product_id = $1 FOR UPDATE`,
                [product_id]
            );

            if (invRes.rowCount === 0) {
                throw new Error(`Inventory record for product ${product_id} not found`);
            }

            const quantity_in_stock = parseInt(invRes.rows[0].quantity_in_stock, 10);
            if (quantity_in_stock < quantity) {
                throw new Error(`Insufficient stock for product ${product_id}. Available: ${quantity_in_stock}`);
            }

            // 3) Insert the sale_item
            const insertItemText = `
                INSERT INTO sale_items (sale_id, product_id, quantity, price_at_sale)
                VALUES ($1, $2, $3, $4)
                RETURNING *;
            `;
            const insertItemValues = [sale_id, product_id, quantity, price_at_sale];
            const insertedItemRes = await client.query(insertItemText, insertItemValues);
            const insertedItem = insertedItemRes.rows[0];

            // 4) Decrement inventory
            await client.query(
                `UPDATE inventory SET quantity_in_stock = quantity_in_stock - $1, last_updated = CURRENT_TIMESTAMP
                 WHERE product_id = $2`,
                [quantity, product_id]
            );

            // 5) Recompute sale subtotal from sale_items
            const totalRes = await client.query(
                `SELECT COALESCE(SUM(quantity * price_at_sale), 0)::numeric(12,2) AS new_subtotal
                 FROM sale_items
                 WHERE sale_id = $1`,
                [sale_id]
            );
            const newSubtotal = totalRes.rows[0].new_subtotal;

            // 6) Calculate discount and update sale
            const discountAmount = (newSubtotal * currentDiscount) / 100;
            const totalAmount = newSubtotal - discountAmount;

            await client.query(
                `UPDATE sales SET subtotal = $1, discount_amount = $2, total_amount = $3 WHERE sale_id = $4`,
                [newSubtotal, discountAmount, totalAmount, sale_id]
            );

            await client.query('COMMIT');

            // Return DTO
            return SaleItemsDTO.fromEntity(insertedItem);
        } catch (err) {
            await client.query('ROLLBACK');
            throw new Error(`Failed to create sale item transactionally: ${err.message}`);
        } finally {
            client.release();
        }
    }

    /**
     * Update a sale item by ID and return updated DTO or null
     */
    async updateSaleItem(sale_item_id, updates) {
        try {
            if (!sale_item_id || isNaN(sale_item_id)) {
                throw new Error('Invalid sale item ID');
            }
            const item = await this.saleItemsRepository.update(sale_item_id, updates);
            return item ? SaleItemsDTO.fromEntity(item) : null;
        } catch (error) {
            throw new Error(`Failed to update sale item: ${error.message}`);
        }
    }

    /**
     * Delete a sale item by ID, returns true if deleted
     */
    async deleteSaleItem(sale_item_id) {
        try {
            if (!sale_item_id || isNaN(sale_item_id)) {
                throw new Error('Invalid sale item ID');
            }
            return await this.saleItemsRepository.delete(sale_item_id);
        } catch (error) {
            throw new Error(`Failed to delete sale item: ${error.message}`);
        }
    }

    /**
     * Return a sale item with joined details (sale, user, product)
     */
    async getSaleItemByIdWithDetails(sale_item_id) {
        return await this.saleItemsRepository.findByIdWithDetails(sale_item_id);
    }
}