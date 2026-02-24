/**
 * SaleItems entity — represents an item within a sale
 * Fields (simple types):
 * - sale_item_id: number | null
 * - sale_id: number | null
 * - product_id: number | null
 * - quantity: number
 * - price_at_sale: number
 */
/**
 * SaleItems entity — represents an item within a sale
 * Fields: sale_item_id, sale_id, product_id, quantity, price_at_sale
 */
export class SaleItems {
    /**
     * Construct a SaleItems instance from a plain object (DB row or payload)
     * @param {Object} param0 - fields for a sale item
     */
    constructor({ sale_item_id = null, sale_id = null, product_id = null, quantity = 0, price_at_sale = 0 }) {
        this.sale_item_id = sale_item_id;
        this.sale_id = sale_id;
        this.product_id = product_id;
        this.quantity = quantity;
        this.price_at_sale = price_at_sale;
    }
}
