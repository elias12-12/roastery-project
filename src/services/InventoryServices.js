import { InventoryDTO } from '../domain/dto/InventoryDTO.js';

/**
 * InventoryServices - Business logic for inventory operations
 * Methods include:
 * - createInventoryRecord(product_id, quantity_in_stock)
 * - getAllInventory()
 * - getInventoryByProduct(product_id)
 * - getAllWithDetails()
 * - getLowStockProducts(threshold)
 * - updateInventory(product_id, new_quantity)
 * - deleteInventory(product_id)
 */
export class InventoryServices {
    constructor(inventoryRepository) {
        this.inventoryRepository = inventoryRepository;
    }

    /** Create an inventory record for product_id and return a DTO */
    async createInventoryRecord(product_id, quantity_in_stock) {
        try {
            if (!product_id || isNaN(product_id)) {
                throw new Error('Invalid product ID');
            }
            if (quantity_in_stock == null || isNaN(quantity_in_stock) || quantity_in_stock < 0) {
                throw new Error('Quantity in stock must be a non-negative number');
            }

            const inventory = await this.inventoryRepository.create({ product_id, quantity_in_stock });
            return InventoryDTO.fromEntity(inventory);
        } catch (error) {
            throw new Error(`Failed to create inventory record: ${error.message}`);
        }
    }

    /** Return all inventory records as DTOs */
    async getAllInventory() {
        try {
            const inventory = await this.inventoryRepository.findAll();
            return inventory.map(inv => InventoryDTO.fromEntity(inv));
        } catch (error) {
            throw new Error(`Failed to list inventory: ${error.message}`);
        }
    }

    /** Get inventory record for a specific product_id or null if missing */
    async getInventoryByProduct(product_id) {
        try {
            if (!product_id || isNaN(product_id)) {
                throw new Error('Invalid product ID');
            }
            const inventory = await this.inventoryRepository.findByProductId(product_id);
            return inventory ? InventoryDTO.fromEntity(inventory) : null;
        } catch (error) {
            throw new Error(`Failed to get inventory by product: ${error.message}`);
        }
    }
    /** Get inventory joined with product details (returns simple objects) */
    async getAllWithDetails(){
        try {
            const inventory=await this.inventoryRepository.findAllWithDetails();
            return inventory.map(r=>({inventory_id:r.inventory_id,
                product_id:r.product_id,
                quantity_in_stock:r.quantity_in_stock,
                last_updated:r.last_updated,
                product_name:r.product_name
            }));
            
        } catch (error) {
            throw new Error(`Failed to list inventory: ${error.message}`);
        }
    }

    /** Get products with stock below threshold (default 5) */
    async getLowStockProducts(threshold = 5) {
    try {
        if (isNaN(threshold) || threshold < 0) {
            throw new Error('Threshold must be a non-negative number');
        }

        const lowStockItems = await this.inventoryRepository.findByLowStock(threshold);
        return lowStockItems.map(item => ({
            inventory_id: item.inventory_id,
            product_id: item.product_id,
            product_name: item.product_name,  
            quantity_in_stock: item.quantity_in_stock,
            unit_price: item.unit_price,      
            product_type: item.product_type,  
            status: item.status,              
            last_updated: item.last_updated}));
    } catch (error) {
        throw new Error(`Failed to get low stock products: ${error.message}`);
    }
}

    /** Update inventory quantity for product_id and return DTO or null */
    async updateInventory(product_id, new_quantity) {
        try {
            if (!product_id || isNaN(product_id)) {
                throw new Error('Invalid product ID');
            }
            if (new_quantity == null || isNaN(new_quantity) || new_quantity < 0) {
                throw new Error('New quantity must be a non-negative number');
            }

            const inventory = await this.inventoryRepository.update(product_id, new_quantity);
            return inventory ? InventoryDTO.fromEntity(inventory) : null;
        } catch (error) {
            throw new Error(`Failed to update inventory: ${error.message}`);
        }
    }

    /** Delete inventory record for product_id; returns true when deleted */
    async deleteInventory(product_id) {
        try {
            if (!product_id || isNaN(product_id)) {
                throw new Error('Invalid product ID');
            }
            return await this.inventoryRepository.delete(product_id);
        } catch (error) {
            throw new Error(`Failed to delete inventory: ${error.message}`);
        }
    }
  
}