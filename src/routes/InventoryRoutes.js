/**
 * InventoryRoutes - HTTP routes for inventory management
 * Exports: InventoryRoutes (Express Router)
 */
import { Router } from 'express';
import { InventoryRepository } from '../domain/repositories/InventoryRepository.js';
import { InventoryServices } from '../services/InventoryServices.js';
import { InventoryControllers } from '../controllers/InventoryControllers.js';

import { productIdParam, createInventory, updateInventory } from '../validators/InventoryValidators.js';

const repo = new InventoryRepository();
const service = new InventoryServices(repo);
const controller = new InventoryControllers(service);
export const InventoryRoutes = Router();
// Routes for inventory management (list, low stock, with details, CRUD)
InventoryRoutes.get('/', controller.list);
InventoryRoutes.get('/low-stock', controller.getLowStock);
InventoryRoutes.get("/with-details", controller.getAllWithDetails);
InventoryRoutes.get('/:product_id', productIdParam, controller.getByProduct);
InventoryRoutes.post('/', createInventory, controller.create);
InventoryRoutes.put('/:product_id', [productIdParam, ...updateInventory], controller.update);
InventoryRoutes.delete('/:product_id', productIdParam, controller.delete);
