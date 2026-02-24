/**
 * SaleItemsDTO — minimal documentation
 * Fields (simple types):
 * - sale_item_id: number | null
 * - sale_id: number | null
 * - product_id: number | null
 * - quantity: number
 * - price_at_sale: number
 */
export class SaleItemsDTO {
    constructor({ sale_item_id = null, sale_id = null, product_id = null, quantity = 0, price_at_sale = 0 }) {
        this.sale_item_id = sale_item_id;
        this.sale_id = sale_id;
        this.product_id = product_id;
        this.quantity = quantity;
        this.price_at_sale = price_at_sale;
    }

    // mapper to convert entity to DTO
    static fromEntity(entity) {
        return new SaleItemsDTO(entity);
    }
}