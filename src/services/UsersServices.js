import {UsersDTO} from '../domain/dto/UsersDTO.js';
import bcrypt from 'bcrypt';

/**
 * UsersServices - Business logic for user operations
 * Methods:
 * - listUsers(): Gets all users
 * - getUsers(id): Gets a user by ID
 * - createUsers(data): Creates a new user
 * - updateUsers(id, data): Updates user info
 * - deleteUsers(id): Removes a user
 */
export class UsersServices{
    constructor(usersRepository){
        this.usersRepository = usersRepository;
    }

    /**
     * List all users and return DTOs
     * @returns {Promise<UsersDTO[]>} Array of user DTOs
     */
    async listUsers(){
        try {
            const users = await this.usersRepository.findAll();
            return users.map(users => UsersDTO.fromEntity(users));
        } catch (error) {
            throw new Error(`Failed to list users: ${error.message}`);
        }
    }

    /**
     * Get a single user by ID and return a DTO, or null if not found
     * @param {number} user_id - User ID
     * @returns {Promise<UsersDTO|null>} User DTO or null if not found
     */
        async getUsers(user_id){
            try {
                if (!user_id || isNaN(user_id)) {
                    throw new Error('Invalid user ID');
                }
                const user = await this.usersRepository.findById(user_id);
                if (!user) {
                    return null;
                }
                return UsersDTO.fromEntity(user);
            } catch (error) {
                throw new Error(`Failed to get user: ${error.message}`);
            }
        }

        /**
        * Alias: get user by id (returns DTO or null)
        * @param {number} user_id - User ID
        * @returns {Promise<UsersDTO|null>} User DTO or null if not found
        */
        async getUserById(user_id) {
        try {
            if (!user_id || isNaN(user_id)) {
                throw new Error('Invalid user ID');
            }

            const user = await this.usersRepository.findById(user_id);
            return user ? UsersDTO.fromEntity(user) : null;

        } catch (error) {
            throw new Error(`Failed to get user: ${error.message}`);
        }

    }

    /**
     * Create a new user record from provided data and return a DTO
     * @param {Object} data - User data object
     * @param {string} data.first_name - User's first name
     * @param {string} data.last_name - User's last name
     * @param {string} data.email - User's email
     * @param {string} data.phone_number - User's phone number
     * @param {string} data.password - Plain text password (will be hashed)
     * @param {string} data.role - User role ('admin', 'customer', 'guest')
     * @returns {Promise<UsersDTO>} Created user DTO
     */
    async createUsers(data){
        try {
            if (!data || !data.first_name || !data.last_name || !data.email || !data.phone_number || !data.password || !data.role) {
                throw new Error('Missing required fields: first_name,last_name,email,phone_number,password,role');
            }

            // Hash password before storing
            const saltRounds = 10;
            const hashed = await bcrypt.hash(data.password, saltRounds);
            const payload = { ...data, password: hashed };
            const user = await this.usersRepository.create(payload);
            return UsersDTO.fromEntity(user);
        } catch (error) {
            throw new Error(`Failed to create user: ${error.message}`);
        }

    }

    /**
     * Update an existing user and return the updated DTO, or null if not found
     * @param {number} user_id - User ID
     * @param {Object} data - Partial user data to update
     * @returns {Promise<UsersDTO|null>} Updated user DTO or null if not found
     */
    async updateUsers(user_id, data){
        try {
            if (!user_id || isNaN(user_id)) {
                throw new Error('Invalid user ID');
            }
            if (!data || Object.keys(data).length === 0) {
                throw new Error('No data provided for update');
            }
            const user = await this.usersRepository.update(user_id, data);
            return user ? UsersDTO.fromEntity(user) : null;
        } catch (error) {
            throw new Error(`Failed to update user: ${error.message}`);
        }

    }

    /**
     * Delete a user by ID, returns true if deleted
     * @param {number} user_id - User ID
     * @returns {Promise<boolean>} True if deleted, false otherwise
     */
    async deleteUsers(user_id){
        try {
            if (!user_id || isNaN(user_id)) {
                throw new Error('Invalid user ID');
            }
            return await this.usersRepository.delete(user_id);
        } catch (error) {
            throw new Error(`Failed to delete user: ${error.message}`);
        }

    }

    /**
     * Register a new user (same as create) and return DTO
     * @param {Object} userData - User registration data
     * @param {string} userData.first_name - User's first name
     * @param {string} userData.last_name - User's last name
     * @param {string} userData.email - User's email
     * @param {string} userData.phone_number - User's phone number
     * @param {string} userData.password - Plain text password (will be hashed)
     * @param {string} [userData.role='customer'] - User role (defaults to 'customer')
     * @returns {Promise<UsersDTO>} Created user DTO
     */
    async registerUser(userData) {
        try {
            const { first_name, last_name, email, phone_number, password, role } = userData;

            if (!first_name || !last_name || !email || !phone_number || !password || !role) {
                throw new Error('Missing required fields: first_name, last_name, email, phone_number, password, role');
            }

            // Ensure role is customer for public registration
            const data = { ...userData, role: userData.role || 'customer' };
            // Hash password
            const saltRounds = 10;
            const hashed = await bcrypt.hash(data.password, saltRounds);
            const payload = { ...data, password: hashed };
            console.log('Registering user with payload:', payload);
            const newUser = await this.usersRepository.create(payload);
            return UsersDTO.fromEntity(newUser);

        } catch (error) {
            console.error('Register user error:', error, 'userData was:', userData);
            throw new Error(`Failed to register user: ${error.message}`);
        }
    }

    /**
     * Authenticate a user by email and password. Returns message and user DTO on success.
     * @param {string} email - User email address
     * @param {string} password - Plain text password
     * @returns {Promise<Object>} Object with message and user DTO
     * @returns {string} returns.message - Success message
     * @returns {UsersDTO} returns.user - Authenticated user DTO
     */
    async loginUser(email, password) {
    try {
        if (!email || !password) {
            throw new Error('Email and password are required');
        }

        // Find user by email
        const user = await this.usersRepository.findByEmail(email);
        if (!user) {
            throw new Error('Invalid email or password');
        }

        // Compare passwords using bcrypt
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            throw new Error('Invalid email or password');
        }

        return {
            message: 'Login successful',
            user: UsersDTO.fromEntity(user)
        };
    } catch (error) {
        throw new Error(`Failed to login user: ${error.message}`);
    }
}
}