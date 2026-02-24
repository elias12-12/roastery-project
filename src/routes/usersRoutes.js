/**
 * UsersRoutes - defines HTTP routes for user-related endpoints
 * Exports: UsersRoutes (Express Router)
 * Dependencies are instantiated via simple DI in this module.
 */
import { Router } from 'express'
import { UsersRepository } from '../domain/repositories/UsersRepository.js';
import { UsersServices } from '../services/UsersServices.js';
import { UsersController } from '../controllers/UsersController.js';

import{idParam, upsertUsers} from '../validators/UsersValidators.js';


/**
 * Dependency injection
 */
const repo = new UsersRepository();
const service = new UsersServices(repo);
const controller = new UsersController(service);

export const UsersRoutes = Router();

// CRUD and auth routes for users (API only)
// Auth routes MUST come before parameterized routes to avoid /register being treated as /:user_id
UsersRoutes.post('/register', controller.register.bind(controller));
UsersRoutes.post('/login', controller.login.bind(controller));
UsersRoutes.get('/', controller.list.bind(controller));
UsersRoutes.get('/:user_id', idParam, controller.get.bind(controller));
UsersRoutes.put('/:user_id', [...idParam, upsertUsers], controller.update.bind(controller));
UsersRoutes.post('/', upsertUsers, controller.create.bind(controller));
UsersRoutes.delete('/:user_id', idParam, controller.delete.bind(controller));
