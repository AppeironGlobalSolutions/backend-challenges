import { Router } from 'express';
import { addComment, getComments } from '../controllers/comment.controller';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = Router();

router.post('/', authenticateToken, addComment);
router.get('/', authenticateToken, getComments);

export default router;