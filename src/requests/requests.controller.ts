import { Router } from 'express';
import type { Response, NextFunction } from 'express';
import Joi from 'joi';
import { authenticate, authorizeAdmin, AuthRequest } from '../_middleware/authMiddleware';
import { validateRequest } from '../_middleware/validateRequest';
import { requestsService } from './requests.service';

const router = Router();

// IMPORTANT: /all must be registered before /:id or Express matches 'all' as an id param
router.get('/all',        authenticate, authorizeAdmin, getAll);
router.get('/',           authenticate, getMyRequests);
router.post('/',          authenticate, createSchema, create);
router.put('/:id/status', authenticate, authorizeAdmin, updateStatus);
router.delete('/:id',     authenticate, authorizeAdmin, remove);

export default router;

function getAll(req: AuthRequest, res: Response, next: NextFunction): void {
  requestsService.getAll().then(data => res.json(data)).catch(next);
}

function getMyRequests(req: AuthRequest, res: Response, next: NextFunction): void {
  requestsService.getMyRequests(req.user!.id).then(data => res.json(data)).catch(next);
}

function create(req: AuthRequest, res: Response, next: NextFunction): void {
  requestsService.create(req.body, req.user!.id).then(data => res.status(201).json(data)).catch(next);
}

function updateStatus(req: AuthRequest, res: Response, next: NextFunction): void {
  const { status } = req.body;
  if (!['Pending', 'Approved', 'Rejected'].includes(status)) {
    next('Status must be Pending, Approved, or Rejected'); return;
  }
  requestsService.updateStatus(Number(req.params.id), status).then(data => res.json(data)).catch(next);
}

function remove(req: AuthRequest, res: Response, next: NextFunction): void {
  requestsService.remove(Number(req.params.id))
    .then(() => res.json({ message: 'Request deleted' })).catch(next);
}

function createSchema(req: AuthRequest, res: Response, next: NextFunction): void {
  const schema = Joi.object({
    type: Joi.string().valid('Equipment', 'Leave', 'Resources').required(),
    items: Joi.array().items(
      Joi.object({ name: Joi.string().required(), qty: Joi.number().integer().min(1).required() })
    ).min(1).required(),
  });
  validateRequest(req, next, schema);
}