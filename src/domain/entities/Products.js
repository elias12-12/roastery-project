/**
 * Products entity — represents a product in the system
 * Fields (simple types):
 * - product_id: number | null
 * - product_name: string
 * - description: string
 * - unit_price: number
 * - product_type: string
 * - status: string
 */
/**
 * Products entity — represents a product record
 * Fields: product_id, product_name, description, unit_price, product_type, status
 */
export class Products {
    /**
     * Create a Products entity instance from a plain object (e.g., DB row)
     * @param {Object} param0 - object with product fields
     */
    constructor({ product_id, product_name, description, unit_price, product_type, status }) {
        this.product_id = product_id;
        this.product_name = product_name;
        this.description = description;
        this.unit_price = unit_price;
        this.product_type = product_type;
        this.status = status;
    }
}