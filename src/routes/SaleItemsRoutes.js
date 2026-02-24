/**
 * SaleItemsRoutes - HTTP routes for sale-item operations
 * Exports: SaleItemsRoutes (Express Router)
 */
import { Router } from 'express';
import { SaleItemsRepository } from '../domain/repositories/SaleItemsRepository.js';
import { SaleItemsServices } from '../services/SaleItemsServices.js';
import { SaleItemsControllers } from '../controllers/SaleItemsControllers.js';

import { saleItemIdParam, saleIdParam, createSaleItem, updateSaleItem } from '../validators/SaleItemsValidators.js';

const repo = new SaleItemsRepository();
const service = new SaleItemsServices(repo);
const controller = new SaleItemsControllers(service);

export const SaleItemsRoutes = Router();
// Routes for sale items (list, get, create, update, delete, details)
// Register specific paths before param routes to avoid conflicts
SaleItemsRoutes.get('/', controller.list);
SaleItemsRoutes.get('/sale/:sale_id', saleIdParam, controller.getBySaleId);
SaleItemsRoutes.get('/:sale_item_id/details', saleItemIdParam, controller.getWithDetails);
SaleItemsRoutes.get('/:sale_item_id', saleItemIdParam, controller.get);
SaleItemsRoutes.post('/', createSaleItem, controller.create);
SaleItemsRoutes.put('/:sale_item_id', [saleItemIdParam, ...updateSaleItem], controller.update);
SaleItemsRoutes.delete('/:sale_item_id', saleItemIdParam, controller.delete);
