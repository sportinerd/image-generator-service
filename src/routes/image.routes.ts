import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { imageController } from '../controllers/image.controller';

const router = Router();

// Generate image route
router.post('/generate', authMiddleware, imageController.generateImage);

// Delete image route
router.delete('/:imageKey(*)', authMiddleware, imageController.deleteImage);


export default router;
