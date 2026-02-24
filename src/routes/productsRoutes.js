/**
 * ProductsRoutes - HTTP routes for product CRUD operations
 * Exports: ProductsRoutes (Express Router)
 */
import { Router } from 'express';
import { ProductsController } from '../controllers/ProductsController.js';
import { ProductsServices } from '../services/ProductsServices.js';
import { ProductsRepository } from '../domain/repositories/ProductsRepository.js';
import { idParam, upsertProduct } from '../validators/ProductsValidators.js'; 

// Dependency injection
const repo = new ProductsRepository();
const service = new ProductsServices(repo);
const controller = new ProductsController(service);

export const ProductsRoutes = Router();

// CRUD routes for products (API only)
ProductsRoutes.get('/', controller.list);
ProductsRoutes.get('/:product_id', idParam, controller.get);
ProductsRoutes.post('/', upsertProduct, controller.create);
ProductsRoutes.put('/:product_id', [idParam, ...upsertProduct], controller.update);
ProductsRoutes.delete('/:product_id', idParam, controller.delete);
