import { Router } from 'express';
import { PagesController } from '../controllers/PagesController.js';

const router = Router();

router.get('/', PagesController.home);
router.get('/about', PagesController.about);
export const IndexRoutes = router;
