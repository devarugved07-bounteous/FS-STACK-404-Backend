import { Router } from 'express';
import { getUserOrders } from '../controllers/orders.controller';
import { protect } from '../middleware/auth';

const router = Router();

router.get('/', protect, getUserOrders);

export default router;
