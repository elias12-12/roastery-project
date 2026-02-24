/**
 * ProductsServices - Business logic for product operations
 * Methods:
 * - createProduct(data): Creates a new product
 * - getAllProducts(): Retrieves all products
 * - getProductById(id): Gets a product by ID
 * - updateProduct(id, data): Updates a product
 * - deleteProduct(id): Deletes a product
 */
export class ProductsServices {
    constructor(productsRepository) {
        this.productsRepository = productsRepository;
    }

    /** 
     * Create a new product from productData and return the created entity 
     * @param {Object} productData - Product data object
     * @param {string} productData.product_name - Product name
     * @param {string} [productData.description] - Product description
     * @param {number} productData.unit_price - Product unit price
     * @param {string} productData.product_type - Product type
     * @param {string} productData.status - Product status ('available' | 'not available')
     * @returns {Promise<Products>} Created product entity
     */
    async createProduct(productData) {
        try {
            if (!productData.product_name || !productData.unit_price || !productData.product_type || !productData.status) {
                throw new Error("Missing required fields: product_name, unit_price, product_type, status");
            }
            return await this.productsRepository.create(productData);
        } catch (error) {
            throw new Error(`Failed to create product: ${error.message}`);
        }
    }

    /** 
     * Retrieve all products 
     * @returns {Promise<Products[]>} Array of product entities
     */
    async getAllProducts() {
        try {
            return await this.productsRepository.findAll();
        } catch (error) {
            throw new Error(`Failed to get products: ${error.message}`);
        }
    }

    /** 
     * Get a product by ID or throw on invalid id 
     * @param {number} product_id - Product ID
     * @returns {Promise<Products|null>} Product entity or null if not found
     */
    async getProductById(product_id) {
        try {
            if (!product_id || isNaN(product_id)) 
                throw new Error("Invalid product ID");

            const product = await this.productsRepository.findById(product_id);
            return product;
        } catch (error) {
            throw new Error(`Failed to get product: ${error.message}`);
        }
    }

    /** 
     * Update a product by ID with provided updates and return updated entity 
     * @param {number} product_id - Product ID
     * @param {Object} updates - Partial product data to update
     * @returns {Promise<Products|null>} Updated product entity or null if not found
     */
    async updateProduct(product_id, updates) {
        try {
            if (!product_id || isNaN(product_id))
                 throw new Error("Invalid product ID");

            if (!updates || Object.keys(updates).length === 0) 
                throw new Error("No data provided for update");

            const updatedProduct = await this.productsRepository.update(product_id, updates);
            return updatedProduct;
        } catch (error) {
            throw new Error(`Failed to update product: ${error.message}`);
        }
    }

    /** 
     * Delete a product by ID; returns true when deleted 
     * @param {number} product_id - Product ID
     * @returns {Promise<boolean>} True if deleted, false otherwise
     */
    async deleteProduct(product_id) {
        try {
            if (!product_id || isNaN(product_id)) 
                throw new Error("Invalid product ID");

            const deleted = await this.productsRepository.delete(product_id);
            return deleted;

        } catch (error) {
            throw new Error(`Failed to delete product: ${error.message}`);
        }
    }
}
