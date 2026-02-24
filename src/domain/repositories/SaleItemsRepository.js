import { pool } from "../../config/db.js";
import { SaleItems } from "../entities/SaleItems.js";

/**
 * SaleItemsRepository - Database operations for sale items
 * Methods:
 * - create({ sale_id, product_id, quantity, price_at_sale })
 * - findAll()
 * - findById(id)
 * - findBySaleId(sale_id)
 * - update(sale_item_id, { quantity, price_at_sale })
 * - delete(sale_item_id)
 * - findByIdWithDetails(sale_item_id) : returns joined details (sale, user, product)
 */
export class SaleItemsRepository {
    /** Insert a sale_item and return the created entity */
    async create({ sale_id, product_id, quantity, price_at_sale }) {
        try {
            const sql = `
                INSERT INTO sale_items (sale_id, product_id, quantity, price_at_sale)
                VALUES ($1, $2, $3, $4)
                RETURNING sale_item_id, sale_id, product_id, quantity, price_at_sale;
            `;
            const { rows } = await pool.query(sql, [sale_id, product_id, quantity, price_at_sale]);
            return new SaleItems(rows[0]);
        } catch (error) {
            throw new Error(`Failed to create sale item: ${error.message}`);
        }
    }

    /** Retrieve all sale items */
    async findAll() {
        try {
            const sql = `SELECT sale_item_id, sale_id, product_id, quantity, price_at_sale FROM sale_items ORDER BY sale_item_id DESC;`;
            const { rows } = await pool.query(sql);
            return rows.map(r => new SaleItems(r));
        } catch (error) {
            throw new Error(`Failed to retrieve sale items: ${error.message}`);
        }
    }

    /** Find a sale item by ID, or return null */
    async findById(sale_item_id) {
        try {
            const sql = `SELECT sale_item_id, sale_id, product_id, quantity, price_at_sale FROM sale_items WHERE sale_item_id = $1;`;
            const { rows } = await pool.query(sql, [sale_item_id]);
            return rows[0] ? new SaleItems(rows[0]) : null;
        } catch (error) {
            throw new Error(`Failed to find sale item by ID: ${error.message}`);
        }
    }

    /** Find sale items by sale_id and return array */
    async findBySaleId(sale_id) {
        try {
            const sql = `SELECT sale_item_id, sale_id, product_id, quantity, price_at_sale FROM sale_items WHERE sale_id = $1 ORDER BY sale_item_id DESC;`;
            const { rows } = await pool.query(sql, [sale_id]);
            return rows.map(r => new SaleItems(r));
        } catch (error) {
            throw new Error(`Failed to find sale items by sale ID: ${error.message}`);
        }
    }

    /** Update a sale_item fields and return updated entity or null */
    async update(sale_item_id, { quantity, price_at_sale }) {
        try {
            const sql = `
                UPDATE sale_items
                SET quantity = COALESCE($1, quantity), price_at_sale = COALESCE($2, price_at_sale)
                WHERE sale_item_id = $3
                RETURNING sale_item_id, sale_id, product_id, quantity, price_at_sale;
            `;
            const { rows } = await pool.query(sql, [quantity, price_at_sale, sale_item_id]);
            return rows[0] ? new SaleItems(rows[0]) : null;
        } catch (error) {
            throw new Error(`Failed to update sale item: ${error.message}`);
        }
    }

    /** Delete a sale_item by ID; returns true when deleted */
    async delete(sale_item_id) {
        try {
            const { rowCount } = await pool.query(`DELETE FROM sale_items WHERE sale_item_id = $1`, [sale_item_id]);
            return rowCount > 0;
        } catch (error) {
            throw new Error(`Failed to delete sale item: ${error.message}`);
        }
    }

    /** Find a sale_item with joined details (sale, user, product) */
    async findByIdWithDetails(sale_item_id) {
        try {
            const sql = `
                SELECT 
                    si.sale_item_id,
                    si.sale_id,
                    si.product_id,
                    si.quantity,
                    si.price_at_sale,
                    s.user_id,
                    TO_CHAR(s.sale_date, 'DD/MM/YYYY') as sale_date,
                    u.first_name,
                    u.last_name,
                    p.product_name
                FROM sale_items si
                INNER JOIN sales s ON si.sale_id = s.sale_id
                INNER JOIN users u ON s.user_id = u.user_id
                INNER JOIN products p ON si.product_id = p.product_id
                WHERE si.sale_item_id = $1;
            `;
            const { rows } = await pool.query(sql, [sale_item_id]);
            return rows[0] || null;
        } catch (error) {
            throw new Error(`Failed to find sale item with details: ${error.message}`);
        }
    }
}                                                                               