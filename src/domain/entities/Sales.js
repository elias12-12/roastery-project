/**
 * Sales entity — represents a sales transaction
 * Fields (simple types):
 * - sale_id: number | null
 * - user_id: number | null
 * - sale_date: Date
 * - subtotal: number
 * - discount_percentage: number
 * - discount_amount: number
 * - total_amount: number
 */
/**
 * Sales entity — represents a sales transaction
 * Fields: sale_id, user_id, sale_date, subtotal, discount_percentage, discount_amount, total_amount
 */
export class Sales{
    /**
     * Construct a Sales entity from a plain object (DB row)
     * @param {Object} param0 - sale fields
     */
    constructor({sale_id = null, user_id = null, sale_date = new Date(), subtotal, discount_percentage, discount_amount, total_amount = 0}) {
        this.sale_id = sale_id;
        this.user_id = user_id;
        this.sale_date = sale_date;
        this.subtotal=subtotal;
        this.discount_percentage=discount_percentage || 0;
        this.discount_amount=discount_amount || 0;
        this.total_amount = total_amount;
    }
}
