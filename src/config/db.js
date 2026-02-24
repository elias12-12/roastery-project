
// Import Pool class from pg module
import { Pool } from 'pg';
// Use dotenv to manage environment variables
import dotenv from "dotenv";
// Load environment variables from .env file
dotenv.config();
// Initialize PostgreSQL connection pool
// using environment variables for configuration
// PGHOST, PGPORT, PGDATABASE, PGUSER, PGPASSWORD
export const pool = new Pool({
    host: process.env.PGHOST,
    port: process.env.PGPORT,
    database: process.env.PGDATABASE,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD
});
// Function to perform a simple health check query
export const healthCheck = async () => {
    const { rows } = await pool.query('SELECT 1 as ok');
    return rows[0].ok === 1;
}