import { pool } from "../../config/db.js";
import { Users } from "../entities/Users.js";

/**
 * UsersRepository - Database operations for users
 * Methods:
 * - create(data): create a new user
 * - update(user_id, data): update user fields
 * - findAll(): list users
 * - findById(user_id): get user by id
 * - findByEmail(email): get user by email (used for login)
 * - delete(user_id): remove a user
 */
export class UsersRepository {
    /** Create a new user record and return the entity */
    async create ({first_name,last_name,email,phone_number,password,role}){
        try {
            const sql = `INSERT INTO users (first_name,last_name,email,phone_number,password,role)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING user_id,first_name,last_name,email,phone_number,password,role;
            `;
            const {rows} = await pool.query(sql, [first_name,last_name,email,phone_number,password,role]);
            return new Users(rows[0]);
        } catch (error) {
            throw new Error(`Failed to create user: ${error.message}`);
        }
    }

    /** Update a user by ID and return the updated entity or null */
    async update(user_id, {first_name,last_name,email,phone_number,password,role}){
        try {
            const sql = `UPDATE users SET first_name = $1, last_name = $2, email = $3, phone_number = $4, password = $5, role = $6
            WHERE user_id= $7
            RETURNING user_id,first_name,last_name,email,phone_number,password,role;
            `;
            const {rows} = await pool.query(sql, [first_name,last_name,email,phone_number,password,role,user_id]);

            return rows[0] ? new Users(rows[0]) : null;
        } catch (error) {
            throw new Error(`Failed to update user: ${error.message}`);
        }
    }
    /** Retrieve all users */
    async findAll(){
        try {
            const sql = `SELECT user_id,first_name,last_name,email,phone_number,password,role
            FROM users ORDER BY user_id DESC;`
            const {rows} = await pool.query(sql);

            return rows.map(r => new Users(r));
        } catch (error) {
            throw new Error(`Failed to retrieve users: ${error.message}`);
        }
    }

    

    /** Find a user by ID, or return null */
    async findById(user_id){
        try {
            const sql = `SELECT user_id,first_name,last_name,email,phone_number,password,role
            FROM users 
            WHERE user_id = $1;`;

            const {rows} = await pool.query(sql, [user_id]);

            return rows[0] ? new Users(rows[0]) : null;
        } catch (error) {
            throw new Error(`Failed to find user by ID: ${error.message}`);
        }
    }
    /** Find a user by email (used for authentication), or return null */
    async findByEmail(email) {
        try {
            const sql = `SELECT user_id, first_name, last_name, email, phone_number, password, role
                         FROM users
                         WHERE email = $1;`;
            const { rows } = await pool.query(sql, [email]);
            return rows[0] ? new Users(rows[0]) : null;
        } catch (error) {
            throw new Error(`Failed to find user by email: ${error.message}`);
        }
    }

    /** Delete a user by ID; returns true when deleted */
    async delete(user_id) {
        try {
            const {rowCount} = await pool.query('DELETE FROM users WHERE user_id = $1', [user_id])
            return rowCount > 0;
        } catch (error) {
            throw new Error(`Failed to delete user: ${error.message}`);
        }
    }
}