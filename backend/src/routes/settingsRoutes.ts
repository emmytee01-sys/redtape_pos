import { Router } from 'express';
import { SettingsController, upload } from '../controllers/settingsController';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();

router.use(authenticate);

// Get routes are accessible by admin, accountant and manager
router.get('/account-numbers', authorize('admin', 'accountant', 'manager'), SettingsController.getAllAccountNumbers);
router.get('/pos-terminals', authorize('admin', 'accountant', 'manager'), SettingsController.getAllPOSTerminals);
router.get('/', authorize('admin', 'accountant', 'manager'), SettingsController.getSettings);

// Modification routes are restricted to admin only
router.post('/account-numbers', authorize('admin'), SettingsController.createAccountNumber);
router.put('/account-numbers/:id', authorize('admin'), SettingsController.updateAccountNumber);
router.delete('/account-numbers/:id', authorize('admin'), SettingsController.deleteAccountNumber);

router.post('/pos-terminals', authorize('admin'), SettingsController.createPOSTerminal);
router.put('/pos-terminals/:id', authorize('admin'), SettingsController.updatePOSTerminal);
router.delete('/pos-terminals/:id', authorize('admin'), SettingsController.deletePOSTerminal);

router.put('/setting', authorize('admin'), SettingsController.updateSetting);
router.post('/logo', authorize('admin'), upload.single('logo'), SettingsController.uploadLogo);

export default router;

