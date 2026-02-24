/**
 * SalesRoutes - HTTP routes for sales operations (list, create, update, discount, delete)
 * Exports: SalesRoutes (Express Router)
 */
import { Router } from 'express';
import { SalesRepository } from '../domain/repositories/SalesRepository.js';
import { SalesServices } from '../services/SalesServices.js';
import { SalesControllers }  from '../controllers/SalesControllers.js';

import { idParam, userIdParam, upsertSales, applyDiscountValidator , getSaleBetweenDates } from '../validators/SalesValidators.js';

const repo = new SalesRepository();
const service = new SalesServices(repo);
const controller = new SalesControllers(service);

export const SalesRoutes = Router();

// Routes for sales (list, query by date/customer, create, update, discount, delete)
SalesRoutes.get('/', controller.list);
SalesRoutes.get('/count',controller.getCounts);
SalesRoutes.get('/total',controller.listTotal);
SalesRoutes.get('/by-date-range', getSaleBetweenDates, controller.getSalesBetweenDates);

// Param-based routes
SalesRoutes.get('/customer/:user_id', userIdParam, controller.getByCustomer);
SalesRoutes.get('/:sale_id', idParam, controller.get);
// Creating a sale
SalesRoutes.post('/', upsertSales, controller.create);
// Updates and deletes
SalesRoutes.put('/:sale_id', [...idParam, upsertSales], controller.update);
SalesRoutes.put('/:sale_id/discount', [...idParam, ...applyDiscountValidator], controller.applyDiscount);
SalesRoutes.delete('/:sale_id', idParam, controller.delete);

