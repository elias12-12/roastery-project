import { pool } from "../../config/db.js";
import { Inventory } from "../entities/Inventory.js";

/**
 * InventoryRepository - Database operations for inventory
 * Methods:
 * - create({ product_id, quantity_in_stock })
 * - findAll()
 * - findByProductId(product_id)
 * - update(product_id, quantity_in_stock)
 * - findAllWithDetails(): returns inventory joined with product info
 * - findByLowStock(threshold)
 * - delete(product_id)
 */
export class InventoryRepository {
    /** Create inventory record and return the created entity */
    async create({ product_id, quantity_in_stock }) {
        try {
            const sql = `
                INSERT INTO inventory (product_id, quantity_in_stock)
                VALUES ($1, $2)
                RETURNING inventory_id, product_id, quantity_in_stock, TO_CHAR(last_updated, 'DD/MM/YYYY') as last_updated;
            `;
            const { rows } = await pool.query(sql, [product_id, quantity_in_stock]);
            return new Inventory(rows[0]);
        } catch (error) {
            throw new Error(`Failed to create inventory record: ${error.message}`);
        }
    }

    /** Retrieve all inventory records */
    async findAll() {
        try {
            const sql = `SELECT inventory_id, product_id, quantity_in_stock, TO_CHAR(last_updated, 'DD/MM/YYYY') as last_updated FROM inventory ORDER BY inventory_id DESC;`;
            const { rows } = await pool.query(sql);
            return rows.map(r => new Inventory(r));
        } catch (error) {
            throw new Error(`Failed to retrieve inventory records: ${error.message}`);
        }
    }

    /** Find inventory record by product_id, or null if not found */
    async findByProductId(product_id) {
        try {
            const sql = `SELECT inventory_id, product_id, quantity_in_stock, TO_CHAR(last_updated, 'DD/MM/YYYY') as last_updated FROM inventory WHERE product_id = $1;`;
            const { rows } = await pool.query(sql, [product_id]);
            return rows[0] ? new Inventory(rows[0]) : null;
        } catch (error) {
            throw new Error(`Failed to find inventory by product ID: ${error.message}`);
        }
    }

    /** Update inventory quantity for a product and return updated entity or null */
    async update(product_id, quantity_in_stock) {
        try {
            const sql = `
                UPDATE inventory
                SET quantity_in_stock = $1, last_updated = NOW()
                WHERE product_id = $2
                RETURNING inventory_id, product_id, quantity_in_stock, TO_CHAR(last_updated, 'DD/MM/YYYY') as last_updated;
            `;
            const { rows } = await pool.query(sql, [quantity_in_stock, product_id]);
            return rows[0] ? new Inventory(rows[0]) : null;
        } catch (error) {
            throw new Error(`Failed to update inventory: ${error.message}`);
        }
    }
    /** Retrieve inventory joined with product details */
    async findAllWithDetails() {
        try {
            const sql = `
                SELECT 
                    i.inventory_id,
                    i.product_id,
                    i.quantity_in_stock,
                    TO_CHAR(i.last_updated, 'DD/MM/YYYY') as last_updated,
                    p.product_name,
                    p.unit_price,
                    p.product_type,
                    p.status
                FROM inventory i
                INNER JOIN products p ON i.product_id = p.product_id
                ORDER BY i.inventory_id DESC;
            `;
            const { rows } = await pool.query(sql);
            return rows;
        } catch (error) {
            throw new Error(`Failed to retrieve inventory with details: ${error.message}`);
        }
    }
    /** Find inventory items with quantity below threshold (default 5) */
    async findByLowStock(threshold = 5) {
        try {
            const sql = `
                SELECT 
                    i.inventory_id, 
                    i.product_id, 
                    i.quantity_in_stock, 
                    TO_CHAR(i.last_updated, 'DD/MM/YYYY') as last_updated,
                    p.product_name,
                    p.unit_price,
                    p.product_type,
                    p.status
                FROM inventory i
                INNER JOIN products p ON i.product_id = p.product_id
                WHERE i.quantity_in_stock < $1
                ORDER BY i.quantity_in_stock ASC;
            `;
            const { rows } = await pool.query(sql, [threshold]);
            return rows;
        } catch (error) {
            throw new Error(`Failed to find low stock items: ${error.message}`);
        }
    }

    /** Delete inventory record by product_id; returns true when deleted */
    async delete(product_id) {
        try {
            const { rowCount } = await pool.query(`DELETE FROM inventory WHERE product_id = $1`, [product_id]);
            return rowCount > 0;
        } catch (error) {
            throw new Error(`Failed to delete inventory record: ${error.message}`);
        }
    }
}