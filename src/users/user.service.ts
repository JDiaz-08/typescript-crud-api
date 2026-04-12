import bcrypt from 'bcryptjs';
import { db } from '../_helpers/db';
import { Role } from '../_helpers/role';
import { User, UserCreationAttributes } from './user.model';

export const userService = { getAll, getById, create, update, delete: _delete };

async function getAll(): Promise<User[]> {
  return db.User.findAll({ order: [['firstName', 'ASC']] });
}

async function getById(id: number): Promise<User> {
  return getUser(id);
}

async function create(
  params: UserCreationAttributes & { password: string; confirmPassword?: string }
): Promise<void> {
  const existing = await db.User.findOne({ where: { email: params.email } });
  if (existing) throw `Email "${params.email}" is already registered`;

  const passwordHash = await bcrypt.hash(params.password, 10);

  await db.User.create({
    title:        params.title,
    firstName:    params.firstName,
    lastName:     params.lastName,
    email:        params.email,
    passwordHash,
    role:         params.role || Role.User,
    verified:     params.verified ?? false,
  } as UserCreationAttributes);
}

async function update(
  id: number,
  params: Partial<UserCreationAttributes> & { password?: string; confirmPassword?: string }
): Promise<void> {
  const user = await getUser(id);

  if (params.email && params.email !== user.email) {
    const dup = await db.User.findOne({ where: { email: params.email } });
    if (dup) throw `Email "${params.email}" is already in use`;
  }

  if (params.password) {
    (params as any).passwordHash = await bcrypt.hash(params.password, 10);
  }

  const { password, confirmPassword, ...safe } = params as any;
  await user.update(safe);
}

async function _delete(id: number): Promise<void> {
  const user = await getUser(id);
  await user.destroy();
}

async function getUser(id: number): Promise<User> {
  const user = await db.User.scope('withHash').findByPk(id);
  if (!user) throw 'User not found';
  return user;
}