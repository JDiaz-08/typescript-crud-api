import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { Role } from '../_helpers/role';
import { validateRequest } from '../_middleware/validateRequest';
import { authService } from './auth.service';

const router = Router();

router.post('/register',     registerSchema, register);
router.post('/verify-email', verifyEmail);
router.post('/login',        login);

export { router as authController };

function register(req: Request, res: Response, next: NextFunction): void {
  authService.register(req.body)
    .then(data => res.status(201).json(data))
    .catch(next);
}

function verifyEmail(req: Request, res: Response, next: NextFunction): void {
  const { token } = req.body;
  if (!token) { next('Verification token is required'); return; }
  authService.verifyEmail(token)
    .then(data => res.json(data))
    .catch(next);
}

function login(req: Request, res: Response, next: NextFunction): void {
  const { email, password } = req.body;
  if (!email || !password) { next('Email and password are required'); return; }
  authService.login(email, password)
    .then(data => res.json(data))
    .catch(next);
}

function registerSchema(req: Request, res: Response, next: NextFunction): void {
  const schema = Joi.object({
    title:           Joi.string().required(),
    firstName:       Joi.string().required(),
    lastName:        Joi.string().allow('').optional(),
    email:           Joi.string().email().required(),
    password:        Joi.string().min(6).required(),
    confirmPassword: Joi.string().valid(Joi.ref('password')).required()
      .messages({ 'any.only': 'Passwords do not match' }),
    role: Joi.string().valid(Role.Admin, Role.User).default(Role.User),
  });
  validateRequest(req, next, schema);
}