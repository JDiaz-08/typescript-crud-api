import { Router } from 'express';
import type { Response, NextFunction } from 'express';
import Joi from 'joi';
import { Role } from '../_helpers/role';
import { authenticate, authorizeAdmin, AuthRequest } from '../_middleware/authMiddleware';
import { validateRequest } from '../_middleware/validateRequest';
import { userService } from './user.service';

const router = Router();

// /me must be before /:id
router.get('/me',     authenticate, getMe);
router.get('/',       authenticate, authorizeAdmin, getAll);
router.post('/',      authenticate, authorizeAdmin, createSchema, create);
router.get('/:id',    authenticate, getById);
router.put('/:id',    authenticate, updateSchema, update);
router.delete('/:id', authenticate, authorizeAdmin, _delete);

export default router;

function getMe(req: AuthRequest, res: Response, next: NextFunction): void {
  userService.getById(req.user!.id).then(user => res.json(user)).catch(next);
}

function getAll(req: AuthRequest, res: Response, next: NextFunction): void {
  userService.getAll().then(users => res.json(users)).catch(next);
}

function getById(req: AuthRequest, res: Response, next: NextFunction): void {
  userService.getById(Number(req.params.id)).then(user => res.json(user)).catch(next);
}

function create(req: AuthRequest, res: Response, next: NextFunction): void {
  userService.create(req.body).then(() => res.status(201).json({ message: 'User created' })).catch(next);
}

function update(req: AuthRequest, res: Response, next: NextFunction): void {
  const targetId = Number(req.params.id);
  if (req.user!.role !== Role.Admin && req.user!.id !== targetId) {
    res.status(403).json({ message: 'You can only update your own profile.' });
    return;
  }
  userService.update(targetId, req.body).then(() => res.json({ message: 'User updated' })).catch(next);
}

function _delete(req: AuthRequest, res: Response, next: NextFunction): void {
  userService.delete(Number(req.params.id)).then(() => res.json({ message: 'User deleted' })).catch(next);
}

function createSchema(req: AuthRequest, res: Response, next: NextFunction): void {
  const schema = Joi.object({
    title:           Joi.string().required(),
    firstName:       Joi.string().required(),
    lastName:        Joi.string().allow('').optional(),
    email:           Joi.string().email().required(),
    password:        Joi.string().min(6).required(),
    confirmPassword: Joi.string().valid(Joi.ref('password')).required()
      .messages({ 'any.only': 'Passwords do not match' }),
    role:     Joi.string().valid(Role.Admin, Role.User).default(Role.User),
    verified: Joi.boolean().default(false),
  });
  validateRequest(req, next, schema);
}

function updateSchema(req: AuthRequest, res: Response, next: NextFunction): void {
  const schema = Joi.object({
    title:           Joi.string().empty(''),
    firstName:       Joi.string().empty(''),
    lastName:        Joi.string().allow('').optional(),
    email:           Joi.string().email().empty(''),
    password:        Joi.string().min(6).empty(''),
    confirmPassword: Joi.string().valid(Joi.ref('password')).empty('')
      .messages({ 'any.only': 'Passwords do not match' }),
    role:     Joi.string().valid(Role.Admin, Role.User).empty(''),
    verified: Joi.boolean().optional(),
  }).with('password', 'confirmPassword');
  validateRequest(req, next, schema);
}