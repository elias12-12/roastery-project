import { pool } from "../../config/db.js";
import { Products } from "../entities/Products.js";

/**
 * ProductsRepository - Database operations for Products
 * Methods:
 * - create(data): Creates a new product record
 * - findAll(): Gets all products
 * - findById(id): Finds a product by ID
 * - update(id, data): Updates product record
 * - delete(id): Removes a product
 */
export class ProductsRepository {
    /** Create a product record and return the created entity */
    async create({ product_name, description, unit_price, product_type, status }) {
        try {
            const sql = `
                INSERT INTO products (product_name, description, unit_price, product_type, status)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING *;
            `;
            const { rows } = await pool.query(sql, [product_name, description, unit_price, product_type, status]);
            return new Products(rows[0]);
        } catch (error) {
            throw new Error(`Failed to create product: ${error.message}`);
        }
    }

    /** Retrieve all product records */
    async findAll() {
        try {
            const sql = `SELECT * FROM products ORDER BY product_id DESC;`;
            const { rows } = await pool.query(sql);
            return rows.map(r => new Products(r));
        } catch (error) {
            throw new Error(`Failed to retrieve products: ${error.message}`);
        }
    }

    /**
     * Search products with optional filters.
     * @param {Object} params
     * @param {string} [params.query] - Matches product_name/description (ILIKE)
     * @param {number} [params.maxPrice]
     * @param {number} [params.minPrice]
     * @param {string} [params.productType]
     * @param {string} [params.status]
     * @param {number} [params.limit=10]
     */
    async search({ query, maxPrice, minPrice, productType, status, limit = 10 } = {}) {
        try {
            const where = [];
            const values = [];

            if (query && String(query).trim()) {
                values.push(`%${String(query).trim()}%`);
                where.push(`(product_name ILIKE $${values.length} OR description ILIKE $${values.length})`);
            }

            if (maxPrice != null && maxPrice !== '' && !Number.isNaN(Number(maxPrice))) {
                values.push(Number(maxPrice));
                where.push(`unit_price <= $${values.length}`);
            }

            if (minPrice != null && minPrice !== '' && !Number.isNaN(Number(minPrice))) {
                values.push(Number(minPrice));
                where.push(`unit_price >= $${values.length}`);
            }

            if (productType && String(productType).trim()) {
                values.push(String(productType).trim());
                where.push(`product_type = $${values.length}`);
            }

            if (status && String(status).trim()) {
                values.push(String(status).trim());
                where.push(`status = $${values.length}`);
            }

            const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 25);
            values.push(safeLimit);

            const sql = `
                SELECT * 
                FROM products
                ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
                ORDER BY product_id DESC
                LIMIT $${values.length};
            `;

            const { rows } = await pool.query(sql, values);
            return rows.map(r => new Products(r));
        } catch (error) {
            throw new Error(`Failed to search products: ${error.message}`);
        }
    }

    /** Find a product by its ID, or return null */
    async findById(product_id) {
        try {
            const sql = `SELECT * FROM products WHERE product_id = $1;`;
            const { rows } = await pool.query(sql, [product_id]);
            return rows[0] ? new Products(rows[0]) : null;
        } catch (error) {
            throw new Error(`Failed to find product by ID: ${error.message}`);
        }
    }

    /** Update a product by ID and return the updated entity or null */
    async update(product_id, { product_name, description, unit_price, product_type, status }) {
        try {
            const sql = `
                UPDATE products
                SET product_name=$1, description=$2, unit_price=$3, product_type=$4, status=$5
                WHERE product_id=$6
                RETURNING *;
            `;
            const { rows } = await pool.query(sql, [product_name, description, unit_price, product_type, status, product_id]);
            return rows[0] ? new Products(rows[0]) : null;
        } catch (error) {
            throw new Error(`Failed to update product: ${error.message}`);
        }
    }

    /** Delete a product by ID; returns true when deleted */
    async delete(product_id) {
        try {
            const { rowCount } = await pool.query(`DELETE FROM products WHERE product_id=$1;`, [product_id]);
            return rowCount > 0;
        } catch (error) {
            throw new Error(`Failed to delete product: ${error.message}`);
        }
    }
}
