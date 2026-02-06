import { Router } from 'express';
import { ReportController } from '../controllers/reportController';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.use(authenticate);

router.get('/dashboard', ReportController.getDashboardStats);
router.get('/sales', ReportController.getSalesReport);
router.get('/products', ReportController.getProductSalesReport);
router.get('/end-of-day', ReportController.getEndOfDayReport);
router.get('/export-end-of-day-pdf', ReportController.exportEndOfDayPDF);
router.get('/export-end-of-day-excel', ReportController.exportEndOfDayExcel);

export default router;

