import { validationResult } from 'express-validator';

/**
 * ProductsController
 *
 * Controller class that provides HTTP handlers for product-related routes.
 * Each handler follows the Express signature (req, res, next) and delegates
 * business logic to the provided productsService.
 *
 * Expected productsService methods: getAllProducts, getProductById,
 * createProduct, updateProduct, deleteProduct
 *
 * Validation errors thrown by _validate have name === "ValidationError"
 * and include a `details` array with validation issues.
 */
export class ProductsController {
        // Note: form rendering for Add/Edit is handled inside the existing
        // `create` and `update` methods so HTML and API flows are colocated.
    /**
     * Create a new ProductsController
     * @param {Object} productsService - service implementing product operations
     */
    constructor(productsService) {
        this.productsService = productsService;
    }

    /**
     * Validate the request using express-validator rules attached to the route.
     * If validation errors exist, throws an Error with name "ValidationError"
     * and a `details` property containing the array of issues.
     *
     * @param {import('express').Request} req
     * @throws {Error} ValidationError with `details` array
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
     * GET /products
     * Return an array of products.
     *
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     * @param {import('express').NextFunction} next
     */
    list = async (req, res, next) => {
        try {
            const products = await this.productsService.getAllProducts();
            return res.json(products);
        } catch (err) {
            next(err);
        }
    }

    /**
     * GET /products/:product_id
     * Retrieve a single product by its ID. Returns 404 if not found.
     *
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     * @param {import('express').NextFunction} next
     */
    get = async (req, res, next) => {
        try {
            this._validate(req);
            const product = await this.productsService.getProductById(req.params.product_id);
            if (!product) {
                return res.status(404).json({message: 'Not Found'});
            }
            return res.json(product);
        } catch (err) {
            next(err);
        }
    }
    /**
     * POST /products
     * Create a new product. Expects product fields in the request body.
     *
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     * @param {import('express').NextFunction} next
     */
    create = async (req, res, next) => {
        try {
            this._validate(req);
            const newProduct = await this.productsService.createProduct(req.body);
            return res.status(201).json(newProduct);
        } catch (err) {
            next(err);
        }
    }

    /**
     * PUT /products/:product_id
     * Update an existing product. Returns 404 if product not found.
     *
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     * @param {import('express').NextFunction} next
     */
    update = async (req, res, next) => {
        try {
            this._validate(req);
            const updatedProduct = await this.productsService.updateProduct(req.params.product_id, req.body);
            if (!updatedProduct) {
                return res.status(404).json({ message: "Product not found" });
            }
            return res.json(updatedProduct);
        } catch (err) {
            next(err);
        }
    }

    /**
     * DELETE /products/:product_id
     * Delete a product. Returns 204 on success, 404 if not found.
     *
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     * @param {import('express').NextFunction} next
     */
    delete = async (req, res, next) => {
        try {
            this._validate(req);
            const deleted = await this.productsService.deleteProduct(req.params.product_id);
            if (!deleted) {
                return res.status(404).json({ message: "Product not found" });
            }
            return res.status(204).send();
        } catch (err) {
            next(err);
        }
    }
}
