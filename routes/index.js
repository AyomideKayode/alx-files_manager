// routes/index.js

import { Router } from 'express';
import AppController from '../controllers/AppController';
import UserController from '../controllers/UsersController';

const router = Router();

// Define routes
router.get('/status', AppController.getStatus);
router.get('/stats', AppController.getStats);
router.post('/users', UserController.postNew);

export default router;
