/**
 * ProductsValidators - express-validator rules for product endpoints
 * Exports:
 * - idParam: param validator for product_id
 * - upsertProduct: body validators for creating/updating products
 */
import { body, param } from 'express-validator';
// Validate :product_id param is a positive integer
export const idParam = param('product_id')
    .isInt({ min: 1 }).withMessage('Product ID must be a positive integer');

// Body validators for creating/updating products
export const upsertProduct = [
    body('product_name').notEmpty().withMessage('product_name is required'),
    body('description').notEmpty().withMessage('description is required'),
    body('unit_price').isFloat({ gt: 0 }).withMessage('unit_price must be greater than 0'),
    body('product_type').notEmpty().withMessage('product_type is required'),
    body('status').isIn(['available', 'not available']).withMessage('status must be available or not available')
];
