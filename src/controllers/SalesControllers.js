import { validationResult } from 'express-validator';

/**
 * SalesControllers — small/simple documentation
 * Methods expose basic CRUD and query endpoints for sales.
 * Common request pieces:
 * - req.params.sale_id: number|string (sale identifier)
 * - req.params.user_id: number|string (user identifier)
 * - req.query.startDate/endDate: string (ISO date)
 * - req.body.user_id: number|string
 * - req.body.total_amount, req.body.discount_percentage: number|string
 */
export class SalesControllers {
    constructor(salesService) {
        this.salesService = salesService;
    }

    // Validate input using express-validator; throws ValidationError with `details` if invalid
    _validate(req) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const err = new Error("Validation Error");
            err.name = "ValidationError";
            err.details = errors.array();
            throw err; 
        }
    }

    // List all sales — responds with Array<Object>
    list = async (req, res, next) => {
        try {
            const sales = await this.salesService.getAllSales();
            return res.json(sales);
        } catch (err) {
            next(err);
        }
    }
    listTotal = async(req, res, next) => {
        try {
            const sales=await this.salesService.getTotal();
            res.json(sales);
        } catch (err) {
            next(err);
        }
    }

    // Get a single sale by ID — req.params.sale_id
    get = async (req, res, next) => {
        try {
            this._validate(req);
            const sale = await this.salesService.getSaleById(req.params.sale_id);
            if (!sale) {
                return res.status(404).json({message: 'Not Found'});
            }
            return res.json(sale);
        } catch (err) {
            next(err);
        }
    }

    // Get all sales by a specific customer — req.params.user_id
    getByCustomer = async (req, res, next) => {
        try {
            this._validate(req);
            const sales = await this.salesService.getSalesByCustomer(req.params.user_id);
            if (!sales || sales.length === 0) {
                return res.status(404).json({ message: "No sales found for this customer" });
            }
            res.json(sales);
        } catch (err) {
            next(err);
        }
    }

    // Create a new sale — expects req.body.user_id
    create = async (req, res, next) => {
        try {
            this._validate(req);
            const newSale = await this.salesService.createSale(req.body.user_id);
            return res.status(201).json(newSale);
        } catch (err) {
            next(err);
        }
    }

    // Update sale total amount — expects req.body.total_amount
    update = async (req, res, next) => {
        try {
            this._validate(req);
            const updatedSale = await this.salesService.updateSaleTotal(req.params.sale_id, req.body.total_amount);
            if (!updatedSale) {
                return res.status(404).json({ message: "Sale not found" });
            }
            return res.json(updatedSale);
        } catch (err) {
            next(err);
        }
    }

    // Apply discount to sale — expects req.body.discount_percentage
    applyDiscount = async (req, res, next) => {
        try {
            this._validate(req);
            const updatedSale = await this.salesService.applyDiscount(req.params.sale_id, req.body.discount_percentage);
            if (!updatedSale) {
                return res.status(404).json({ message: "Sale not found" });
            }
            return res.json(updatedSale);
        } catch (err) {
            next(err);
        }
    }
    getCounts= async(req,res,next)=>{
        try {
            const count=await this.salesService.getCount();
            res.status(200).json(count);
            
        } catch (err) {
            next(err);
        }
    }

    // Get sales between dates — expects query strings startDate, endDate (ISO strings)
    getSalesBetweenDates = async (req, res, next) => {
        try {
            this._validate(req);
            const { startDate, endDate } = req.query;
            const sales = await this.salesService.getSalesBetweenDates(startDate, endDate);
            res.json({
                startDate: startDate,
                endDate: endDate,
                count: sales.length,
                sales: sales
            });
        } catch (err) {
            next(err);
        }
    }
    // Delete a sale — req.params.sale_id
    delete = async (req, res, next) => {
        try {
            this._validate(req);
            const deleted = await this.salesService.deleteSale(req.params.sale_id);
            if (!deleted) {
                return res.status(404).json({ message: "Sale not found" });
            }
            return res.status(204).send();
        } catch (err) {
            next(err);
        }
    }


}
