import {validationResult} from 'express-validator'

/**
 * UsersController — API-only handlers
 * Common request pieces:
 * - req.params.user_id: number|string
 * - req.body: object (user fields for create/update)
 * - login expects { email: string, password: string } in req.body
 */
export class UsersController{
    constructor(userServices){
        this.userServices = userServices;
    }

    // Validate request using express-validator. If invalid, respond 400.
    _validate(req, res){
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            return res.status(400).json({errors: errors.array()});
        }
        return null;
    }

    // GET /users — list all users
    list = async (req, res, next) =>{
        try{
            const users = await this.userServices.listUsers();
            return res.json(users);
        }catch(e){
            next(e);
        }
    }

    // GET /users/:user_id — get a single user
    get = async (req, res, next) => {
        try{
            if(this._validate(req, res)){
                return;
            }
            const data = await this.userServices.getUsers(req.params.user_id);
            if(!data){
                return res.status(404).json({message: 'Not Found'});
            }
            return res.status(200).json(data);
        }catch(e){
            next(e);
        }
    }

    // POST /users — create a user; expects user object in req.body
    create = async (req, res, next) =>{
        try{
            if(this._validate(req, res)){
                return;
            }
            const data = await this.userServices.createUsers(req.body);
            return res.status(201).json(data);
        }catch(e){
            next(e);
        }
    }

    // POST /users/register — public registration for customers
    register = async (req, res, next) => {
        try {
            if (this._validate(req, res)) return;
            // Ensure role is set to 'customer' for public registration
            console.log('Register controller received req.body:', req.body);
            const input = { ...req.body, role: 'customer' };
            console.log('Register controller sending to service:', input);
            const data = await this.userServices.registerUser(input);
            return res.status(201).json(data);
        } catch (err) {
            next(err);
        }
    }

    // PUT /users/:user_id — update a user; expects user fields in req.body
    update = async (req, res, next) =>{
        try{
            if(this._validate(req, res)){
                return;
            }
            const data = await this.userServices.updateUsers(req.params.user_id, req.body);
            if(!data){
                return res.status(404).json({message: 'No data found'});
            }
            return res.status(201).json(data);
        }catch(e){
            next(e);
        }
    }

    // DELETE /users/:user_id — delete a user
    delete = async (req, res, next) =>{
        try{
            if(this._validate(req, res)){
                return;
            }
            const ok = await this.userServices.deleteUsers(req.params.user_id);
            if(!ok){
                return res.status(404).json('Not found');
            }
            return res.status(204).send();
        }catch(e){
            next(e);
        }
    }

    // POST /users/login — login with { email, password }
    login = async (req, res, next) => {
        try {
            const { email, password } = req.body;
            const result = await this.userServices.loginUser(email, password);
            return res.json(result);
        } catch (err) {
            next(err); // Use error handler middleware for consistent error handling
        }
    }
}