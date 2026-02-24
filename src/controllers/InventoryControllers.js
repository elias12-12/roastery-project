import { validationResult } from 'express-validator';

/**
 * InventoryControllers
 *
 * Controller class that exposes HTTP handlers for inventory-related routes.
 * Each method follows the Express handler signature (req, res, next) and
 * delegates business logic to the provided inventoryService.
 *
 * Errors:
 * - Throws a ValidationError (name="ValidationError") from _validate when
 *   express-validator finds problems with the request. The error will include
 *   a `details` array with validation issues.
 *
 * Usage:
 *   const controller = new InventoryControllers(inventoryService);
 *   router.get('/inventory', controller.list);
 *
 */

export class InventoryControllers {
    constructor(inventoryService) {
        this.inventoryService = inventoryService;
    }

    /**
     * Validate request using express-validator.
     * Throws an Error with name 'ValidationError' and details array if invalid.
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
     * List all inventory records.
     * Responds with JSON array of inventory DTOs.
     */
    list = async (req, res, next) => {
        try {
            const inventory = await this.inventoryService.getAllInventory();
            return res.json(inventory);
        } catch (err) {
            next(err);
        }
    }

    /**
     * Get inventory record for a specific product.
     * Expects req.params.product_id. Returns 404 if not found.
     */
    getByProduct = async (req, res, next) => {
        try {
            this._validate(req);
            const inventory = await this.inventoryService.getInventoryByProduct(req.params.product_id);
            if (!inventory) {
                return res.status(404).json({ message: "Inventory record not found" });
            }
            return res.json(inventory);
        } catch (err) {
            next(err);
        }
    }

    /**
     * Create a new inventory record.
     * Expects product_id and quantity_in_stock in req.body. Returns 201 with the created record.
     */
    create = async (req, res, next) => {
        try {
            this._validate(req);
            const inventory = await this.inventoryService.createInventoryRecord(
                req.body.product_id,
                req.body.quantity_in_stock
            );
            return res.status(201).json(inventory);
        } catch (err) {
            next(err);
        }
    }

    /**
     * Update the inventory quantity for a product.
     * Expects req.params.product_id and req.body.quantity_in_stock. Returns 404 if not found.
     */
    update = async (req, res, next) => {
        try {
            this._validate(req);
            const inventory = await this.inventoryService.updateInventory(
                req.params.product_id,
                req.body.quantity_in_stock
            );
            if (!inventory) {
                return res.status(404).json({ message: "Inventory record not found" });
            }
            return res.json(inventory);
        } catch (err) {
            next(err);
        }
    }

    /**
     * Delete an inventory record by product_id.
     * Returns 204 on success or 404 if no record existed.
     */
    delete = async (req, res, next) => {
        try {
            this._validate(req);
            const deleted = await this.inventoryService.deleteInventory(req.params.product_id);
            if (!deleted) {
                return res.status(404).json({ message: "Inventory record not found" });
            }
            return res.status(204).send();
        } catch (err) {
            next(err);
        }
    }
    /**
     * Get inventory records joined with product details.
     * Returns an array of records with product_name and other product info.
     */
    getAllWithDetails = async (req, res, next) => {
    try {
        const inventory = await this.inventoryService.getAllWithDetails();
        if (!inventory || inventory.length === 0) {
            return res.status(404).json({ message: "No inventory records found" });
        }
        return res.json(inventory);
    } catch (err) {
        next(err);
    }
};
    
    /**
     * Get products with low stock.
     * Optional query param: threshold (defaults to 5).
     * Responds with { threshold, count, items }.
     */
    getLowStock = async (req, res, next) => {
        try {
            const threshold = req.query.threshold ? parseInt(req.query.threshold) : 5;
            
            if (isNaN(threshold) || threshold < 0) {
                return res.status(400).json({ message: "Threshold must be a non-negative number" });
            }

            const lowStockItems = await this.inventoryService.getLowStockProducts(threshold);
            res.json({
                threshold: threshold,
                count: lowStockItems.length,
                items: lowStockItems
            });
        } catch (err) {
            next(err);
        }
    }


}