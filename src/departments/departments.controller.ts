import { Router } from 'express';
import type { Response, NextFunction } from 'express';
import Joi from 'joi';
import { authenticate, authorizeAdmin, AuthRequest } from '../_middleware/authMiddleware';
import { validateRequest } from '../_middleware/validateRequest';
import { departmentsService } from './departments.service';

const router = Router();

router.get('/',       authenticate, getAll);
router.get('/:id',    authenticate, getById);
router.post('/',      authenticate, authorizeAdmin, createSchema, create);
router.put('/:id',    authenticate, authorizeAdmin, updateSchema, update);
router.delete('/:id', authenticate, authorizeAdmin, remove);

export default router;

function getAll(req: AuthRequest, res: Response, next: NextFunction): void {
  departmentsService.getAll().then(data => res.json(data)).catch(next);
}

function getById(req: AuthRequest, res: Response, next: NextFunction): void {
  departmentsService.getById(Number(req.params.id)).then(data => res.json(data)).catch(next);
}

function create(req: AuthRequest, res: Response, next: NextFunction): void {
  departmentsService.create(req.body).then(data => res.status(201).json(data)).catch(next);
}

function update(req: AuthRequest, res: Response, next: NextFunction): void {
  departmentsService.update(Number(req.params.id), req.body).then(data => res.json(data)).catch(next);
}

function remove(req: AuthRequest, res: Response, next: NextFunction): void {
  departmentsService.remove(Number(req.params.id))
    .then(() => res.json({ message: 'Department deleted' })).catch(next);
}

function createSchema(req: AuthRequest, res: Response, next: NextFunction): void {
  const schema = Joi.object({
    name:        Joi.string().required(),
    description: Joi.string().allow('').optional(),
  });
  validateRequest(req, next, schema);
}

function updateSchema(req: AuthRequest, res: Response, next: NextFunction): void {
  const schema = Joi.object({
    name:        Joi.string().optional(),
    description: Joi.string().allow('').optional(),
  });
  validateRequest(req, next, schema);
}