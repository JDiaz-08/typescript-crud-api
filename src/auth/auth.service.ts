import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { db } from '../_helpers/db';
import { Role } from '../_helpers/role';
import config from '../../config.json';

export const authService = { register, verifyEmail, login };

async function register(params: {
  firstName: string;
  lastName: string;
  title: string;
  email: string;
  password: string;
  confirmPassword: string;
  role?: string;
}): Promise<{ message: string; verifyToken: string }> {
  const existing = await db.User.findOne({ where: { email: params.email } });
  if (existing) throw 'Email already registered';

  const passwordHash = await bcrypt.hash(params.password, 10);
  const user = await db.User.create({
    firstName:    params.firstName,
    lastName:     params.lastName,
    title:        params.title,
    email:        params.email,
    passwordHash,
    role:         params.role || Role.User,
    verified:     false,
  });

  const payload = { id: user.id };
  const options: SignOptions = { expiresIn: '1h' };
  const verifyToken = jwt.sign(payload, config.jwtSecret, options);

  return { message: 'Account created. Please verify your email.', verifyToken };
}

async function verifyEmail(token: string): Promise<{ message: string }> {
  let payload: any;
  try {
    payload = jwt.verify(token, config.jwtSecret);
  } catch {
    throw 'Invalid or expired verification token';
  }

  const user = await db.User.findByPk(payload.id);
  if (!user) throw 'User not found';

  await user.update({ verified: true });
  return { message: 'Email verified successfully. You may now log in.' };
}

async function login(
  email: string,
  password: string
): Promise<{ token: string; role: string; firstName: string; lastName: string }> {
  const user = await db.User.scope('withHash').findOne({ where: { email } });

  if (!user || !user.verified)
    throw 'Invalid credentials or unverified email';

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match)
    throw 'Invalid credentials or unverified email';

  const payload = { id: user.id, role: user.role, email: user.email };
  const options: SignOptions = { expiresIn: config.jwtExpiresIn as SignOptions['expiresIn'] };
  const token = jwt.sign(payload, config.jwtSecret, options);

  return { token, role: user.role, firstName: user.firstName, lastName: user.lastName };
}