/**
 * Inventory entity 
 * Fields (simple types):
 * - inventory_id: number | null
 * - product_id: number | null
 * - quantity_in_stock: number
 * - last_updated: Date | string 
 */
export class Inventory{
    constructor({inventory_id = null, product_id = null, quantity_in_stock = 0, last_updated = new Date() }){
        this.inventory_id=inventory_id;
        this.product_id=product_id;
        this.quantity_in_stock=quantity_in_stock;
        this.last_updated=last_updated;
    }
}