/**
 * SaleItemsValidators - express-validator rules for sale items endpoints
 * Exports:
 * - saleItemIdParam, saleIdParam: param validators
 * - createSaleItem: body validators for creating a sale item
 * - updateSaleItem: body validators for updating a sale item
 */
import { body, param } from 'express-validator';
// Validate :sale_item_id param is a positive integer
export const saleItemIdParam = [
    param('sale_item_id').isInt({ gt: 0 }).withMessage('sale_item_id must be a positive integer')
];

// Validate :sale_id param is a positive integer
export const saleIdParam = [
    param('sale_id').isInt({ gt: 0 }).withMessage('sale_id must be a positive integer')
];

// Body validators for creating a sale item (sale_id, product_id, quantity, price_at_sale)
export const createSaleItem = [
    body('sale_id').isInt({ gt: 0 }).withMessage('sale_id must be a positive integer'),
    body('product_id').isInt({ gt: 0 }).withMessage('product_id must be a positive integer'),
    body('quantity').isInt({ gt: 0 }).withMessage('quantity must be a positive integer'),
    body('price_at_sale').isFloat({ gt: 0 }).withMessage('price_at_sale must be a positive number')
];

export const updateSaleItem = [
    body('quantity').optional().isInt({ gt: 0 }).withMessage('quantity must be a positive integer if provided'),
    body('price_at_sale').optional().isFloat({ gt: 0 }).withMessage('price_at_sale must be a positive number if provided')
];