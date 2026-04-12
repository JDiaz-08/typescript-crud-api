import { Router } from 'express';
import type { Response, NextFunction } from 'express';
import Joi from 'joi';
import { authenticate, authorizeAdmin, AuthRequest } from '../_middleware/authMiddleware';
import { validateRequest } from '../_middleware/validateRequest';
import { employeesService } from './employees.service';

const router = Router();

router.get('/',       authenticate, authorizeAdmin, getAll);
router.get('/:id',    authenticate, authorizeAdmin, getById);
router.post('/',      authenticate, authorizeAdmin, createSchema, create);
router.put('/:id',    authenticate, authorizeAdmin, updateSchema, update);
router.delete('/:id', authenticate, authorizeAdmin, remove);

export default router;

function getAll(req: AuthRequest, res: Response, next: NextFunction): void {
  employeesService.getAll().then(data => res.json(data)).catch(next);
}

function getById(req: AuthRequest, res: Response, next: NextFunction): void {
  employeesService.getById(Number(req.params.id)).then(data => res.json(data)).catch(next);
}

function create(req: AuthRequest, res: Response, next: NextFunction): void {
  employeesService.create(req.body).then(data => res.status(201).json(data)).catch(next);
}

function update(req: AuthRequest, res: Response, next: NextFunction): void {
  employeesService.update(Number(req.params.id), req.body).then(data => res.json(data)).catch(next);
}

function remove(req: AuthRequest, res: Response, next: NextFunction): void {
  employeesService.remove(Number(req.params.id))
    .then(() => res.json({ message: 'Employee deleted' })).catch(next);
}

function createSchema(req: AuthRequest, res: Response, next: NextFunction): void {
  const schema = Joi.object({
    employeeId:   Joi.string().required(),
    userId:       Joi.number().integer().required(),
    departmentId: Joi.number().integer().required(),
    position:     Joi.string().required(),
    hireDate:     Joi.string().isoDate().required(),
  });
  validateRequest(req, next, schema);
}

function updateSchema(req: AuthRequest, res: Response, next: NextFunction): void {
  const schema = Joi.object({
    employeeId:   Joi.string().optional(),
    userId:       Joi.number().integer().optional(),
    departmentId: Joi.number().integer().optional(),
    position:     Joi.string().optional(),
    hireDate:     Joi.string().isoDate().optional(),
  });
  validateRequest(req, next, schema);
}