import { Router } from 'express';
import { SettingsController, upload } from '../controllers/settingsController';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();

router.use(authenticate);
router.use(authorize('admin')); // Only admin can access settings

router.get('/account-numbers', SettingsController.getAllAccountNumbers);
router.post('/account-numbers', SettingsController.createAccountNumber);
router.put('/account-numbers/:id', SettingsController.updateAccountNumber);
router.delete('/account-numbers/:id', SettingsController.deleteAccountNumber);

router.get('/', SettingsController.getSettings);
router.put('/setting', SettingsController.updateSetting);
router.post('/logo', upload.single('logo'), SettingsController.uploadLogo);

export default router;

