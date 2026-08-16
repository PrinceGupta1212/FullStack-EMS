import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { chatWithAssistant } from '../controllers/chatController.js';

const chatRouter = Router();
chatRouter.post('/', protect, chatWithAssistant);

export default chatRouter;