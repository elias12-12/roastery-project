import { validationResult } from 'express-validator';

/**
 * SaleItemsControllers
 *
 * Controller class that exposes HTTP handlers for sale item routes. Each
 * handler uses the provided `saleItemsService` to perform the business logic
 * and follows the Express handler signature (req, res, next).
 *
 * Expected saleItemsService methods:
 * - getAllSaleItems()
 * - getSaleItemById(id)
 * - getSaleItemsBySaleId(saleId)
 * - createSaleItem(sale_id, product_id, quantity, price_at_sale)
 * - updateSaleItem(id, payload)
 * - deleteSaleItem(id)
 * - getSaleItemByIdWithDetails(id)
 *
 * Validation: this controller uses express-validator; when validation fails the
 * `_validate` helper throws an Error with `name === "ValidationError"` and
 * a `details` array describing the issues.
 */
export class SaleItemsControllers {
    /**
     * @param {Object} saleItemsService - service implementing sale items operations
     */
    constructor(saleItemsService) {
        this.saleItemsService = saleItemsService;
    }

    /**
     * Validate the request using express-validator rules attached to the route.
     * If validation errors exist, throws an Error with name "ValidationError"
     * and a `details` property containing the array of issues.
     *
     * @param {import('express').Request} req
     * @throws {Error} ValidationError
     * @private
     */
    _validate(req) {    
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const err = new Error("Validation Error");
            err.name = "ValidationError";
            err.details = errors.array();
            throw err;
        }
    }

    /**
     * GET /sale-items
     * Return all sale items.
     */
    list = async (req, res, next) => {
        try {
            const items = await this.saleItemsService.getAllSaleItems();
            return res.json(items);
        } catch (err) {
            next(err);
        }
    }

    /**
     * GET /sale-items/:sale_item_id
     * Retrieve a sale item by id. Returns 404 when not found.
     */
    get = async (req, res, next) => {
        try {
            this._validate(req);
            const item = await this.saleItemsService.getSaleItemById(req.params.sale_item_id);
            if (!item) {
                return res.status(404).json({message: 'No item found'});
            }
            return res.json(item);
        } catch (err) {
            next(err);
        }
    }

    /**
     * GET /sale-items/sale/:sale_id
     * Retrieve all sale items that belong to a specific sale.
     * Returns 404 if none are found.
     */
    getBySaleId = async (req, res, next) => {
        try {
            this._validate(req);
            const items = await this.saleItemsService.getSaleItemsBySaleId(req.params.sale_id);
            if (!items || items.length === 0) {
                return res.status(404).json({ message: "No items found for this sale" });
            }
            return res.json(items);
        } catch (err) {
            next(err);
        }
    }

    /**
     * POST /sale-items
     * Create a new sale item. Expects sale_id, product_id, quantity, price_at_sale
     * in the request body.
     */
    create = async (req, res, next) => {
        try {
            this._validate(req);
            const item = await this.saleItemsService.createSaleItem(
                req.body.sale_id,
                req.body.product_id,
                req.body.quantity,
                req.body.price_at_sale
            );
            return res.status(201).json(item);
        } catch (err) {
            next(err);
        }
    }

    /**
     * PUT /sale-items/:sale_item_id
     * Update an existing sale item. Returns 404 if not found.
     */
    update = async (req, res, next) => {
        try {
            this._validate(req);
            const item = await this.saleItemsService.updateSaleItem(req.params.sale_item_id, req.body);
            if (!item) {
                return res.status(404).json({ message: "Sale item not found" });
            }
            return res.json(item);
        } catch (err) {
            next(err);
        }
    }

    /**
     * DELETE /sale-items/:sale_item_id
     * Delete a sale item. Returns 204 on success, 404 if not found.
     */
    delete = async (req, res, next) => {
        try {
            this._validate(req);
            const deleted = await this.saleItemsService.deleteSaleItem(req.params.sale_item_id);
            if (!deleted) {
                return res.status(404).json({ message: "Sale item not found" });
            }
            return res.status(204).send();
        } catch (err) {
            next(err);
        }
    }

    /**
     * GET /sale-items/:sale_item_id/details
     * Retrieve a sale item including related details (e.g., product or sale info).
     * Returns 404 if not found.
     */
    getWithDetails = async (req, res, next) => {
        try {
            this._validate(req);
            const item = await this.saleItemsService.getSaleItemByIdWithDetails(req.params.sale_item_id);
            if (!item) {
                return res.status(404).json({ message: "Sale item not found" });
            }
            return res.json(item);
        } catch (err) {
            next(err);
        }
    }

}
