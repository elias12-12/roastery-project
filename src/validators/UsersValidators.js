/**
 * UsersValidators - express-validator rules for user endpoints
 * Exports:
 * - idParam: param validator for user_id
 * - upsertUsers: body validators for creating/updating users
 */
import { body, param } from 'express-validator';

// Validate that :user_id route param is a positive integer
export const idParam = [param('user_id')
        .isInt({gt: 0}).withMessage('id must be an integer')
    ];

// Body validators for creating/updating users (first_name,last_name,email,password,phone_number,role)
    export const upsertUsers = [
        body('first_name').isString().isLength({min: 1, max: 255}).withMessage('first name must be a string between 1-255 characters'),
        body('last_name').isString().isLength({min: 1, max: 255}).withMessage('last name must be a string between 1-255 characters'),
        body('email').isString({min: 1, max: 300}).withMessage('Email must be strong'),
        body('password').isString({min: 1, max: 300}).withMessage('Pawword must be strong'),
        body('phone_number').isString({min: 1, max: 300}).withMessage('Phone Number must be clear'),
        body('role').isString({min: 1, max: 300}).withMessage('Role must be (admin, manager, employee)'),
    ]