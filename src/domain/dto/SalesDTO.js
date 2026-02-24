/**
 * SalesDTO data transfer object 
 * Fields and simple types:
 * - sale_id: number | null
 * - user_id: number | null
 * - sale_date: Date | string (ISO)
 * - subtotal: number
 * - discount_percentage: number
 * - discount_amount: number
 * - total_amount: number
 */
export class SalesDTO {
    constructor({sale_id = null, user_id = null, sale_date = new Date(), subtotal, discount_percentage, discount_amount, total_amount = 0}) {
        this.sale_id = sale_id;
        this.user_id = user_id;
        this.sale_date = sale_date;
        this.subtotal = parseFloat(subtotal);
        this.discount_percentage = parseFloat(discount_percentage) || 0;
        this.discount_amount = parseFloat(discount_amount) || 0;
        this.total_amount = parseFloat(total_amount);
        this.has_discount = this.discount_percentage > 0;
    }

    // mapper to convert entity to DTO
    static fromEntity(entity) {
        return new SalesDTO(entity);
    }
}